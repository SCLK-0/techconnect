import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Megaphone, Trash2, Maximize2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { format } from "date-fns";
import { z } from "zod";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";

const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  content: z.string().trim().min(1, "Content is required").max(2000, "Content must be less than 2000 characters"),
});

export default function AdminAnnouncements() {
  useAdminSession();
  const { user } = useUserRole();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const queryClient = useQueryClient();

  const { data: announcements = [], isLoading, isFetching } = useQuery({
    queryKey: ["all-announcements"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .or(`expires_at.is.null,expires_at.gte.${now}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("announcements").insert({
        title,
        content,
        created_by: user.id,
        expires_at: null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Announcement created!");
      setTitle("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["all-announcements"] });
    },
    onError: (error) => {
      toast.error("Failed to create: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Announcement deleted");
      queryClient.invalidateQueries({ queryKey: ["all-announcements"] });
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = announcementSchema.safeParse({ title, content });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    
    createMutation.mutate();
  };

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
        <AdminSidebar />
        <div className="flex-1 flex flex-col relative">
          <LoadingOverlay isLoading={isLoading || isFetching} message="Loading announcements..." />
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
              <Card>
                <CardHeader>
                  <CardTitle>Create Announcement</CardTitle>
                  <CardDescription>Post updates or events for all users</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value.slice(0, 200))}
                        placeholder="Announcement title"
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {title.length}/200 characters
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value.slice(0, 2000))}
                        placeholder="Announcement details"
                        rows={4}
                        maxLength={2000}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {content.length}/2000 characters • Use **text** for bold
                      </p>
                    </div>
                    <Button type="submit" disabled={createMutation.isPending}>
                      <Megaphone className="w-4 h-4 mr-2" />
                      Create Announcement
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">All Announcements</h2>
                {paginatedAnnouncements.map((announcement) => (
                  <Card 
                    key={announcement.id} 
                    className="cursor-pointer hover:bg-accent/50 transition-colors relative group w-full overflow-hidden"
                    onClick={() => setSelectedAnnouncement(announcement)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <CardTitle className="break-words">{announcement.title}</CardTitle>
                          <CardDescription className="break-words">
                            Posted on {format(new Date(announcement.created_at), "PPP")}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Maximize2 className="w-4 h-4 text-muted-foreground" />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMutation.mutate(announcement.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p 
                        className="whitespace-pre-wrap line-clamp-3 break-words overflow-wrap-anywhere"
                        dangerouslySetInnerHTML={{ 
                          __html: (announcement.content || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                        }}
                      />
                    </CardContent>
                  </Card>
                ))}
                
                {renderPagination()}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Announcement Details Modal */}
      <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
        <DialogContent className="sm:max-w-2xl w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="break-words">{selectedAnnouncement?.title}</DialogTitle>
            <DialogDescription className="break-words">
              Posted on {selectedAnnouncement && format(new Date(selectedAnnouncement.created_at), "PPPP")}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p 
              className="whitespace-pre-wrap text-sm break-words overflow-wrap-anywhere"
              dangerouslySetInnerHTML={{ 
                __html: (selectedAnnouncement?.content || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
