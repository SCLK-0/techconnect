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
