import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LearnerSidebar } from "@/components/learner/LearnerSidebar";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Megaphone, Maximize2 } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";
import React, { useState } from "react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export default function Announcements() {
  const { role, loading } = useUserRole();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const itemsPerPage = 5;
  const [initialLoad, setInitialLoad] = useState(true);
  
  const { data: announcements = [], refetch, isSuccess, isLoading, isFetching } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .or(`expires_at.is.null,expires_at.gte.${now}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      const userIds = [...new Set(data.map(a => a.created_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      return data.map(a => ({ ...a, creator_name: profileMap.get(a.created_by) }));
    },
  });

  // Clear initial load state once query is successful
  React.useEffect(() => {
    if (isSuccess) {
      setInitialLoad(false);
    }
  }, [isSuccess]);

  // Add realtime subscription
  React.useEffect(() => {
    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const totalPages = Math.ceil(announcements.length / itemsPerPage);
  const paginatedAnnouncements = announcements.slice(
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

  // Determine which sidebar to use based on role (uses cached role for instant loading)
  const SidebarComponent = role === "admin" ? AdminSidebar : role === "tutor" ? TutorSidebar : LearnerSidebar;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SidebarComponent />
        <div className="flex-1 flex flex-col relative">
          <LoadingOverlay isLoading={initialLoad || isLoading || isFetching} message="Loading announcements..." />
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
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Announcements</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Stay updated with the latest news
                </p>
              </div>

              <div className="space-y-4 pl-4 md:pl-0">
              {announcements.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No announcements at this time
                  </CardContent>
                </Card>
              ) : (
                <>
                  {paginatedAnnouncements.map((announcement) => (
                    <Card 
                      key={announcement.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors w-full max-w-full overflow-hidden"
                      onClick={() => setSelectedAnnouncement(announcement)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="flex items-center gap-2 break-words">
                              <Megaphone className="w-5 h-5 flex-shrink-0" />
                              <span className="break-words">{announcement.title}</span>
                            </CardTitle>
                            <CardDescription className="break-words">
                              Posted by {announcement.creator_name || "Admin"} on{" "}
                              {format(new Date(announcement.created_at), "PPP")}
                            </CardDescription>
                          </div>
                          <Maximize2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap line-clamp-3 break-words overflow-wrap-anywhere">{announcement.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {renderPagination()}
                </>
              )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Announcement Details Modal */}
      <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
        <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto rounded-lg">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-base break-words">
              <Megaphone className="w-4 h-4 flex-shrink-0" />
              <span className="break-words">{selectedAnnouncement?.title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs break-words">
              Posted by {selectedAnnouncement?.creator_name || "Admin"} on{" "}
              {selectedAnnouncement && format(new Date(selectedAnnouncement.created_at), "PPP")}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3">
            <p className="whitespace-pre-wrap text-sm break-words overflow-wrap-anywhere">{selectedAnnouncement?.content}</p>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
