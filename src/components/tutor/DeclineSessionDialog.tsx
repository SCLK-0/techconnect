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
import { sendSessionDeclinedEmail } from "@/utils/sendNotificationEmail";

interface DeclineSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  tutorId: string;
  learnerName: string;
  subject: string;
  onSuccess: () => void;
}

const DECLINATION_REASONS = [
  "Schedule conflict - I'm not available at this time",
  "Outside my expertise area",
  "Too short notice",
  "Personal emergency",
  "Other (please specify)",
];

export function DeclineSessionDialog({
  open,
  onOpenChange,
  sessionId,
  tutorId,
  learnerName,
  subject,
  onSuccess,
}: DeclineSessionDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDecline = async () => {
    const reason = selectedReason === "Other (please specify)" 
      ? customReason.trim()
      : selectedReason;

    if (!reason) {
      toast.error("Please select or enter a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('decline_session_with_reason', {
        p_session_id: sessionId,
        p_tutor_id: tutorId,
        p_declination_reason: reason,
      });

      if (error) throw error;

      if (data?.success) {
        // Get learner email and tutor name for email notification
        try {
          const { data: learnerProfile, error: learnerError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", data.learner_id)
            .single();

          const { data: tutorProfile, error: tutorError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", tutorId)
            .single();

          // Get learner's email using RPC function
          const { data: learnerEmail, error: emailError } = await supabase
            .rpc('get_user_email', { user_id: data.learner_id });

          if (learnerError) {
            console.error("Error fetching learner profile:", learnerError);
          }
          if (tutorError) {
            console.error("Error fetching tutor profile:", tutorError);
          }
          if (emailError) {
            console.error("Error fetching learner email:", emailError);
          }

          if (learnerEmail) {
            await sendSessionDeclinedEmail(
              learnerEmail,
              learnerProfile?.full_name || "User",
              tutorProfile?.full_name || "Your tutor",
              reason
            );
          }
        } catch (emailError) {
          console.error("Error sending rejection email:", emailError);
        }

        toast.success(`Session declined. ${data.learner_name} has been notified.`);
        onSuccess();
        onOpenChange(false);
        setSelectedReason("");
        setCustomReason("");
      } else {
        toast.error(data?.error || "Failed to decline session");
      }
    } catch (error: any) {
      console.error("Error declining session:", error);
      toast.error("Failed to decline session: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Decline Session Request</DialogTitle>
          <DialogDescription>
            Please provide a reason for declining {learnerName}'s request for {subject}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Reason for declining</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="mt-2 space-y-2">
              {DECLINATION_REASONS.map((reason) => (
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
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDecline}
            disabled={isSubmitting || !selectedReason}
          >
            <X className="mr-2 h-4 w-4" />
            {isSubmitting ? "Declining..." : "Decline Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
