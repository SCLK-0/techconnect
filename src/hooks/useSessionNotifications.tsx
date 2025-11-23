import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInMinutes, format } from "date-fns";
import { sendSessionReminderEmail } from "@/utils/sendNotificationEmail";

export function useSessionNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const checkUpcomingSessions = async () => {
      const now = new Date();
      
      const { data: sessions, error } = await supabase
        .from("sessions")
        .select("id, subject, scheduled_at, tutor_id, learner_id")
        .eq("status", "accepted")
        .gte("scheduled_at", now.toISOString())
        .or(`tutor_id.eq.${userId},learner_id.eq.${userId}`);

      if (error) {
        console.error("Error fetching upcoming sessions:", error);
        return;
      }

      sessions?.forEach(async (session) => {
        const scheduledTime = new Date(session.scheduled_at);
        const minutesUntil = differenceInMinutes(scheduledTime, now);

        // Notify 5 minutes before
        if (minutesUntil <= 5 && minutesUntil > 0) {
          const notificationKey = `session-${session.id}-5min`;
          const hasNotified = localStorage.getItem(notificationKey);

          if (!hasNotified) {
            toast.info(`Session "${session.subject}" starts in ${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}!`, {
              duration: 10000,
            });
            localStorage.setItem(notificationKey, "true");

            // Send email reminder
            try {
              const { data: userProfile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("user_id", userId)
                .single();

              // Get user's email using RPC function
              const { data: userEmail, error: emailError } = await supabase
                .rpc('get_user_email', { user_id: userId });

              if (emailError) {
                console.error("Error fetching user email:", emailError);
              }

              if (userEmail) {
                await sendSessionReminderEmail(
                  userEmail,
                  userProfile?.full_name || "User",
                  session.subject,
                  format(scheduledTime, "MMMM d, yyyy 'at' h:mm a")
                );
              }
            } catch (error) {
              console.error("Error sending reminder email:", error);
            }
          }
        }

        // Clear notification flag after session time has passed
        if (minutesUntil < 0) {
          localStorage.removeItem(`session-${session.id}-5min`);
        }
      });
    };

    // Check immediately
    checkUpcomingSessions();

    // Check every minute
    const interval = setInterval(checkUpcomingSessions, 60000);

    return () => clearInterval(interval);
  }, [userId]);
}
