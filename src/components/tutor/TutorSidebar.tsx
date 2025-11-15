import { Users, Calendar, Clock, FileText, Heart, User, Settings, LayoutDashboard, Star, LogOut, Megaphone } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { OnlineStatusToggle } from "@/components/tutor/OnlineStatusToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useInstantRequestNotifications } from "@/hooks/useInstantRequestNotifications";
import { useUserRole } from "@/hooks/useUserRole";
import { GlobalInstantRequestsWidget } from "@/components/tutor/GlobalInstantRequestsWidget";

const menuItems = [
  { title: "Dashboard", url: "/tutor/dashboard", icon: LayoutDashboard },
  { title: "Sessions", url: "/tutor/sessions", icon: Clock },
  { title: "My Tutees", url: "/tutor/tutees", icon: Users },
  { title: "Availability", url: "/tutor/availability", icon: Calendar },
  { title: "Student Feedback", url: "/tutor/feedback", icon: Star },
  { title: "Resources", url: "/tutor/resources", icon: FileText },
  { title: "Announcements", url: "/announcements", icon: Megaphone },
  { title: "Donate", url: "/tutor/donate", icon: Heart },
];

export function TutorSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { user, role } = useUserRole();
  const [isActive, setIsActive] = useState(true);
  const [tutorStatus, setTutorStatus] = useState<string>("approved"); // Default to approved to prevent flickering
  const [isLoading, setIsLoading] = useState(true);

  // Enable instant request notifications on all tutor pages
  useInstantRequestNotifications({ userId: user?.id, role });

  useEffect(() => {
    let userId: string | null = null;

    const checkUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        // Check both profile active status and tutor approval status
        const { data: profileData } = await supabase
          .from("profiles")
          .select("is_active")
          .eq("user_id", user.id)
          .single();
        
        const { data: tutorData } = await supabase
          .from("tutor_profiles")
          .select("status")
          .eq("user_id", user.id)
          .single();
        
        setIsActive(profileData?.is_active ?? true);
        setTutorStatus(tutorData?.status ?? "approved");
        setIsLoading(false);
      }
    };
    checkUserStatus();

    // Subscribe to real-time updates for tutor profile changes (only for status changes from admin)
    const tutorChannel = supabase
      .channel("tutor-profile-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tutor_profiles",
        },
        (payload) => {
          if (userId && payload.new.user_id === userId) {
            // Only update if status actually changed
            const oldStatus = payload.old.status;
            const newStatus = payload.new.status;
            
            if (oldStatus !== newStatus) {
              setTutorStatus(newStatus);
              // Toast notification removed - status changes are silent
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tutorChannel);
    };
  }, []);

  const canNavigate = isActive && tutorStatus === "approved";
  const shouldShowDisabled = !isLoading && !canNavigate;

  const handleLogout = async () => {
    try {
      // Set tutor offline before logout
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user:", userError);
      }
      
      if (user) {
        const { error: updateError } = await supabase
          .from("tutor_profiles")
          .update({ is_online: false })
          .eq("user_id", user.id);
        
        if (updateError) {
          console.error("Error updating online status:", updateError);
        }
      }
      
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }
      
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  return (
    <>
      <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink to={item.url}>
                    {({ isActive: linkActive }) => (
                      <SidebarMenuButton
                        asChild
                        className={
                          shouldShowDisabled
                            ? "opacity-50"
                            : linkActive
                            ? "!bg-primary !text-primary-foreground hover:!bg-primary hover:!text-primary-foreground"
                            : ""
                        }
                        onClick={(e) => {
                          if (!canNavigate && !isLoading) {
                            e.preventDefault();
                            toast.error(
                              !isActive 
                                ? "Your account is inactive. Please contact an administrator." 
                                : "Your tutor profile must be approved to access this feature."
                            );
                          }
                        }}
                      >
                        <span className="flex items-center gap-3 font-normal">
                          <item.icon className="h-4 w-4" />
                          {state === "expanded" && <span className="font-normal">{item.title}</span>}
                        </span>
                      </SidebarMenuButton>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <NavLink to="/edit-profile">
                  {({ isActive }) => (
                    <SidebarMenuButton
                      asChild
                      className={
                        shouldShowDisabled
                          ? "opacity-50"
                          : isActive
                          ? "!bg-primary !text-primary-foreground hover:!bg-primary hover:!text-primary-foreground"
                          : ""
                      }
                      onClick={(e) => {
                        if (!canNavigate && !isLoading) {
                          e.preventDefault();
                          toast.error(
                            !isActive 
                              ? "Your account is inactive. Please contact an administrator." 
                              : "Your tutor profile must be approved to access this feature."
                          );
                        }
                      }}
                    >
                      <span className="flex items-center gap-3 font-normal">
                        <User className="h-4 w-4" />
                        {state === "expanded" && <span className="font-normal">Profile</span>}
                      </span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <NavLink to="/settings">
                  {({ isActive }) => (
                    <SidebarMenuButton
                      asChild
                      className={
                        shouldShowDisabled
                          ? "opacity-50"
                          : isActive
                          ? "!bg-primary !text-primary-foreground hover:!bg-primary hover:!text-primary-foreground"
                          : ""
                      }
                      onClick={(e) => {
                        if (!canNavigate && !isLoading) {
                          e.preventDefault();
                          toast.error(
                            !isActive 
                              ? "Your account is inactive. Please contact an administrator." 
                              : "Your tutor profile must be approved to access this feature."
                          );
                        }
                      }}
                    >
                      <span className="flex items-center gap-3 font-normal">
                        <Settings className="h-4 w-4" />
                        {state === "expanded" && <span className="font-normal">Settings</span>}
                      </span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="flex items-center gap-3 font-normal text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <LogOut className="h-4 w-4" />
                  {state === "expanded" && <span className="font-normal">Log Out</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        {state !== "collapsed" && <OnlineStatusToggle />}
      </SidebarFooter>
      </Sidebar>
      {/* Global instant requests widget - appears on all tutor pages */}
      {user?.id && <GlobalInstantRequestsWidget userId={user.id} />}
    </>
  );
}
