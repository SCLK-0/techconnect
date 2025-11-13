import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InstantSessionWaitingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  tutorName: string;
}

export function InstantSessionWaitingModal({
  open,
  onOpenChange,
  sessionId,
  tutorName,
}: InstantSessionWaitingModalProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<string>("pending");

  useEffect(() => {
    if (!sessionId || !open) return;

    // Subscribe to session status changes
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          const newStatus = payload.new.status;
          setSessionStatus(newStatus);
          
          if (newStatus === "accepted") {
            toast.success("Session accepted!", {
              description: `${tutorName} has accepted your instant session`,
            });
            onOpenChange(false);
          } else if (newStatus === "rejected") {
            toast.error("Tutor is currently busy", {
              description: `${tutorName} is unable to start a session right now. Please try again later or book a scheduled session.`,
            });
            onOpenChange(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, open, tutorName, onOpenChange]);

  const handleCancel = async () => {
    if (!sessionId) return;
    
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ status: "cancelled" })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Session cancelled");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error cancelling session:", error);
      toast.error("Failed to cancel session");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open ? null : onOpenChange(open)}>
      <DialogContent className="sm:max-w-[400px]" hideCloseButton onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Waiting for Response
          </DialogTitle>
          <DialogDescription>
            Waiting for {tutorName} to accept your instant session request...
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="relative flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            This may take a few moments
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isCancelling}
            className="w-full"
          >
            {isCancelling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Cancel Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
