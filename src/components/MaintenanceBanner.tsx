import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function MaintenanceBanner() {
  return (
    <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">Under Maintenance</AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        Some features are temporarily unavailable while we improve the system. Core functionality remains operational.
      </AlertDescription>
    </Alert>
  );
}
