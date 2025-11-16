import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

export function PageLoadingOverlay() {
  const [isNavigating, setIsNavigating] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Show loading on navigation
    setIsNavigating(true);
    
    // Hide after a short delay to ensure smooth transition
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
