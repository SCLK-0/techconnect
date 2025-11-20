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
  { title: "Favorites", url: "/learner/favorites", icon: Heart },
  { title: "My Sessions", url: "/learner/sessions", icon: Calendar },
  { title: "Resources", url: "/learner/resources", icon: FileText },
  { title: "Announcements", url: "/announcements", icon: Megaphone },
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
                  <NavLink to={item.url}>
                    {({ isActive }) => (
                      <SidebarMenuButton
                        asChild
                        className={
                          isActive
                            ? "!bg-primary !text-primary-foreground hover:!bg-primary hover:!text-primary-foreground"
                            : ""
                        }
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
                        isActive
                          ? "!bg-primary !text-primary-foreground hover:!bg-primary hover:!text-primary-foreground"
                          : ""
                      }
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
                        isActive
                          ? "!bg-primary !text-primary-foreground hover:!bg-primary hover:!text-primary-foreground"
                          : ""
                      }
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
    </Sidebar>
  );
};
