import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { Activity, Users, Video } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { seedAdminData } from "@/utils/seedAdminData";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";

export default function AdminLiveMonitoring() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Seed data on mount if needed
  useEffect(() => {
    seedAdminData();
  }, []);

  const { data: stats } = useQuery({
    queryKey: ["live-stats"],
    queryFn: async () => {
      // Get tutors who are marked online and have been active in last 2 minutes
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: tutors } = await supabase
        .from("tutor_profiles")
        .select("id")
        .eq("is_online", true)
        .eq("status", "approved")
        .gt("last_seen", twoMinutesAgo);

      const { data: sessions, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("session_status", "in_progress")
        .order("scheduled_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for tutors and learners
      const userIds = new Set<string>();
      sessions?.forEach((session: any) => {
        if (session.tutor_id) userIds.add(session.tutor_id);
        if (session.learner_id) userIds.add(session.learner_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]));

      const enrichedSessions = sessions?.map((session: any) => ({
        ...session,
        tutor: { full_name: profileMap.get(session.tutor_id) || "Unknown" },
        learner: { full_name: profileMap.get(session.learner_id) || "Unknown" }
      }));

      return {
        onlineTutors: tutors?.length || 0,
        activeSessions: enrichedSessions?.length || 0,
        sessions: enrichedSessions || []
      };
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  useEffect(() => {
    // Real-time subscription for tutor online status
    const tutorChannel = supabase
      .channel("tutor-status-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tutor_profiles",
        },
        () => {
          // Trigger refetch without full reload
          queryClient.invalidateQueries({ queryKey: ["live-stats"] });
        }
      )
      .subscribe();

    // Real-time subscription for session changes
    const sessionChannel = supabase
      .channel("session-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["live-stats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tutorChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, []);

  const totalPages = Math.ceil((stats?.sessions?.length || 0) / itemsPerPage);
  const paginatedSessions = stats?.sessions?.slice(
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
          <header className="h-16 border-b flex items-center justify-center px-3 py-4">
            <div className="w-full max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden" />
                <div className="flex items-center gap-2">
                  <img src={logo} alt="TechConnect Logo" className="h-8 w-8 object-contain" />
                  <span className="font-semibold text-lg hidden sm:inline">TechConnect</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <UserMenu />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pt-8 pb-6 overflow-auto flex justify-center">
            <div className="grid gap-2 md:grid-cols-2 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Online Tutors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.onlineTutors || 0}</div>
                  <p className="text-xs text-muted-foreground">Currently available</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
                  <p className="text-xs text-muted-foreground">In progress or waiting</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Active Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.sessions && stats.sessions.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {paginatedSessions?.map((session: any) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{session.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            Tutor: {session.tutor?.full_name || "Unknown"} • Learner: {session.learner?.full_name || "Unknown"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={session.session_status === "in_progress" ? "default" : "secondary"}>
                            {session.session_status}
                          </Badge>
                           <button
                            onClick={() => window.open(`/video-session/${session.id}?monitor=true`, '_blank')}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                          >
                            Monitor
                          </button>
                        </div>
                      </div>
                    ))}
                    </div>
                    
                    {renderPagination()}
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No active sessions</p>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
