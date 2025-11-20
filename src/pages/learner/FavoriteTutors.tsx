import { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LearnerSidebar } from "@/components/learner/LearnerSidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Heart, Wifi, WifiOff, Loader2 } from "lucide-react";
import { BookSessionDialog } from "@/components/learner/BookSessionDialog";
import { TutorDetailDialog } from "@/components/learner/TutorDetailDialog";
import { useFavoriteTutor } from "@/hooks/useFavoriteTutor";
import { toast } from "sonner";

export default function FavoriteTutors() {
  const { user } = useUserRole();
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [bookingTutor, setBookingTutor] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);

  const { data: favoriteTutors, isLoading } = useQuery({
    queryKey: ['favorite-tutors', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .rpc('get_favorite_tutors', { p_learner_id: user.id });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleViewDetails = (tutor: any) => {
    setSelectedTutor(tutor);
    setDetailDialogOpen(true);
  };

  const handleBookSession = (tutor: any) => {
    setBookingTutor(tutor);
    setBookDialogOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <LearnerSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-center px-3 py-4">
            <div className="w-full max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={logo} alt="TechConnect Logo" className="h-8 w-8 object-contain" />
                <span className="font-semibold text-lg hidden sm:inline">TechConnect</span>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell />
                <UserMenu />
                <SidebarTrigger className="md:hidden" />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pt-8 pb-12 overflow-auto flex justify-center">
            <div className="space-y-6 w-full max-w-[95%] sm:max-w-[90%] md:max-w-5xl">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Favorite Tutors</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Quick access to your bookmarked tutors
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : favoriteTutors && favoriteTutors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favoriteTutors.map((tutor: any) => (
                    <FavoriteTutorCard
                      key={tutor.tutor_user_id}
                      tutor={tutor}
                      learnerId={user?.id}
                      onViewDetails={() => handleViewDetails(tutor)}
                      onBookSession={() => handleBookSession(tutor)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Favorite Tutors Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Browse tutors and click the heart icon to add them to your favorites
                  </p>
                  <Button onClick={() => window.location.href = '/learner/find-tutors'}>
                    Find Tutors
                  </Button>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>

      {selectedTutor && (
        <TutorDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          tutor={{
            id: selectedTutor.tutor_profile_id,
            user_id: selectedTutor.tutor_user_id,
            subject_expertise: selectedTutor.subject_expertise,
            bio: selectedTutor.bio,
            is_online: selectedTutor.is_online,
            is_in_session: false,
            rating: selectedTutor.average_rating,
            review_count: selectedTutor.total_reviews,
            registered_year: selectedTutor.registered_year,
            profiles: {
              full_name: selectedTutor.full_name,
              avatar_url: selectedTutor.avatar_url,
            },
          }}
          onBookSession={() => handleBookSession(selectedTutor)}
          onInstantSession={() => toast.info("Instant session feature coming soon")}
        />
      )}

      {bookingTutor && (
        <BookSessionDialog
          open={bookDialogOpen}
          onOpenChange={setBookDialogOpen}
          tutorId={bookingTutor.tutor_user_id}
          tutorName={bookingTutor.full_name}
          tutorSubjects={bookingTutor.subject_expertise}
        />
      )}
    </SidebarProvider>
  );
}

interface FavoriteTutorCardProps {
  tutor: any;
  learnerId: string | undefined;
  onViewDetails: () => void;
  onBookSession: () => void;
}

function FavoriteTutorCard({ tutor, learnerId, onViewDetails, onBookSession }: FavoriteTutorCardProps) {
  const { isFavorited, setIsFavorited, toggleFavorite, isLoading } = useFavoriteTutor(
    tutor.tutor_user_id,
    learnerId
  );

  useEffect(() => {
    setIsFavorited(true); // Already favorited since it's on this page
  }, [setIsFavorited]);

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={tutor.avatar_url || ""} />
          <AvatarFallback className="bg-blue-500 text-white">
            {tutor.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{tutor.full_name}</h3>
              {tutor.registered_year && (
                <p className="text-xs text-muted-foreground">{tutor.registered_year}</p>
              )}
            </div>
            <button
              onClick={() => toggleFavorite()}
              disabled={isLoading}
              className="flex-shrink-0"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isFavorited
                    ? "fill-red-500 text-red-500"
                    : "text-muted-foreground hover:text-red-500"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-2 text-sm">
            <div className="flex items-center gap-1">
              {tutor.is_online ? (
                <>
                  <Wifi className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Offline</span>
                </>
              )}
            </div>
            {tutor.average_rating && tutor.total_reviews > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{tutor.average_rating}</span>
                <span className="text-muted-foreground">({tutor.total_reviews})</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {tutor.subject_expertise.slice(0, 3).map((subject: string) => (
              <Badge key={subject} variant="secondary" className="text-xs">
                {subject}
              </Badge>
            ))}
            {tutor.subject_expertise.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tutor.subject_expertise.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={onViewDetails} className="flex-1">
              View Profile
            </Button>
            <Button size="sm" onClick={onBookSession} className="flex-1">
              Book Session
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
