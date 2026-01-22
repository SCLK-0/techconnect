import { Button } from "@/components/ui/button";
import { UserCheck, X, Loader2 } from "lucide-react";
import { useState, useRef } from "react";

interface TutorAdmitControlProps {
  learnerName: string;
  onAdmit: () => Promise<void> | void;
  onReject: () => void;
}

export function TutorAdmitControl({ learnerName, onAdmit, onReject }: TutorAdmitControlProps) {
  const [isAdmitting, setIsAdmitting] = useState(false);
  const admitCalledRef = useRef(false);

  const handleAdmit = async () => {
    if (isAdmitting || admitCalledRef.current) {
      console.log(" Admit already in progress, ignoring");
      return; // Prevent double-click
    }
    
    console.log(" TutorAdmitControl: handleAdmit called");
    admitCalledRef.current = true;
    setIsAdmitting(true);
    
    try {
      await onAdmit();
      console.log(" TutorAdmitControl: onAdmit completed");
    } catch (error) {
      console.error("Error in admit:", error);
      setIsAdmitting(false);
      admitCalledRef.current = false;
    }
    // Don't reset isAdmitting - component will unmount when admit succeeds
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-card border rounded-lg shadow-lg p-4 space-y-3 animate-in slide-in-from-top-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Learner Waiting</h3>
            <p className="text-sm text-muted-foreground">{learnerName} is in the waiting room</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleAdmit} className="flex-1" size="sm" disabled={isAdmitting}>
            {isAdmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Admitting...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Admit
              </>
            )}
          </Button>
          <Button onClick={onReject} variant="outline" size="sm" disabled={isAdmitting}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
