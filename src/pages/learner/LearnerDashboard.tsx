import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Calendar, FileText, MessageSquare, Search, Video, Megaphone, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LearnerSidebar } from "@/components/learner/LearnerSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";

import { format } from "date-fns";

export default function LearnerDashboard() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<number | null>(null);
  const [completedSessions, setCompletedSessions] = useState<number | null>(null);
  const [resourcesCount, setResourcesCount] = useState<number | null>(null);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();
        
        if (data?.full_name) {
          const name = data.full_name.split(" ")[0];
          setFirstName(name);
        }
      }
    };

    const fetchSessionStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch upcoming sessions count
        const { count: upcomingCount, error: upcomingError } = await supabase
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .eq("learner_id", user.id)
          .in("status", ["pending", "accepted"])
          .gte("scheduled_at", new Date().toISOString());
        
        if (upcomingError) {
          console.error("Error fetching upcoming sessions:", upcomingError);
        } else {
          setUpcomingSessions(upcomingCount || 0);
        }
        
        // Fetch completed sessions count
        const { count: completedCount, error: completedError } = await supabase
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .eq("learner_id", user.id)
          .eq("status", "completed");
        
        if (completedError) {
          console.error("Error fetching completed sessions:", completedError);
        } else {
          setCompletedSessions(completedCount || 0);
        }

        // Fetch resources count
        const { count: resourceCount, error: resourceError } = await supabase
          .from("resources")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved");
        
        if (resourceError) {
          console.error("Error fetching resources:", resourceError);
        } else {
          setResourcesCount(resourceCount || 0);
        }
      }
    };

    const fetchAnnouncements = async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .or(`expires_at.is.null,expires_at.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (error) {
        console.error("Error fetching announcements:", error);
      } else {
        setRecentAnnouncements(data || []);
      }
    };

    fetchUserProfile();
    fetchAnnouncements();
    fetchSessionStats().then(() => setInitialLoad(false));

    // Set up real-time subscription for sessions
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const sessionsChannel = supabase
          .channel("learner-sessions-updates")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "sessions",
              filter: `learner_id=eq.${user.id}`,
            },
            () => {
              console.log("Session update detected, refreshing stats...");
              fetchSessionStats();
            }
          )
          .subscribe();

        // Set up real-time subscription for resources
        const resourcesChannel = supabase
          .channel("resources-updates")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "resources",
            },
            () => {
              console.log("Resources update detected, refreshing stats...");
              fetchSessionStats();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(sessionsChannel);
          supabase.removeChannel(resourcesChannel);
        };
      }
    });

    // Also refresh stats every 30 seconds as backup
    const interval = setInterval(() => {
      fetchSessionStats();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <LearnerSidebar />
        
        <div className="flex-1 flex flex-col relative">
          <LoadingOverlay isLoading={initialLoad} message="Loading dashboard..." />
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
              <MaintenanceBanner />
              
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-2">
                  {firstName === null ? (
                    <Skeleton className="h-9 w-64" />
                  ) : (
                    `Welcome${firstName ? `, ${firstName}` : ''}!`
                  )}
                </h2>
                <p className="text-muted-foreground">
                  Here's what's happening with your learning journey today.
                </p>
              </div>

              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {upcomingSessions === null ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{upcomingSessions}</div>
                        <p className="text-xs text-muted-foreground">
                          {upcomingSessions === 0 ? "No sessions scheduled" : "Sessions scheduled"}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {completedSessions === null ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{completedSessions}</div>
                        <p className="text-xs text-muted-foreground">Total sessions completed</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Available Resources</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {resourcesCount === null ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{resourcesCount}</div>
                        <p className="text-xs text-muted-foreground">
                          {resourcesCount === 0 ? "No resources yet" : "Resources to explore"}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Get started with your learning</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      className="w-full justify-start" 
                      variant="default"
                      onClick={() => navigate("/demo-preview?role=learner")}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Start Demo Session
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <NavLink to="/learner/find-tutors">
                        <Search className="mr-2 h-4 w-4" />
                        Find a Tutor
                      </NavLink>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <NavLink to="/learner/sessions">
                        <Calendar className="mr-2 h-4 w-4" />
                        View My Sessions
                      </NavLink>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <NavLink to="/learner/resources">
                        <FileText className="mr-2 h-4 w-4" />
                        Browse Resources
                      </NavLink>
                    </Button>

                  </CardContent>
                </Card>

                <Card className="flex flex-col">
                  <CardHeader>
                    <CardTitle>Recent Announcements</CardTitle>
                    <CardDescription>Stay updated with the latest news</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1">
                    {recentAnnouncements.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No announcements yet</p>
                    ) : (
                      recentAnnouncements.map((announcement) => (
                        <div key={announcement.id} className="space-y-1">
                          <div className="flex items-start gap-2">
                            <Megaphone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1">{announcement.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(announcement.created_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                  {recentAnnouncements.length > 0 && (
                    <div className="px-6 pb-6 pt-0">
                      <Button 
                        variant="link" 
                        className="w-full p-0 h-auto text-sm" 
                        onClick={() => navigate("/announcements")}
                      >
                        View all announcements →
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
