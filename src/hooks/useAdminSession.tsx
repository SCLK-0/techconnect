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
      // Check if admin session marker exists (sessionStorage clears on browser close)
      const isAdminSessionActive = sessionStorage.getItem('admin_session_active') === 'true';
      
      if (!isAdminSessionActive) {
        console.log("⚠️ Admin session expired (browser was closed), redirecting to login...");
        // Sign out and redirect to admin login
        await supabase.auth.signOut();
        navigate("/admin/login", { replace: true });
      }
    };

    checkAdminSession();
  }, [navigate]);
};
