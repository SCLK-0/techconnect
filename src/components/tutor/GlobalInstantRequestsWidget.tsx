import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface GlobalInstantRequestsWidgetProps {
  userId: string;
}

export function GlobalInstantRequestsWidget({ userId }: GlobalInstantRequestsWidgetProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: instantRequests = [] } = useQuery({
    queryKey: ["instant-requests", userId],
    queryFn: async () => {
      const { data: sessions, error } = await supabase
        .from("sessions")
        .select("id, subject, duration_minutes, created_at, learner_id")
        .eq("tutor_id", userId)
        .eq("session_type", "instant")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1); // Only show the most recent one

      if (error) throw error;

      if (!sessions || sessions.length === 0) return [];

      const learnerIds = sessions.map(s => s.learner_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", learnerIds);

      return sessions.map(session => ({
        ...session,
        profiles: profiles?.find(p => p.user_id === session.learner_id) || { full_name: "Unknown" }
      }));
    },
    refetchInterval: 3000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: string }) => {
      const { error } = await supabase
        .from("sessions")
        .update({ 
          status,
          session_status: status === "accepted" ? "waiting" : "pending"
        })
        .eq("id", sessionId);
      if (error) throw error;
      return sessionId;
    },
    onSuccess: (sessionId, variables) => {
      queryClient.invalidateQueries({ queryKey: ["instant-requests"] });
      
      if (variables.status === "accepted") {
        toast.success("Session accepted! Redirecting...");
        navigate(`/video-session/${sessionId}`);
      } else {
        toast.success("Session declined");
      }
    },
    onError: () => {
      toast.error("Failed to update session status");
    },
  });

  const currentRequest = instantRequests[0];

  if (!currentRequest) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3 min-w-[320px] p-4 bg-background border border-border rounded-lg shadow-lg">
        <Avatar className="h-12 w-12 ring-2 ring-primary/20">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {currentRequest.profiles.full_name?.charAt(0) || "?"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 bg-primary text-primary-foreground">
              <Zap className="h-3 w-3 mr-1" />
              Instant Session
            </div>
          </div>
          
          <p className="text-sm font-semibold text-foreground">
            {currentRequest.profiles.full_name}
          </p>
          
          <p className="text-xs text-muted-foreground">
            {currentRequest.subject} • {currentRequest.duration_minutes || 60} min
          </p>
          
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => updateStatusMutation.mutate({ 
                sessionId: currentRequest.id, 
                status: "accepted" 
              })}
              disabled={updateStatusMutation.isPending}
              className="flex-1 h-8 text-xs"
            >
              Accept
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateStatusMutation.mutate({ 
                sessionId: currentRequest.id, 
                status: "rejected" 
              })}
              disabled={updateStatusMutation.isPending}
              className="flex-1 h-8 text-xs"
            >
              Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
