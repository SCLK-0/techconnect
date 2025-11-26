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
        // Tutor profile doesn't exist yet - this is normal for new tutors
        console.log("Tutor profile not found - may be newly registered");
        toast.info("Please complete your tutor registration");
        navigate("/", { replace: true });
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

  // Only render children if user is an approved tutor
  if (role === "tutor" && isApproved) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}
