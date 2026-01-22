import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye, Calendar, Clock, User, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ObserverSession {
  id: string;
  subject: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  learner_name: string;
  tutor_name: string;
  request_status: string; // pending or approved
}

export function ObserverSessions() {
  const queryClient = useQueryClient();

  const { data: observerSessions = [], isLoading } = useQuery({
    queryKey: ["observer-sessions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log(" ObserverSessions: Checking for user", user.id);

      // Get sessions where user is an observer (approved OR pending)
      const { data: participantSessions, error: participantsError } = await supabase
        .from("session_participants" as any)
        .select(`
          session_id,
          status,
          approved_at,
          role,
          user_id
        `)
        .eq("user_id", user.id)
        .eq("role", "observer")
        .in("status", ["approved", "pending"]); // Show both approved and pending

      console.log(" ObserverSessions: All participant sessions for user:", participantSessions);
      console.log(" ObserverSessions: Participants error:", participantsError);

      if (!participantSessions || participantSessions.length === 0) {
        console.log(" ObserverSessions: No observer sessions found");
        return [];
      }

      const sessionIds = participantSessions.map((p: any) => p.session_id);

      // Get session details
      const { data: sessions } = await supabase
        .from("sessions")
        .select(`
          id,
          subject,
          scheduled_at,
          duration_minutes,
          status,
          learner_id,
          tutor_id
        `)
        .in("id", sessionIds)
        .order("scheduled_at", { ascending: true });

      if (!sessions || sessions.length === 0) {
        return [];
      }

      // Get user names
      const userIds = [...new Set([
        ...sessions.map(s => s.learner_id),
        ...sessions.map(s => s.tutor_id)
      ])];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      // Create a map of session_id to request status
      const requestStatusMap = new Map(participantSessions.map((p: any) => [p.session_id, p.status]));

      const result = sessions.map(session => ({
        ...session,
        learner_name: profileMap.get(session.learner_id) || "Unknown",
        tutor_name: profileMap.get(session.tutor_id) || "Unknown",
        request_status: requestStatusMap.get(session.id) || "pending"
      })) as ObserverSession[];

      console.log(" ObserverSessions: Final result to return:", result);
      return result;
    },
  });

  // Mutation to leave an observing session
  const leaveObservingMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log(" Leaving observing session:", sessionId);

      // Delete the observer request/participation
      const { error } = await supabase
        .from("session_participants" as any)
        .delete()
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("role", "observer");

      if (error) {
        console.error("Error leaving observing session:", error);
        throw error;
      }

      // Send notification to session owner (learner)
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("learner_id, subject")
        .eq("id", sessionId)
        .single();

      if (sessionData) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();

        await supabase.from("notifications").insert({
          user_id: sessionData.learner_id,
          type: "session",
          title: "Observer Left Session",
          message: `${userProfile?.full_name || 'Someone'} is no longer tagging along to your session: ${sessionData.subject}`,
          link: "/learner/sessions"
        });
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success("You've left the observing session");
      // Invalidate related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["observer-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["available-observer-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["observer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["observer-count"] });
    },
    onError: (error: any) => {
      console.error("Error leaving observing session:", error);
      toast.error("Failed to leave observing session: " + error.message);
    },
  });

  const handleLeaveObserving = (sessionId: string, sessionSubject: string) => {
    if (confirm(`Are you sure you want to stop tagging along to "${sessionSubject}"?`)) {
      leaveObservingMutation.mutate(sessionId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-8 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  console.log(" ObserverSessions: Rendering with sessions:", observerSessions);

  if (observerSessions.length === 0) {
    console.log(" ObserverSessions: No sessions to display");
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>You're not tagging along to any sessions yet</p>
          <p className="text-sm mt-1">Go to "Find Sessions" tab to request tag-along access to other learners' sessions</p>
        </CardContent>
      </Card>
    );
  }

  console.log(" ObserverSessions: Rendering", observerSessions.length, "observer sessions");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Sessions You're Tagging Along
        </h3>
        <p className="text-sm text-muted-foreground">
          Sessions where you have tag-along access
        </p>
      </div>

      <div className="space-y-4">
        {observerSessions.map((session) => (
          <Card key={session.id} className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    {session.subject}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    {session.learner_name} with {session.tutor_name}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {session.request_status === 'approved' ? 'Approved' : 'Pending Approval'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(session.scheduled_at), "MMM dd, yyyy")}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(session.scheduled_at), "h:mm a")} ({session.duration_minutes} min)
                </div>
              </div>

              <div className="flex gap-2">
                {session.request_status === 'pending' ? (
                  <div className="flex gap-2">
                    <Button disabled className="flex-1" variant="outline">
                      <Clock className="mr-2 h-4 w-4" />
                      Waiting for Approval
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => handleLeaveObserving(session.id, session.subject)}
                      disabled={leaveObservingMutation.isPending}
                      className="flex-shrink-0"
                      title="Cancel your tag-along request"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (session.status === 'accepted' || session.status === 'pending') && (() => {
                  const scheduledTime = new Date(session.scheduled_at);
                  const now = new Date();
                  const durationMinutes = session.duration_minutes || 60;
                  const gracePeriodMinutes = 10;
                  
                  const sessionEndTime = new Date(scheduledTime.getTime() + (durationMinutes + gracePeriodMinutes) * 60000);
                  const minutesUntilStart = Math.floor((scheduledTime.getTime() - now.getTime()) / 60000);
                  const minutesUntilEnd = Math.floor((sessionEndTime.getTime() - now.getTime()) / 60000);
                  
                  // Can only join if session is accepted (not pending)
                  const isAccepted = session.status === 'accepted';
                  const canJoin = isAccepted && ((minutesUntilStart <= 5 && minutesUntilStart >= 0) || (minutesUntilStart < 0 && minutesUntilEnd > 0));
                  const hasExpired = minutesUntilEnd <= 0;
                  
                  let buttonText = 'Tag Along';
                  if (!isAccepted) {
                    buttonText = 'Session Pending Approval';
                  } else if (hasExpired) {
                    buttonText = 'Session Expired';
                  } else if (minutesUntilStart > 5) {
                    buttonText = `Available in ${minutesUntilStart} min`;
                  } else if (minutesUntilStart < 0) {
                    buttonText = 'Tag Along';
                  }
                  
                  return (
                    <div className="flex gap-2">
                      <Button
                        disabled={!canJoin || hasExpired}
                        onClick={() => {
                          // Navigate to session as tag-along
                          window.location.href = `/observer/${session.id}`;
                        }}
                        className="flex-1"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {buttonText}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleLeaveObserving(session.id, session.subject)}
                        disabled={leaveObservingMutation.isPending}
                        className="flex-shrink-0"
                        title="Stop tagging along to this session"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })()}
              </div>

              <p className="text-xs text-muted-foreground">
                You can watch this session but cannot interact with the whiteboard or chat.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}