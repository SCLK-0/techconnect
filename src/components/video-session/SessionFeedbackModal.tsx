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
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SessionFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onComplete: () => void;
}

export function SessionFeedbackModal({
  open,
  onOpenChange,
  sessionId,
  onComplete,
}: SessionFeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("User not authenticated");
        return;
      }

      const { error } = await supabase.from("feedback").insert({
        session_id: sessionId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast.success("Feedback submitted successfully");
      onComplete();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open ? null : onOpenChange(open)}>
      <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] rounded-2xl" hideCloseButton onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="break-words">Session Feedback</DialogTitle>
          <DialogDescription className="break-words">
            How was your session? Your feedback helps us improve the experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Rating */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-medium">Rate your experience</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-none text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label htmlFor="feedback-comment" className="text-sm font-medium">
              Additional comments (optional)
            </label>
            <Textarea
              id="feedback-comment"
              placeholder="Share your thoughts about this session..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting || rating === 0} className="w-full h-11 rounded-xl">
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
