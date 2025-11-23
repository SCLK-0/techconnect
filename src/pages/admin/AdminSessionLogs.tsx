import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, FileText, Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";

import { useSearchParams } from "react-router-dom";

export default function AdminSessionLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [yearLevelFilter, setYearLevelFilter] = useState<string>("all");
  const itemsPerPage = 7;

  const { data: sessionLogs, isLoading, isFetching } = useQuery({
    queryKey: ["admin-session-logs"],
    queryFn: async () => {
      const query = supabase
        .from("session_logs")
        .select(`
          *,
          sessions(
            id,
            subject,
            session_status,
            tutor_id,
            learner_id,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      const { data: logs, error } = await query;
      if (error) throw error;

      // Fetch profiles for tutors, learners, and log creators
      const userIds = new Set<string>();
      logs?.forEach((log: any) => {
        if (log.user_id) userIds.add(log.user_id);
        if (log.sessions?.tutor_id) userIds.add(log.sessions.tutor_id);
        if (log.sessions?.learner_id) userIds.add(log.sessions.learner_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(userIds));

      // Fetch year levels for learners and tutors
      const { data: learnerProfiles } = await supabase
        .from("learner_profiles")
        .select("user_id, registered_year")
        .in("user_id", Array.from(userIds));

      const { data: tutorProfiles } = await supabase
        .from("tutor_profiles")
        .select("user_id, registered_year")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]));
      const learnerYearMap = new Map(learnerProfiles?.map(lp => [lp.user_id, lp.registered_year]));
      const tutorYearMap = new Map(tutorProfiles?.map(tp => [tp.user_id, tp.registered_year]));

      // Group logs by session_id
      const groupedLogs = new Map<string, any>();
      
      logs?.forEach((log: any) => {
        const sessionId = log.session_id;
        
        if (!groupedLogs.has(sessionId)) {
          groupedLogs.set(sessionId, {
            session_id: sessionId,
            sessions: log.sessions ? {
              ...log.sessions,
              tutor: { 
                full_name: profileMap.get(log.sessions.tutor_id) || "Unknown",
                registered_year: tutorYearMap.get(log.sessions.tutor_id)
              },
              learner: { 
                full_name: profileMap.get(log.sessions.learner_id) || "Unknown",
                registered_year: learnerYearMap.get(log.sessions.learner_id)
              }
            } : null,
            tutor_log: null,
            learner_log: null,
            latest_update: log.created_at
          });
        }
        
        const group = groupedLogs.get(sessionId);
        
        // Add log to appropriate role
        if (log.user_role === 'tutor') {
          group.tutor_log = {
            ...log,
            user: { full_name: profileMap.get(log.user_id) || "Unknown" }
          };
        } else if (log.user_role === 'learner') {
          group.learner_log = {
            ...log,
            user: { full_name: profileMap.get(log.user_id) || "Unknown" }
          };
        }
        
        // Update latest timestamp
        if (new Date(log.created_at) > new Date(group.latest_update)) {
          group.latest_update = log.created_at;
        }
      });

      // Convert map to array and sort by latest update
      return Array.from(groupedLogs.values()).sort((a, b) => 
        new Date(b.latest_update).getTime() - new Date(a.latest_update).getTime()
      );
    },
  });

  // Apply filters
  const filteredLogs = sessionLogs?.filter((group: any) => {
    // Filter by date range
    if (dateFrom || dateTo) {
      const sessionDate = new Date(group.sessions?.created_at);
      if (dateFrom && sessionDate < new Date(dateFrom)) return false;
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Include the entire end date
        if (sessionDate > toDate) return false;
      }
    }

    // Filter by search query (name, subject, topics)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const subject = group.sessions?.subject?.toLowerCase() || "";
      const tutorName = group.sessions?.tutor?.full_name?.toLowerCase() || "";
      const learnerName = group.sessions?.learner?.full_name?.toLowerCase() || "";
      const tutorTopics = group.tutor_log?.topics_covered?.toLowerCase() || "";
      const learnerTopics = group.learner_log?.topics_covered?.toLowerCase() || "";
      const tutorNextSteps = group.tutor_log?.next_steps?.toLowerCase() || "";
      const learnerNextSteps = group.learner_log?.next_steps?.toLowerCase() || "";
      const tutorAccomplishments = group.tutor_log?.accomplishments?.toLowerCase() || "";
      const learnerAccomplishments = group.learner_log?.accomplishments?.toLowerCase() || "";
      
      const matchesSearch = 
        subject.includes(query) ||
        tutorName.includes(query) ||
        learnerName.includes(query) ||
        tutorTopics.includes(query) ||
        learnerTopics.includes(query) ||
        tutorNextSteps.includes(query) ||
        learnerNextSteps.includes(query) ||
        tutorAccomplishments.includes(query) ||
        learnerAccomplishments.includes(query);
      
      if (!matchesSearch) return false;
    }

    // Filter by year level
    if (yearLevelFilter !== "all") {
      const tutorYear = group.sessions?.tutor?.registered_year;
      const learnerYear = group.sessions?.learner?.registered_year;
      if (tutorYear !== yearLevelFilter && learnerYear !== yearLevelFilter) {
        return false;
      }
    }

    return true;
  });

  const totalPages = Math.ceil((filteredLogs?.length || 0) / itemsPerPage);
  const paginatedLogs = filteredLogs?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFrom, dateTo]);

  // Auto-open session log when coming from session management
  useEffect(() => {
    const sessionId = searchParams.get("session");
    if (sessionId && sessionLogs) {
      const sessionLog = sessionLogs.find((log: any) => log.session_id === sessionId);
      if (sessionLog) {
        setSelectedLog(sessionLog);
        // Clear the URL parameter after opening
        setSearchParams({});
      }
    }
  }, [sessionLogs, searchParams, setSearchParams]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    return (
      <Pagination className="mt-6 mb-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">
                  1
                </PaginationLink>
              </PaginationItem>
              {startPage > 2 && <PaginationEllipsis />}
            </>
          )}
          
          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(totalPages)} className="cursor-pointer">
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col relative">
          <LoadingOverlay isLoading={isLoading || isFetching} message="Loading session logs..." />
          <header className="h-16 border-b flex items-center justify-center px-3 py-4">
            <div className="w-full max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={logo} alt="TechConnect Logo" className="h-8 w-8 object-contain" />
                <span className="font-semibold text-lg hidden sm:inline">TechConnect</span>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <UserMenu />
                <SidebarTrigger className="md:hidden" />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pt-8 pb-12 overflow-auto flex justify-center">
            <div className="space-y-6 w-full max-w-[95%] sm:max-w-[90%] md:max-w-5xl">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Session Logs</h2>
                <p className="text-muted-foreground">
                  View and search all session logs submitted by tutors and learners.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Search & Filter Logs</CardTitle>
                  <CardDescription>Search by name, subject, topics, or filter by date</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by tutor/learner name, subject, topics, accomplishments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
                      <span className="text-sm text-muted-foreground">Date Range:</span>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          placeholder="From date"
                          className="w-[160px]"
                        />
                        <span className="text-sm text-muted-foreground">to</span>
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          placeholder="To date"
                          className="w-[160px]"
                        />
                      </div>
                      
                      <Select value={yearLevelFilter} onValueChange={(value) => {
                        setYearLevelFilter(value);
                        setCurrentPage(1);
                      }}>
                        <SelectTrigger className="w-full sm:w-[160px]">
                          <SelectValue placeholder="Year Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Years</SelectItem>
                          <SelectItem value="1st Year">1st Year</SelectItem>
                          <SelectItem value="2nd Year">2nd Year</SelectItem>
                          <SelectItem value="3rd Year">3rd Year</SelectItem>
                          <SelectItem value="4th Year">4th Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    All Session Logs ({filteredLogs?.length || 0})
                  </CardTitle>
                  <CardDescription>
                    Click on any log to view full details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading logs...</p>
                    </div>
                  ) : sessionLogs && sessionLogs.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {paginatedLogs?.map((group: any) => (
                        <div
                          key={group.session_id}
                          className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors relative group"
                          onClick={() => setSelectedLog(group)}
                        >
                           <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                <h3 className="font-semibold break-words flex-1">{group.sessions?.subject || "Unknown Subject"}</h3>
                                <Maximize2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              </div>
                              <p className="text-sm text-muted-foreground break-words">
                                Tutor: {group.sessions?.tutor?.full_name || "Unknown"} • 
                                Learner: {group.sessions?.learner?.full_name || "Unknown"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                              {group.tutor_log && (
                                <Badge variant="secondary" className="text-xs">
                                  Tutor Log
                                </Badge>
                              )}
                              {group.learner_log && (
                                <Badge variant="secondary" className="text-xs">
                                  Learner Log
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(group.latest_update), "MMM dd, yyyy")}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm line-clamp-2 text-muted-foreground">
                            {group.tutor_log?.topics_covered || group.learner_log?.topics_covered || "No topics covered yet"}
                          </p>
                        </div>
                      ))}
                      </div>
                      
                      {renderPagination()}
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No session logs found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-3xl w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="break-words">{selectedLog?.sessions?.subject || "Session Log"}</DialogTitle>
            <DialogDescription className="break-words">
              Session between <span className="font-medium break-words">{selectedLog?.sessions?.tutor?.full_name}{selectedLog?.sessions?.tutor?.registered_year && ` (${selectedLog.sessions.tutor.registered_year})`}</span> (Tutor) and <span className="font-medium break-words">{selectedLog?.sessions?.learner?.full_name}{selectedLog?.sessions?.learner?.registered_year && ` (${selectedLog.sessions.learner.registered_year})`}</span> (Learner)
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Session Details</h4>
                <div className="space-y-1 text-sm">
                  <p className="break-words">
                    <span className="text-muted-foreground">Tutor:</span> {selectedLog.sessions?.tutor?.full_name}
                    {selectedLog.sessions?.tutor?.registered_year && <span className="text-muted-foreground"> ({selectedLog.sessions.tutor.registered_year})</span>}
                  </p>
                  <p className="break-words">
                    <span className="text-muted-foreground">Learner:</span> {selectedLog.sessions?.learner?.full_name}
                    {selectedLog.sessions?.learner?.registered_year && <span className="text-muted-foreground"> ({selectedLog.sessions.learner.registered_year})</span>}
                  </p>
                  <p><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{selectedLog.sessions?.session_status}</Badge></p>
                  <p><span className="text-muted-foreground">Session Date:</span> {format(new Date(selectedLog.sessions?.created_at), "MMMM dd, yyyy")}</p>
                </div>
              </div>

              {/* Tutor's Log */}
              {selectedLog.tutor_log && (
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="default">Tutor's Log</Badge>
                    <span className="text-xs text-muted-foreground">
                      Submitted {format(new Date(selectedLog.tutor_log.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-sm mb-1">Topics Covered</h5>
                      <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md break-words overflow-wrap-anywhere">
                        {selectedLog.tutor_log.topics_covered}
                      </p>
                    </div>

                    {selectedLog.tutor_log.next_steps && (
                      <div>
                        <h5 className="font-medium text-sm mb-1">Next Steps</h5>
                        <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md break-words overflow-wrap-anywhere">
                          {selectedLog.tutor_log.next_steps}
                        </p>
                      </div>
                    )}

                    {selectedLog.tutor_log.accomplishments && (
                      <div>
                        <h5 className="font-medium text-sm mb-1">Accomplishments</h5>
                        <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md break-words overflow-wrap-anywhere">
                          {selectedLog.tutor_log.accomplishments}
                        </p>
                      </div>
                    )}

                    {selectedLog.tutor_log.homework && (
                      <div>
                        <h5 className="font-medium text-sm mb-1">Homework</h5>
                        <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md break-words overflow-wrap-anywhere">
                          {selectedLog.tutor_log.homework}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Learner's Log */}
              {selectedLog.learner_log && (
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">Learner's Log</Badge>
                    <span className="text-xs text-muted-foreground">
                      Submitted {format(new Date(selectedLog.learner_log.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-sm mb-1">Topics Covered</h5>
                      <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md break-words overflow-wrap-anywhere">
                        {selectedLog.learner_log.topics_covered}
                      </p>
                    </div>

                    {selectedLog.learner_log.next_steps && (
                      <div>
                        <h5 className="font-medium text-sm mb-1">Next Steps</h5>
                        <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md break-words overflow-wrap-anywhere">
                          {selectedLog.learner_log.next_steps}
                        </p>
                      </div>
                    )}

                    {selectedLog.learner_log.accomplishments && (
                      <div>
                        <h5 className="font-medium text-sm mb-1">Accomplishments</h5>
                        <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md break-words overflow-wrap-anywhere">
                          {selectedLog.learner_log.accomplishments}
                        </p>
                      </div>
                    )}

                    {selectedLog.learner_log.homework && (
                      <div>
                        <h5 className="font-medium text-sm mb-1">Homework</h5>
                        <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md break-words overflow-wrap-anywhere">
                          {selectedLog.learner_log.homework}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!selectedLog.tutor_log && !selectedLog.learner_log && (
                <p className="text-center text-muted-foreground py-4">No logs submitted for this session yet</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
