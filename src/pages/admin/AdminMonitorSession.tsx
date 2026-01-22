import { useParams, Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export default function AdminMonitorSession() {
  const { sessionId } = useParams();
  const { role, isLoading } = useUserRole();

  if (isLoading) {
    return <LoadingOverlay isLoading={true} message="Loading..." />;
  }

  // Only admins can access this page
  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (!sessionId) {
    return <Navigate to="/admin/live-monitoring" replace />;
  }

  // Redirect to VideoSession with monitor mode enabled
  // This uses the same video infrastructure as tutor/learner for better reliability
  return <Navigate to={`/video-session/${sessionId}?monitor=true`} replace />;
}
