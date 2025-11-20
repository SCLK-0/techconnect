import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { BookSessionDialog } from "./BookSessionDialog";

interface RescheduleSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorId: string;
  tutorName: string;
  tutorSubjects: string[];
  rejectionReason?: string;
  cancelledReason?: string;
}

export function RescheduleSessionDialog({
  open,
  onOpenChange,
  tutorId,
  tutorName,
  tutorSubjects,
  rejectionReason,
  cancelledReason,
}: RescheduleSessionDialogProps) {
  const [showBookDialog, setShowBookDialog] = useState(false);

  const reason = rejectionReason || cancelledReason;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Session {rejectionReason ? 'Declined' : 'Cancelled'}</DialogTitle>
            <DialogDescription>
              {rejectionReason 
                ? `${tutorName} declined your session request.`
                : `Your session with ${tutorName} was cancelled.`
              }
            </DialogDescription>
          </DialogHeader>

          {reason && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-1">Reason:</p>
              <p className="text-sm text-muted-foreground">{reason}</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Would you like to reschedule with {tutorName} or find another tutor?
            </p>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  onOpenChange(false);
                  setShowBookDialog(true);
                }}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reschedule with {tutorName}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  window.location.href = '/learner/find-tutors';
                }}
                className="w-full"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Find Another Tutor
              </Button>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BookSessionDialog
        open={showBookDialog}
        onOpenChange={setShowBookDialog}
        tutorId={tutorId}
        tutorName={tutorName}
        tutorSubjects={tutorSubjects}
      />
    </>
  );
}
