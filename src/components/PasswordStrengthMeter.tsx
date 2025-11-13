import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", colorClass: "" };

    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 10;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    
    // Determine label and color
    if (score < 50) {
      return { score, label: "Weak", colorClass: "text-destructive" };
    } else if (score < 75) {
      return { score, label: "Medium", colorClass: "text-warning" };
    } else {
      return { score, label: "Strong", colorClass: "text-success" };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Password Strength:</span>
        <span className={cn("text-xs font-semibold", strength.colorClass)}>
          {strength.label}
        </span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-300",
            strength.score < 50 && "bg-destructive",
            strength.score >= 50 && strength.score < 75 && "bg-warning",
            strength.score >= 75 && "bg-success"
          )}
          style={{ width: `${strength.score}%` }}
        />
      </div>
    </div>
  );
};

