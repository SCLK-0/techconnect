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
import { sendTutorCancelledEmail } from "@/utils/sendNotificationEmail";

interface TutorCancelSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  tutorId: string;
  learnerName: string;
  subject: string;
  onSuccess: () => void;
}

const CANCELLATION_REASONS = [
  "Personal emergency",
  "Unexpected technical issues",
  "Health issue",
  "Schedule conflict",
  "Other (please specify)",
];

export function TutorCancelSessionDialog({
  open,
  onOpenChange,
  sessionId,
  tutorId,
  learnerName,
  subject,
  onSuccess,
}: TutorCancelSessionDialogProps) {
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
      const { error } = await supabase
        .from("sessions")
        .update({ 
          status: "cancelled",
          cancelled_reason: reason 
        })
        .eq("id", sessionId);

      if (error) throw error;

      // Send email notification to learner
      try {
        const { data: learnerProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", sessionId)
          .single();

        const { data: tutorProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", tutorId)
          .single();

        // Get learner's email using RPC function
        const { data: sessionData } = await supabase
          .from("sessions")
          .select("learner_id")
          .eq("id", sessionId)
          .single();

        if (sessionData?.learner_id) {
          const { data: learnerEmail, error: emailError } = await supabase
            .rpc('get_user_email', { user_id: sessionData.learner_id });

          if (emailError) {
            console.error("Error fetching learner email:", emailError);
          }

          if (learnerEmail) {
            await sendTutorCancelledEmail(
              learnerEmail,
              learnerName,
              tutorProfile?.full_name || "Your tutor",
              subject,
              reason
            );
          }
        }
      } catch (emailError) {
        console.error("Error sending cancellation email:", emailError);
      }

      toast.success(`Session cancelled. ${learnerName} has been notified.`);
      onSuccess();
      onOpenChange(false);
      setSelectedReason("");
      setCustomReason("");
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
            Please provide a reason for cancelling your session with {learnerName} for {subject}
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
