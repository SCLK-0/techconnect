import { useQuery } from "@tanstack/react-query";
import { Eye, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface ObserverCountProps {
  sessionId: string;
}

export function ObserverCount({ sessionId }: ObserverCountProps) {
  const { data: observerInfo, isLoading } = useQuery({
    queryKey: ["observer-count", sessionId],
    queryFn: async () => {
      console.log(" ObserverCount: Checking session", sessionId);

      // Get approved observers from session_participants
      const { data: approvedObservers, error: participantsError } = await supabase
        .from("session_participants" as any)
        .select("user_id, status, role")
        .eq("session_id", sessionId)
        .eq("role", "observer");

      console.log(" ObserverCount: Approved observers from session_participants:", approvedObservers);
      console.log(" ObserverCount: Participants error:", participantsError);

      // Get all observer requests (pending and approved) - fallback for legacy data
      const { data: allRequests, error: requestsError } = await supabase
        .from("observer_requests" as any)
        .select("id, status, requester_id")
        .eq("session_id", sessionId);

      console.log(" ObserverCount: All observer requests:", allRequests);
      console.log(" ObserverCount: Requests error:", requestsError);

      const approvedFromParticipants = approvedObservers?.filter((p: any) => p.status === "approved").length || 0;
      const approvedFromRequests = allRequests?.filter((r: any) => r.status === "approved").length || 0;
      const pendingRequests = allRequests?.filter((r: any) => r.status === "pending").length || 0;

      console.log(" ObserverCount: Counts - Participants:", approvedFromParticipants, "Requests approved:", approvedFromRequests, "Pending:", pendingRequests);

      return {
        approvedCount: Math.max(approvedFromParticipants, approvedFromRequests),
        pendingCount: pendingRequests,
        approvedObservers: approvedObservers || []
      };
    },
  });

  if (isLoading) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Eye className="h-3 w-3" />
        Loading tag-along info...
      </div>
    );
  }

  if (!observerInfo || (observerInfo.approvedCount === 0 && observerInfo.pendingCount === 0)) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Eye className="h-3 w-3" />
        No tag-along learners yet
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {observerInfo.approvedCount > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {observerInfo.approvedCount} approved tag-along{observerInfo.approvedCount !== 1 ? 's' : ''}
        </Badge>
      )}
      {observerInfo.pendingCount > 0 && (
        <Badge variant="outline" className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {observerInfo.pendingCount} pending request{observerInfo.pendingCount !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
}