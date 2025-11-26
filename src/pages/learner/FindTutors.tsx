import { useState, useEffect } from "react";
import { Search, UserCircle, Wifi, WifiOff, Zap, Star, Clock, Filter, Maximize2, Heart } from "lucide-react";
import { useFavoriteTutor } from "@/hooks/useFavoriteTutor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { LearnerSidebar } from "@/components/learner/LearnerSidebar";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";
import { BookSessionDialog } from "@/components/learner/BookSessionDialog";
import { InstantSessionDialog } from "@/components/learner/InstantSessionDialog";
import { InstantSessionWaitingModal } from "@/components/learner/InstantSessionWaitingModal";
import { TutorDetailDialog } from "@/components/learner/TutorDetailDialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { useNavigate } from "react-router-dom";
import { toast as sonnerToast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LoadingOverlay } from "@/components/LoadingOverlay";

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

const FindTutors = () => {
  const navigate = useNavigate();
  const { user } = useUserRole();
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isInstantDialogOpen, setIsInstantDialogOpen] = useState(false);
  const [isWaitingModalOpen, setIsWaitingModalOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const [acceptedSessionId, setAcceptedSessionId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const { toast } = useToast();
  
  // Filter states
  const [onlineFilter, setOnlineFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [subjectFilters, setSubjectFilters] = useState<string[]>([]);
  const [yearLevelFilter, setYearLevelFilter] = useState<string>("all");
  const [showOnlyBooked, setShowOnlyBooked] = useState<boolean>(false);
  const [bookedTutorIds, setBookedTutorIds] = useState<Set<string>>(new Set());
  
  const allSubjects = [
    "Programming",
    "Software Development",
    "Electronics",
    "Circuit Design",
    "Automotive",
    "Mechanical Systems",
    "Garments",
    "Fashion Design",
    "Industrial Design",
    "Manufacturing",
    "Quality Control",
    "Project Management",
    "Other",
  ];

  // Fuzzy search helper - calculates string similarity
  const fuzzyMatch = (str: string, query: string): number => {
    const strLower = str.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Exact match
    if (strLower === queryLower) return 100;
    
    // Starts with
    if (strLower.startsWith(queryLower)) return 90;
    
    // Contains
    if (strLower.includes(queryLower)) return 70;
    
    // Calculate Levenshtein distance for fuzzy matching
    const matrix: number[][] = [];
    for (let i = 0; i <= queryLower.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= strLower.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= queryLower.length; i++) {
      for (let j = 1; j <= strLower.length; j++) {
        if (queryLower[i - 1] === strLower[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    const distance = matrix[queryLower.length][strLower.length];
    const maxLength = Math.max(queryLower.length, strLower.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;
    
    return similarity > 30 ? similarity : 0;
  };

  // Rule-based matchmaking score
  const calculateMatchScore = (tutor: TutorProfile, query: string): number => {
    if (!query.trim()) return 0;
    
    let score = 0;
    
    // Name matching (highest weight)
    const nameScore = fuzzyMatch(tutor.profiles.full_name, query);
    score += nameScore * 2;
    
    // Subject matching
    const maxSubjectScore = Math.max(
      ...(tutor.subject_expertise || []).map(subject => fuzzyMatch(subject, query)),
      0
    );
    score += maxSubjectScore * 1.5;
    
    // Bio matching
    const bioScore = fuzzyMatch(tutor.bio, query);
    score += bioScore * 0.5;
    
    // Bonus for online tutors
    if (tutor.is_online) score += 20;
    
    // Bonus for high rating
    if (tutor.rating) {
      score += tutor.rating * 5;
    }
    
    // Bonus for having availability
    if (tutor.next_available) score += 10;
    
    return score;
  };

  const handleCardClick = (tutor: TutorProfile) => {
    setSelectedTutor(tutor);
    setIsDetailDialogOpen(true);
  };

  const handleBookSession = (tutor: TutorProfile) => {
    setSelectedTutor(tutor);
    setIsBookingDialogOpen(true);
  };

  const handleInstantSession = (tutor: TutorProfile) => {
    setSelectedTutor(tutor);
    setIsInstantDialogOpen(true);
  };

  const getNextAvailableTime = (tutorId: string, weeklySlots: any[], dayOverrides: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Helper to get local date string (avoids UTC conversion issues)
    const getLocalDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Helper to format time to 12-hour format
    const format12Hour = (time24: string): string => {
      if (!time24 || !time24.includes(':')) return 'Invalid time';
      const parts = time24.split(':');
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (isNaN(hours) || isNaN(minutes)) return 'Invalid time';
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    
    // Check next 14 days starting from tomorrow (since booking requires at least tomorrow)
    for (let i = 1; i <= 14; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dateStr = getLocalDateString(checkDate);
      const dayOfWeek = checkDate.getDay();
      
      // Check day-specific override first (higher priority)
      const dayOverride = dayOverrides.find(d => d.date === dateStr);
      
      // If explicitly marked unavailable, skip this day
      if (dayOverride && !dayOverride.is_available) continue;
      
      // If day override has specific time slots, use those
      if (dayOverride?.start_time && dayOverride?.end_time) {
        const startParts = dayOverride.start_time.split(':');
        const endParts = dayOverride.end_time.split(':');
        const startHours = parseInt(startParts[0], 10);
        const startMinutes = parseInt(startParts[1], 10);
        const endHours = parseInt(endParts[0], 10);
        const endMinutes = parseInt(endParts[1], 10);
        
        if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
          continue; // Skip invalid time format
        }
        const startTimeInMinutes = startHours * 60 + startMinutes;
        const endTimeInMinutes = endHours * 60 + endMinutes;
        
        // Validate time range
        if (endTimeInMinutes > startTimeInMinutes) {
          const slotTime = new Date(checkDate);
          slotTime.setHours(startHours, startMinutes, 0, 0);
          
          const startTimeStr = format12Hour(dayOverride.start_time);
          const endTimeStr = format12Hour(dayOverride.end_time);
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          if (i === 1) {
            return `Tomorrow ${startTimeStr} - ${endTimeStr}`;
          } else if (i <= 7) {
            return `${days[dayOfWeek]} ${startTimeStr} - ${endTimeStr}`;
          } else {
            // For dates more than a week away, show the actual date
            const month = checkDate.getMonth() + 1;
            const day = checkDate.getDate();
            return `${month}/${day} ${startTimeStr} - ${endTimeStr}`;
          }
        }
        continue; // Skip weekly slots if day override exists
      }
      
      // Fall back to weekly recurring schedule
      const daySlots = weeklySlots.filter(slot => slot.day_of_week === dayOfWeek && slot.is_available);
      if (daySlots.length === 0) continue;
      
      // Find earliest valid time slot
      for (const slot of daySlots) {
        // Validate time range
        if (!slot.start_time || !slot.end_time) continue;
        
        const startParts = slot.start_time.split(':');
        const endParts = slot.end_time.split(':');
        const startHours = parseInt(startParts[0], 10);
        const startMinutes = parseInt(startParts[1], 10);
        const endHours = parseInt(endParts[0], 10);
        const endMinutes = parseInt(endParts[1], 10);
        
        if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
          continue; // Skip invalid time format
        }
        const startTimeInMinutes = startHours * 60 + startMinutes;
        const endTimeInMinutes = endHours * 60 + endMinutes;
        
        // Skip invalid time ranges
        if (endTimeInMinutes <= startTimeInMinutes) continue;
        
        const slotTime = new Date(checkDate);
        slotTime.setHours(startHours, startMinutes, 0, 0);
        
        const startTimeStr = format12Hour(slot.start_time);
        const endTimeStr = format12Hour(slot.end_time);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        if (i === 1) {
          return `Tomorrow ${startTimeStr} - ${endTimeStr}`;
        } else if (i <= 7) {
          return `${days[dayOfWeek]} ${startTimeStr} - ${endTimeStr}`;
        } else {
          // For dates more than a week away, show the actual date
          const month = checkDate.getMonth() + 1;
          const day = checkDate.getDate();
          return `${month}/${day} ${startTimeStr} - ${endTimeStr}`;
        }
      }
    }
    
    return null;
  };

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        // Fetch tutors that the learner has had sessions with
        if (user) {
          console.log("🔍 Fetching booked tutors for learner:", user.id);
          const { data: sessionsData, error: sessionsError } = await supabase
            .from("sessions")
            .select("tutor_id, status, session_type")
            .eq("learner_id", user.id)
            .in("status", ["accepted", "completed"]);
          
          if (sessionsError) {
            console.error("❌ Error fetching booked tutors:", sessionsError);
          }
          
          if (sessionsData) {
            console.log("📊 Found sessions:", sessionsData);
            const uniqueTutorIds = new Set(sessionsData.map(s => s.tutor_id));
            console.log("✅ Booked tutor IDs:", Array.from(uniqueTutorIds));
            console.log("📈 Total unique tutors booked:", uniqueTutorIds.size);
            setBookedTutorIds(uniqueTutorIds);
          } else {
            console.log("⚠️ No sessions found");
          }
        }

        // First get tutor profiles - filter by truly online tutors (active within 30 seconds)
        const { data: tutorData, error: tutorError} = await supabase
          .from("tutor_profiles")
          .select("id, user_id, subject_expertise, bio, is_online, last_seen, registered_year")
          .eq("status", "approved");

        if (tutorError) throw tutorError;
        
        // Filter for actually online tutors (last_seen within 60 seconds to account for heartbeat timing)
        const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
        const tutorsWithActualStatus = tutorData?.map(tutor => ({
          ...tutor,
          is_online: tutor.is_online && tutor.last_seen && new Date(tutor.last_seen) > sixtySecondsAgo
        }));

        // Then get profiles for these users
        const userIds = tutorsWithActualStatus?.map((t) => t.user_id) || [];
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        if (profileError) throw profileError;

        // Fetch availability for all tutors
        const { data: weeklyAvailability } = await supabase
          .from("tutor_availability")
          .select("*")
          .in("tutor_id", userIds);

        const { data: dayAvailability } = await supabase
          .from("tutor_day_availability")
          .select("*")
          .in("tutor_id", userIds);

        // Check which tutors are currently in active sessions
        const now = new Date();
        const { data: activeSessions } = await supabase
          .from("sessions")
          .select("tutor_id, scheduled_at, duration_minutes, status")
          .in("tutor_id", userIds)
          .eq("status", "in_progress");

        // Create a set of tutor IDs that are currently in session
        const tutorsInSession = new Set(
          activeSessions?.map(session => session.tutor_id) || []
        );

        // Fetch ratings for each tutor
        const tutorsWithRatings = await Promise.all(
          tutorsWithActualStatus?.map(async (tutor) => {
            const { data: ratingData } = await supabase
              .rpc('get_tutor_rating', { tutor_user_id: tutor.user_id });
            const profile = profileData?.find((p) => p.user_id === tutor.user_id);
            
            // Calculate next available time
            const tutorWeeklySlots = weeklyAvailability?.filter(s => s.tutor_id === tutor.user_id) || [];
            const tutorDayOverrides = dayAvailability?.filter(d => d.tutor_id === tutor.user_id) || [];
            const nextAvailable = getNextAvailableTime(tutor.user_id, tutorWeeklySlots, tutorDayOverrides);
            
            return {
              ...tutor,
              is_in_session: tutorsInSession.has(tutor.user_id),
              rating: ratingData?.[0]?.average_rating || null,
              review_count: ratingData?.[0]?.total_reviews || null,
              next_available: nextAvailable,
              profiles: {
                full_name: profile?.full_name || "Unknown",
                avatar_url: profile?.avatar_url || null,
              },
            };
          }) || []
        );

        setTutors(tutorsWithRatings);
        setFilteredTutors(tutorsWithRatings);
      } catch (error: any) {
        toast({
          title: "Error loading tutors",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
    
    // Refetch every 10 seconds to catch timeout-based offline status
    const refetchInterval = setInterval(fetchTutors, 10000);

    // Set up real-time subscription for immediate tutor online status changes
    const profileChannel = supabase
      .channel('tutor_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tutor_profiles',
          filter: 'status=eq.approved'
        },
        (payload) => {
          const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
          const actuallyOnline = payload.new.is_online && 
            payload.new.last_seen && 
            new Date(payload.new.last_seen) > sixtySecondsAgo;
          
          setTutors((prevTutors) =>
            prevTutors.map((tutor) =>
              tutor.id === payload.new.id
                ? { ...tutor, is_online: actuallyOnline }
                : tutor
            )
          );
          setFilteredTutors((prevTutors) =>
            prevTutors.map((tutor) =>
              tutor.id === payload.new.id
                ? { ...tutor, is_online: actuallyOnline }
                : tutor
            )
          );
        }
      )
      .subscribe();

    // Set up real-time subscription for session status changes
    const sessionChannel = supabase
      .channel('sessions_status_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions'
        },
        (payload) => {
          const session = payload.new as any;
          const isInSession = session.session_status === 'in_progress';
          
          // Update tutor's in_session status
          setTutors((prevTutors) =>
            prevTutors.map((tutor) =>
              tutor.user_id === session.tutor_id
                ? { ...tutor, is_in_session: isInSession }
                : tutor
            )
          );
          setFilteredTutors((prevTutors) =>
            prevTutors.map((tutor) =>
              tutor.user_id === session.tutor_id
                ? { ...tutor, is_in_session: isInSession }
                : tutor
            )
          );
        }
      )
      .subscribe();

    return () => {
      clearInterval(refetchInterval);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [toast]);

  // Subscribe to session status changes for instant session acceptance
  useEffect(() => {
    if (!createdSessionId) return;

    const sessionChannel = supabase
      .channel(`instant-session-${createdSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${createdSessionId}`
        },
        (payload) => {
          const session = payload.new as any;
          if (session.status === 'accepted') {
            sonnerToast.success("Tutor accepted! Redirecting to session...");
            setIsWaitingModalOpen(false);
            // Redirect immediately
            navigate(`/video-session/${session.id}`);
          } else if (session.status === 'rejected') {
            sonnerToast.error("Tutor declined the session request");
            setIsWaitingModalOpen(false);
            setCreatedSessionId(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
    };
  }, [createdSessionId, navigate]);

  // Apply filters whenever tutors or filter criteria change
  useEffect(() => {
    let filtered = [...tutors];

    // Apply filters first
    // Online status filter
    if (onlineFilter === "online") {
      filtered = filtered.filter((tutor) => tutor.is_online);
    } else if (onlineFilter === "offline") {
      filtered = filtered.filter((tutor) => !tutor.is_online);
    }

    // Rating filter
    if (ratingFilter !== "all") {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter((tutor) => tutor.rating && tutor.rating >= minRating);
    }

    // Subject filter
    if (subjectFilters.length > 0) {
      filtered = filtered.filter((tutor) =>
        subjectFilters.some((subject) => (tutor.subject_expertise || []).includes(subject))
      );
    }

    // Year level filter
    if (yearLevelFilter !== "all") {
      filtered = filtered.filter((tutor) => tutor.registered_year === yearLevelFilter);
    }

    // Booked sessions filter
    if (showOnlyBooked) {
      filtered = filtered.filter((tutor) => bookedTutorIds.has(tutor.user_id));
    }

    // Fuzzy search with matchmaking
    if (searchQuery.trim()) {
      // Calculate match scores for each tutor
      const tutorsWithScores = filtered.map((tutor) => ({
        tutor,
        score: calculateMatchScore(tutor, searchQuery),
      }));
      
      // Filter out tutors with zero score and sort by score
      filtered = tutorsWithScores
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ tutor }) => tutor);
    }

    setFilteredTutors(filtered);
  }, [searchQuery, tutors, onlineFilter, ratingFilter, subjectFilters, yearLevelFilter, showOnlyBooked, bookedTutorIds]);

  // Reset to page 1 only when user changes filters (not when tutors update)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, onlineFilter, ratingFilter, subjectFilters, yearLevelFilter, showOnlyBooked]);

  const totalPages = Math.ceil(filteredTutors.length / itemsPerPage);
  
  // Safety check: if current page exceeds total pages, reset to last valid page
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  
  const paginatedTutors = filteredTutors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    return (
      <Pagination className="mb-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">
                  1
                </PaginationLink>
              </PaginationItem>
              {startPage > 2 && <PaginationEllipsis />}
            </>
          )}
          
          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => setCurrentPage(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink onClick={() => setCurrentPage(totalPages)} className="cursor-pointer">
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // Add error boundary
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading user...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <LearnerSidebar />
        
        <div className="flex-1 flex flex-col relative">
          <LoadingOverlay isLoading={loading} message="Loading tutors..." />
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
              <MaintenanceBanner />
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Find Tutors</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Browse and connect with approved tutors in various subjects
                </p>
              </div>

              <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, subject, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={onlineFilter} onValueChange={setOnlineFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="online">Online Only</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="2">2+ Stars</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={yearLevelFilter} onValueChange={setYearLevelFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Year Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="1st Year">1st Year</SelectItem>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                    <SelectItem value="4th Year">4th Year</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto gap-2">
                      <Filter className="h-4 w-4" />
                      Subjects
                      {subjectFilters.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {subjectFilters.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Filter by Subject</h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {allSubjects.map((subject) => (
                          <div key={subject} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-${subject}`}
                              checked={subjectFilters.includes(subject)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSubjectFilters([...subjectFilters, subject]);
                                } else {
                                  setSubjectFilters(subjectFilters.filter((s) => s !== subject));
                                }
                              }}
                            />
                            <Label htmlFor={`filter-${subject}`} className="text-sm cursor-pointer">
                              {subject}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {subjectFilters.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setSubjectFilters([])}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center space-x-2 px-1">
                <Checkbox
                  id="booked-filter"
                  checked={showOnlyBooked}
                  disabled={bookedTutorIds.size === 0}
                  onCheckedChange={(checked) => setShowOnlyBooked(checked as boolean)}
                />
                <Label htmlFor="booked-filter" className={`text-sm ${bookedTutorIds.size === 0 ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}>
                  Show only tutors I've booked before
                  {bookedTutorIds.size > 0 && (
                    <span className="text-muted-foreground ml-1">
                      ({bookedTutorIds.size})
                    </span>
                  )}
                </Label>
              </div>
            </div>

              {loading ? (
                <div className="grid gap-2 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                  ))}
                </div>
              ) : filteredTutors.length === 0 ? (
                <Card className="p-6 sm:p-12 text-center">
                  <UserCircle className="h-12 sm:h-16 w-12 sm:w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No tutors found</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search criteria"
                      : "No approved tutors available at the moment"}
                  </p>
                </Card>
              ) : (
                <>
                  <div className="grid gap-2 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedTutors.map((tutor) => (
                      <Card 
                        key={tutor.id} 
                        className="hover:shadow-xl hover:scale-[1.02] hover:border-primary/50 transition-all duration-300 cursor-pointer"
                        onClick={() => handleCardClick(tutor)}
                      >
                      <CardHeader className="pb-3 relative">
                        <div className="absolute right-2 top-2 flex gap-1 z-10">
                          <FavoriteButton tutorId={tutor.user_id} learnerId={user?.id} />
                          <button
                            className="p-1.5 rounded-md hover:bg-accent transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardClick(tutor);
                            }}
                          >
                            <Maximize2 className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                          <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
                            <AvatarImage src={tutor.profiles.avatar_url || ""} />
                            <AvatarFallback className="bg-blue-500 text-white">
                              {tutor.profiles.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 pr-8">
                            <CardTitle className="text-base sm:text-lg truncate">
                              {tutor.profiles.full_name}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {tutor.is_in_session ? (
                                <>
                                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                                    <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">In Session</span>
                                  </div>
                                </>
                              ) : tutor.is_online ? (
                                <>
                                  <Wifi className="h-3 w-3 text-green-500 flex-shrink-0" />
                                  <span className="text-xs text-green-500">Online</span>
                                </>
                              ) : (
                                <>
                                  <WifiOff className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                  <span className="text-xs text-muted-foreground">Offline</span>
                                </>
                              )}
                              {tutor.rating && tutor.rating > 0 && tutor.review_count && tutor.review_count > 0 && (
                                <div className="flex items-center gap-1 ml-0 sm:ml-2">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                  <span className="text-xs font-medium">{tutor.rating.toFixed(1)}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({tutor.review_count})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4 pt-0">
                        <div>
                          <h4 className="text-xs sm:text-sm font-semibold mb-2">Subject Expertise</h4>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {tutor.subject_expertise.slice(0, 3).map((subject) => (
                              <Badge key={subject} variant="secondary" className="text-xs">
                                {subject}
                              </Badge>
                            ))}
                            {tutor.subject_expertise.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{tutor.subject_expertise.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-semibold mb-2">Bio</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {tutor.bio}
                          </p>
                        </div>
                        {tutor.next_available && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">Next available: {tutor.next_available}</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-3">
                          <Button 
                            className="w-full text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookSession(tutor);
                            }}
                          >
                            Book Session
                          </Button>
                          <Button 
                            variant={tutor.is_online && !tutor.is_in_session ? "default" : "outline"}
                            className="w-full relative pr-8 text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInstantSession(tutor);
                            }}
                            disabled={!tutor.is_online || tutor.is_in_session}
                          >
                            <Zap className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">
                              {tutor.is_in_session ? "In Session" : tutor.is_online ? "Start Instant Session" : "Instant"}
                            </span>
                            {tutor.is_online && !tutor.is_in_session && (
                              <span className="absolute top-1/2 -translate-y-1/2 right-2 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </span>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    ))}
                  </div>
                  
                  {renderPagination()}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {selectedTutor && (
        <>
          <TutorDetailDialog
            open={isDetailDialogOpen}
            onOpenChange={setIsDetailDialogOpen}
            tutor={selectedTutor}
            onBookSession={() => handleBookSession(selectedTutor)}
            onInstantSession={() => handleInstantSession(selectedTutor)}
          />
          <BookSessionDialog
            open={isBookingDialogOpen}
            onOpenChange={setIsBookingDialogOpen}
            tutorId={selectedTutor.user_id}
            tutorName={selectedTutor.profiles.full_name}
            tutorSubjects={selectedTutor.subject_expertise}
          />
          <InstantSessionDialog
            open={isInstantDialogOpen}
            onOpenChange={setIsInstantDialogOpen}
            tutorId={selectedTutor.user_id}
            tutorName={selectedTutor.profiles.full_name}
            tutorSubjects={selectedTutor.subject_expertise}
            onSessionCreated={(sessionId) => {
              setCreatedSessionId(sessionId);
              setIsWaitingModalOpen(true);
            }}
          />
          <InstantSessionWaitingModal
            open={isWaitingModalOpen}
            onOpenChange={setIsWaitingModalOpen}
            sessionId={createdSessionId}
            tutorName={selectedTutor.profiles.full_name}
          />
        </>
      )}
    </SidebarProvider>
  );
};

// Favorite Button Component
interface FavoriteButtonProps {
  tutorId: string;
  learnerId: string | undefined;
}

function FavoriteButton({ tutorId, learnerId }: FavoriteButtonProps) {
  const { isFavorited, setIsFavorited, toggleFavorite, isLoading } = useFavoriteTutor(tutorId, learnerId);

  // Check if already favorited on mount
  useEffect(() => {
    const checkFavorite = async () => {
      if (!learnerId) return;
      try {
        const { data, error } = await supabase
          .from('favorite_tutors')
          .select('id')
          .eq('learner_id', learnerId)
          .eq('tutor_id', tutorId)
          .maybeSingle();
        
        if (!error) {
          setIsFavorited(!!data);
        }
      } catch (error) {
        // Silently fail if table doesn't exist yet
        console.log('Favorite check failed:', error);
      }
    };
    checkFavorite();
  }, [tutorId, learnerId, setIsFavorited]);

  return (
    <button
      className="p-1.5 rounded-md hover:bg-accent transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite();
      }}
      disabled={isLoading}
    >
      <Heart
        className={`h-4 w-4 transition-colors ${
          isFavorited
            ? "fill-red-500 text-red-500"
            : "text-muted-foreground hover:text-red-500"
        }`}
      />
    </button>
  );
}

export default FindTutors;
