import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useTutorStatus } from "@/hooks/useTutorStatus";
import { toast } from "sonner";
import { LoadingOverlay } from "@/components/LoadingOverlay";

interface TutorRouteGuardProps {
  children: React.ReactNode;
}

export function TutorRouteGuard({ children }: TutorRouteGuardProps) {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const { tutorStatus, loading: statusLoading, isApproved } = useTutorStatus();

  useEffect(() => {
    // Wait for role to load first
    if (roleLoading) return;

    // Check if user is a tutor
    if (role !== "tutor") {
      toast.error("Access denied - Tutor access required");
      navigate("/", { replace: true });
      return;
    }

    // Now wait for tutor status to load
    if (statusLoading) return;

    // Check if tutor is approved (but allow null status - database sync issue)
    if (!isApproved && tutorStatus !== null) {
      if (tutorStatus === "pending") {
        toast.info("Your tutor application is pending approval");
        navigate("/", { replace: true });
      } else if (tutorStatus === "rejected") {
        toast.error("Your tutor application was rejected");
        navigate("/", { replace: true });
      } else if (tutorStatus === "disabled") {
        toast.error("Your tutor account has been disabled");
        navigate("/", { replace: true });
      } else {
        // This shouldn't happen, but handle it gracefully
        console.error("Unexpected tutor status:", tutorStatus);
        toast.error("Unable to verify tutor status");
        navigate("/", { replace: true });
      }
    }
    
    // Log warning if tutor has no profile (for admin debugging)
    if (tutorStatus === null) {
      console.warn("⚠️ Tutor role exists but no tutor_profile found - allowing access");
    }
  }, [role, tutorStatus, isApproved, roleLoading, statusLoading, navigate]);

  // Show loading while checking permissions
  if (roleLoading || statusLoading) {
    return <LoadingOverlay isLoading={true} message="Verifying access..." />;
  }

  // Only render children if user is an approved tutor OR if status is null (database issue)
  if (role === "tutor" && (isApproved || tutorStatus === null)) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}
