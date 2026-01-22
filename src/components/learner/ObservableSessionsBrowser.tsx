import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Eye, Clock, Calendar, User, BookOpen, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ObservableSession {
  id: string;
  subject: string;
  scheduled_at: string;
  duration_minutes: number;
  learner: {
    full_name: string;
  };
  tutor: {
    full_name: string;
  };
}

export function ObservableSessionsBrowser() {
  const [selectedSession, setSelectedSession] = useState<ObservableSession | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch sessions that allow observers
  const { data: observableSessions = [], isLoading, refetch } = useQuery({
    queryKey: ["observable-sessions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      console.log(" Current user ID:", user.id);

      // Debug: Let's see all sessions with allow_observers=true
      // Using type assertion because allow_observers may not be in generated types
      const { data: allObservableSessions, error: allError } = await supabase
        .from("sessions" as any)
        .select("id, subject, session_type, allow_observers, status, scheduled_at, learner_id, tutor_id")
        .eq("allow_observers", true);
      
      console.log(" All sessions with allow_observers=true:", allObservableSessions);
      if (allError) console.error(" Error fetching all observable sessions:", allError);

      // Debug: Check the full query
      const now = new Date().toISOString();
      console.log(" Current time for filter:", now);

      const { data, error } = await supabase
        .from("sessions" as any)
        .select(`
          id,
          subject,
          scheduled_at,
          duration_minutes,
          learner_id,
          tutor_id,
          session_type,
          status,
          allow_observers
        `)
        .eq("allow_observers", true)
        .in("status", ["pending", "accepted"])
        .gte("scheduled_at", now)
        .neq("learner_id", user.id)
        .neq("tutor_id", user.id)
        .order("scheduled_at", { ascending: true });

      console.log(" Query result:", data);
      console.log(" Query error:", error);
      console.log(" Query params - allow_observers: true, status: pending/accepted, scheduled_at >=", now);

      if (error) {
        console.error("Error fetching observable sessions:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log(" No sessions found after filtering");
        return [];
      }

      // Filter out sessions where user already has requests
      const sessionIds = data.map((s: any) => s.id);
      
      // Check for existing observer requests (any status)
      const { data: existingRequests, error: requestsError } = await supabase
        .from("session_participants" as any)
        .select("session_id, status")
        .eq("user_id", user.id)
        .eq("role", "observer")
        .in("session_id", sessionIds);

      console.log(" Existing requests with status:", existingRequests);
      console.log(" Session IDs being checked:", sessionIds);
      if (requestsError) console.log(" Requests error:", requestsError);

      const requestedSessionIds = new Set(existingRequests?.map((r: any) => r.session_id) || []);
      console.log(" Requested session IDs to filter out:", Array.from(requestedSessionIds));
      
      // Filter out sessions with existing requests
      const availableSessions = data.filter((session: any) => !requestedSessionIds.has(session.id));
      console.log(" Available sessions after filtering requests:", availableSessions);

      if (availableSessions.length === 0) {
        return [];
      }

      const learnerIds = availableSessions.map((s: any) => s.learner_id);
      const tutorIds = availableSessions.map((s: any) => s.tutor_id);
      const allUserIds = [...new Set([...learnerIds, ...tutorIds])];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", allUserIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      return availableSessions.map((session: any) => ({
        ...session,
        learner: { full_name: profileMap.get(session.learner_id) || "Unknown" },
        tutor: { full_name: profileMap.get(session.tutor_id) || "Unknown" }
      })) as ObservableSession[];
    },
    // Force refetch every time to avoid caching issues
    staleTime: 0,
    cacheTime: 0,
  });

  // Request observer access mutation
  const requestAccessMutation = useMutation({
    mutationFn: async ({ sessionId, message }: { sessionId: string; message?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Try using the RPC function first, fall back to direct insert
      const { data, error } = await supabase.rpc('request_observer_access', {
        p_session_id: sessionId,
        p_requester_id: user.id,
        p_message: message || null,
      });

      if (error) {
        // If RPC doesn't exist, try direct insert to session_participants
        console.log("RPC failed, trying direct insert:", error);
        const { error: insertError } = await supabase
          .from("session_participants" as any)
          .insert({
            session_id: sessionId,
            user_id: user.id,
            role: "observer",
            status: "pending"
          });
        
        if (insertError) throw insertError;
        return { success: true, message: "Observer request sent successfully!" };
      }
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.success !== false) {
        toast.success(data?.message || "Observer request sent successfully!");
        setShowRequestDialog(false);
        setRequestMessage("");
        setSelectedSession(null);
        queryClient.invalidateQueries({ queryKey: ["observable-sessions"] });
        queryClient.invalidateQueries({ queryKey: ["observer-requests"] });
      } else {
        toast.error(data?.error || "Failed to send request");
      }
    },
    onError: (error: any) => {
      console.error("Error requesting access:", error);
      toast.error("Failed to send request: " + error.message);
    },
  });

  const handleRequestAccess = (session: ObservableSession) => {
    setSelectedSession(session);
    setShowRequestDialog(true);
  };

  const handleSubmitRequest = () => {
    if (!selectedSession) return;
    
    requestAccessMutation.mutate({
      sessionId: selectedSession.id,
      message: requestMessage.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (observableSessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Observable Sessions</h3>
          <p className="text-muted-foreground">
            No sessions are currently allowing observers. Check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Sessions You Can Observe</h2>
            <p className="text-muted-foreground">Request to watch ongoing tutoring sessions</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>

        <div className="grid gap-4">
          {observableSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      {session.subject}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4" />
                      {session.learner.full_name} with {session.tutor.full_name}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Observer Friendly
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
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
              </CardContent>

              <CardFooter>
                <Button 
                  onClick={() => handleRequestAccess(session)}
                  disabled={requestAccessMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Request to Observe
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Request Observer Access Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Observer Access</DialogTitle>
            <DialogDescription>
              Send a request to observe "{selectedSession?.subject}" with {selectedSession?.learner.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Hi! I'd like to observe this session to learn more about this topic..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={3}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Let them know why you'd like to observe
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRequestDialog(false)}
              disabled={requestAccessMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={requestAccessMutation.isPending}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {requestAccessMutation.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}