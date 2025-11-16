import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LearnerSidebar } from "@/components/learner/LearnerSidebar";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Settings as SettingsIcon } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUserRole } from "@/hooks/useUserRole";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export default function Settings() {
  const { role, loading } = useUserRole();
  
  // Determine which sidebar to use based on role (uses cached role for instant loading)
  const Sidebar = role === "admin" ? AdminSidebar : role === "tutor" ? TutorSidebar : LearnerSidebar;
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col relative">
          <LoadingOverlay isLoading={loading} message="Loading settings..." />
          <header className="h-16 border-b flex items-center justify-center px-3 py-4">
            <div className="w-full max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={logo} alt="TechConnect Logo" className="h-8 w-8 object-contain" />
                <span className="font-semibold text-lg hidden sm:inline">TechConnect</span>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <UserMenu />
                <SidebarTrigger className="md:hidden" />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pt-8 pb-12 overflow-auto flex justify-center">
            <div className="space-y-6 w-full max-w-[95%] sm:max-w-[90%] md:max-w-5xl">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Settings</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Customize how the app looks and manage preferences
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>Customize how the app looks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Theme</p>
                      <p className="text-sm text-muted-foreground">Switch between light and dark mode</p>
                    </div>
                    <ThemeToggle />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
