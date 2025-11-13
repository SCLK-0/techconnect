import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

interface InstantSessionToastProps {
  sessionId: string;
  learnerName: string;
  learnerAvatar?: string;
  subject: string;
  duration: string;
  onAccept: (sessionId: string) => void;
  onDecline: (sessionId: string) => void;
}

export function InstantSessionToast({
  sessionId,
  learnerName,
  learnerAvatar,
  subject,
  duration,
  onAccept,
  onDecline,
}: InstantSessionToastProps) {
  return (
    <div className="flex items-start gap-3 min-w-[320px] p-4 bg-background border border-border rounded-lg shadow-lg">
      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
        <AvatarImage src={learnerAvatar} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {learnerName[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-primary text-primary-foreground">
            <Zap className="h-3 w-3 mr-1" />
            Instant Session
          </Badge>
        </div>
        <p className="text-sm font-semibold text-foreground">{learnerName}</p>
        <p className="text-xs text-muted-foreground">
          {subject} • {duration} min
        </p>
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => onAccept(sessionId)}
            className="h-8 text-xs flex-1"
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDecline(sessionId)}
            className="h-8 text-xs flex-1"
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
