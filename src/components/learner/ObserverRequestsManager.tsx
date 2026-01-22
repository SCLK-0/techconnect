import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye, Check, X, Clock, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ObserverRequest {
  id: string;
  session_id: string;
  requester_id: string;
  message?: string;
  created_at: string;
  status: string;
  requester: {
    full_name: string;
    avatar_url?: string;
  };
  session: {
    id: string;
    subject: string;
    scheduled_at: string;
    duration_minutes: number;
  };
}

export function ObserverRequestsManager() {
  const queryClient = useQueryClient();

  // Fetch pending tag-along requests for user's sessions
  const { data: observerRequests = [], isLoading } = useQuery({
    queryKey: ["observer-requests"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log(" ObserverRequestsManager: Fetching requests for user", user.id);

      // Get sessions where user is the learner (they can approve tag-along requests)
      const { data: userSessions } = await (supabase as any)
        .from("sessions")
        .select("id, subject, scheduled_at, duration_minutes, allow_observers")
        .eq("learner_id", user.id)
        .eq("allow_observers", true); // Only sessions that allow observers

      console.log(" ObserverRequestsManager: User sessions that allow observers:", userSessions);

      if (!userSessions || userSessions.length === 0) {
        return [];
      }

      const sessionIds = userSessions.map((s: any) => s.id);

      // Get pending tag-along requests from session_participants (with deduplication)
      const { data: requests, error } = await supabase
        .from("session_participants" as any)
        .select(`
          session_id,
          user_id,
          role,
          status,
          created_at
        `)
        .eq("role", "observer")
        .eq("status", "pending")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: false });

      // Remove duplicates based on session_id + user_id combination
      const uniqueRequests = requests?.filter((request, index, self) => 
        index === self.findIndex(r => r.session_id === request.session_id && r.user_id === request.user_id)
      ) || [];

      console.log(" ObserverRequestsManager: Pending requests:", requests);
      console.log(" ObserverRequestsManager: Error:", error);

      if (error) {
        console.error("Error fetching tag-along requests:", error);
        throw error;
      }

      if (!uniqueRequests || uniqueRequests.length === 0) {
        return [];
      }

      // Get requester profiles
      const requesterIds = uniqueRequests.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", requesterIds);

      console.log(" ObserverRequestsManager: Profiles:", profiles);

      // Combine the data
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const sessionMap = new Map(userSessions?.map((s: any) => [s.id, s]) || []);

      const result = uniqueRequests.map(request => ({
        id: `${request.session_id}-${request.user_id}`, // Composite ID
        session_id: request.session_id,
        requester_id: request.user_id,
        created_at: request.created_at,
        status: request.status,
        requester: profileMap.get(request.user_id) || { full_name: "Unknown", avatar_url: null },
        session: sessionMap.get(request.session_id) || { id: request.session_id, subject: "Unknown", scheduled_at: "", duration_minutes: 0 }
      })) as ObserverRequest[];

      console.log(" ObserverRequestsManager: Final result:", result);
      return result;
    },
  });

  // Respond to tag-along request mutation
  const respondToRequestMutation = useMutation({
    mutationFn: async ({ sessionId, userId, approved }: { sessionId: string; userId: string; approved: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log(" ObserverRequestsManager: Responding to request", { sessionId, userId, approved });

      // First, let's check if the request exists
      console.log(" Checking request exists:", { sessionId, userId });
      
      const { data: existingRequest, error: checkError } = await supabase
        .from("session_participants" as any)
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", userId)
        .eq("role", "observer")
        .single();

      console.log(" Existing request check:", { existingRequest, checkError });

      if (checkError || !existingRequest) {
        throw new Error(`Request not found. Error: ${checkError?.message || 'No data'}`);
      }

      // Get session details for notification
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("subject")
        .eq("id", sessionId)
        .single();

      // Get approver's name
      const { data: approverProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      if (approved) {
        // Approve the request
        console.log(" Approving request:", { sessionId, userId });
        
        const { data, error } = await supabase
          .from("session_participants" as any)
          .update({ 
            status: "approved"
          })
          .eq("session_id", sessionId)
          .eq("user_id", userId)
          .eq("role", "observer")
          .eq("status", "pending") // Only update if still pending
          .select();

        console.log(" Approve result:", { data, error });

        if (error) {
          console.error(" Approve error:", error);
          throw error;
        }

        // Send notification to requester
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "session",
          title: "Tag-Along Request Approved!",
          message: `${approverProfile?.full_name || 'The session owner'} approved your request to tag along to "${sessionData?.subject || 'their session'}"`,
          link: "/learner/sessions"
        });

        return { success: true, message: "Tag-along request approved!" };
      } else {
        // Decline the request (update status to rejected)
        console.log(" Declining request:", { sessionId, userId });
        
        const { data, error } = await supabase
          .from("session_participants" as any)
          .update({ status: "rejected" })
          .eq("session_id", sessionId)
          .eq("user_id", userId)
          .eq("role", "observer")
          .eq("status", "pending")
          .select();

        console.log(" Decline result:", { data, error });

        if (error) {
          console.error(" Decline error:", error);
          throw error;
        }

        // Send notification to requester
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "session",
          title: "Tag-Along Request Declined",
          message: `Your request to tag along to "${sessionData?.subject || 'a session'}" was declined`,
          link: "/learner/sessions"
        });

        return { success: true, message: "Tag-along request declined" };
      }
    },
    onSuccess: (data, variables) => {
      console.log(" Request response success:", data);
      toast.success(data.message);
      
      // Invalidate all related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["observer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["learner-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["observer-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["observer-count"] });
      queryClient.invalidateQueries({ queryKey: ["available-observer-sessions"] });
    },
    onError: (error: any) => {
      console.error("Error responding to request:", error);
      toast.error("Failed to respond to request: " + error.message);
    },
  });

  const handleApprove = (request: ObserverRequest) => {
    respondToRequestMutation.mutate({ 
      sessionId: request.session_id, 
      userId: request.requester_id, 
      approved: true 
    });
  };

  const handleDecline = (request: ObserverRequest) => {
    respondToRequestMutation.mutate({ 
      sessionId: request.session_id, 
      userId: request.requester_id, 
      approved: false 
    });
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

  if (observerRequests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Tag-Along Requests</h3>
          <p className="text-muted-foreground">
            When other learners request to tag along to your sessions, they'll appear here for approval.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Tag-Along Requests</h2>
        <p className="text-muted-foreground">Learners who want to tag along to your sessions</p>
      </div>

      <div className="space-y-4">
        {observerRequests.map((request) => (
          <Card key={request.id} className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={request.requester.avatar_url} />
                    <AvatarFallback>
                      {request.requester.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5 text-orange-600" />
                      {request.requester.full_name} wants to tag along
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4" />
                      {request.session.subject}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Pending
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Session: {format(new Date(request.session.scheduled_at), "MMM dd, yyyy 'at' h:mm a")}</span>
                  <span>Duration: {request.session.duration_minutes} minutes</span>
                </div>
              </div>

              {request.message && (
                <div className="bg-background/50 rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Message from {request.requester.full_name}:</span>
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{request.message}"</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(request)}
                  disabled={respondToRequestMutation.isPending}
                  className="flex-1"
                  size="sm"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleDecline(request)}
                  disabled={respondToRequestMutation.isPending}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <X className="mr-2 h-4 w-4" />
                  Decline
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Tag-along learners can see and hear the session but cannot interact with the whiteboard or chat.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}