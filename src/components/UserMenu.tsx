import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { toast as sonnerToast } from "sonner";

export function UserMenu() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { role } = useUserRole();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [tutorStatus, setTutorStatus] = useState<string>("approved"); // Default to approved to prevent flickering

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let userId: string | null = null;

    const fetchProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          return;
        }
        
        if (user) {
          userId = user.id;
          const { data, error } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, is_active")
            .eq("user_id", user.id)
            .maybeSingle();
          
          if (error) {
            return;
          }
          
          if (data) {
            setProfile(data);
            setIsActive(data.is_active ?? true);
            
            // If user is a tutor, check tutor status
            if (role === "tutor") {
              const { data: tutorData } = await supabase
                .from("tutor_profiles")
                .select("status")
                .eq("user_id", user.id)
                .single();
              
              setTutorStatus(tutorData?.status ?? "approved");
            }
          }
        }
      } catch (error) {
        console.error("Exception in fetchProfile:", error);
      }
    };

    fetchProfile();

    // Listen for auth changes and refetch profile
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          fetchProfile();
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    // Real-time subscription for profile changes
    const profileChannel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    // Real-time subscription for tutor profile status changes
    const tutorChannel = supabase
      .channel("tutor-profile-status")
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
              // Don't show toast here - TutorSidebar handles it
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(tutorChannel);
    };
  }, [role]);

  const handleLogout = async () => {
    try {
      // Set tutor offline status before logout
      if (role === "tutor") {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (!userError && user) {
          const { error: updateError } = await supabase
            .from("tutor_profiles")
            .update({ is_online: false })
            .eq("user_id", user.id);
          
          if (updateError) {
            toast({
              title: "Warning",
              description: "Could not update online status",
              variant: "destructive",
            });
          }
        }
      }
      
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }
      
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out properly",
        variant: "destructive",
      });
    }
  };

  const getInitials = () => {
    if (!profile?.full_name || profile.full_name.trim() === "") return "?";
    const parts = profile.full_name.trim().split(" ").filter(p => p.length > 0);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getProfilePath = () => {
    return "/edit-profile";
  };

  const getSettingsPath = () => {
    return "/settings";
  };

  const canAccessSettings = () => {
    if (role !== "tutor") return true;
    return isActive && tutorStatus === "approved";
  };

  const handleProfileClick = () => {
    if (canAccessSettings()) {
      navigate(getProfilePath());
    } else {
      sonnerToast.error(
        !isActive 
          ? "Your account is inactive. Please contact an administrator." 
          : "Your tutor profile must be approved to access this feature."
      );
    }
  };

  const handleSettingsClick = () => {
    if (canAccessSettings()) {
      navigate(getSettingsPath());
    } else {
      sonnerToast.error(
        !isActive 
          ? "Your account is inactive. Please contact an administrator." 
          : "Your tutor profile must be approved to access this feature."
      );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
          <Avatar className="h-9 w-9 cursor-pointer border-2 border-background">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">{getInitials()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={handleProfileClick}
          className={!canAccessSettings() ? "opacity-50" : ""}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Edit Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSettingsClick}
          className={!canAccessSettings() ? "opacity-50" : ""}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        {mounted && (
          <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {theme === "light" ? (
              <>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light Mode</span>
              </>
            )}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
