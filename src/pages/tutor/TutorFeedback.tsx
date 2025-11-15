import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Star, MessageSquare, Calendar, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";

interface FeedbackWithDetails {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  session: {
    subject: string;
    scheduled_at: string;
    learner: {
      full_name: string;
      avatar_url: string;
    };
  };
}

export default function TutorFeedback() {
  const { user } = useUserRole();
  const [feedback, setFeedback] = useState<FeedbackWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

    const feedbackWithDetails = feedbackData.map(fb => {
      const session = sessions.find(s => s.id === fb.session_id);
      const profile = profiles?.find(p => p.user_id === session?.learner_id);
      
      return {
        id: fb.id,
        rating: fb.rating || 0,
        comment: fb.comment || "",
        created_at: fb.created_at,
        session: {
          subject: session?.subject || "",
          scheduled_at: session?.scheduled_at || "",
          learner: {
            full_name: profile?.full_name || "Unknown",
            avatar_url: profile?.avatar_url || "",
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
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  // Filter feedback by search query
  const filteredFeedback = feedback.filter((fb) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      fb.session?.learner?.full_name?.toLowerCase().includes(query) ||
      fb.session?.subject?.toLowerCase().includes(query) ||
      fb.comment?.toLowerCase().includes(query)
    );
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
      <Pagination className="mt-6">
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
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-center px-3 py-4">
            <div className="w-full max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <UserMenu />
              </div>
            </div>
          </header>

          <main className="flex-1 px-3 py-6 overflow-auto flex justify-center">
            <div className="space-y-6 w-full max-w-5xl">
              {/* Search Bar */}
              {!loading && feedback.length > 0 && (
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search feedback by student, subject, or comment..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
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
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedFeedback.map((fb) => (
                      <Card key={fb.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={fb.session.learner.avatar_url} />
                              <AvatarFallback>
                                {fb.session.learner.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm truncate">
                                {fb.session.learner.full_name}
                              </CardTitle>
                              <div className="flex items-center gap-1 mt-1">
                                {renderStars(fb.rating)}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2">
                            <Badge variant="secondary" className="text-xs">
                              {fb.session.subject}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(fb.session.scheduled_at).toLocaleDateString()}
                            </div>
                          </div>
                          {fb.comment && (
                            <div className="pt-2 border-t">
                              <div className="flex gap-2 items-start">
                                <MessageSquare className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-muted-foreground line-clamp-3">
                                  {fb.comment}
                                </p>
                              </div>
                            </div>
                          )}
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
    </SidebarProvider>
  );
}
