import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { useQuery } from "@tanstack/react-query";
import { User, BookOpen, Star, Search, Maximize2, Mail, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { useState, useEffect } from "react";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export default function TutorTutees() {
  const { user } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTutee, setSelectedTutee] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [initialLoad, setInitialLoad] = useState(true);
  const [yearLevelFilter, setYearLevelFilter] = useState<string>("all");


  const { data: tutees = [], isLoading, isFetching, isSuccess } = useQuery({
    queryKey: ["tutees", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get unique learners from completed sessions
      const { data: sessions, error } = await supabase
        .from("sessions")
        .select("learner_id, subject")
        .eq("tutor_id", user.id)
        .eq("status", "completed");
      
      if (error) throw error;

      const learnerIds = [...new Set(sessions?.map(s => s.learner_id))];
      
      // Get learner profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", learnerIds);

      // Get learner year levels
      const { data: learnerProfiles } = await supabase
        .from("learner_profiles")
        .select("user_id, registered_year")
        .in("user_id", learnerIds);

      // Calculate stats for each learner
      const tuteesWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const learnerSessions = sessions?.filter(s => s.learner_id === profile.user_id) || [];
          const sessionCount = learnerSessions.length;
          const subjects = [...new Set(learnerSessions.map(s => s.subject))];
          const learnerProfile = learnerProfiles?.find(lp => lp.user_id === profile.user_id);

          // Get average rating from this learner
          const { data: feedbackData } = await supabase
            .from("feedback")
            .select("rating")
            .in("session_id", 
              learnerSessions.map(s => sessions.find(ss => ss.learner_id === profile.user_id)?.learner_id)
            );

          const avgRating = feedbackData?.length 
            ? (feedbackData.reduce((acc, f) => acc + (f.rating || 0), 0) / feedbackData.length).toFixed(1)
            : null;

          return {
            ...profile,
            sessionCount,
            subjects,
            avgRating,
            registered_year: learnerProfile?.registered_year,
          };
        })
      );

      return tuteesWithStats;
    },
    enabled: !!user,
  });

  // Filter tutees by search query and year level
  const filteredTutees = tutees.filter((tutee: any) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        tutee.full_name?.toLowerCase().includes(query) ||
        tutee.subjects?.some((s: string) => s.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    // Year level filter
    if (yearLevelFilter !== "all") {
      if (tutee.registered_year !== yearLevelFilter) return false;
    }
    
    return true;
  });

  const totalPages = Math.ceil(filteredTutees.length / itemsPerPage);
  const paginatedTutees = filteredTutees.slice(
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
      <Pagination className="mt-6 mb-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          <PaginationItem className="hidden sm:block">
            {startPage > 1 && (
              <>
                <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">
                  1
                </PaginationLink>
              </>
            )}
          </PaginationItem>
          {startPage > 2 && <PaginationEllipsis className="hidden sm:flex" />}
          
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
          
          {endPage < totalPages - 1 && <PaginationEllipsis className="hidden sm:flex" />}
          <PaginationItem className="hidden sm:block">
            {endPage < totalPages && (
              <>
                <PaginationLink onClick={() => setCurrentPage(totalPages)} className="cursor-pointer">
                  {totalPages}
                </PaginationLink>
              </>
            )}
          </PaginationItem>
          
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

  // Clear initial load state once query is successful
  useEffect(() => {
    if (isSuccess) {
      setInitialLoad(false);
    }
  }, [isSuccess]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <TutorSidebar />
        <div className="flex-1 flex flex-col relative">
          <LoadingOverlay isLoading={initialLoad || isLoading || isFetching} message="Loading learners..." />
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
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">My Learners</h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  View and manage your learners
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search learners by name or subject..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                
                <Select value={yearLevelFilter} onValueChange={(value) => {
                  setYearLevelFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-full sm:w-[160px]">
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
              </div>

              {tutees.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No learners yet. Complete some sessions to see your learners here.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedTutees.map((tutee) => (
                    <Card 
                      key={tutee.user_id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors relative group"
                      onClick={() => setSelectedTutee(tutee)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={tutee.avatar_url} alt={tutee.full_name} />
                              <AvatarFallback className="bg-green-500 text-white">
                                {tutee.full_name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-base break-words">{tutee.full_name}</CardTitle>
                          </div>
                          <Maximize2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-4 w-4" />
                          <span>{tutee.sessionCount} sessions completed</span>
                        </div>
                        {tutee.avgRating && (
                          <div className="flex items-center gap-2 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>Rated you {tutee.avgRating}/5</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {tutee.subjects.slice(0, 2).map((subject) => (
                            <Badge key={subject} variant="secondary" className="text-xs break-words">
                              {subject}
                            </Badge>
                          ))}
                          {tutee.subjects.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{tutee.subjects.length - 2} other{tutee.subjects.length - 2 !== 1 ? 's' : ''}
                            </Badge>
                          )}
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

      {/* Learner Details Modal */}
      <Dialog open={!!selectedTutee} onOpenChange={() => setSelectedTutee(null)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto w-[calc(100%-2rem)] rounded-2xl">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="flex items-center justify-center gap-2 text-base break-words">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="break-words">{selectedTutee?.full_name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Learner Information
            </DialogDescription>
          </DialogHeader>
          
          {selectedTutee && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedTutee.avatar_url} alt={selectedTutee.full_name} />
                  <AvatarFallback className="text-lg bg-green-500 text-white">
                    {selectedTutee.full_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-base font-semibold">{selectedTutee.full_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedTutee.registered_year ? `${selectedTutee.registered_year} • Learner` : 'Learner'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">Total Sessions</p>
                    <p className="text-lg font-bold">{selectedTutee.sessionCount}</p>
                  </div>
                </div>

                {selectedTutee.avgRating && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium">Avg Rating</p>
                      <p className="text-lg font-bold">{selectedTutee.avgRating}/5</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Subjects Studied</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedTutee.subjects.map((subject: string) => (
                    <Badge key={subject} variant="secondary" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  You have completed {selectedTutee.sessionCount} tutoring session{selectedTutee.sessionCount !== 1 ? 's' : ''} with this learner.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
