import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MessageSquare, Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RatingTags, type RatingTag } from "@/components/feedback/RatingTags";

interface FeedbackDialogProps {
  sessionId: string;
}

export function FeedbackDialog({ sessionId }: FeedbackDialogProps) {
  const { user } = useUserRole();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<RatingTag[]>([]);
  const queryClient = useQueryClient();

  const handleTagToggle = (tag: RatingTag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      // Insert feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .insert({
          session_id: sessionId,
          user_id: user.id,
          rating,
          comment,
        })
        .select()
        .single();
      
      if (feedbackError) throw feedbackError;
      
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
    },
    onSuccess: () => {
      toast.success("Feedback submitted!");
      setOpen(false);
      setRating(0);
      setComment("");
      setSelectedTags([]);
      queryClient.invalidateQueries({ queryKey: ["learner-sessions"] });
    },
    onError: (error) => {
      toast.error("Failed to submit: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    submitMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="w-4 h-4 mr-2" />
          Leave Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] rounded-2xl">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="break-words">Session Feedback</DialogTitle>
          <DialogDescription className="break-words">Share your experience with this session</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Rating</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>What did you like? (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
            <RatingTags 
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
            />
          </div>
          <div>
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this session..."
              rows={4}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full h-11 rounded-xl">Submit Feedback</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full h-11 rounded-xl">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
