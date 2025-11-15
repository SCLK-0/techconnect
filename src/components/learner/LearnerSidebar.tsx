import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Calendar,
  FileText,
  MessageSquare,
  Megaphone,
  Heart,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const menuItems = [
  { title: "Dashboard", url: "/learner/dashboard", icon: LayoutDashboard },
  { title: "Find Tutors", url: "/learner/find-tutors", icon: Search },
  { title: "My Sessions", url: "/learner/sessions", icon: Calendar },
  { title: "Resources", url: "/learner/resources", icon: FileText },
  { title: "Announcements", url: "/announcements", icon: Megaphone },
  { title: "Donate", url: "/donate", icon: Heart },
];

export const LearnerSidebar = () => {
  const { state } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary text-primary-foreground hover:!bg-primary hover:!text-primary-foreground flex items-center gap-3 font-normal"
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
                        ? "bg-primary text-primary-foreground hover:!bg-primary hover:!text-primary-foreground flex items-center gap-3 font-normal"
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
                        ? "bg-primary text-primary-foreground hover:!bg-primary hover:!text-primary-foreground flex items-center gap-3 font-normal"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 font-normal"
                    }
                  >
                    <Settings className="h-4 w-4" />
                    {state === "expanded" && <span className="font-normal">Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
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
    </Sidebar>
  );
};
