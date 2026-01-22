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
import { sendSessionRequestEmail } from "@/utils/sendNotificationEmail";

const bookSessionSchema = z.object({
  date: z.date({
    required_error: "Please select a date for the session",
  }),
  time: z.string().min(1, "Please select a time"),
  duration: z.coerce.number()
    .min(10, "Minimum duration is 10 minutes")
    .max(240, "Maximum duration is 4 hours (240 minutes)"),
  subjectCategory: z.string().min(1, "Please select a subject category"),
  specificTopic: z.string()
    .trim()
    .min(1, "Please specify what you need help with")
    .max(100, "Topic must be less than 100 characters"),
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

const allDurations = [
  { value: "10", label: "10 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "20", label: "20 minutes" },
  { value: "25", label: "25 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
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
  const [fullyBookedDates, setFullyBookedDates] = useState<Set<string>>(new Set());
  const [allBookedSessionsData, setAllBookedSessionsData] = useState<any[]>([]);

  // Helper function to get date string in local timezone (avoids UTC conversion issues)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (open && tutorId) {
      loadTutorAvailability();
      loadDayOverrides();
      loadAllBookedSessionsRaw(); // Load raw booked sessions data
    }
  }, [open, tutorId]);

  // Recalculate fully booked dates when booked sessions change
  useEffect(() => {
    if (allBookedSessionsData.length > 0) {
      calculateFullyBookedDates();
    }
  }, [allBookedSessionsData]);

  // Disabled - causes blank screen
  // const selectedDate = form.watch("date");
  // useEffect(() => {
  //   if (selectedDate && tutorId) {
  //     loadBookedSessions(selectedDate);
  //   }
  // }, [selectedDate, tutorId]);

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

  // Load all booked sessions for the next 60 days (raw data only)
  const loadAllBookedSessionsRaw = async () => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60);
    endDate.setHours(23, 59, 59, 999);

    const { data: allSessions } = await supabase
      .from("sessions")
      .select("scheduled_at, duration_minutes")
      .eq("tutor_id", tutorId)
      .in("status", ["pending", "accepted", "in_progress"])
      .gte("scheduled_at", startDate.toISOString())
      .lte("scheduled_at", endDate.toISOString());

    setAllBookedSessionsData(allSessions || []);
    console.log(" Loaded booked sessions:", allSessions?.length || 0);
  };

  // Calculate which dates are fully booked based on availability and booked sessions
  const calculateFullyBookedDates = () => {
    console.log(" Calculating fully booked dates...");
    console.log(" Booked sessions data:", allBookedSessionsData);
    
    // Any date with a booking is fully booked (1 session per tutor per day rule)
    const fullyBooked = new Set<string>();
    
    allBookedSessionsData.forEach(session => {
      const sessionDate = new Date(session.scheduled_at);
      const dateStr = getLocalDateString(sessionDate);
      fullyBooked.add(dateStr);
      console.log(` ${dateStr}: FULLY BOOKED (has existing session)`);
    });

    setFullyBookedDates(fullyBooked);
    console.log(" Final fully booked dates:", Array.from(fullyBooked));
  };

  const loadBookedSessions = async (date: Date) => {
    const dateStr = getLocalDateString(date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("sessions")
      .select("scheduled_at, duration_minutes")
      .eq("tutor_id", tutorId)
      .in("status", ["pending", "accepted", "in_progress"])
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString());
    
    console.log(" Loaded booked sessions for", dateStr, ":", data, "error:", error);
    setBookedSessions(data || []);
  };

  const form = useForm<BookSessionFormValues>({
    resolver: zodResolver(bookSessionSchema),
    defaultValues: {
      subjectCategory: tutorSubjects[0] || "",
      specificTopic: "",
    },
  });

  const isDateAvailable = (date: Date) => {
    const dateStr = getLocalDateString(date);
    
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

  const hasBookingInTimeSlot = (time: string, selectedDate: Date) => {
    if (!selectedDate) return false;
    
    const [hours, minutes] = time.split(":").map(Number);
    const proposedStart = new Date(selectedDate);
    proposedStart.setHours(hours, minutes, 0, 0);
    
    const hasConflict = bookedSessions.some(session => {
      const sessionStart = new Date(session.scheduled_at);
      const sessionEnd = new Date(sessionStart.getTime() + session.duration_minutes * 60000);
      
      // Check if the proposed time falls within an existing session
      const conflicts = proposedStart >= sessionStart && proposedStart < sessionEnd;
      if (conflicts) {
        console.log(` Time ${time} conflicts with session:`, {
          proposedStart: proposedStart.toISOString(),
          sessionStart: sessionStart.toISOString(),
          sessionEnd: sessionEnd.toISOString()
        });
      }
      return conflicts;
    });
    
    return hasConflict;
  };

  const isTimeAvailable = (time: string, selectedDate: Date) => {
    if (!selectedDate) return true;
    
    const dayOfWeek = selectedDate.getDay();
    const dateStr = getLocalDateString(selectedDate);
    const [hours, minutes] = time.split(":").map(Number);
    const timeInMinutes = hours * 60 + minutes;
    
    // Check if this time slot conflicts with any booked sessions
    if (hasBookingInTimeSlot(time, selectedDate)) return false;
    
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

  const getTimeSlotEndTime = (selectedDate: Date, startTime: string): string | null => {
    const dayOfWeek = selectedDate.getDay();
    const dateStr = getLocalDateString(selectedDate);
    const [hours, minutes] = startTime.split(":").map(Number);
    const startTimeInMinutes = hours * 60 + minutes;
    
    // Check for day-specific time slots first
    const dayOverride = dayOverrides.find(d => d.date === dateStr);
    if (dayOverride && dayOverride.start_time && dayOverride.end_time) {
      const [startHours, startMinutes] = dayOverride.start_time.split(":").map(Number);
      const [endHours, endMinutes] = dayOverride.end_time.split(":").map(Number);
      const slotStartInMinutes = startHours * 60 + startMinutes;
      const slotEndInMinutes = endHours * 60 + endMinutes;
      
      if (startTimeInMinutes >= slotStartInMinutes && startTimeInMinutes < slotEndInMinutes) {
        return dayOverride.end_time.slice(0, 5);
      }
    }
    
    // Fall back to weekly schedule
    const weeklySlot = tutorAvailability.find(slot => {
      if (slot.day_of_week !== dayOfWeek) return false;
      
      const [slotStartHours, slotStartMinutes] = slot.start_time.split(":").map(Number);
      const [slotEndHours, slotEndMinutes] = slot.end_time.split(":").map(Number);
      const slotStartInMinutes = slotStartHours * 60 + slotStartMinutes;
      const slotEndInMinutes = slotEndHours * 60 + slotEndMinutes;
      
      return startTimeInMinutes >= slotStartInMinutes && startTimeInMinutes < slotEndInMinutes;
    });
    
    if (weeklySlot) {
      return weeklySlot.end_time.slice(0, 5);
    }
    
    return null;
  };

  const formatTimeSlot = (time: string, selectedDate: Date): string => {
    // Helper to convert 24h to 12h format
    const format12Hour = (time24: string): string => {
      const [hours, minutes] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    
    return format12Hour(time);
  };

  const getAvailableDurations = (selectedDate: Date | undefined, selectedTime: string | undefined) => {
    if (!selectedDate || !selectedTime) return allDurations;
    
    const dayOfWeek = selectedDate.getDay();
    const dateStr = getLocalDateString(selectedDate);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const startTimeInMinutes = hours * 60 + minutes;
    
    // Find the end time of the availability window
    let endTimeInMinutes: number | null = null;
    
    // Check for day-specific time slots first
    const dayOverride = dayOverrides.find(d => d.date === dateStr);
    if (dayOverride && dayOverride.start_time && dayOverride.end_time) {
      const [endHours, endMinutes] = dayOverride.end_time.split(":").map(Number);
      endTimeInMinutes = endHours * 60 + endMinutes;
    } else {
      // Fall back to weekly schedule
      const weeklySlot = tutorAvailability.find(slot => {
        if (slot.day_of_week !== dayOfWeek) return false;
        
        const [slotStartHours, slotStartMinutes] = slot.start_time.split(":").map(Number);
        const [slotEndHours, slotEndMinutes] = slot.end_time.split(":").map(Number);
        const slotStartTimeInMinutes = slotStartHours * 60 + slotStartMinutes;
        const slotEndTimeInMinutes = slotEndHours * 60 + slotEndMinutes;
        
        return startTimeInMinutes >= slotStartTimeInMinutes && startTimeInMinutes < slotEndTimeInMinutes;
      });
      
      if (weeklySlot) {
        const [endHours, endMinutes] = weeklySlot.end_time.split(":").map(Number);
        endTimeInMinutes = endHours * 60 + endMinutes;
      }
    }
    
    if (endTimeInMinutes === null) return allDurations;
    
    // Calculate maximum available duration in minutes
    const maxDurationMinutes = endTimeInMinutes - startTimeInMinutes;
    
    // Debug log to understand the calculation
    console.log(` Duration calculation for ${selectedTime}:`, {
      startTimeInMinutes,
      endTimeInMinutes,
      maxDurationMinutes,
      selectedDate: selectedDate?.toDateString(),
      dayOverride: dayOverrides.find(d => d.date === getLocalDateString(selectedDate!)),
      weeklySlot: tutorAvailability.find(slot => {
        const dayOfWeek = selectedDate!.getDay();
        if (slot.day_of_week !== dayOfWeek) return false;
        const [slotStartHours, slotStartMinutes] = slot.start_time.split(":").map(Number);
        const [slotEndHours, slotEndMinutes] = slot.end_time.split(":").map(Number);
        const slotStartTimeInMinutes = slotStartHours * 60 + slotStartMinutes;
        const slotEndTimeInMinutes = slotEndHours * 60 + slotEndMinutes;
        return startTimeInMinutes >= slotStartTimeInMinutes && startTimeInMinutes < slotEndTimeInMinutes;
      })
    });
    
    // Filter durations to only show those that fit within the available window
    return allDurations.filter(duration => {
      const durationValue = parseInt(duration.value);
      return durationValue <= maxDurationMinutes;
    });
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

      // Combine subject category and specific topic
      const subject = `${values.subjectCategory} - ${values.specificTopic.trim()}`;

      // Create session
      const { error } = await supabase
        .from("sessions")
        .insert({
          tutor_id: tutorId,
          learner_id: user.id,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: durationMinutes,
          subject: subject,
          status: "pending",
          session_type: "scheduled",
        });

      if (error) throw error;

      // Send email notification to tutor
      try {
        const { data: tutorProfile, error: tutorError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", tutorId)
          .single();

        const { data: learnerProfile, error: learnerError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();

        // Get tutor's email using RPC function
        const { data: tutorEmail, error: emailError } = await supabase
          .rpc('get_user_email', { user_id: tutorId });

        if (tutorError) {
          console.error("Error fetching tutor profile:", tutorError);
        }
        if (learnerError) {
          console.error("Error fetching learner profile:", learnerError);
        }
        if (emailError) {
          console.error("Error fetching tutor email:", emailError);
        }

        if (tutorEmail) {
          await sendSessionRequestEmail(
            tutorEmail,
            tutorProfile?.full_name || "Tutor",
            learnerProfile?.full_name || "A learner",
            subject,
            format(scheduledAt, "MMMM d, yyyy 'at' h:mm a")
          );
        }
      } catch (emailError) {
        console.error("Error sending session request email:", emailError);
        // Don't fail the booking if email fails
      }

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
                        onSelect={(date) => {
                          field.onChange(date);
                          // Reset time and duration when date changes
                          form.setValue("time", "");
                          form.setValue("duration", "");
                          // Load booked sessions when date is selected
                          if (date) {
                            loadBookedSessions(date);
                          }
                        }}
                        disabled={(date) => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          tomorrow.setHours(0, 0, 0, 0);
                          
                          // Disable past dates and dates without availability
                          if (date < tomorrow || !isDateAvailable(date)) return true;
                          
                          // Disable dates that are fully booked
                          const dateStr = getLocalDateString(date);
                          if (fullyBookedDates.has(dateStr)) return true;
                          
                          return false;
                        }}
                        modifiers={{
                          booked: (date) => {
                            const dateStr = getLocalDateString(date);
                            return fullyBookedDates.has(dateStr);
                          }
                        }}
                        modifiersStyles={{
                          booked: {
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            textDecoration: 'line-through',
                            opacity: 0.6
                          }
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
                
                // Get tutor's availability window for the selected date
                const getAvailabilityWindow = () => {
                  if (!selectedDate) return null;
                  
                  const dayOfWeek = selectedDate.getDay();
                  const dateStr = getLocalDateString(selectedDate);
                  
                  // Check day-specific override first
                  const dayOverride = dayOverrides.find(d => d.date === dateStr);
                  if (dayOverride && dayOverride.start_time && dayOverride.end_time) {
                    return { start: dayOverride.start_time, end: dayOverride.end_time };
                  }
                  
                  // Check weekly schedule
                  const weeklySlot = tutorAvailability.find(slot => slot.day_of_week === dayOfWeek);
                  if (weeklySlot) {
                    return { start: weeklySlot.start_time, end: weeklySlot.end_time };
                  }
                  
                  return null;
                };
                
                const format12Hour = (time24: string): string => {
                  const [hours, minutes] = time24.split(':').map(Number);
                  const period = hours >= 12 ? 'PM' : 'AM';
                  const hours12 = hours % 12 || 12;
                  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
                };
                
                const availabilityWindow = getAvailabilityWindow();
                
                // Get all time slots in tutor's availability window
                const allTimeSlots = selectedDate 
                  ? timeSlots.filter(time => {
                      const dayOfWeek = selectedDate.getDay();
                      const dateStr = getLocalDateString(selectedDate);
                      const [hours, minutes] = time.split(":").map(Number);
                      const timeInMinutes = hours * 60 + minutes;
                      
                      // Check day-specific override
                      const dayOverride = dayOverrides.find(d => d.date === dateStr);
                      if (dayOverride && dayOverride.start_time && dayOverride.end_time) {
                        const [startHours, startMinutes] = dayOverride.start_time.split(':').map(Number);
                        const [endHours, endMinutes] = dayOverride.end_time.split(':').map(Number);
                        return timeInMinutes >= (startHours * 60 + startMinutes) && timeInMinutes < (endHours * 60 + endMinutes);
                      }
                      
                      // Check weekly schedule
                      return tutorAvailability.some(slot => {
                        if (slot.day_of_week !== dayOfWeek) return false;
                        const [startHours, startMinutes] = slot.start_time.split(":").map(Number);
                        const [endHours, endMinutes] = slot.end_time.split(":").map(Number);
                        return timeInMinutes >= (startHours * 60 + startMinutes) && timeInMinutes < (endHours * 60 + endMinutes);
                      });
                    })
                  : [];
                
                const availableTimeSlots = allTimeSlots.filter(time => {
                  const isAvailable = isTimeAvailable(time, selectedDate) && !isPastDateTime(selectedDate, time);
                  if (!isAvailable) return false;
                  
                  // Also check if this time slot has any valid durations
                  const durations = getAvailableDurations(selectedDate, time);
                  return durations.length > 0;
                });
                
                return (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Time</FormLabel>
                    {availabilityWindow && (
                      <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        Tutor available: {format12Hour(availabilityWindow.start)} - {format12Hour(availabilityWindow.end)}
                      </div>
                    )}
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedDate}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder={
                            !selectedDate 
                              ? "Select a date first" 
                              : "Select a time slot"
                          }>
                            {field.value && selectedDate && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {formatTimeSlot(field.value, selectedDate)}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {availableTimeSlots.map((time) => {
                          const isOccupied = hasBookingInTimeSlot(time, selectedDate);
                          const isPast = isPastDateTime(selectedDate, time);
                          const availableDurations = getAvailableDurations(selectedDate, time);
                          const hasValidDurations = availableDurations.length > 0;
                          const canSelect = !isOccupied && !isPast && hasValidDurations;
                          
                          return (
                            <SelectItem key={time} value={time} disabled={!canSelect}>
                              <span className={!canSelect ? "text-muted-foreground" : ""}>
                                {selectedDate ? formatTimeSlot(time, selectedDate) : time}
                                {isOccupied && " (Occupied)"}
                                {isPast && !isOccupied && " (Past)"}
                                {!hasValidDurations && !isOccupied && !isPast && " (No time left)"}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {selectedDate && availableTimeSlots.length === 0 && (
                      <FormDescription className="text-xs text-amber-600">
                        {isPastDateTime(selectedDate, "23:59") 
                          ? "All available time slots for this date have passed. Please select another date."
                          : "No time slots available for this date."}
                      </FormDescription>
                    )}
                    {selectedDate && availableTimeSlots.length > 0 && (
                      <FormDescription className="text-xs text-muted-foreground">
                        ℹ️ Some time slots may be unavailable due to existing bookings. You'll be notified if your selected time conflicts.
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
              render={({ field }) => {
                const selectedDate = form.watch("date");
                const selectedTime = form.watch("time");
                const availableDurations = getAvailableDurations(selectedDate, selectedTime);
                const maxDuration = availableDurations.length > 0 
                  ? Math.max(...availableDurations.map(d => parseInt(d.value)))
                  : 240;
                
                const currentValue = field.value ? parseInt(String(field.value)) : 0;
                const isInvalid = currentValue > 0 && (currentValue < 10 || currentValue > maxDuration);
                
                return (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={10}
                        max={maxDuration}
                        step={5}
                        placeholder="Enter duration in minutes"
                        disabled={!selectedDate || !selectedTime}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value);
                          
                          // Validate on change
                          const numValue = parseInt(value);
                          if (value && !isNaN(numValue)) {
                            if (numValue < 10) {
                              form.setError("duration", {
                                type: "manual",
                                message: "Minimum duration is 10 minutes"
                              });
                            } else if (numValue > maxDuration) {
                              form.setError("duration", {
                                type: "manual",
                                message: `Maximum duration is ${maxDuration} minutes for this time slot`
                              });
                            } else {
                              form.clearErrors("duration");
                            }
                          }
                        }}
                        className={cn("h-10", isInvalid && "border-red-500")}
                      />
                    </FormControl>
                    {selectedDate && selectedTime && !isInvalid && availableDurations.length > 0 && (
                      <FormDescription className="text-xs text-muted-foreground">
                        {`Duration: ${availableDurations[0].value}-${availableDurations[availableDurations.length - 1].value} min`}
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
              name="subjectCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Subject Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select subject category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tutorSubjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
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
              name="specificTopic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Specific Topic</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Python loops and functions, Arduino basics..."
                      className="h-10"
                      {...field}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    What specifically do you need help with?
                  </FormDescription>
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
