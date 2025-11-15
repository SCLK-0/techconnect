import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, User, CheckCircle, Check, X, Video } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSessionNotifications } from "@/hooks/useSessionNotifications";

export default function TutorSessions() {
  const { user } = useUserRole();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"pending" | "accepted" | "completed" | "cancelled" | "missed">("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Enable session notifications
  useSessionNotifications(user?.id);

  const { data: sessions = [] } = useQuery({
    queryKey: ["tutor-sessions", user?.id, filter],
    queryFn: async () => {
      if (!user) return [];
      
      // Auto-update passed accepted sessions to missed (only if still waiting)
      // Sessions are missed only if: current time > (scheduled_at + duration_minutes + 20 minutes grace period)
      if (filter === "accepted") {
        // First, fetch sessions to check which ones are actually missed
        const { data: sessionsToCheck } = await supabase
          .from("sessions")
          .select("id, scheduled_at, duration_minutes")
          .eq("tutor_id", user.id)
          .eq("status", "accepted")
          .eq("session_status", "waiting");

        if (sessionsToCheck && sessionsToCheck.length > 0) {
          const now = new Date();
          const missedSessionIds = sessionsToCheck.filter(session => {
            const scheduledAt = new Date(session.scheduled_at);
            const durationMinutes = session.duration_minutes || 60; // Default 60 if not set
            const gracePeriodMinutes = 20;
            const missedThreshold = new Date(scheduledAt.getTime() + (durationMinutes + gracePeriodMinutes) * 60000);
            return now > missedThreshold;
          }).map(s => s.id);

          if (missedSessionIds.length > 0) {
            await supabase
              .from("sessions")
              .update({ status: "missed", session_status: "missed" })
              .in("id", missedSessionIds);
          }
        }
      }
      
      let query = supabase
        .from("sessions")
        .select("*")
        .eq("tutor_id", user.id)
        .eq("status", filter);
      
      // Exclude instant sessions from cancelled tab
      if (filter === "cancelled") {
        query = query.neq("session_type", "instant");
      }
      
      const { data, error } = await query.order("scheduled_at", { ascending: false });
      if (error) throw error;
      
      const learnerIds = data?.map(s => s.learner_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", learnerIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, { full_name: p.full_name }]) || []);
      return data?.map(s => ({ ...s, profiles: profileMap.get(s.learner_id) })) || [];
    },
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: string }) => {
      const { error } = await supabase
        .from("sessions")
        .update({ status })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Session updated successfully");
      queryClient.invalidateQueries({ queryKey: ["tutor-sessions"] });
    },
    onError: () => {
      toast.error("Failed to update session");
    },
  });


  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const paginatedSessions = sessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <TutorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-between px-6 bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Sessions</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-6">
              <Tabs value={filter} onValueChange={(v) => { setFilter(v as any); setCurrentPage(1); }}>
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="pending" className="text-xs sm:text-sm">Pending</TabsTrigger>
                  <TabsTrigger value="accepted" className="text-xs sm:text-sm">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs sm:text-sm">Completed</TabsTrigger>
                  <TabsTrigger value="missed" className="text-xs sm:text-sm">Missed</TabsTrigger>
                  <TabsTrigger value="cancelled" className="text-xs sm:text-sm">Cancelled</TabsTrigger>
                </TabsList>

                <TabsContent value={filter} className="mt-6">
                  {sessions.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center text-muted-foreground">
                        No {filter} sessions
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {paginatedSessions.map((session) => (
                          <Card key={session.id}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <CardTitle>{session.subject}</CardTitle>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    {session.profiles?.full_name}
                                  </div>
                                </div>
                                <Badge>{session.session_type}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                {session.scheduled_at && (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      {format(new Date(session.scheduled_at), "PPP")}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      {format(new Date(session.scheduled_at), "p")} ({session.duration_minutes} min)
                                    </div>
                                  </>
                                )}
                              </div>
                              {filter === "pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => updateStatusMutation.mutate({ sessionId: session.id, status: "accepted" })}
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Accept
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => updateStatusMutation.mutate({ sessionId: session.id, status: "cancelled" })}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Decline
                                  </Button>
                                </div>
                              )}
                              {filter === "accepted" && (() => {
                                const scheduledTime = new Date(session.scheduled_at);
                                const now = new Date();
                                const durationMinutes = session.duration_minutes || 60;
                                const gracePeriodMinutes = 20;
                                
                                // Session end time = scheduled + duration + grace period
                                const sessionEndTime = new Date(scheduledTime.getTime() + (durationMinutes + gracePeriodMinutes) * 60000);
                                const minutesUntilStart = Math.floor((scheduledTime.getTime() - now.getTime()) / 60000);
                                const minutesUntilEnd = Math.floor((sessionEndTime.getTime() - now.getTime()) / 60000);
                                
                                // Can join if: within 5 minutes before start OR after start but before end time
                                const canJoin = (minutesUntilStart <= 5 && minutesUntilStart >= 0) || (minutesUntilStart < 0 && minutesUntilEnd > 0);
                                const hasExpired = minutesUntilEnd <= 0;
                                
                                let buttonText = 'Join Session';
                                if (hasExpired) {
                                  buttonText = 'Session Expired';
                                } else if (minutesUntilStart > 5) {
                                  buttonText = `Available in ${minutesUntilStart} min`;
                                } else if (minutesUntilStart < 0) {
                                  const minutesLate = Math.abs(minutesUntilStart);
                                  buttonText = minutesLate > 0 ? `Join (${minutesLate} min late)` : 'Join Session';
                                }
                                
                                return (
                                  <Button
                                    onClick={() => navigate(`/video-session/${session.id}`)}
                                    disabled={!canJoin}
                                    variant={minutesUntilStart < 0 && canJoin ? "outline" : "default"}
                                    title={hasExpired ? 'Session has expired (duration + 20 min grace period passed)' : !canJoin ? `Available ${Math.abs(minutesUntilStart)} minutes before session` : ''}
                                  >
                                    <Video className="mr-2 h-4 w-4" />
                                    {buttonText}
                                  </Button>
                                );
                              })()}
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <Pagination className="mt-6">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          {(() => {
                            const pages = [];
                            const maxVisible = 5;
                            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                            let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                            
                            if (endPage - startPage < maxVisible - 1) {
                              startPage = Math.max(1, endPage - maxVisible + 1);
                            }
                            
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <PaginationItem key={i}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(i)}
                                    isActive={currentPage === i}
                                    className="cursor-pointer"
                                  >
                                    {i}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                            return pages;
                          })()}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
