import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Star, Clock, CheckCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useInstantSessionNotifications } from "@/hooks/useInstantSessionNotifications";

export default function TutorDashboard() {
  const { user } = useUserRole();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [tutorStatus, setTutorStatus] = useState<string>("");

  // Enable instant session notifications
  useInstantSessionNotifications(user?.id, isOnline);

  const { data: stats } = useQuery({
    queryKey: ["tutor-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.rpc('get_tutor_stats', { 
        tutor_user_id: user.id 
      });
      return data?.[0];
    },
    enabled: !!user,
  });

  const { data: recentSessions = [] } = useQuery({
    queryKey: ["recent-sessions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("tutor_id", user.id)
        .order("scheduled_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      
      const learnerIds = data?.map(s => s.learner_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", learnerIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      return data?.map(s => ({ ...s, learner_name: profileMap.get(s.learner_id) })) || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    
    const loadStatus = async () => {
      const { data } = await supabase
        .from("tutor_profiles")
        .select("is_online, status")
        .eq("user_id", user.id)
        .single();
      setIsOnline(data?.is_online || false);
      setTutorStatus(data?.status || "");
    };
    loadStatus();

    const fetchUserProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();
      
      if (data?.full_name) {
        const name = data.full_name.split(" ")[0];
        setFirstName(name);
      }
    };
    fetchUserProfile();

    const sessionChannel = supabase
      .channel("tutor-status")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
          filter: `tutor_id=eq.${user.id}`,
        },
        () => {}
      )
      .subscribe();
    
    // Subscribe to online status and approval status changes for real-time sync
    const statusChannel = supabase
      .channel("tutor-online-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tutor_profiles",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setIsOnline(payload.new.is_online);
          setTutorStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(statusChannel);
    };
  }, [user]);

  const toggleOnlineStatus = async () => {
    if (!user) return;
    const newStatus = !isOnline;
    
    const { error } = await supabase
      .from("tutor_profiles")
      .update({ is_online: newStatus })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      setIsOnline(newStatus);
      toast.success(`You are now ${newStatus ? "online" : "offline"}`);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <TutorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center justify-center px-3">
            <div className="w-full max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold">Dashboard</h1>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <UserMenu />
              </div>
            </div>
          </header>

          <main className="flex-1 px-3 py-6 overflow-auto flex justify-center">
            <div className="space-y-6 w-full max-w-7xl">
              {tutorStatus === "pending" && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-semibold text-orange-900 dark:text-orange-100">Account Not Active Yet</p>
                        <p className="text-sm text-orange-700 dark:text-orange-200">
                          Your tutor profile is pending admin approval. You'll be notified once approved.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {tutorStatus === "rejected" && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-semibold text-red-900 dark:text-red-100">Application Rejected</p>
                        <p className="text-sm text-red-700 dark:text-red-200">
                          Unfortunately, your tutor application was not approved. Please contact support for more information.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold">
                    {firstName === null ? (
                      <Skeleton className="h-9 w-64" />
                    ) : (
                      `Welcome back${firstName ? `, ${firstName}` : ''}!`
                    )}
                  </h2>
                  <p className="text-muted-foreground">Here's your tutoring overview</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="online-status">Online Status</Label>
                  <Switch
                    id="online-status"
                    checked={isOnline}
                    onCheckedChange={toggleOnlineStatus}
                    disabled={tutorStatus !== "approved"}
                  />
                  <Badge variant={isOnline ? "default" : "secondary"}>
                    {isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {stats === undefined ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">{stats?.total_sessions || 0}</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {stats === undefined ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">{stats?.completed_sessions || 0}</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {stats === undefined ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      <div className="text-2xl font-bold">
                        {stats?.average_rating || "N/A"}
                        {stats?.average_rating && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({stats?.total_reviews} reviews)
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {stats === undefined ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">{stats?.pending_sessions || 0}</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Sessions</CardTitle>
                    <CardDescription>Your latest tutoring sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentSessions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No sessions yet</p>
                    ) : (
                      <div className="space-y-3">
                        {recentSessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between border-b pb-2">
                            <div>
                              <p className="text-sm font-medium">{session.subject}</p>
                              <p className="text-xs text-muted-foreground">
                                {session.learner_name}
                              </p>
                            </div>
                            <Badge variant={
                              session.status === 'completed' ? 'default' :
                              session.status === 'pending' ? 'secondary' : 'outline'
                            }>
                              {session.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Manage your tutoring activities</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      disabled={tutorStatus !== "approved"}
                      onClick={() => {
                        if (tutorStatus === "approved") {
                          navigate("/tutor/sessions");
                        } else {
                          toast.error("Your tutor profile must be approved to access this feature.");
                        }
                      }}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      View Session Requests
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      disabled={tutorStatus !== "approved"}
                      onClick={() => {
                        if (tutorStatus === "approved") {
                          navigate("/tutor/availability");
                        } else {
                          toast.error("Your tutor profile must be approved to access this feature.");
                        }
                      }}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Set Availability
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      disabled={tutorStatus !== "approved"}
                      onClick={() => {
                        if (tutorStatus === "approved") {
                          navigate("/tutor/resources");
                        } else {
                          toast.error("Your tutor profile must be approved to access this feature.");
                        }
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Upload Resources
                    </Button>
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
