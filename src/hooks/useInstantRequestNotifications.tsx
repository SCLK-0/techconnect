import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface InstantRequestNotificationsProps {
  userId: string | undefined;
  role: string | null;
}

export function useInstantRequestNotifications({ userId, role }: InstantRequestNotificationsProps) {
  const navigate = useNavigate();
  const shownRequestsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only for tutors
    if (!userId || role !== "tutor") return;

    console.log("🔔 Setting up instant request notifications for tutor:", userId);

    // Subscribe to new instant requests
    const channel = supabase
      .channel(`instant-requests-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sessions",
          filter: `tutor_id=eq.${userId}`,
        },
        async (payload) => {
          const newSession = payload.new as any;
          
          // Only show for instant sessions that are pending
          if (newSession.session_type === "instant" && newSession.status === "pending") {
            // Prevent duplicate toasts
            if (shownRequestsRef.current.has(newSession.id)) {
              return;
            }
            shownRequestsRef.current.add(newSession.id);

            // Fetch learner name
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", newSession.learner_id)
              .single();

            const learnerName = profile?.full_name || "A learner";

            // Just log - the widget will handle the UI
            console.log("🔔 New instant request received:", newSession.id, "from", learnerName);
          }
        }
      )
      .subscribe();

    return () => {
      console.log("🔕 Cleaning up instant request notifications");
      supabase.removeChannel(channel);
    };
  }, [userId, role, navigate]);
}
