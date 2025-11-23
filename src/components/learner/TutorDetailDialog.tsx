import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Wifi, WifiOff, Clock, Zap, Maximize2 } from "lucide-react";
import { TutorRatingTagsSection } from "@/components/learner/TutorRatingTagsSection";

interface TutorProfile {
  id: string;
  user_id: string;
  subject_expertise: string[];
  bio: string;
  is_online: boolean;
  is_in_session: boolean;
  rating?: number;
  review_count?: number;
  next_available?: string;
  registered_year?: string;
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
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Tutor Profile</DialogTitle>
          <DialogDescription className="sr-only">
            View detailed information about this tutor
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
              <AvatarImage src={tutor.profiles.avatar_url || ""} />
              <AvatarFallback className="text-2xl bg-blue-500 text-white">
                {tutor.profiles.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-bold">{tutor.profiles.full_name}</h3>
              {tutor.registered_year && (
                <p className="text-sm text-muted-foreground mt-1">{tutor.registered_year}</p>
              )}
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-4 mt-2">
                <div className="flex items-center gap-2">
                  {tutor.is_in_session ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">In Session</span>
                    </div>
                  ) : tutor.is_online ? (
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
            <h4 className="text-sm font-semibold mb-2 sm:mb-3">Subject Expertise</h4>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {tutor.subject_expertise.slice(0, 5).map((subject) => (
                <Badge key={subject} variant="secondary" className="text-sm">
                  {subject}
                </Badge>
              ))}
              {tutor.subject_expertise.length > 5 && (
                <Badge variant="outline" className="text-sm">
                  +{tutor.subject_expertise.length - 5} others
                </Badge>
              )}
            </div>
          </div>

          <TutorRatingTagsSection tutorUserId={tutor.user_id} />

          <div>
            <h4 className="text-sm font-semibold mb-2 sm:mb-3">About</h4>
            <div className="text-sm text-muted-foreground leading-relaxed max-h-[120px] sm:max-h-[150px] overflow-y-auto p-3 pr-4 border rounded-lg bg-muted/30 custom-scrollbar break-words overflow-wrap-anywhere">
              {tutor.bio}
            </div>
          </div>

          {tutor.next_available && (
            <div className="flex items-center gap-2 text-sm bg-muted/50 px-4 py-3 rounded-md">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Next available: <span className="font-medium">{tutor.next_available}</span></span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-4">
            <Button 
              className="flex-1 w-full"
              onClick={() => {
                onOpenChange(false);
                onBookSession();
              }}
            >
              Book Session
            </Button>
            <Button 
              variant={tutor.is_online && !tutor.is_in_session ? "default" : "outline"}
              className="flex-1 w-full relative"
              onClick={() => {
                onOpenChange(false);
                onInstantSession();
              }}
              disabled={!tutor.is_online || tutor.is_in_session}
            >
              <Zap className="mr-2 h-4 w-4" />
              <span className="truncate">
                {tutor.is_in_session ? "Tutor In Session" : tutor.is_online ? "Start Instant Session" : "Tutor Offline"}
              </span>
              {tutor.is_online && !tutor.is_in_session && (
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
