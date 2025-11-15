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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SessionLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  userRole: string | null;
  onComplete: () => void;
}

export function SessionLogModal({
  open,
  onOpenChange,
  sessionId,
  userRole,
  onComplete,
}: SessionLogModalProps) {
  const [topicsCovered, setTopicsCovered] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!topicsCovered.trim()) {
      toast.error("Please describe what topics were covered");
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("session_logs").insert({
        session_id: sessionId,
        user_id: user.id,
        user_role: userRole,
        topics_covered: topicsCovered.trim(),
        accomplishments: null,
        homework: null,
      });

      if (error) throw error;

      toast.success("Session log saved successfully");
      onComplete();
    } catch (error) {
      console.error("Error saving session log:", error);
      toast.error("Failed to save session log");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open ? null : onOpenChange(open)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" hideCloseButton onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Session Log</DialogTitle>
          <DialogDescription>
            Document what was accomplished during this session. This helps track progress and plan
            future sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Topics Covered */}
          <div className="space-y-2">
            <Label htmlFor="topics-covered">
              Topics Covered <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="topics-covered"
              placeholder="e.g., Reviewed quadratic equations, practiced graphing parabolas..."
              value={topicsCovered}
              onChange={(e) => setTopicsCovered(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting || !topicsCovered.trim()}>
            {submitting ? "Saving..." : "Save Log"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
