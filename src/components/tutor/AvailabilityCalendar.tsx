import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Clock, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { DayContentProps } from "react-day-picker";

interface DayAvailability {
  date: string;
  is_available: boolean;
  start_time?: string;
  end_time?: string;
  id?: string;
}

interface AvailabilityCalendarProps {
  tutorId: string;
  dayAvailability: DayAvailability[];
  onUpdate: () => void;
}

export function AvailabilityCalendar({ tutorId, dayAvailability, onUpdate }: AvailabilityCalendarProps) {
  const [mode, setMode] = useState<"time-slots" | "bulk-actions">("time-slots");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeDialogOpen, setTimeDialogOpen] = useState(false);
  const [selectedDateForTime, setSelectedDateForTime] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [currentAvailabilityStatus, setCurrentAvailabilityStatus] = useState<'available' | 'unavailable' | null>(null);

  // Helper function to get date string in local timezone (avoids UTC conversion issues)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateMarkedAvailable = (date: Date) => {
    const dateStr = getLocalDateString(date);
    const dayData = dayAvailability.find(d => d.date === dateStr);
    return dayData?.is_available === true;
  };

  const isDateMarkedUnavailable = (date: Date) => {
    const dateStr = getLocalDateString(date);
    const dayData = dayAvailability.find(d => d.date === dateStr);
    return dayData?.is_available === false;
  };

  const hasTimeSlots = (date: Date) => {
    // Don't show time slots indicator for past dates (including today)
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date < tomorrow) {
      return false;
    }
    
    const dateStr = getLocalDateString(date);
    const dayData = dayAvailability.find(d => d.date === dateStr);
    return !!(dayData?.start_time && dayData?.end_time);
  };

  const getTimeSlots = (date: Date) => {
    const dateStr = getLocalDateString(date);
    const dayData = dayAvailability.find(d => d.date === dateStr);
    if (dayData?.start_time && dayData?.end_time) {
      return `${dayData.start_time.slice(0, 5)}-${dayData.end_time.slice(0, 5)}`;
    }
    return null;
  };

  const CustomDayContent = (props: DayContentProps) => {
    const timeSlot = getTimeSlots(props.date);
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <span>{format(props.date, "d")}</span>
        {timeSlot && (
          <span className="text-[0.6rem] font-medium text-primary-foreground/90 mt-0.5">
            {timeSlot}
          </span>
        )}
      </div>
    );
  };

  const handleDateClick = (date: Date | Date[] | undefined) => {
    if (mode === "time-slots" && date && !Array.isArray(date)) {
      const dateStr = getLocalDateString(date);
      const existing = dayAvailability.find(d => d.date === dateStr);
      
      setSelectedDateForTime(date);
      
      // Set current status based on existing data
      if (existing) {
        setCurrentAvailabilityStatus(existing.is_available ? 'available' : 'unavailable');
        if (existing.start_time && existing.end_time) {
          setStartTime(existing.start_time);
          setEndTime(existing.end_time);
        } else {
          setStartTime("09:00");
          setEndTime("17:00");
        }
      } else {
        setCurrentAvailabilityStatus(null);
        setStartTime("09:00");
        setEndTime("17:00");
      }
      
      setTimeDialogOpen(true);
    } else if (mode === "bulk-actions" && Array.isArray(date)) {
      setSelectedDates(date);
    }
  };

  const handleMarkDayAvailable = async () => {
    if (!selectedDateForTime) return;

    setIsSubmitting(true);
    try {
      const dateStr = getLocalDateString(selectedDateForTime);
      
      // Delete existing entries first
      await supabase
        .from("tutor_day_availability")
        .delete()
        .eq('tutor_id', tutorId)
        .eq('date', dateStr);
      
      // Insert new entry
      const { error } = await supabase
        .from("tutor_day_availability")
        .insert({
          tutor_id: tutorId,
          date: dateStr,
          is_available: true,
          start_time: null,
          end_time: null,
        });

      if (error) throw error;

      // Update local state immediately
      setCurrentAvailabilityStatus('available');
      
      // Refresh data from database
      await onUpdate();
      
      toast.success("Day marked as available");
    } catch (error: any) {
      console.error("Error marking day:", error);
      toast.error("Failed to mark day as available");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDayUnavailable = async () => {
    if (!selectedDateForTime) return;

    setIsSubmitting(true);
    try {
      const dateStr = getLocalDateString(selectedDateForTime);
      
      // Check for existing sessions on this date
      const startOfDay = new Date(selectedDateForTime);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDateForTime);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingSessions, error: sessionError } = await supabase
        .from("sessions")
        .select("id, scheduled_at, learner_id")
        .eq("tutor_id", tutorId)
        .in("status", ["pending", "accepted"])
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString());

      if (sessionError) throw sessionError;

      // Block if there are existing sessions
      if (existingSessions && existingSessions.length > 0) {
        // Fetch learner names
        const learnerIds = existingSessions.map(s => s.learner_id);
        const { data: learnerProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", learnerIds);

        const learnerMap = new Map(learnerProfiles?.map(p => [p.user_id, p.full_name]) || []);

        const sessionList = existingSessions.map(s => {
          const time = new Date(s.scheduled_at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const learnerName = learnerMap.get(s.learner_id) || 'Unknown';
          return `• ${time} with ${learnerName}`;
        }).join('\n');
        
        toast.error(`Cannot mark as unavailable: ${existingSessions.length} existing session(s)`, {
          description: `Please cancel or reschedule these sessions first:\n${sessionList}`,
          duration: 8000,
        });
        setIsSubmitting(false);
        return; // Block the action
      }
      
      // Delete existing entries first
      await supabase
        .from("tutor_day_availability")
        .delete()
        .eq('tutor_id', tutorId)
        .eq('date', dateStr);
      
      // Insert new entry
      const { error } = await supabase
        .from("tutor_day_availability")
        .insert({
          tutor_id: tutorId,
          date: dateStr,
          is_available: false,
          start_time: null,
          end_time: null,
        });

      if (error) throw error;

      // Update local state immediately
      setCurrentAvailabilityStatus('unavailable');
      
      // Refresh data from database
      await onUpdate();
      
      toast.success("Day marked as unavailable");
    } catch (error: any) {
      console.error("Error marking day:", error);
      toast.error("Failed to mark day as unavailable");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAvailable = async () => {
    if (selectedDates.length === 0) {
      toast.error("Please select dates first");
      return;
    }

    setIsSubmitting(true);
    try {
      const inserts = selectedDates.map(date => ({
        tutor_id: tutorId,
        date: getLocalDateString(date),
        is_available: true,
      }));

      const { error } = await supabase
        .from("tutor_day_availability")
        .upsert(inserts);

      if (error) throw error;

      toast.success("Days marked as available");
      setSelectedDates([]);
      onUpdate();
    } catch (error: any) {
      console.error("Error marking days:", error);
      toast.error("Failed to update availability");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkUnavailable = async () => {
    if (selectedDates.length === 0) {
      toast.error("Please select dates first");
      return;
    }

    setIsSubmitting(true);
    try {
      // Check for existing sessions on selected dates
      let totalConflicts = 0;
      for (const date of selectedDates) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: existingSessions } = await supabase
          .from("sessions")
          .select("id")
          .eq("tutor_id", tutorId)
          .in("status", ["pending", "accepted"])
          .gte("scheduled_at", startOfDay.toISOString())
          .lte("scheduled_at", endOfDay.toISOString());

        if (existingSessions && existingSessions.length > 0) {
          totalConflicts += existingSessions.length;
        }
      }

      // Block if there are conflicts
      if (totalConflicts > 0) {
        toast.error(`Cannot mark as unavailable: ${totalConflicts} existing session(s)`, {
          description: "Please cancel or reschedule these sessions first before marking dates as unavailable.",
          duration: 6000,
        });
        setIsSubmitting(false);
        return; // Block the action
      }

      const inserts = selectedDates.map(date => ({
        tutor_id: tutorId,
        date: getLocalDateString(date),
        is_available: false,
      }));

      const { error } = await supabase
        .from("tutor_day_availability")
        .upsert(inserts);

      if (error) throw error;

      toast.success("Days marked as unavailable");
      setSelectedDates([]);
      onUpdate();
    } catch (error: any) {
      console.error("Error marking days:", error);
      toast.error("Failed to update availability");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTimeSlot = async () => {
    if (!selectedDateForTime) return;

    if (startTime >= endTime) {
      toast.error("End time must be after start time");
      return;
    }

    setIsSubmitting(true);
    try {
      const dateStr = getLocalDateString(selectedDateForTime);
      
      // Check for existing sessions on this date
      const startOfDay = new Date(selectedDateForTime);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDateForTime);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingSessions, error: sessionError } = await supabase
        .from("sessions")
        .select("id, scheduled_at, duration_minutes, learner_id")
        .eq("tutor_id", tutorId)
        .in("status", ["pending", "accepted"])
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString());

      if (sessionError) throw sessionError;

      // Check if any sessions fall outside the new time range
      if (existingSessions && existingSessions.length > 0) {
        const [newStartHours, newStartMinutes] = startTime.split(':').map(Number);
        const [newEndHours, newEndMinutes] = endTime.split(':').map(Number);
        const newStartInMinutes = newStartHours * 60 + newStartMinutes;
        const newEndInMinutes = newEndHours * 60 + newEndMinutes;

        const conflictingSessions = existingSessions.filter(session => {
          const sessionDate = new Date(session.scheduled_at);
          const sessionStartHours = sessionDate.getHours();
          const sessionStartMinutes = sessionDate.getMinutes();
          const sessionStartInMinutes = sessionStartHours * 60 + sessionStartMinutes;
          const sessionEndInMinutes = sessionStartInMinutes + (session.duration_minutes || 0);

          // Session conflicts if it starts before new range OR ends after new range
          return sessionStartInMinutes < newStartInMinutes || sessionEndInMinutes > newEndInMinutes;
        });

        if (conflictingSessions.length > 0) {
          // Fetch learner names for the conflicting sessions
          const learnerIds = conflictingSessions.map(s => s.learner_id);
          const { data: learnerProfiles } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", learnerIds);

          const learnerMap = new Map(learnerProfiles?.map(p => [p.user_id, p.full_name]) || []);

          const sessionList = conflictingSessions.map(s => {
            const sessionTime = new Date(s.scheduled_at);
            const time = sessionTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            const endTime = new Date(sessionTime.getTime() + (s.duration_minutes || 0) * 60000);
            const endTimeStr = endTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            const learnerName = learnerMap.get(s.learner_id) || 'Unknown';
            return `• ${time}-${endTimeStr} with ${learnerName}`;
          }).join('\n');
          
          toast.error(`Cannot save: ${conflictingSessions.length} session(s) outside new time range`, {
            description: `These sessions would be excluded:\n${sessionList}\nPlease cancel/reschedule them first or extend your time range.`,
            duration: 10000,
          });
          setIsSubmitting(false);
          return; // Block the action
        }
      }
      
      // First, delete any existing entries for this date to avoid duplicates
      await supabase
        .from("tutor_day_availability")
        .delete()
        .eq('tutor_id', tutorId)
        .eq('date', dateStr);
      
      // Then insert the new time slot
      const payload = {
        tutor_id: tutorId,
        date: dateStr,
        is_available: true,
        start_time: startTime,
        end_time: endTime,
      };
      
      console.log("Saving time slot with payload:", payload);
      console.log("Start time value:", startTime, "Type:", typeof startTime);
      console.log("End time value:", endTime, "Type:", typeof endTime);
      
      const { data, error } = await supabase
        .from("tutor_day_availability")
        .insert(payload)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Time slot saved successfully:", data);
      
      // Refresh data first
      await onUpdate();
      
      toast.success("Time slot saved");
      setTimeDialogOpen(false);
    } catch (error: any) {
      console.error("Error saving time slot:", error);
      toast.error(`Failed to save time slot: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTimeSlot = async () => {
    if (!selectedDateForTime) return;

    setIsSubmitting(true);
    try {
      const dateStr = getLocalDateString(selectedDateForTime);
      
      // Check for existing sessions on this date
      const startOfDay = new Date(selectedDateForTime);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDateForTime);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingSessions, error: sessionError } = await supabase
        .from("sessions")
        .select("id, scheduled_at, learner_id")
        .eq("tutor_id", tutorId)
        .in("status", ["pending", "accepted"])
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString());

      if (sessionError) throw sessionError;

      // Block if there are existing sessions
      if (existingSessions && existingSessions.length > 0) {
        // Fetch learner names
        const learnerIds = existingSessions.map(s => s.learner_id);
        const { data: learnerProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", learnerIds);

        const learnerMap = new Map(learnerProfiles?.map(p => [p.user_id, p.full_name]) || []);

        const sessionList = existingSessions.map(s => {
          const time = new Date(s.scheduled_at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          const learnerName = learnerMap.get(s.learner_id) || 'Unknown';
          return `• ${time} with ${learnerName}`;
        }).join('\n');
        
        toast.error(`Cannot remove settings: ${existingSessions.length} existing session(s)`, {
          description: `Please cancel or reschedule these sessions first:\n${sessionList}`,
          duration: 8000,
        });
        setIsSubmitting(false);
        return; // Block the action
      }
      
      // Try to delete by date and tutor_id (more reliable than relying on id)
      const { error } = await supabase
        .from("tutor_day_availability")
        .delete()
        .eq('tutor_id', tutorId)
        .eq('date', dateStr);

      if (error) throw error;
      
      toast.success("Day settings removed");
      setTimeDialogOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting day settings:", error);
      toast.error("Failed to remove day settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modifiers = {
    available: (date: Date) => isDateMarkedAvailable(date),
    unavailable: (date: Date) => isDateMarkedUnavailable(date),
    hasTime: (date: Date) => hasTimeSlots(date),
  };

  const modifiersStyles = {
    available: {
      backgroundColor: "hsl(var(--primary) / 0.5)",
      color: "hsl(var(--primary-foreground))",
      fontWeight: "bold",
    },
    unavailable: {
      backgroundColor: "hsl(var(--destructive))",
      color: "white",
      fontWeight: "bold",
      textDecoration: "line-through",
    },
    hasTime: {
      backgroundColor: "hsl(var(--primary))",
      color: "white",
      fontWeight: "bold",
      border: "2px solid hsl(var(--primary-foreground))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Day-Specific Availability</CardTitle>
        <CardDescription>
          Set specific hours for individual dates or mark multiple dates as available/unavailable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--primary))", border: "2px solid white" }} />
            <span>Has Time Slots</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--primary) / 0.5)" }} />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(var(--destructive))" }} />
            <span>Unavailable</span>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
          <Button
            variant={mode === "time-slots" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setMode("time-slots");
              setSelectedDates([]);
            }}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            Set Time Slots
          </Button>
        </div>

        {/* Single Calendar */}
        <div className="space-y-3">
          {mode === "time-slots" ? (
            <>
              <Calendar
                mode="single"
                onSelect={(date) => date && handleDateClick(date)}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                disabled={(date) => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(0, 0, 0, 0);
                  return date < tomorrow;
                }}
                className="rounded-md border pointer-events-auto mx-auto"
                components={{
                  DayContent: CustomDayContent,
                }}
              />
              <p className="text-sm text-muted-foreground text-center">
                💡 Click a date to set specific hours for that day
              </p>
            </>
          ) : (
            <>
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => handleDateClick(dates)}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                disabled={(date) => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(0, 0, 0, 0);
                  return date < tomorrow;
                }}
                className="rounded-md border pointer-events-auto mx-auto"
                components={{
                  DayContent: CustomDayContent,
                }}
              />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center">
                  Select multiple dates and mark them as available or unavailable
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleMarkAvailable}
                    disabled={isSubmitting || selectedDates.length === 0}
                    className="flex-1"
                    size="sm"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Mark Available ({selectedDates.length})
                  </Button>
                  <Button
                    onClick={handleMarkUnavailable}
                    disabled={isSubmitting || selectedDates.length === 0}
                    variant="destructive"
                    className="flex-1"
                    size="sm"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Mark Unavailable ({selectedDates.length})
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>

      <Dialog open={timeDialogOpen} onOpenChange={setTimeDialogOpen}>
        <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] rounded-lg">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base">
              Manage Day Availability
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedDateForTime && `Configure availability for ${format(selectedDateForTime, "MMMM d, yyyy")}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Step 1: Choose Availability Status (if not set) */}
            {currentAvailabilityStatus === null && (
              <div className="space-y-3">
                <div className="text-center space-y-2">
                  <Label className="text-sm font-medium">Step 1: Choose Availability</Label>
                  <p className="text-xs text-muted-foreground">
                    First, mark this day as available or unavailable
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleMarkDayAvailable}
                    disabled={isSubmitting}
                    className="w-full h-20 flex-col gap-2"
                  >
                    <Check className="h-6 w-6 text-green-600" />
                    <span>Available</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleMarkDayUnavailable}
                    disabled={isSubmitting}
                    className="w-full h-20 flex-col gap-2"
                  >
                    <X className="h-6 w-6 text-red-600" />
                    <span>Unavailable</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Set Time Slot (only if marked available) */}
            {currentAvailabilityStatus === 'available' && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <Label className="text-sm font-medium">Day is Available</Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkDayUnavailable}
                      disabled={isSubmitting}
                    >
                      Switch to Unavailable
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Optional: Set specific hours</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-time" className="text-xs">Start Time</Label>
                        <Input
                          id="start-time"
                          type="time"
                          value={startTime}
                          onChange={(e) => {
                            console.log("Start time changed to:", e.target.value);
                            setStartTime(e.target.value);
                          }}
                          className="text-sm"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-time" className="text-xs">End Time</Label>
                        <Input
                          id="end-time"
                          type="time"
                          value={endTime}
                          onChange={(e) => {
                            console.log("End time changed to:", e.target.value);
                            setEndTime(e.target.value);
                          }}
                          className="text-sm"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                    </div>
                    <Button onClick={handleSaveTimeSlot} disabled={isSubmitting} className="w-full">
                      <Clock className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Saving..." : "Save Time Slot"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Leave blank to use your weekly schedule times
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                </div>

                <Button
                  variant="destructive"
                  onClick={handleDeleteTimeSlot}
                  disabled={isSubmitting}
                  className="w-full"
                  size="sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Day Settings
                </Button>
              </>
            )}

            {/* Step 2: Show Unavailable Status */}
            {currentAvailabilityStatus === 'unavailable' && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-red-600" />
                      <Label className="text-sm font-medium">Day is Unavailable</Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkDayAvailable}
                      disabled={isSubmitting}
                    >
                      Switch to Available
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    This day is blocked. Learners cannot book sessions.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                </div>

                <Button
                  variant="destructive"
                  onClick={handleDeleteTimeSlot}
                  disabled={isSubmitting}
                  className="w-full"
                  size="sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Day Settings
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
