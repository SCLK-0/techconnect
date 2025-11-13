import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";

export default function AdminSessionLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const { data: sessionLogs, isLoading } = useQuery({
    queryKey: ["admin-session-logs", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("session_logs")
        .select(`
          *,
          sessions(
            id,
            subject,
            session_status,
            tutor_id,
            learner_id
          )
        `)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`topics_covered.ilike.%${searchQuery}%,next_steps.ilike.%${searchQuery}%`);
      }

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

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]));

      // Enrich logs with profile names
      return logs?.map((log: any) => ({
        ...log,
        user: { full_name: profileMap.get(log.user_id) || "Unknown" },
        sessions: log.sessions ? {
          ...log.sessions,
          tutor: { full_name: profileMap.get(log.sessions.tutor_id) || "Unknown" },
          learner: { full_name: profileMap.get(log.sessions.learner_id) || "Unknown" }
        } : null
      }));
    },
  });

  const totalPages = Math.ceil((sessionLogs?.length || 0) / itemsPerPage);
  const paginatedLogs = sessionLogs?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    return (
      <Pagination className="mt-6">
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
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-between px-6 bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Session Logs</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 p-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Search Logs</CardTitle>
                <CardDescription>Search session logs by topics or next steps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  All Session Logs
                </CardTitle>
                <CardDescription>
                  View all session logs submitted by tutors and learners
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
                      {paginatedLogs?.map((log: any) => (
                      <div
                        key={log.id}
                        className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedLog(log)}
                      >
                         <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold">{log.sessions?.subject || "Unknown Subject"}</h3>
                            <p className="text-sm text-muted-foreground">
                              Tutor: {log.sessions?.tutor?.full_name || "Unknown"} • 
                              Learner: {log.sessions?.learner?.full_name || "Unknown"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {log.user_role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "MMM dd, yyyy")}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm line-clamp-2 text-muted-foreground">
                          {log.topics_covered}
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
          </main>
        </div>
      </div>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedLog?.sessions?.subject || "Session Log"}</DialogTitle>
            <DialogDescription>
              Submitted by {selectedLog?.user?.full_name || "Unknown"} ({selectedLog?.user_role}) on{" "}
              {selectedLog && format(new Date(selectedLog.created_at), "MMMM dd, yyyy 'at' hh:mm a")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Session Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Tutor:</span> {selectedLog.sessions?.tutor?.full_name}</p>
                  <p><span className="text-muted-foreground">Learner:</span> {selectedLog.sessions?.learner?.full_name}</p>
                  <p><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{selectedLog.sessions?.session_status}</Badge></p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Topics Covered</h4>
                <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                  {selectedLog.topics_covered}
                </p>
              </div>

              {selectedLog.next_steps && (
                <div>
                  <h4 className="font-semibold mb-2">Next Steps</h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedLog.next_steps}
                  </p>
                </div>
              )}

              {selectedLog.accomplishments && (
                <div>
                  <h4 className="font-semibold mb-2">Accomplishments</h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedLog.accomplishments}
                  </p>
                </div>
              )}

              {selectedLog.homework && (
                <div>
                  <h4 className="font-semibold mb-2">Homework</h4>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedLog.homework}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
