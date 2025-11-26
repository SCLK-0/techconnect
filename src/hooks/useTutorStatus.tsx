import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

export type TutorStatus = "pending" | "approved" | "rejected" | "disabled" | null;

export const useTutorStatus = () => {
  const { user, role } = useUserRole();
  const [tutorStatus, setTutorStatus] = useState<TutorStatus>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorStatus = async () => {
      // Only check status if user is a tutor
      if (!user || role !== "tutor") {
        setTutorStatus(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("tutor_profiles")
          .select("status")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching tutor status:", error);
          setTutorStatus(null);
        } else {
          setTutorStatus(data?.status as TutorStatus);
        }
      } catch (error) {
        console.error("Error in fetchTutorStatus:", error);
        setTutorStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorStatus();

    // Subscribe to tutor profile changes
    const channel = supabase
      .channel(`tutor-status-${user?.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tutor_profiles",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log("Tutor status changed:", payload.new);
          setTutorStatus((payload.new as any).status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);

  return { tutorStatus, loading, isApproved: tutorStatus === "approved" };
};
