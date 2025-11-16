import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Zap } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const instantSessionSchema = z.object({
  duration: z.string().min(1, "Please select session duration"),
  subject: z.string()
    .trim()
    .min(1, "Subject is required")
    .max(100, "Subject must be less than 100 characters"),
});

type InstantSessionFormValues = z.infer<typeof instantSessionSchema>;

interface InstantSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorId: string;
  tutorName: string;
  tutorSubjects: string[];
  onSessionCreated?: (sessionId: string) => void;
}

const durations = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
];

export function InstantSessionDialog({
  open,
  onOpenChange,
  tutorId,
  tutorName,
  tutorSubjects,
  onSessionCreated,
}: InstantSessionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InstantSessionFormValues>({
    resolver: zodResolver(instantSessionSchema),
    defaultValues: {
      subject: tutorSubjects[0] || "",
      duration: "60",
    },
  });

  const onSubmit = async (values: InstantSessionFormValues) => {
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to start a session");
        return;
      }

      const now = new Date();
      const durationMinutes = parseInt(values.duration);
      const sessionEndTime = new Date(now.getTime() + durationMinutes * 60000);

      // Check if learner has any active or upcoming sessions
      const { data: learnerSessions, error: learnerCheckError } = await supabase
        .from("sessions")
        .select("scheduled_at, duration_minutes, status")
        .eq("learner_id", user.id)
        .in("status", ["pending", "accepted", "in_progress"]);

      if (learnerCheckError) throw learnerCheckError;

      const hasLearnerConflict = learnerSessions?.some(session => {
        const existingStart = new Date(session.scheduled_at);
        const existingEnd = new Date(existingStart.getTime() + session.duration_minutes * 60000);
        
        // Check if the instant session would overlap with existing sessions
        return (
          (now >= existingStart && now < existingEnd) ||
          (sessionEndTime > existingStart && sessionEndTime <= existingEnd) ||
          (now <= existingStart && sessionEndTime >= existingEnd)
        );
      });

      if (hasLearnerConflict) {
        toast.error("You already have a session scheduled", {
          description: "Please complete or cancel your current session before starting a new one.",
        });
        setIsSubmitting(false);
        return;
      }

      // Check if tutor has any active or upcoming sessions in the next hour
      const { data: tutorSessions, error: tutorCheckError } = await supabase
        .from("sessions")
        .select("scheduled_at, duration_minutes, status")
        .eq("tutor_id", tutorId)
        .in("status", ["pending", "accepted", "in_progress"]);

      if (tutorCheckError) throw tutorCheckError;

      const hasTutorConflict = tutorSessions?.some(session => {
        const existingStart = new Date(session.scheduled_at);
        const existingEnd = new Date(existingStart.getTime() + session.duration_minutes * 60000);
        
        return (
          (now >= existingStart && now < existingEnd) ||
          (sessionEndTime > existingStart && sessionEndTime <= existingEnd) ||
          (now <= existingStart && sessionEndTime >= existingEnd)
        );
      });

      if (hasTutorConflict) {
        toast.error("Tutor is currently busy", {
          description: "This tutor has another session scheduled. Please try again later or book a scheduled session.",
        });
        setIsSubmitting(false);
        return;
      }

      // Create instant session with pending status
      const { data, error } = await supabase
        .from("sessions")
        .insert({
          tutor_id: tutorId,
          learner_id: user.id,
          scheduled_at: now.toISOString(),
          duration_minutes: durationMinutes,
          subject: values.subject.trim(),
          status: "pending",
          session_type: "instant",
        })
        .select()
        .single();

      if (error) throw error;

      // Close this dialog
      form.reset();
      onOpenChange(false);
      
      // Pass the session ID back to parent for waiting modal
      if (onSessionCreated) {
        onSessionCreated(data.id);
      }
      
      toast.success("Request sent! Waiting for tutor to accept...");
    } catch (error: any) {
      console.error("Error starting instant session:", error);
      toast.error("Failed to start session", {
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
      <DialogContent className="sm:max-w-[420px] w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto rounded-2xl" hideCloseButton onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="flex items-center justify-center gap-2 break-words text-lg">
            <Zap className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="break-words">Start Instant Session</span>
          </DialogTitle>
          <DialogDescription className="break-words text-center">
            Connect with <span className="break-words font-medium">{tutorName}</span> right now for an immediate tutoring session.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Duration</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl">
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
                  <FormMessage className="text-xs" />
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
                      className="h-11 break-words rounded-xl"
                      {...field}
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage className="text-xs break-words" />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2 flex-col gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl"
              >
                {isSubmitting ? "Starting..." : "Start Now"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl"
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
