import { useNavigate, NavLink } from "react-router-dom";
import { useSidebar, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, LineChart, Users, CheckCircle, Calendar, FileText, Heart, Megaphone, User, Settings, LogOut, Activity, FileTextIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const menuItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Analytics", url: "/admin/analytics", icon: LineChart },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Tutor Approvals", url: "/admin/approvals", icon: CheckCircle },
  { title: "Session Management", url: "/admin/sessions", icon: Calendar },
  { title: "Session Logs", url: "/admin/session-logs", icon: FileTextIcon },
  { title: "Resource Approval", url: "/admin/resources", icon: FileText },
  { title: "Announcements", url: "/admin/announcements", icon: Megaphone },
  { title: "Donation Management", url: "/admin/donations", icon: Heart },
  { title: "Live Monitoring", url: "/admin/live-monitoring", icon: Activity },
];

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error logging out");
    } else {
      navigate("/login");
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground flex items-center gap-3 font-normal"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 font-normal"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {state === "expanded" && <span className="font-normal">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
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
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/edit-profile" 
                    className={({ isActive }) =>
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground flex items-center gap-3 font-normal"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 font-normal"
                    }
                  >
                    <User className="h-4 w-4" />
                    {state === "expanded" && <span className="font-normal">Profile</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/settings" 
                    className={({ isActive }) =>
                      isActive
                        ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground flex items-center gap-3 font-normal"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 font-normal"
                    }
                  >
                    <Settings className="h-4 w-4" />
                    {state === "expanded" && <span className="font-normal">Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} className="font-normal text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <LogOut className="h-4 w-4" />
                  {state === "expanded" && <span className="font-normal">Log Out</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
