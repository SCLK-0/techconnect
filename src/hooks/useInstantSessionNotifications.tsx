import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface InstantSession {
  id: string;
  learner_id: string;
  subject: string;
  duration: string;
  status: string;
  session_type: string;
}

export function useInstantSessionNotifications(userId: string | undefined, isOnline: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !isOnline) return;

    const channel = supabase
      .channel("instant-sessions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sessions",
          filter: `tutor_id=eq.${userId}`,
        },
        async (payload) => {
          const newSession = payload.new as InstantSession;
          
          if (newSession.session_type !== "instant" || newSession.status !== "pending") {
            return;
          }

          // Play notification sound
          try {
            const audio = new Audio("/notification.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch (error) {}

          // Invalidate queries to update dashboard and GlobalInstantRequestsWidget
          queryClient.invalidateQueries({ queryKey: ["instant-requests"] });
          queryClient.invalidateQueries({ queryKey: ["tutor-stats"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `tutor_id=eq.${userId}`,
        },
        (payload) => {
          const updatedSession = payload.new as InstantSession;
          
          // Invalidate queries when session status changes
          if (updatedSession.session_type === "instant" && 
              (updatedSession.status === "accepted" || updatedSession.status === "rejected")) {
            queryClient.invalidateQueries({ queryKey: ["instant-requests"] });
            queryClient.invalidateQueries({ queryKey: ["tutor-stats"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isOnline, queryClient]);
}
