import { Button } from "@/components/ui/button";
import { UserCheck, X } from "lucide-react";

interface TutorAdmitControlProps {
  learnerName: string;
  onAdmit: () => void;
  onReject: () => void;
}

export function TutorAdmitControl({ learnerName, onAdmit, onReject }: TutorAdmitControlProps) {
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
          <Button onClick={onAdmit} className="flex-1" size="sm">
            <UserCheck className="w-4 h-4 mr-2" />
            Admit
          </Button>
          <Button onClick={onReject} variant="outline" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
