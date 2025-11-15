import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { AvailabilityCalendar } from "@/components/tutor/AvailabilityCalendar";
import { toast } from "sonner";
import { Clock, Trash2, Copy } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface TimeSlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function TutorAvailability() {
  const { user } = useUserRole();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [dayAvailability, setDayAvailability] = useState<any[]>([]);
  const [newSlot, setNewSlot] = useState<TimeSlot>({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "10:00",
    is_available: true,
  });

  useEffect(() => {
    if (!user) return;
    
    loadAvailability();
    loadDayAvailability();

    // Subscribe to realtime updates
    const availabilityChannel = supabase
      .channel("availability-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tutor_availability",
          filter: `tutor_id=eq.${user.id}`,
        },
        () => {
          loadAvailability();
        }
      )
      .subscribe();

    const dayAvailabilityChannel = supabase
      .channel("day-availability-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tutor_day_availability",
          filter: `tutor_id=eq.${user.id}`,
        },
        () => {
          loadDayAvailability();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(availabilityChannel);
      supabase.removeChannel(dayAvailabilityChannel);
    };
  }, [user]);

  const loadAvailability = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tutor_availability")
      .select("*")
      .eq("tutor_id", user.id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (!error && data) {
      setSlots(data);
    }
  };

  const loadDayAvailability = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tutor_day_availability")
      .select("*")
      .eq("tutor_id", user.id)
      .gte("date", new Date().toISOString().split('T')[0])
      .order("date", { ascending: true });

    if (!error && data) {
      setDayAvailability(data);
    }
  };

  const addSlot = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from("tutor_availability")
      .insert({
        tutor_id: user.id,
        ...newSlot,
      });

    if (error) {
      toast.error("Failed to add time slot");
    } else {
      toast.success("Time slot added");
      setNewSlot({
        day_of_week: 1,
        start_time: "09:00",
        end_time: "10:00",
        is_available: true,
      });
      loadAvailability();
    }
  };

  const toggleSlot = async (id: string, isAvailable: boolean) => {
    const { error } = await supabase
      .from("tutor_availability")
      .update({ is_available: !isAvailable })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success("Availability updated");
    }
  };

  const deleteSlot = async (id: string) => {
    const { error } = await supabase
      .from("tutor_availability")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Time slot deleted");
    }
  };

  const duplicateToAllDays = async (slot: TimeSlot) => {
    if (!user) return;
    
    const slots = DAYS.map((_, idx) => ({
      tutor_id: user.id,
      day_of_week: idx,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: true,
    }));

    const { error } = await supabase
      .from("tutor_availability")
      .insert(slots);

    if (error) {
      toast.error("Failed to duplicate");
    } else {
      toast.success("Time slot duplicated to all days");
      loadAvailability();
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <TutorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-center px-3 py-4">
            <div className="w-full max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden" />
                <div className="flex items-center gap-2">
                  <img src={logo} alt="TechConnect Logo" className="h-8 w-8 object-contain" />
                  <span className="font-semibold text-lg hidden sm:inline">TechConnect</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <UserMenu />
              </div>
            </div>
          </header>

          <main className="flex-1 px-3 pt-8 pb-6 overflow-auto flex justify-center">
            <div className="space-y-6 w-full max-w-5xl">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Recurring Schedule</CardTitle>
                  <CardDescription>Set your recurring weekly hours for tutoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <div>
                      <Label>Day of Week</Label>
                      <select
                        className="w-full p-2 border rounded bg-background"
                        value={newSlot.day_of_week}
                        onChange={(e) => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}
                      >
                        {DAYS.map((day, idx) => (
                          <option key={idx} value={idx}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={newSlot.start_time}
                          onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={newSlot.end_time}
                          onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button onClick={addSlot} className="w-full sm:w-auto">
                      <Clock className="mr-2 h-4 w-4" />
                      Add Time Slot
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Weekly Schedule</CardTitle>
                  <CardDescription>Manage your recurring availability (updates in real-time)</CardDescription>
                </CardHeader>
                <CardContent>
                  {slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No time slots set</p>
                  ) : (
                    <div className="space-y-3">
                      {slots.map((slot) => (
                        <div key={slot.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border p-3 rounded">
                          <div className="space-y-1">
                            <p className="font-medium">{DAYS[slot.day_of_week]}</p>
                            <p className="text-sm text-muted-foreground">
                              {slot.start_time} - {slot.end_time}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={slot.is_available}
                                onCheckedChange={() => toggleSlot(slot.id!, slot.is_available)}
                              />
                              <span className="text-sm">
                                {slot.is_available ? "Available" : "Unavailable"}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => duplicateToAllDays(slot)}
                              title="Apply to all days"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteSlot(slot.id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <AvailabilityCalendar 
                tutorId={user?.id || ""} 
                dayAvailability={dayAvailability}
                onUpdate={loadDayAvailability}
              />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
