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
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";

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
  const [initialLoad, setInitialLoad] = useState(true);
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
      console.log("Loaded day availability from database:", data);
      setDayAvailability(data);
      setInitialLoad(false);
    }
  };

  const addSlot = async () => {
    if (!user) return;
    
    // Validate that end time is after start time
    const [startHours, startMinutes] = newSlot.start_time.split(":").map(Number);
    const [endHours, endMinutes] = newSlot.end_time.split(":").map(Number);
    const startTimeInMinutes = startHours * 60 + startMinutes;
    const endTimeInMinutes = endHours * 60 + endMinutes;
    
    if (endTimeInMinutes <= startTimeInMinutes) {
      toast.error("Invalid time range", {
        description: "End time must be after start time"
      });
      return;
    }
    
    // Check for overlapping slots on the same day
    const existingSlotsForDay = slots.filter(s => s.day_of_week === newSlot.day_of_week);
    
    const hasOverlap = existingSlotsForDay.some(slot => {
      const [slotStartHours, slotStartMinutes] = slot.start_time.split(':').map(Number);
      const [slotEndHours, slotEndMinutes] = slot.end_time.split(':').map(Number);
      const slotStartInMinutes = slotStartHours * 60 + slotStartMinutes;
      const slotEndInMinutes = slotEndHours * 60 + slotEndMinutes;
      
      // Check if time ranges overlap
      return (
        (startTimeInMinutes >= slotStartInMinutes && startTimeInMinutes < slotEndInMinutes) ||
        (endTimeInMinutes > slotStartInMinutes && endTimeInMinutes <= slotEndInMinutes) ||
        (startTimeInMinutes <= slotStartInMinutes && endTimeInMinutes >= slotEndInMinutes)
      );
    });
    
    if (hasOverlap) {
      toast.error("Time slot overlaps with existing slot", {
        description: `${DAYS[newSlot.day_of_week]} already has a conflicting time slot`,
      });
      return;
    }
    
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
    if (!user) return;
    
    // If trying to mark as unavailable, check for existing sessions
    if (isAvailable) {
      const slotToToggle = slots.find(s => s.id === id);
      if (!slotToToggle) {
        toast.error("Slot not found");
        return;
      }
      
      // Check for existing sessions on this day of week in the next 60 days
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 60);
      
      const { data: existingSessions, error: sessionError } = await supabase
        .from("sessions")
        .select("id, scheduled_at, learner_id")
        .eq("tutor_id", user.id)
        .in("status", ["pending", "accepted"])
        .gte("scheduled_at", today.toISOString())
        .lte("scheduled_at", endDate.toISOString());
      
      if (sessionError) {
        toast.error("Failed to check for existing sessions");
        return;
      }
      
      // Filter sessions that fall on this day of week and within the time slot
      const [slotStartHours, slotStartMinutes] = slotToToggle.start_time.split(':').map(Number);
      const [slotEndHours, slotEndMinutes] = slotToToggle.end_time.split(':').map(Number);
      const slotStartInMinutes = slotStartHours * 60 + slotStartMinutes;
      const slotEndInMinutes = slotEndHours * 60 + slotEndMinutes;
      
      const conflictingSessions = existingSessions?.filter(session => {
        const sessionDate = new Date(session.scheduled_at);
        if (sessionDate.getDay() !== slotToToggle.day_of_week) return false;
        
        const sessionHours = sessionDate.getHours();
        const sessionMinutes = sessionDate.getMinutes();
        const sessionTimeInMinutes = sessionHours * 60 + sessionMinutes;
        
        return sessionTimeInMinutes >= slotStartInMinutes && sessionTimeInMinutes < slotEndInMinutes;
      }) || [];
      
      if (conflictingSessions.length > 0) {
        toast.error(`Cannot mark as unavailable: ${conflictingSessions.length} existing session(s)`, {
          description: "Please cancel or reschedule these sessions first.",
          duration: 6000,
        });
        return;
      }
    }
    
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
    if (!user) return;
    
    // Get the slot details first
    const slotToDelete = slots.find(s => s.id === id);
    if (!slotToDelete) {
      toast.error("Slot not found");
      return;
    }
    
    // Check for existing sessions on this day of week in the next 60 days
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60);
    
    // Find all dates that match this day of week
    const datesToCheck: Date[] = [];
    const currentDate = new Date(today);
    while (currentDate <= endDate) {
      if (currentDate.getDay() === slotToDelete.day_of_week) {
        datesToCheck.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Check for sessions on any of these dates
    const { data: existingSessions, error: sessionError } = await supabase
      .from("sessions")
      .select("id, scheduled_at, learner_id")
      .eq("tutor_id", user.id)
      .in("status", ["pending", "accepted"])
      .gte("scheduled_at", today.toISOString())
      .lte("scheduled_at", endDate.toISOString());
    
    if (sessionError) {
      toast.error("Failed to check for existing sessions");
      return;
    }
    
    // Filter sessions that fall on this day of week and within the time slot
    const [slotStartHours, slotStartMinutes] = slotToDelete.start_time.split(':').map(Number);
    const [slotEndHours, slotEndMinutes] = slotToDelete.end_time.split(':').map(Number);
    const slotStartInMinutes = slotStartHours * 60 + slotStartMinutes;
    const slotEndInMinutes = slotEndHours * 60 + slotEndMinutes;
    
    const conflictingSessions = existingSessions?.filter(session => {
      const sessionDate = new Date(session.scheduled_at);
      if (sessionDate.getDay() !== slotToDelete.day_of_week) return false;
      
      // Check if session time falls within this slot
      const sessionHours = sessionDate.getHours();
      const sessionMinutes = sessionDate.getMinutes();
      const sessionTimeInMinutes = sessionHours * 60 + sessionMinutes;
      
      return sessionTimeInMinutes >= slotStartInMinutes && sessionTimeInMinutes < slotEndInMinutes;
    }) || [];
    
    if (conflictingSessions.length > 0) {
      // Fetch learner names
      const learnerIds = conflictingSessions.map(s => s.learner_id);
      const { data: learnerProfiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", learnerIds);
      
      const learnerMap = new Map(learnerProfiles?.map(p => [p.user_id, p.full_name]) || []);
      
      const sessionList = conflictingSessions.slice(0, 3).map(s => {
        const sessionDate = new Date(s.scheduled_at);
        const dateStr = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const learnerName = learnerMap.get(s.learner_id) || 'Unknown';
        return `• ${dateStr} ${timeStr} with ${learnerName}`;
      }).join('\n');
      
      const moreText = conflictingSessions.length > 3 ? `\n...and ${conflictingSessions.length - 3} more` : '';
      
      toast.error(`Cannot delete: ${conflictingSessions.length} existing session(s)`, {
        description: `Please cancel or reschedule these sessions first:\n${sessionList}${moreText}`,
        duration: 8000,
      });
      return;
    }
    
    const { error } = await supabase
      .from("tutor_availability")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Time slot deleted");
      loadAvailability();
    }
  };

  const duplicateToAllDays = async (slot: TimeSlot) => {
    if (!user) return;
    
    // Validate time range
    if (slot.end_time <= slot.start_time) {
      toast.error("End time must be after start time");
      return;
    }
    
    // Calculate time in minutes for overlap checking
    const [startHours, startMinutes] = slot.start_time.split(':').map(Number);
    const [endHours, endMinutes] = slot.end_time.split(':').map(Number);
    const startTimeInMinutes = startHours * 60 + startMinutes;
    const endTimeInMinutes = endHours * 60 + endMinutes;
    
    // Check for overlaps on each day and only add to days without conflicts
    const slotsToAdd = [];
    const skippedDays = [];
    
    for (let dayIdx = 0; dayIdx < DAYS.length; dayIdx++) {
      const existingSlotsForDay = slots.filter(s => s.day_of_week === dayIdx);
      
      const hasOverlap = existingSlotsForDay.some(existingSlot => {
        const [slotStartHours, slotStartMinutes] = existingSlot.start_time.split(':').map(Number);
        const [slotEndHours, slotEndMinutes] = existingSlot.end_time.split(':').map(Number);
        const slotStartInMinutes = slotStartHours * 60 + slotStartMinutes;
        const slotEndInMinutes = slotEndHours * 60 + slotEndMinutes;
        
        return (
          (startTimeInMinutes >= slotStartInMinutes && startTimeInMinutes < slotEndInMinutes) ||
          (endTimeInMinutes > slotStartInMinutes && endTimeInMinutes <= slotEndInMinutes) ||
          (startTimeInMinutes <= slotStartInMinutes && endTimeInMinutes >= slotEndInMinutes)
        );
      });
      
      if (!hasOverlap) {
        slotsToAdd.push({
          tutor_id: user.id,
          day_of_week: dayIdx,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available,
        });
      } else {
        skippedDays.push(DAYS[dayIdx]);
      }
    }
    
    if (slotsToAdd.length === 0) {
      toast.error("All days have conflicting time slots", {
        description: "Please remove overlapping slots first",
      });
      return;
    }

    const { error } = await supabase
      .from("tutor_availability")
      .insert(slotsToAdd);

    if (error) {
      toast.error("Failed to add to all days");
    } else {
      if (skippedDays.length > 0) {
        toast.success(`Added to ${slotsToAdd.length} days`, {
          description: `Skipped ${skippedDays.join(', ')} due to conflicts`,
        });
      } else {
        toast.success(`Time slot added to all days (${slot.is_available ? 'Available' : 'Unavailable'})`);
      }
      loadAvailability();
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <TutorSidebar />
        <div className="flex-1 flex flex-col relative">
          <LoadingOverlay isLoading={initialLoad} message="Loading availability..." />
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
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Availability</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Set your weekly schedule and manage specific date availability
                </p>
              </div>

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
                        className="w-full p-2 border rounded bg-background text-sm"
                        value={newSlot.day_of_week}
                        onChange={(e) => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}
                        style={{ fontSize: '14px' }}
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
                          className="text-sm"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={newSlot.end_time}
                          onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                          className="text-sm"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newSlot.is_available}
                        onCheckedChange={(checked) => setNewSlot({ ...newSlot, is_available: checked })}
                      />
                      <Label className="cursor-pointer">
                        {newSlot.is_available ? "Available" : "Unavailable"}
                      </Label>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={addSlot} className="flex-1">
                        <Clock className="mr-2 h-4 w-4" />
                        Add Time Slot
                      </Button>
                      <Button onClick={() => duplicateToAllDays(newSlot)} variant="outline" className="flex-1">
                        <Copy className="mr-2 h-4 w-4" />
                        Add to All Days
                      </Button>
                    </div>
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
