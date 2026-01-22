import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AllowObserversToggleProps {
  sessionId: string;
  currentValue: boolean;
  disabled?: boolean;
}

export function AllowObserversToggle({ 
  sessionId, 
  currentValue, 
  disabled = false 
}: AllowObserversToggleProps) {
  const [isEnabled, setIsEnabled] = useState(currentValue);
  const queryClient = useQueryClient();

  // Sync internal state with prop changes
  useEffect(() => {
    setIsEnabled(currentValue);
  }, [currentValue]);

  const updateObserversMutation = useMutation({
    mutationFn: async (allowObservers: boolean) => {
      // Handle mock sessions for testing
      if (sessionId.startsWith("mock-")) {
        // Simulate API delay for testing
        await new Promise(resolve => setTimeout(resolve, 500));
        return allowObservers;
      }

      const { error } = await supabase
        .from("sessions")
        .update({ allow_observers: allowObservers })
        .eq("id", sessionId);

      if (error) throw error;
      return allowObservers;
    },
    onSuccess: (allowObservers) => {
      setIsEnabled(allowObservers);
      
      if (sessionId.startsWith("mock-")) {
        toast.success(
          allowObservers 
            ? "Mock session: Tag-along now allowed (demo mode)"
            : "Mock session: Tag-along disabled (demo mode)"
        );
      } else {
        toast.success(
          allowObservers 
            ? "Session now allows tag-along learners - others can request to join!"
            : "Session no longer allows tag-along learners"
        );
        queryClient.invalidateQueries({ queryKey: ["my-sessions"] });
      }
    },
    onError: (error: any) => {
      console.error("Error updating observer setting:", error);
      toast.error("Failed to update tag-along setting: " + error.message);
      // Revert the switch state on error
      setIsEnabled(currentValue);
    },
  });

  const handleToggle = (checked: boolean) => {
    if (disabled) return;
    setIsEnabled(checked);
    updateObserversMutation.mutate(checked);
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {isEnabled ? (
            <Eye className="h-4 w-4 text-primary" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
          Allow Tag-Along Learners
        </CardTitle>
        <CardDescription className="text-xs">
          Let other learners request to tag along to your session (view-only)
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center space-x-2">
          <Switch
            id={`observers-${sessionId}`}
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={disabled || updateObserversMutation.isPending}
          />
          <Label 
            htmlFor={`observers-${sessionId}`} 
            className="text-sm cursor-pointer"
          >
            {isEnabled ? "Tag-along allowed" : "Private session"}
          </Label>
        </div>
        {isEnabled && (
          <p className="text-xs text-muted-foreground mt-2">
            Other learners can find your session and request to tag along. You'll approve each request.
          </p>
        )}
      </CardContent>
    </Card>
  );
}