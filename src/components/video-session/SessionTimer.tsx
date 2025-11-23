import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SessionTimerProps {
  sessionId: string;
  onTimeout: () => void;
}

export function SessionTimer({ sessionId, onTimeout }: SessionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isMissed, setIsMissed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase
        .from("sessions")
        .select("scheduled_at, duration_minutes, session_status")
        .eq("id", sessionId)
        .single();

      if (data) {
        const durationMinutes = parseInt(data.duration_minutes);
        setDuration(durationMinutes * 60); // Convert to seconds
        
        // Calculate time remaining from scheduled time
        const scheduledTime = new Date(data.scheduled_at).getTime();
        const endTime = scheduledTime + (durationMinutes * 60 * 1000);
        const now = Date.now();
        const remaining = Math.floor((endTime - now) / 1000);
        
        // Allow 20 minute grace period (1200 seconds)
        const gracePeriodinSeconds = 20 * 60;
        
        if (remaining < -gracePeriodinSeconds) {
          // Session is more than 20 minutes late - mark as missed
          setIsMissed(true);
          setTimeLeft(0);
          toast.error("This session has been missed (more than 20 minutes late)");
          setTimeout(() => onTimeout(), 2000);
        } else {
          // Set time left (can be negative if late but within grace period)
          setTimeLeft(Math.max(0, remaining));
          setIsInitialized(true);
        }
      }
    };

    loadSession();
  }, [sessionId, onTimeout]);

  useEffect(() => {
    if (isMissed || !isInitialized) return;

    if (timeLeft === 0 && duration > 0) {
      onTimeout();
      return;
    }

    // Show warning 5 minutes before timeout
    if (timeLeft === 300 && !showWarning) {
      setShowWarning(true);
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, duration, onTimeout, showWarning, isInitialized]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const isWarning = timeLeft <= 300; // 5 minutes

  return (
    <>
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-mono ${
          isMissed ? "bg-destructive text-destructive-foreground" : 
          isWarning ? "bg-destructive/10 text-destructive" : "bg-muted"
        }`}
      >
        <Clock className="h-4 w-4" />
        <span className="font-medium">{formatTime(timeLeft)}</span>
      </div>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Session Ending Soon
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your session will end in 5 minutes. Please wrap up your discussion and prepare to end
              the call.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowWarning(false)}>
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
