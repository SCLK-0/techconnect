import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole, UserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading } = useUserRole();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Check if user profile is active
  // Note: is_active is for ACCOUNT-level deactivation (complete ban)
  // For tutors, use tutor_profiles.status (pending/approved/rejected/disabled) instead
  useEffect(() => {
    const checkUserStatus = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("is_active")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error checking user status:", error);
          setCheckingProfile(false);
          return;
        }

        setIsActive(data?.is_active ?? true);
        setCheckingProfile(false);
      } else {
        setCheckingProfile(false);
      }
    };

    checkUserStatus();
  }, [user]);

  useEffect(() => {
    if (!loading && !checkingProfile) {
      if (!user) {
        navigate("/login");
      } else if (isActive === false) {
        // User account is deactivated - sign them out
        supabase.auth.signOut();
        toast.error("Your account has been deactivated. Please contact an administrator.");
        navigate("/login");
      } else if (role && !allowedRoles.includes(role)) {
        // User has wrong role, redirect to home but keep them logged in
        navigate("/");
      }
    }
  }, [user, role, loading, checkingProfile, isActive, navigate, allowedRoles]);

  if (loading || checkingProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!user || !role || !allowedRoles.includes(role) || isActive === false) {
    return null;
  }

  return <>{children}</>;
};
