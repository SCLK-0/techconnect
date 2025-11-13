import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Users, Calendar, DollarSign, FileText, UserCheck } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminAnalytics() {
  const { data: stats } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const [profiles, sessions, donations, resources, tutorProfiles] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("sessions").select("*"),
        supabase.from("donations").select("*"),
        supabase.from("resources").select("*", { count: "exact", head: true }),
        supabase.from("tutor_profiles").select("*"),
      ]);

      const completedSessions = sessions.data?.filter((s) => s.status === "completed").length || 0;
      const totalDonations = donations.data?.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) || 0;
      const approvedTutors = tutorProfiles.data?.filter((t) => t.status === "approved").length || 0;

      return {
        totalUsers: profiles.count || 0,
        totalSessions: sessions.data?.length || 0,
        completedSessions,
        totalDonations,
        totalResources: resources.count || 0,
        approvedTutors,
        pendingTutors: tutorProfiles.data?.filter((t) => t.status === "pending").length || 0,
      };
    },
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-between px-6 bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Analytics</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">Platform Analytics</h2>
                <p className="text-muted-foreground">Comprehensive overview of platform metrics</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      All registered users
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved Tutors</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.approvedTutors || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.pendingTutors || 0} pending approval
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.completedSessions || 0} completed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₱{stats?.totalDonations?.toFixed(2) || "0.00"}</div>
                    <p className="text-xs text-muted-foreground">Platform support</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resources</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalResources || 0}</div>
                    <p className="text-xs text-muted-foreground">Learning materials</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats?.totalSessions
                        ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                        : 0}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground">Session success rate</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Platform Health Metrics</CardTitle>
                  <CardDescription>Real-time system performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">User Engagement</span>
                    <span className="text-sm text-muted-foreground">
                      {stats?.totalSessions && stats?.totalUsers
                        ? (stats.totalSessions / stats.totalUsers).toFixed(1)
                        : "0"}{" "}
                      sessions/user
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tutor Coverage</span>
                    <span className="text-sm text-muted-foreground">
                      {stats?.approvedTutors || 0} active tutors
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Platform Growth</span>
                    <span className="text-sm font-medium text-green-600">Steady</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
