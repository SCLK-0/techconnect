import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Wifi, WifiOff } from "lucide-react";

export function OnlineStatusToggle() {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tutorStatus, setTutorStatus] = useState<string>("");

  useEffect(() => {
    fetchOnlineStatus();
    
    // Subscribe to online status changes for real-time sync
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const channel = supabase
        .channel('online-status-sync')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tutor_profiles',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setIsOnline(payload.new.is_online);
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, []);

  useEffect(() => {
    // Heartbeat interval - update last_seen every 15 seconds when online
    if (!isOnline) return;

    const heartbeatInterval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase
        .from("tutor_profiles")
        .update({ last_seen: new Date().toISOString() })
        .eq("user_id", user.id);
    }, 15000);
    
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [isOnline]);

  const fetchOnlineStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("tutor_profiles")
        .select("is_online, status")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setIsOnline(data?.is_online || false);
      setTutorStatus(data?.status || "");
    } catch (error) {
      console.error("Error fetching online status:", error);
    }
  };

  const toggleOnlineStatus = async (checked: boolean) => {
    if (tutorStatus !== "approved") {
      toast.error("You must be approved by an admin to go online");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User not found");
        setLoading(false);
        return;
      }

      const updateData = { 
        is_online: checked,
        last_seen: new Date().toISOString()
      };

      const { error } = await supabase
        .from("tutor_profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating online status:", error);
        toast.error(`Failed to update status: ${error.message}`);
        throw error;
      }

      setIsOnline(checked);
      toast.success(
        checked ? "✅ You are now online and visible to learners" : "You are now offline",
        { duration: 1500 }
      );
    } catch (error: any) {
      console.error("Error updating online status:", error);
      toast.error(error?.message || "Failed to update online status");
      // Revert the state
      await fetchOnlineStatus();
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || tutorStatus !== "approved";

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t">
      <div className={`${isOnline ? "text-green-500" : "text-muted-foreground"}`}>
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
      </div>
      <Label htmlFor="online-status" className="flex-1 cursor-pointer text-sm">
        {isOnline ? "Online" : "Offline"}
      </Label>
      <Switch
        id="online-status"
        checked={isOnline}
        onCheckedChange={toggleOnlineStatus}
        disabled={isDisabled}
      />
    </div>
  );
}
