import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Clock, CheckCircle, XCircle, Calendar as CalendarIcon, FileText } from "lucide-react";
import { format } from "date-fns";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { toast } from "sonner";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { useNavigate } from "react-router-dom";

export default function AdminSessions() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const { data: sessions = [], isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      console.log("Fetching admin sessions...");
      
      // Fetch sessions (exclude demo sessions)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false});

      if (sessionsError) {
        console.error("Error fetching sessions:", sessionsError);
        toast.error(`Failed to load sessions: ${sessionsError.message}`);
        throw sessionsError;
      }

      // Get unique user IDs (tutors and learners)
      const userIds = [...new Set([
        ...sessionsData?.map(s => s.tutor_id) || [],
        ...sessionsData?.map(s => s.learner_id) || []
      ])];

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        // Don't throw, continue without profile data
      }

      // Merge sessions with profile data
      const sessionsWithProfiles = sessionsData?.map(session => ({
        ...session,
        tutor: profiles?.find(p => p.user_id === session.tutor_id) || { full_name: "Unknown" },
        learner: profiles?.find(p => p.user_id === session.learner_id) || { full_name: "Unknown" }
      })) || [];

      console.log("Fetched sessions:", sessionsWithProfiles);
      return sessionsWithProfiles;
    },
  });

  // Show error toast if query fails
  if (error) {
    console.error("Query error:", error);
  }

  const filteredSessions = sessions.filter((session: any) => {
    const matchesSearch =
      session.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.tutor?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.learner?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || session.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const paginatedSessions = filteredSessions.slice(
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      case "accepted":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col relative">
          <LoadingOverlay isLoading={isLoading || isFetching} message="Loading sessions..." />
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
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Sessions ({filteredSessions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Desktop Table View */}
                  <div className="hidden md:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Tutor</TableHead>
                          <TableHead>Learner</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">
                              Loading sessions...
                            </TableCell>
                          </TableRow>
                        ) : filteredSessions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">
                              No sessions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedSessions.map((session: any) => (
                            <TableRow key={session.id}>
                              <TableCell className="font-medium">{session.subject}</TableCell>
                              <TableCell>{session.tutor?.full_name || "N/A"}</TableCell>
                              <TableCell>{session.learner?.full_name || "N/A"}</TableCell>
                              <TableCell>{session.duration_minutes || session.duration} min</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant={getStatusVariant(session.status)} className="flex items-center gap-1 w-fit">
                                    {getStatusIcon(session.status)}
                                    {session.status}
                                  </Badge>
                                  {session.disconnect_reason && (
                                    <Badge variant="destructive" className="text-xs w-fit">
                                      Disconnected
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {session.scheduled_at
                                  ? format(new Date(session.scheduled_at), "MMM dd, yyyy")
                                  : format(new Date(session.created_at), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell className="text-right">
                                {session.status === "completed" ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(`/admin/session-logs?session=${session.id}`)}
                                    className="gap-2"
                                  >
                                    <FileText className="h-4 w-4" />
                                    View Logs
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">No logs yet</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {renderPagination()}

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {isLoading ? (
                      <div className="text-center py-8">Loading sessions...</div>
                    ) : filteredSessions.length === 0 ? (
                      <div className="text-center py-8">No sessions found</div>
                    ) : (
                      paginatedSessions.map((session: any) => (
                        <Card key={session.id}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold">{session.subject}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {session.duration_minutes || session.duration} minutes
                                </p>
                              </div>
                              <div className="flex flex-col gap-1 items-end">
                                <Badge variant={getStatusVariant(session.status)} className="flex items-center gap-1">
                                  {getStatusIcon(session.status)}
                                  {session.status}
                                </Badge>
                                {session.disconnect_reason && (
                                  <Badge variant="destructive" className="text-xs">
                                    Disconnected
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Tutor:</span>
                                <span className="font-medium">{session.tutor?.full_name || "N/A"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Learner:</span>
                                <span className="font-medium">{session.learner?.full_name || "N/A"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Date:</span>
                                <span className="font-medium">
                                  {session.scheduled_at
                                    ? format(new Date(session.scheduled_at), "MMM dd, yyyy")
                                    : format(new Date(session.created_at), "MMM dd, yyyy")}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
