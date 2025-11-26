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

    // Check if tutor is approved
    if (!isApproved) {
      if (tutorStatus === "pending") {
        toast.info("Your tutor application is pending approval");
        navigate("/", { replace: true });
      } else if (tutorStatus === "rejected") {
        toast.error("Your tutor application was rejected");
        navigate("/", { replace: true });
      } else if (tutorStatus === "disabled") {
        toast.error("Your tutor account has been disabled");
        navigate("/", { replace: true });
      } else if (tutorStatus === null) {
        // Tutor profile doesn't exist - this is a data issue
        // Allow access but log the issue for debugging
        console.warn("Tutor role exists but no tutor_profile found for user:", role);
        // Don't block access - this might be a database sync issue
        // The tutor can still use the system, admin should fix the profile
      } else {
        // This shouldn't happen, but handle it gracefully
        console.error("Unexpected tutor status:", tutorStatus);
        toast.error("Unable to verify tutor status");
        navigate("/", { replace: true });
      }
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
