import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Wifi, WifiOff, Clock, Zap } from "lucide-react";

interface TutorProfile {
  id: string;
  user_id: string;
  subject_expertise: string[];
  bio: string;
  is_online: boolean;
  rating?: number;
  review_count?: number;
  next_available?: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface TutorDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutor: TutorProfile | null;
  onBookSession: () => void;
  onInstantSession: () => void;
}

export const TutorDetailDialog = ({
  open,
  onOpenChange,
  tutor,
  onBookSession,
  onInstantSession,
}: TutorDetailDialogProps) => {
  if (!tutor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tutor Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={tutor.profiles.avatar_url || ""} />
              <AvatarFallback className="text-2xl">
                {tutor.profiles.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">{tutor.profiles.full_name}</h3>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  {tutor.is_online ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-500 font-medium">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Offline</span>
                    </>
                  )}
                </div>
                {tutor.rating && tutor.rating > 0 && tutor.review_count && tutor.review_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{tutor.rating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">
                      ({tutor.review_count} {tutor.review_count === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Subject Expertise</h4>
            <div className="flex flex-wrap gap-2">
              {tutor.subject_expertise.map((subject) => (
                <Badge key={subject} variant="secondary" className="text-sm">
                  {subject}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">About</h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {tutor.bio}
            </p>
          </div>

          {tutor.next_available && (
            <div className="flex items-center gap-2 text-sm bg-muted/50 px-4 py-3 rounded-md">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Next available: <span className="font-medium">{tutor.next_available}</span></span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                onBookSession();
              }}
            >
              Book Session
            </Button>
            <Button 
              variant={tutor.is_online ? "default" : "outline"}
              className="flex-1 relative"
              onClick={() => {
                onOpenChange(false);
                onInstantSession();
              }}
              disabled={!tutor.is_online}
            >
              <Zap className="mr-2 h-4 w-4" />
              {tutor.is_online ? "Start Instant Session" : "Tutor Offline"}
              {tutor.is_online && (
                <span className="absolute top-1/2 -translate-y-1/2 right-3 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
