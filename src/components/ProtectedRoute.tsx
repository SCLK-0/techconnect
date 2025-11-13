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

        // If user is not active, sign them out and redirect
        if (data && !data.is_active) {
          await supabase.auth.signOut();
          toast.error("Your account has been deactivated. Please contact an administrator.");
          navigate("/login");
        }
      } else {
        setCheckingProfile(false);
      }
    };

    checkUserStatus();
  }, [user, navigate]);

  useEffect(() => {
    if (!loading && !checkingProfile) {
      if (!user) {
        navigate("/login");
      } else if (role && !allowedRoles.includes(role)) {
        navigate("/");
      }
    }
  }, [user, role, loading, checkingProfile, navigate, allowedRoles]);

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
