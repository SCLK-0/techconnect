import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export function LoadingOverlay({ isLoading, message = "Loading..." }: LoadingOverlayProps) {
  useEffect(() => {
    if (isLoading) {
      // Prevent scrolling when loading
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling when done
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="absolute top-0 left-0 right-0 h-screen bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
