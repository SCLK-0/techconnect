import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { Users, UserCheck, Activity, Calendar, Megaphone } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const [userRoles, sessions, tutorProfiles] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }),
        supabase.from("sessions").select("*"),
        supabase.from("tutor_profiles").select("*", { count: "exact" }).eq("status", "pending"),
      ]);

      const activeSessions = sessions.data?.filter(
        (s) => s.session_status === "in_progress" || s.status === "accepted"
      ).length || 0;

      return {
        totalUsers: userRoles.count || 0,
        pendingApprovals: tutorProfiles.count || 0,
        activeSessions,
        totalSessions: sessions.data?.length || 0,
      };
    },
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center justify-center px-3">
            <div className="w-full max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold">Admin Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
              <NotificationBell />
              <UserMenu />
            </div>
            </div>
          </header>

          <main className="flex-1 px-3 py-6 overflow-auto flex justify-center">
            <div className="space-y-6 w-full max-w-7xl">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Platform Overview</h2>
                <p className="text-muted-foreground">
                  Monitor and manage the TechConnect platform.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground">Registered users</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.pendingApprovals || 0}</div>
                    <p className="text-xs text-muted-foreground">Tutor applications</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
                    <p className="text-xs text-muted-foreground">Live sessions now</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
                    <p className="text-xs text-muted-foreground">All time</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Manage platform operations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <NavLink to="/admin/approvals">
                        <UserCheck className="mr-2 h-4 w-4" />
                        Review Tutor Applications
                      </NavLink>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <NavLink to="/admin/announcements">
                        <Megaphone className="mr-2 h-4 w-4" />
                        Create Announcement
                      </NavLink>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <NavLink to="/admin/users">
                        <Users className="mr-2 h-4 w-4" />
                        Manage Users
                      </NavLink>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <NavLink to="/admin/sessions">
                        <Calendar className="mr-2 h-4 w-4" />
                        View All Sessions
                      </NavLink>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Platform Health</CardTitle>
                    <CardDescription>System status and metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">System Status</span>
                        <span className="text-sm font-medium text-green-600">Operational</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active Users</span>
                        <span className="text-sm font-medium">{stats?.totalUsers || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Pending Reviews</span>
                        <span className="text-sm font-medium">{stats?.pendingApprovals || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
