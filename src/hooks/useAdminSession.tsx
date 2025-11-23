import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to validate admin session on page load
 * Ensures admin sessions expire when browser is closed
 */
export const useAdminSession = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminSession = async () => {
      // First check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No session at all, redirect to login
        console.log("⚠️ No session found, redirecting to login...");
        navigate("/admin/login", { replace: true });
        return;
      }

      // Check if admin session marker exists (sessionStorage clears on browser close)
      const isAdminSessionActive = sessionStorage.getItem('admin_session_active') === 'true';
      
      if (!isAdminSessionActive) {
        // Session exists but marker is missing - set it for this session
        // This handles the case where admin navigates between pages
        console.log("⚠️ Admin session marker missing, setting it now...");
        sessionStorage.setItem('admin_session_active', 'true');
      }
    };

    checkAdminSession();
  }, [navigate]);
};
