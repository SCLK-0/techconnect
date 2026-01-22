import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useMissedSessionsChecker } from "./hooks/useMissedSessionsChecker";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import RoleSelection from "./pages/RoleSelection";
import LearnerRegistration from "./pages/LearnerRegistration";
import TutorRegistration from "./pages/TutorRegistration";
import ConfirmEmail from "./pages/ConfirmEmail";
import LearnerDashboard from "./pages/learner/LearnerDashboard";
import FindTutors from "./pages/learner/FindTutors";
import FavoriteTutors from "./pages/learner/FavoriteTutors";
import MySessions from "./pages/learner/MySessions";
import LearnerResources from "./pages/learner/LearnerResources";

import TutorDashboard from "./pages/tutor/TutorDashboard";
import TutorRequests from "./pages/tutor/TutorRequests";
import TutorSessions from "./pages/tutor/TutorSessions";
import TutorTutees from "./pages/tutor/TutorTutees";
import TutorAvailability from "./pages/tutor/TutorAvailability";
import TutorFeedback from "./pages/tutor/TutorFeedback";

import TutorResources from "./pages/tutor/TutorResources";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminSessions from "./pages/admin/AdminSessions";
import AdminResources from "./pages/admin/AdminResources";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminLiveMonitoring from "./pages/admin/AdminLiveMonitoring";
import AdminMonitorSession from "./pages/admin/AdminMonitorSession";
import AdminSessionLogs from "./pages/admin/AdminSessionLogs";
import Announcements from "./pages/Announcements";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import VideoSession from "./pages/VideoSession";
import DemoSession from "./pages/DemoSession";
import DemoPreview from "./pages/DemoPreview";
import DemoAdmit from "./pages/DemoAdmit";
import QuickStartGuide from "./pages/QuickStartGuide";
import AuthCallback from "./pages/AuthCallback";
// Removed GroupSessionsTest - focusing only on observer functionality
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Automatically check and mark missed sessions every 2 minutes
  useMissedSessionsChecker();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/quick-start" element={<QuickStartGuide />} />
          {/* Removed group-sessions-test route - focusing only on observer functionality */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/role-selection" element={<RoleSelection />} />
          <Route path="/register/learner" element={<LearnerRegistration />} />
          <Route path="/register/tutor" element={<TutorRegistration />} />
          <Route path="/confirm-email" element={<ConfirmEmail />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Learner Routes */}
          <Route 
            path="/learner/dashboard" 
            element={
              <ProtectedRoute allowedRoles={["learner"]}>
                <LearnerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learner/find-tutors" 
            element={
              <ProtectedRoute allowedRoles={["learner"]}>
                <FindTutors />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learner/favorites" 
            element={
              <ProtectedRoute allowedRoles={["learner"]}>
                <FavoriteTutors />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learner/sessions" 
            element={
              <ProtectedRoute allowedRoles={["learner"]}>
                <MySessions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learner/resources" 
            element={
              <ProtectedRoute allowedRoles={["learner"]}>
                <LearnerResources />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/announcements" 
            element={
              <ProtectedRoute allowedRoles={["learner", "tutor", "admin"]}>
                <Announcements />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/edit-profile" 
            element={
              <ProtectedRoute allowedRoles={["learner", "tutor", "admin"]}>
                <EditProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute allowedRoles={["learner", "tutor", "admin"]}>
                <Settings />
              </ProtectedRoute>
            } 
          />
          
          {/* Tutor Routes */}
          <Route 
            path="/tutor/dashboard" 
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <TutorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/tutor/sessions" 
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <TutorSessions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tutor/tutees" 
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <TutorTutees />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tutor/availability" 
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <TutorAvailability />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tutor/feedback" 
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <TutorFeedback />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tutor/resources"
            element={
              <ProtectedRoute allowedRoles={["tutor"]}>
                <TutorResources />
              </ProtectedRoute>
            } 
          />

          
          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/announcements" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAnnouncements />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/approvals" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminApprovals />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/sessions" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSessions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/resources" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminResources />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/analytics" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/live-monitoring" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminLiveMonitoring />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/monitor/:sessionId" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminMonitorSession />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/session-logs" 
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminSessionLogs />
              </ProtectedRoute>
            } 
          />
          
          {/* Video Session Route */}
          <Route 
            path="/video-session/:sessionId" 
            element={
              <ProtectedRoute allowedRoles={["learner", "tutor", "admin"]}>
                <VideoSession />
              </ProtectedRoute>
            } 
          />
          
          {/* Observer Video Session Route */}
          <Route 
            path="/observer/:sessionId" 
            element={
              <ProtectedRoute allowedRoles={["learner", "tutor", "admin"]}>
                <VideoSession />
              </ProtectedRoute>
            } 
          />

          {/* Demo Preview Route */}
          <Route 
            path="/demo-preview" 
            element={
              <ProtectedRoute allowedRoles={["learner", "tutor"]}>
                <DemoPreview />
              </ProtectedRoute>
            } 
          />
          
          {/* Demo Admit Route */}
          <Route 
            path="/demo-admit" 
            element={
              <ProtectedRoute allowedRoles={["learner", "tutor"]}>
                <DemoAdmit />
              </ProtectedRoute>
            } 
          />
          
          {/* Demo Session Route */}
          <Route 
            path="/demo-session" 
            element={
              <ProtectedRoute allowedRoles={["learner", "tutor"]}>
                <DemoSession />
              </ProtectedRoute>
            } 
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
