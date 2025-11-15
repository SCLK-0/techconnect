import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle, User as UserIcon, Mail, BookOpen, UserCheck } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";

export default function AdminApprovals() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: pendingTutors = [], isLoading, error } = useQuery({
    queryKey: ["pending-tutors"],
    queryFn: async () => {
      console.log("Fetching pending tutors...");
      
      // Fetch tutor profiles
      const { data: tutorProfiles, error: tutorError } = await supabase
        .from("tutor_profiles")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (tutorError) {
        console.error("Error fetching tutor profiles:", tutorError);
        toast.error(`Failed to load applications: ${tutorError.message}`);
        throw tutorError;
      }

      // Fetch profiles for these tutors
      const userIds = tutorProfiles?.map(t => t.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("full_name, user_id")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        // Don't throw, just continue without profile data
      }

      // Merge tutor profiles with profile data
      const tutorsWithProfiles = tutorProfiles?.map(tutor => ({
        ...tutor,
        profiles: profiles?.find(p => p.user_id === tutor.user_id) || { full_name: "Unknown", user_id: tutor.user_id }
      })) || [];

      console.log("Fetched pending tutors:", tutorsWithProfiles);
      return tutorsWithProfiles;
    },
  });

  // Show error toast if query fails
  if (error) {
    console.error("Query error:", error);
  }

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("tutor_profiles")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Tutor ${variables.status === "approved" ? "approved" : "rejected"}`);
      queryClient.invalidateQueries({ queryKey: ["pending-tutors"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const totalPages = Math.ceil(pendingTutors.length / itemsPerPage);
  const paginatedTutors = pendingTutors.slice(
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
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-between px-4 sm:px-6 bg-card">
            <div className="flex items-center gap-2 sm:gap-4">
              <SidebarTrigger />
              <h1 className="text-lg sm:text-xl font-semibold">Tutor Approvals</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 overflow-auto">
            <div className="space-y-6 max-w-[calc(100%-3rem)]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Pending Applications</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Review and approve tutor applications</p>
                </div>
                <Badge variant="secondary" className="text-sm sm:text-base px-3 py-1 sm:px-4 sm:py-2">
                  {pendingTutors.length} Pending
                </Badge>
              </div>

              {isLoading ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    Loading applications...
                  </CardContent>
                </Card>
              ) : pendingTutors.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">No pending tutor applications</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4">
                    {paginatedTutors.map((tutor: any) => (
                    <Card key={tutor.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                              <UserIcon className="h-5 w-5" />
                              {tutor.profiles?.full_name || "Unknown"}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {tutor.profiles?.user_id?.substring(0, 8)}...
                              </span>
                            </CardDescription>
                          </div>
                          <Badge>Pending Review</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            Subject Expertise
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {tutor.subject_expertise?.map((subject: string) => (
                              <Badge key={subject} variant="secondary">
                                {subject}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Bio</h4>
                          <p className="text-sm text-muted-foreground">{tutor.bio}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-4">
                          <Button
                            className="flex-1"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: tutor.id, status: "approved" })
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: tutor.id, status: "rejected" })
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
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
    </SidebarProvider>
  );
}
