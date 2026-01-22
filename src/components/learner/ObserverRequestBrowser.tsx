import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye, Calendar, Clock, User, Plus, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AvailableSession {
  id: string;
  subject: string;
  scheduled_at: string;
  duration_minutes: number;
  learner_name: string;
  tutor_name: string;
  status: string;
  has_requested?: boolean;
}

export function ObserverRequestBrowser() {
  const queryClient = useQueryClient();

  const { data: availableSessions = [], isLoading, refetch } = useQuery({
    queryKey: ["available-observer-sessions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log(" ObserverRequestBrowser: Fetching available sessions for user", user.id);

      // Get sessions that allow observers and are upcoming
      // Include both pending and accepted sessions
      // Using type assertion because allow_observers and session_participants may not be in generated types
      const { data: sessions, error: sessionsError } = await (supabase as any)
        .from("sessions")
        .select(`
          id,
          subject,
          scheduled_at,
          duration_minutes,
          learner_id,
          tutor_id,
          status,
          allow_observers
        `)
        .eq("allow_observers", true)
        .in("status", ["pending", "accepted"])
        .gte("scheduled_at", new Date().toISOString())
        .neq("learner_id", user.id) // Don't show user's own sessions
        .neq("tutor_id", user.id) // Don't show sessions where user is tutor
        .order("scheduled_at", { ascending: true })
        .limit(10);

      console.log(" ObserverRequestBrowser: Sessions query result:", sessions, sessionsError);
      console.log(" ObserverRequestBrowser: Query params - allow_observers: true, status: pending/accepted, scheduled_at >=", new Date().toISOString());

      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) return [];

      // Get user names
      const userIds = [...new Set([
        ...sessions.map((s: any) => s.learner_id),
        ...sessions.map((s: any) => s.tutor_id)
      ])];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      // Check which sessions user has already requested observer access for
      // Filter out ANY sessions where user has made a request (pending, approved, or rejected)
      const sessionIds = sessions.map((s: any) => s.id);
      const { data: existingRequests } = await (supabase as any)
        .from("session_participants")
        .select("session_id, status")
        .eq("user_id", user.id)
        .eq("role", "observer")
        .in("session_id", sessionIds);

      console.log(" ObserverRequestBrowser: Existing requests:", existingRequests);

      const requestedSessionIds = new Set(existingRequests?.map((r: any) => r.session_id) || []);
      console.log(" ObserverRequestBrowser: Sessions to filter out:", Array.from(requestedSessionIds));

      // Filter out sessions where user already has ANY request
      const availableSessions = sessions.filter((session: any) => !requestedSessionIds.has(session.id));
      console.log(" ObserverRequestBrowser: Available sessions after filtering:", availableSessions);

      const result = availableSessions.map((session: any) => ({
        ...session,
        learner_name: profileMap.get(session.learner_id) || "Unknown",
        tutor_name: profileMap.get(session.tutor_id) || "Unknown",
        status: session.status,
        has_requested: false // These are all available sessions now
      })) as AvailableSession[];

      console.log(" ObserverRequestBrowser: Final result:", result);
      return result;
    },
  });

  const requestObserverAccess = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First check if there's an existing rejected request - if so, update it instead of inserting
      const { data: existingRequest } = await (supabase as any)
        .from("session_participants")
        .select("id, status")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("role", "observer")
        .single();

      if (existingRequest) {
        // Update existing request back to pending
        const { error: updateError } = await (supabase as any)
          .from("session_participants")
          .update({ status: "pending" })
          .eq("session_id", sessionId)
          .eq("user_id", user.id)
          .eq("role", "observer");

        if (updateError) throw updateError;
      } else {
        // Insert new request
        const { error } = await (supabase as any)
          .from("session_participants")
          .insert({
            session_id: sessionId,
            user_id: user.id,
            role: "observer",
            status: "pending"
          });

        if (error) throw error;
      }

      // Get session details for notification
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("learner_id, subject")
        .eq("id", sessionId)
        .single();

      // Get requester's name
      const { data: requesterProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      // Send notification to session owner
      if (sessionData?.learner_id) {
        await supabase.from("notifications").insert({
          user_id: sessionData.learner_id,
          type: "session",
          title: "New Tag-Along Request",
          message: `${requesterProfile?.full_name || 'Someone'} wants to tag along to your "${sessionData.subject}" session`,
          link: "/learner/sessions"
        });
      }
    },
    onSuccess: () => {
      toast.success("Tag-along request sent! Waiting for approval.");
      queryClient.invalidateQueries({ queryKey: ["available-observer-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["observer-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["observer-requests"] });
    },
    onError: (error) => {
      console.error("Error requesting observer access:", error);
      toast.error("Failed to send tag-along request");
    }
  });

  // Cancel a pending tag-along request
  const cancelObserverRequest = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete the pending request
      const { error } = await (supabase as any)
        .from("session_participants")
        .delete()
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("role", "observer")
        .eq("status", "pending");

      if (error) throw error;

      // Get session details for notification
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("learner_id, subject")
        .eq("id", sessionId)
        .single();

      // Get requester's name
      const { data: requesterProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      // Send notification to session owner that request was cancelled
      if (sessionData?.learner_id) {
        await supabase.from("notifications").insert({
          user_id: sessionData.learner_id,
          type: "session",
          title: "Tag-Along Request Cancelled",
          message: `${requesterProfile?.full_name || 'Someone'} cancelled their tag-along request for your "${sessionData.subject}" session`,
          link: "/learner/sessions"
        });
      }
    },
    onSuccess: () => {
      toast.success("Tag-along request cancelled");
      queryClient.invalidateQueries({ queryKey: ["available-observer-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["observer-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["observer-requests"] });
    },
    onError: (error) => {
      console.error("Error cancelling observer request:", error);
      toast.error("Failed to cancel tag-along request");
    }
  });

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

  if (availableSessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No sessions available for tag-along at the moment</p>
          <p className="text-sm mt-1">Check back later for new sessions that allow tag-along learners</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium">Available Sessions</h4>
          <p className="text-sm text-muted-foreground">
            Request to tag along to upcoming sessions that allow tag-along learners
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>
      
      {availableSessions.map((session) => (
        <Card key={session.id} className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-600" />
                  {session.subject}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4" />
                  {session.learner_name} with {session.tutor_name}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Open for Tag-Along
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
              {session.has_requested ? (
                <Button 
                  variant="outline"
                  onClick={() => cancelObserverRequest.mutate(session.id)}
                  disabled={cancelObserverRequest.isPending}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Request
                </Button>
              ) : (
                <Button
                  onClick={() => requestObserverAccess.mutate(session.id)}
                  disabled={requestObserverAccess.isPending}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Request Tag-Along Access
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {session.has_requested 
                ? "Your request is pending approval. You can cancel it if you change your mind."
                : "Request to tag along to this session. You'll be notified when approved."
              }
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}