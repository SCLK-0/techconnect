import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DemoAdmit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const camera = searchParams.get("camera");
  const mic = searchParams.get("mic");
  const role = searchParams.get("role");
  const videoDevice = searchParams.get("videoDevice");
  const audioDevice = searchParams.get("audioDevice");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Countdown from 3 to 1
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Redirect after 3 seconds
    const redirectTimer = setTimeout(() => {
      const params = new URLSearchParams({
        role: role || 'learner',
        camera: camera || 'true',
        mic: mic || 'true',
        videoDevice: videoDevice || '',
        audioDevice: audioDevice || ''
      });
      navigate(`/demo-session?${params.toString()}`);
    }, 3000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [navigate, camera, mic, role]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-primary/10 animate-pulse" />
          </div>
          <div className="relative flex items-center justify-center h-32">
            <CheckCircle2 className="w-16 h-16 text-primary" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold">You've Been Admitted!</h1>
          
          <p className="text-muted-foreground text-lg">
            The dummy tutor has admitted you to the session
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Joining in {countdown} second{countdown !== 1 ? 's' : ''}...</span>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-3 p-4 bg-card rounded-lg border">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">D</span>
              </div>
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold">Dummy Session</h3>
              <p className="text-sm text-muted-foreground">
                Duration: 30 minutes
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-left">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground">
              Please ensure your camera and microphone are ready. The session will start automatically
              once the tutor admits you.
            </p>
          </div>
        </div>

        <div className="pt-4">
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-3/4 mx-auto" />
        </div>
        
        <div className="pt-6">
          <button 
            className="w-full px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
            onClick={() => navigate(role === "learner" ? "/learner/dashboard" : "/tutor/dashboard")}
          >
            Cancel and Leave
          </button>
        </div>
      </div>
    </div>
  );
}
