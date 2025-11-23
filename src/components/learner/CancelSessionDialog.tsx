import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X } from "lucide-react";
import { sendSessionCancelledEmail } from "@/utils/sendNotificationEmail";

interface CancelSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  userId: string;
  tutorName: string;
  subject: string;
  onSuccess: () => void;
}

const CANCELLATION_REASONS = [
  "Schedule conflict - Something came up",
  "Found another tutor",
  "No longer need help with this topic",
  "Personal emergency",
  "Other (please specify)",
];

export function CancelSessionDialog({
  open,
  onOpenChange,
  sessionId,
  userId,
  tutorName,
  subject,
  onSuccess,
}: CancelSessionDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    const reason = selectedReason === "Other (please specify)" 
      ? customReason.trim()
      : selectedReason;

    if (!reason) {
      toast.error("Please select or enter a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('cancel_session_with_reason', {
        p_session_id: sessionId,
        p_user_id: userId,
        p_cancellation_reason: reason,
      });

      if (error) throw error;

      if (data?.success) {
        // Send email notification to tutor
        try {
          // Get tutor ID from the session since RPC doesn't return it
          const { data: sessionData, error: sessionError } = await supabase
            .from("sessions")
            .select("tutor_id")
            .eq("id", sessionId)
            .single();

          if (sessionError || !sessionData?.tutor_id) {
            console.error("Error fetching session tutor_id:", sessionError);
            throw new Error("Could not find tutor for this session");
          }

          const tutorId = sessionData.tutor_id;

          const { data: tutorProfile, error: tutorError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", tutorId)
            .single();

          const { data: learnerProfile, error: learnerError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", userId)
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
            await sendSessionCancelledEmail(
              tutorEmail,
              tutorProfile?.full_name || "Tutor",
              learnerProfile?.full_name || "A learner",
              subject,
              reason
            );
          }
        } catch (emailError) {
          console.error("Error sending cancellation email:", emailError);
        }

        toast.success(`Session cancelled. ${data.notified_user} has been notified.`);
        onSuccess();
        onOpenChange(false);
        setSelectedReason("");
        setCustomReason("");
      } else {
        toast.error(data?.error || "Failed to cancel session");
      }
    } catch (error: any) {
      console.error("Error cancelling session:", error);
      toast.error("Failed to cancel session: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Session</DialogTitle>
          <DialogDescription>
            Please provide a reason for cancelling your session with {tutorName} for {subject}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Reason for cancelling</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="mt-2 space-y-2">
              {CANCELLATION_REASONS.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label htmlFor={reason} className="font-normal cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === "Other (please specify)" && (
            <div>
              <Label htmlFor="custom-reason">Please specify</Label>
              <Textarea
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter your reason..."
                rows={3}
                className="mt-2"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Keep Session
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isSubmitting || !selectedReason}
          >
            <X className="mr-2 h-4 w-4" />
            {isSubmitting ? "Cancelling..." : "Cancel Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
