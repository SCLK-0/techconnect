import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { Star, MessageSquare, Calendar, Search, Maximize2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { LoadingOverlay } from "@/components/LoadingOverlay";

interface FeedbackWithDetails {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  session: {
    subject: string;
    scheduled_at: string;
    subjects: string[];
    learner: {
      full_name: string;
      avatar_url: string;
      registered_year?: string;
    };
  };
}

export default function TutorFeedback() {
  const { user } = useUserRole();
  const [feedback, setFeedback] = useState<FeedbackWithDetails[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [yearLevelFilter, setYearLevelFilter] = useState<string>("all");

  useEffect(() => {
    if (user) {
      loadFeedback();
    }
  }, [user]);

  const loadFeedback = async () => {
    if (!user) return;

    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select("id, subject, scheduled_at, learner_id")
      .eq("tutor_id", user.id)
      .eq("status", "completed");

    if (sessionsError || !sessions) {
      setLoading(false);
      return;
    }

    const sessionIds = sessions.map(s => s.id);
    const { data: feedbackData, error: feedbackError } = await supabase
      .from("feedback")
      .select("*")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: false });

    if (feedbackError || !feedbackData) {
      setLoading(false);
      return;
    }

    // Get learner profiles
    const learnerIds = [...new Set(sessions.map(s => s.learner_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", learnerIds);

    // Get learner year levels
    const { data: learnerProfiles } = await supabase
      .from("learner_profiles")
      .select("user_id, registered_year")
      .in("user_id", learnerIds);

    // Get all subjects for each learner
    const learnerSubjects = new Map<string, string[]>();
    sessions.forEach(session => {
      const subjects = learnerSubjects.get(session.learner_id) || [];
      if (!subjects.includes(session.subject)) {
        subjects.push(session.subject);
      }
      learnerSubjects.set(session.learner_id, subjects);
    });

    const feedbackWithDetails = feedbackData.map(fb => {
      const session = sessions.find(s => s.id === fb.session_id);
      const profile = profiles?.find(p => p.user_id === session?.learner_id);
      const learnerProfile = learnerProfiles?.find(lp => lp.user_id === session?.learner_id);
      const subjects = learnerSubjects.get(session?.learner_id || '') || [];
      
      return {
        id: fb.id,
        rating: fb.rating || 0,
        comment: fb.comment || "",
        created_at: fb.created_at,
        session: {
          subject: session?.subject || "",
          scheduled_at: session?.scheduled_at || "",
          subjects: subjects,
          learner: {
            full_name: profile?.full_name || "Unknown",
            avatar_url: profile?.avatar_url || "",
            registered_year: learnerProfile?.registered_year,
          },
        },
      };
    });

    setFeedback(feedbackWithDetails);
    setLoading(false);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            }`}
            strokeWidth={2}
          />
        ))}
      </div>
    );
  };

  // Filter feedback by search query and year level
  const filteredFeedback = feedback.filter((fb) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        fb.session?.learner?.full_name?.toLowerCase().includes(query) ||
        fb.session?.subject?.toLowerCase().includes(query) ||
        fb.comment?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // Year level filter
    if (yearLevelFilter !== "all") {
      if (fb.session?.learner?.registered_year !== yearLevelFilter) return false;
    }
    
    return true;
  });

  const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage);
  const paginatedFeedback = filteredFeedback.slice(
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <TutorSidebar />
        <div className="flex-1 flex flex-col relative">
          <LoadingOverlay isLoading={loading} message="Loading feedback..." />
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

          <main className="flex-1 px-4 pt-8 pb-12 overflow-auto flex justify-center overflow-x-hidden">
            <div className="space-y-6 w-full max-w-sm md:max-w-5xl">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Learner Feedback</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  View ratings and comments from your learners
                </p>
              </div>

              {/* Search Bar and Filters */}
              {!loading && feedback.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search feedback by learner, subject, or comment..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10 w-full"
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
              )}

              {loading ? (
                <p className="text-center text-muted-foreground">Loading feedback...</p>
              ) : feedback.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      No feedback yet. Complete some sessions to receive feedback!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
                    {paginatedFeedback.map((fb) => (
                      <Card 
                        key={fb.id} 
                        className="cursor-pointer hover:bg-accent/50 transition-colors relative group w-full max-w-full overflow-hidden"
                        onClick={() => setSelectedFeedback(fb)}
                      >
                        <CardHeader className="pb-2 pt-3 px-3">
                          <div className="flex items-start justify-between w-full gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Avatar className="h-9 w-9 flex-shrink-0">
                                <AvatarImage src={fb.session.learner.avatar_url} />
                                <AvatarFallback className="bg-green-500 text-white text-sm">
                                  {fb.session.learner.full_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <CardTitle className="text-sm truncate break-words">
                                  {fb.session.learner.full_name}
                                </CardTitle>
                                <div className="flex items-center gap-0.5 mt-1">
                                  {renderStars(fb.rating)}
                                </div>
                              </div>
                            </div>
                            <Maximize2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-2 px-3 pb-3">
                          <div className="space-y-1.5 w-full overflow-hidden">
                            <div className="flex flex-wrap gap-1">
                              {fb.session.subjects.slice(0, 2).map((subject) => (
                                <Badge key={subject} variant="secondary" className="text-xs truncate max-w-[120px]">
                                  {subject}
                                </Badge>
                              ))}
                              {fb.session.subjects.length > 2 && (
                                <Badge variant="secondary" className="text-xs flex-shrink-0">
                                  +{fb.session.subjects.length - 2}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{new Date(fb.session.scheduled_at).toLocaleDateString()}</span>
                            </div>
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

      {/* Feedback Details Modal */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="flex items-center justify-center gap-2 text-base break-words">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
              <span className="break-words">Feedback from {selectedFeedback?.session.learner.full_name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs break-words">
              Session on {selectedFeedback && new Date(selectedFeedback.session.scheduled_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={selectedFeedback.session.learner.avatar_url} />
                  <AvatarFallback className="text-lg bg-green-500 text-white">
                    {selectedFeedback.session.learner.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold break-words">{selectedFeedback.session.learner.full_name}</h3>
                  {selectedFeedback.session.learner.registered_year && (
                    <p className="text-xs text-muted-foreground">{selectedFeedback.session.learner.registered_year}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(selectedFeedback.rating)}
                    <span className="text-xs text-muted-foreground">
                      ({selectedFeedback.rating}/5)
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Subjects</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedFeedback.session.subjects.map((subject: string) => (
                    <Badge key={subject} variant="secondary" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedFeedback.comment && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    Comment
                  </h4>
                  <div className="bg-muted p-3 rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-xs whitespace-pre-wrap break-words overflow-wrap-anywhere">{selectedFeedback.comment}</p>
                  </div>
                </div>
              )}

              {!selectedFeedback.comment && (
                <div className="text-center py-3 text-muted-foreground text-xs">
                  No comment provided
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
