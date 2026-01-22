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
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RatingTags, type RatingTag } from "@/components/feedback/RatingTags";
import { DonationQRDialog } from "@/components/learner/DonationQRDialog";

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
  const [selectedTags, setSelectedTags] = useState<RatingTag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [tutorQRCode, setTutorQRCode] = useState<string | null>(null);
  const [tutorName, setTutorName] = useState("");

  const handleTagToggle = (tag: RatingTag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    // Prevent double submission
    if (submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("User not authenticated");
        setSubmitting(false);
        return;
      }

      // Check if feedback already exists for this session and user
      const { data: existingFeedback } = await supabase
        .from("feedback")
        .select("id")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingFeedback) {
        toast.info("You have already submitted feedback for this session");
        onComplete();
        return;
      }

      const { data: feedbackData, error } = await supabase
        .from("feedback")
        .insert({
          session_id: sessionId,
          user_id: user.id,
          rating,
          comment: comment.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert rating tags if any selected
      if (selectedTags.length > 0 && feedbackData) {
        const tagInserts = selectedTags.map(tag => ({
          feedback_id: feedbackData.id,
          tag: tag,
        }));
        
        const { error: tagsError } = await supabase
          .from("feedback_tags")
          .insert(tagInserts);
        
        if (tagsError) throw tagsError;
      }

      toast.success("Feedback submitted successfully");
      
      // Check if tutor has donation QR code
      const { data: sessionData } = await supabase
        .from("sessions")
        .select("tutor_id")
        .eq("id", sessionId)
        .single();
      
      if (sessionData?.tutor_id) {
        // Get tutor profile with donation QR code
        const { data: tutorProfile } = await supabase
          .from("tutor_profiles")
          .select("donation_qr_code")
          .eq("user_id", sessionData.tutor_id)
          .single();
        
        // Get tutor name from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", sessionData.tutor_id)
          .single();
        
        if (tutorProfile?.donation_qr_code) {
          setTutorQRCode(tutorProfile.donation_qr_code);
          setTutorName(profile?.full_name || "your tutor");
          onOpenChange(false); // Close feedback modal first
          setShowDonation(true); // Then show donation dialog
          return; // Don't call onComplete yet
        }
      }
      
      onComplete();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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

          {/* Rating Tags */}
          <div className="space-y-2">
            <Label>What did you like? (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
            <RatingTags 
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
            />
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

    {tutorQRCode && (
      <DonationQRDialog
        open={showDonation}
        onOpenChange={(open) => {
          setShowDonation(open);
          if (!open) {
            onComplete(); // Call onComplete when donation dialog is closed
          }
        }}
        tutorName={tutorName}
        qrCodeData={tutorQRCode}
      />
    )}
    </>
  );
}
