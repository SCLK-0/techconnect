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

interface RejectSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  tutorId: string;
  learnerName: string;
  subject: string;
  onSuccess: () => void;
}

const REJECTION_REASONS = [
  "Schedule conflict - I'm not available at this time",
  "Outside my expertise area",
  "Too short notice",
  "Personal emergency",
  "Other (please specify)",
];

export function RejectSessionDialog({
  open,
  onOpenChange,
  sessionId,
  tutorId,
  learnerName,
  subject,
  onSuccess,
}: RejectSessionDialogProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReject = async () => {
    const reason = selectedReason === "Other (please specify)" 
      ? customReason.trim()
      : selectedReason;

    if (!reason) {
      toast.error("Please select or enter a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('reject_session_with_reason', {
        p_session_id: sessionId,
        p_tutor_id: tutorId,
        p_rejection_reason: reason,
      });

      if (error) throw error;

      if (data?.success) {
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
              {REJECTION_REASONS.map((reason) => (
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
            onClick={handleReject}
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
