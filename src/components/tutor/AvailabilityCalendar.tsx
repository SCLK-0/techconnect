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

  const isDateMarkedAvailable = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = dayAvailability.find(d => d.date === dateStr);
    return dayData?.is_available === true;
  };

  const isDateMarkedUnavailable = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = dayAvailability.find(d => d.date === dateStr);
    return dayData?.is_available === false;
  };

  const hasTimeSlots = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = dayAvailability.find(d => d.date === dateStr);
    return !!(dayData?.start_time && dayData?.end_time);
  };

  const getTimeSlots = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
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
      const dateStr = date.toISOString().split('T')[0];
      const existing = dayAvailability.find(d => d.date === dateStr);
      
      setSelectedDateForTime(date);
      if (existing?.start_time && existing?.end_time) {
        setStartTime(existing.start_time);
        setEndTime(existing.end_time);
      } else {
        setStartTime("09:00");
        setEndTime("17:00");
      }
      setTimeDialogOpen(true);
    } else if (mode === "bulk-actions" && Array.isArray(date)) {
      setSelectedDates(date);
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
        date: date.toISOString().split('T')[0],
        is_available: true,
      }));

      const { error } = await supabase
        .from("tutor_day_availability")
        .upsert(inserts, { onConflict: 'tutor_id,date' });

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
      const inserts = selectedDates.map(date => ({
        tutor_id: tutorId,
        date: date.toISOString().split('T')[0],
        is_available: false,
      }));

      const { error } = await supabase
        .from("tutor_day_availability")
        .upsert(inserts, { onConflict: 'tutor_id,date' });

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
      const dateStr = selectedDateForTime.toISOString().split('T')[0];
      
      const payload = {
        tutor_id: tutorId,
        date: dateStr,
        is_available: true,
        start_time: startTime,
        end_time: endTime,
      };
      
      console.log("Saving time slot with payload:", payload);
      
      const { data, error } = await supabase
        .from("tutor_day_availability")
        .upsert(payload, { onConflict: 'tutor_id,date' })
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Time slot saved successfully:", data);
      toast.success("Time slot saved");
      setTimeDialogOpen(false);
      onUpdate();
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
      const dateStr = selectedDateForTime.toISOString().split('T')[0];
      const existing = dayAvailability.find(d => d.date === dateStr);
      
      if (existing?.id) {
        const { error } = await supabase
          .from("tutor_day_availability")
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        toast.success("Time slot removed");
      }
      
      setTimeDialogOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error("Error deleting time slot:", error);
      toast.error("Failed to remove time slot");
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
          <Button
            variant={mode === "bulk-actions" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setMode("bulk-actions");
              setSelectedDates([]);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Bulk Actions
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
              <Clock className="inline-block mr-2 h-4 w-4" />
              Set Time Slot
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedDateForTime && `Set specific hours for ${format(selectedDateForTime, "MMMM d, yyyy")}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time" className="text-xs">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
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
                  onChange={(e) => setEndTime(e.target.value)}
                  className="text-sm"
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Learners will be able to book sessions during this time range.
            </p>
          </div>

          <DialogFooter className="flex gap-2">
            {selectedDateForTime && hasTimeSlots(selectedDateForTime) && (
              <Button
                variant="outline"
                onClick={handleDeleteTimeSlot}
                disabled={isSubmitting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            )}
            <Button onClick={handleSaveTimeSlot} disabled={isSubmitting}>
              <Clock className="mr-2 h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Time Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
