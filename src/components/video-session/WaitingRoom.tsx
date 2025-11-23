import { useEffect, useState } from "react";
import { Users, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface WaitingRoomProps {
  sessionData: any;
  role: "tutor" | "learner" | "admin" | null;
}

export function WaitingRoom({ sessionData, role }: WaitingRoomProps) {
  const [waitTime, setWaitTime] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setWaitTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCancel = () => {
    navigate(role === "learner" ? "/learner/sessions" : "/tutor/sessions");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-primary/10 animate-pulse" />
          </div>
          <div className="relative flex items-center justify-center h-32">
            <Users className="w-16 h-16 text-primary" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold">
            {role === "learner" ? "Waiting for Tutor" : "Learner is Waiting"}
          </h1>
          
          <p className="text-muted-foreground text-lg">
            {role === "learner"
              ? "Your tutor will admit you into the session shortly"
              : "A learner is waiting to join your session"}
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Waiting time: {formatTime(waitTime)}</span>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {sessionData?.subject?.[0]?.toUpperCase() || "S"}
                </span>
              </div>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold">{sessionData?.subject || "Session"}</h3>
              <p className="text-sm text-muted-foreground">
                Duration: {sessionData?.duration_minutes || "60"} minutes
              </p>
            </div>
          </div>

          {role === "learner" && (
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-left">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <p className="text-muted-foreground">
                Please ensure your camera and microphone are ready. The session will start automatically
                once the tutor admits you.
              </p>
            </div>
          )}
        </div>

        {role === "learner" && (
          <>
            <div className="pt-4">
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-8 w-3/4 mx-auto" />
            </div>
            
            <div className="pt-6">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleCancel}
              >
                Cancel and Leave
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
