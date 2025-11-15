import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { useQuery } from "@tanstack/react-query";
import { User, BookOpen, Star, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { useState } from "react";

export default function TutorTutees() {
  const { user } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { data: tutees = [] } = useQuery({
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

      // Calculate stats for each learner
      const tuteesWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          const learnerSessions = sessions?.filter(s => s.learner_id === profile.user_id) || [];
          const sessionCount = learnerSessions.length;
          const subjects = [...new Set(learnerSessions.map(s => s.subject))];

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
          };
        })
      );

      return tuteesWithStats;
    },
    enabled: !!user,
  });

  // Filter tutees by search query
  const filteredTutees = tutees.filter((tutee: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tutee.full_name?.toLowerCase().includes(query) ||
      tutee.subjects?.some((s: string) => s.toLowerCase().includes(query))
    );
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
          <header className="h-14 border-b flex items-center justify-center px-4">
            <div className="w-full max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold">My Tutees</h1>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <UserMenu />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 overflow-auto flex justify-center">
            <div className="space-y-4 w-full max-w-7xl">
              {/* Search Bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tutees by name or subject..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              {tutees.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No tutees yet. Complete some sessions to see your students here.
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedTutees.map((tutee) => (
                    <Card key={tutee.user_id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {tutee.full_name}
                        </CardTitle>
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
                          {tutee.subjects.map((subject) => (
                            <Badge key={subject} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
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
    </SidebarProvider>
  );
}
