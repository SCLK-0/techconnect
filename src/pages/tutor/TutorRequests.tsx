import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, User, Check, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { RejectSessionDialog } from "@/components/tutor/RejectSessionDialog";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";

export default function TutorRequests() {
  const { user } = useUserRole();
  const queryClient = useQueryClient();
  const [initialLoad, setInitialLoad] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);


  const { data: requests = [], isLoading, isFetching, isSuccess } = useQuery({
    queryKey: ["session-requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("tutor_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false});
      if (error) throw error;
      
      const learnerIds = data?.map(s => s.learner_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", learnerIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }]) || []);
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
      toast.success("Session updated");
      queryClient.invalidateQueries({ queryKey: ["session-requests"] });
    },
    onError: () => {
      toast.error("Failed to update session");
    },
  });

  // Clear initial load state once query is successful
  useEffect(() => {
    if (isSuccess) {
      setInitialLoad(false);
    }
  }, [isSuccess]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <TutorSidebar />
        <div className="flex-1 flex flex-col relative">
          <LoadingOverlay isLoading={initialLoad || isLoading || isFetching} message="Loading requests..." />
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
              <MaintenanceBanner />
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Session Requests</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Review and respond to tutoring session requests
                </p>
              </div>

              {requests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No pending requests
                  </CardContent>
                </Card>
              ) : (
                requests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            {request.subject}
                            <Badge variant="secondary">
                              {request.session_type === "instant" ? "Instant" : "Scheduled"}
                            </Badge>
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            {request.profiles?.full_name}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-4 text-sm">
                        {request.scheduled_at && (
                          <>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(request.scheduled_at), "PPP")}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {format(new Date(request.scheduled_at), "p")} ({request.duration_minutes} min)
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => updateStatusMutation.mutate({ 
                            sessionId: request.id, 
                            status: "accepted" 
                          })}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            console.log("Decline clicked, opening dialog for session:", request.id);
                            setSelectedSession(request);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      {selectedSession && (
        <RejectSessionDialog
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          sessionId={selectedSession.id}
          tutorId={user?.id || ""}
          learnerName={selectedSession.profiles?.full_name || "Learner"}
          subject={selectedSession.subject}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["session-requests"] });
          }}
        />
      )}
    </SidebarProvider>
  );
}
