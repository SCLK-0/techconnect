import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const bookSessionSchema = z.object({
  date: z.date({
    required_error: "Please select a date for the session",
  }),
  time: z.string().min(1, "Please select a time"),
  duration: z.string().min(1, "Please select session duration"),
  subject: z.string()
    .trim()
    .min(1, "Subject is required")
    .max(100, "Subject must be less than 100 characters"),
});

type BookSessionFormValues = z.infer<typeof bookSessionSchema>;

interface BookSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorId: string;
  tutorName: string;
  tutorSubjects: string[];
}

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30"
];

const durations = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
];

export function BookSessionDialog({
  open,
  onOpenChange,
  tutorId,
  tutorName,
  tutorSubjects,
}: BookSessionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tutorAvailability, setTutorAvailability] = useState<any[]>([]);
  const [dayOverrides, setDayOverrides] = useState<any[]>([]);
  const [bookedSessions, setBookedSessions] = useState<any[]>([]);

  useEffect(() => {
    if (open && tutorId) {
      loadTutorAvailability();
      loadDayOverrides();
    }
  }, [open, tutorId]);

  // Watch for date changes and load booked sessions
  const selectedDate = form.watch("date");
  
  useEffect(() => {
    if (selectedDate && tutorId) {
      loadBookedSessions(selectedDate);
    }
  }, [selectedDate, tutorId]);

  const loadTutorAvailability = async () => {
    const { data: weeklySlots } = await supabase
      .from("tutor_availability")
      .select("*")
      .eq("tutor_id", tutorId)
      .eq("is_available", true);
    
    setTutorAvailability(weeklySlots || []);
  };

  const loadDayOverrides = async () => {
    const { data } = await supabase
      .from("tutor_day_availability")
      .select("*")
      .eq("tutor_id", tutorId);
    
    setDayOverrides(data || []);
  };

  const loadBookedSessions = async (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from("sessions")
      .select("scheduled_at, duration_minutes")
      .eq("tutor_id", tutorId)
      .in("status", ["pending", "accepted", "in_progress"])
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString());
    
    setBookedSessions(data || []);
  };

  const form = useForm<BookSessionFormValues>({
    resolver: zodResolver(bookSessionSchema),
    defaultValues: {
      subject: tutorSubjects[0] || "",
    },
  });

  const isDateAvailable = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check for day-specific override
    const dayOverride = dayOverrides.find(d => d.date === dateStr);
    
    // If explicitly marked unavailable, disable the date
    if (dayOverride && !dayOverride.is_available) {
      return false;
    }
    
    // If marked available OR has weekly schedule, enable the date
    const dayOfWeek = date.getDay();
    const hasWeeklySchedule = tutorAvailability.some(slot => slot.day_of_week === dayOfWeek);
    
    return dayOverride?.is_available || hasWeeklySchedule;
  };

  const isTimeAvailable = (time: string, selectedDate: Date) => {
    if (!selectedDate) return true;
    
    const dayOfWeek = selectedDate.getDay();
    const dateStr = selectedDate.toISOString().split('T')[0];
    const [hours, minutes] = time.split(":").map(Number);
    const timeInMinutes = hours * 60 + minutes;
    
    // Check if this time slot conflicts with any booked sessions
    const proposedStart = new Date(selectedDate);
    proposedStart.setHours(hours, minutes, 0, 0);
    
    const hasBookingConflict = bookedSessions.some(session => {
      const sessionStart = new Date(session.scheduled_at);
      const sessionEnd = new Date(sessionStart.getTime() + session.duration_minutes * 60000);
      
      // Check if the proposed time falls within an existing session
      return proposedStart >= sessionStart && proposedStart < sessionEnd;
    });
    
    if (hasBookingConflict) return false;
    
    // Check for day-specific time slots first
    const dayOverride = dayOverrides.find(d => d.date === dateStr);
    if (dayOverride && dayOverride.start_time && dayOverride.end_time) {
      const [startHours, startMinutes] = dayOverride.start_time.split(":").map(Number);
      const [endHours, endMinutes] = dayOverride.end_time.split(":").map(Number);
      const startTimeInMinutes = startHours * 60 + startMinutes;
      const endTimeInMinutes = endHours * 60 + endMinutes;
      
      return timeInMinutes >= startTimeInMinutes && timeInMinutes < endTimeInMinutes;
    }
    
    // Fall back to weekly schedule
    return tutorAvailability.some(slot => {
      if (slot.day_of_week !== dayOfWeek) return false;
      
      const [startHours, startMinutes] = slot.start_time.split(":").map(Number);
      const [endHours, endMinutes] = slot.end_time.split(":").map(Number);
      const startTimeInMinutes = startHours * 60 + startMinutes;
      const endTimeInMinutes = endHours * 60 + endMinutes;
      
      return timeInMinutes >= startTimeInMinutes && timeInMinutes < endTimeInMinutes;
    });
  };

  const isPastDateTime = (date: Date, time: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(":").map(Number);
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    return selectedDateTime < now;
  };

  const onSubmit = async (values: BookSessionFormValues) => {
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to book a session");
        return;
      }

      // Combine date and time
      const [hours, minutes] = values.time.split(":").map(Number);
      const scheduledAt = new Date(values.date);
      scheduledAt.setHours(hours, minutes, 0, 0);
      
      const durationMinutes = parseInt(values.duration);
      const sessionEndTime = new Date(scheduledAt.getTime() + durationMinutes * 60000);

      // Check for conflicts with tutor's existing sessions
      const { data: tutorSessions, error: tutorCheckError } = await supabase
        .from("sessions")
        .select("scheduled_at, duration_minutes")
        .eq("tutor_id", tutorId)
        .in("status", ["pending", "accepted", "in_progress"])
        .gte("scheduled_at", scheduledAt.toISOString())
        .lte("scheduled_at", sessionEndTime.toISOString());

      if (tutorCheckError) throw tutorCheckError;

      // Check if any existing session overlaps
      const hasConflict = tutorSessions?.some(session => {
        const existingStart = new Date(session.scheduled_at);
        const existingEnd = new Date(existingStart.getTime() + session.duration_minutes * 60000);
        
        // Check if sessions overlap
        return (
          (scheduledAt >= existingStart && scheduledAt < existingEnd) ||
          (sessionEndTime > existingStart && sessionEndTime <= existingEnd) ||
          (scheduledAt <= existingStart && sessionEndTime >= existingEnd)
        );
      });

      if (hasConflict) {
        toast.error("Time slot unavailable", {
          description: "The tutor already has a session scheduled at this time. Please choose a different time.",
        });
        setIsSubmitting(false);
        return;
      }

      // Check for conflicts with learner's existing sessions
      const { data: learnerSessions, error: learnerCheckError } = await supabase
        .from("sessions")
        .select("scheduled_at, duration_minutes")
        .eq("learner_id", user.id)
        .in("status", ["pending", "accepted", "in_progress"])
        .gte("scheduled_at", scheduledAt.toISOString())
        .lte("scheduled_at", sessionEndTime.toISOString());

      if (learnerCheckError) throw learnerCheckError;

      const hasLearnerConflict = learnerSessions?.some(session => {
        const existingStart = new Date(session.scheduled_at);
        const existingEnd = new Date(existingStart.getTime() + session.duration_minutes * 60000);
        
        return (
          (scheduledAt >= existingStart && scheduledAt < existingEnd) ||
          (sessionEndTime > existingStart && sessionEndTime <= existingEnd) ||
          (scheduledAt <= existingStart && sessionEndTime >= existingEnd)
        );
      });

      if (hasLearnerConflict) {
        toast.error("You already have a session at this time", {
          description: "Please choose a different time slot.",
        });
        setIsSubmitting(false);
        return;
      }

      // Create session
      const { error } = await supabase
        .from("sessions")
        .insert({
          tutor_id: tutorId,
          learner_id: user.id,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: durationMinutes,
          subject: values.subject.trim(),
          status: "pending",
          session_type: "scheduled",
        });

      if (error) throw error;

      toast.success("Session booked successfully!", {
        description: `Your session with ${tutorName} has been scheduled for ${format(scheduledAt, "PPP 'at' p")}`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error booking session:", error);
      toast.error("Failed to book session", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Book Session with {tutorName}</DialogTitle>
            <DialogDescription>
              Choose a date, time, and subject for your tutoring session.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium">Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal h-10",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          tomorrow.setHours(0, 0, 0, 0);
                          return date < tomorrow || !isDateAvailable(date);
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="h-5">
                    <FormMessage className="text-xs" />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => {
                const selectedDate = form.watch("date");
                const availableTimeSlots = selectedDate 
                  ? timeSlots.filter(time => 
                      isTimeAvailable(time, selectedDate) &&
                      !isPastDateTime(selectedDate, time)
                    )
                  : [];
                
                return (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Time</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedDate || availableTimeSlots.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder={
                            !selectedDate 
                              ? "Select a date first" 
                              : availableTimeSlots.length === 0
                                ? "No time slots available"
                                : "Select a time slot"
                          }>
                            {field.value && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {field.value}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedDate && availableTimeSlots.length === 0 && (
                      <FormDescription className="text-xs text-amber-600">
                        {isPastDateTime(selectedDate, "23:59") 
                          ? "All available time slots for this date have passed. Please select another date."
                          : "No time slots available for this date. You can set specific hours in your Availability page."}
                      </FormDescription>
                    )}
                    <div className="h-5">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Duration</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select session duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {durations.map((duration) => (
                        <SelectItem key={duration.value} value={duration.value}>
                          {duration.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="h-5">
                    <FormMessage className="text-xs" />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Automotive Basics"
                      className="h-10"
                      {...field}
                      maxLength={100}
                    />
                  </FormControl>
                  <div className="h-5">
                    <FormMessage className="text-xs" />
                  </div>
                </FormItem>
              )}
            />

              <DialogFooter className="pt-4 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Booking..." : "Book Session"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
}
