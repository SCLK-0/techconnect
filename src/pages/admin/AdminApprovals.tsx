import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle, XCircle, User as UserIcon, Mail, BookOpen, UserCheck, RotateCcw } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";

export default function AdminApprovals() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pending" | "declined">("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchTutorsByStatus = async (status: string) => {
    const { data: tutorProfiles, error: tutorError } = await supabase
      .from("tutor_profiles")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (tutorError) {
      console.error(`Error fetching ${status} tutors:`, tutorError);
      toast.error(`Failed to load applications: ${tutorError.message}`);
      throw tutorError;
    }

    const userIds = tutorProfiles?.map(t => t.user_id) || [];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("full_name, user_id")
      .in("user_id", userIds);

    return tutorProfiles?.map(tutor => ({
      ...tutor,
      profiles: profiles?.find(p => p.user_id === tutor.user_id) || { full_name: "Unknown", user_id: tutor.user_id }
    })) || [];
  };

  const { data: pendingTutors = [], isLoading, isFetching, error } = useQuery({
    queryKey: ["pending-tutors"],
    queryFn: () => fetchTutorsByStatus("pending"),
  });

  const { data: declinedTutors = [], isLoading: isLoadingDeclined } = useQuery({
    queryKey: ["declined-tutors"],
    queryFn: () => fetchTutorsByStatus("declined"),
    enabled: activeTab === "declined",
  });

  // Show error toast if query fails
  if (error) {
    console.error("Query error:", error);
  }

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // Update tutor status
      const { error } = await supabase
        .from("tutor_profiles")
        .update({ status })
        .eq("id", id);
      if (error) throw error;

      // TODO: Add email notification for tutor approval/declination
      // Currently disabled due to RLS permission issues
      // Will be fixed in a future update
    },
    onSuccess: (_, variables) => {
      toast.success(`Tutor ${variables.status === "approved" ? "approved" : "declined"}`);
      queryClient.invalidateQueries({ queryKey: ["pending-tutors"] });
      queryClient.invalidateQueries({ queryKey: ["declined-tutors"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const currentTutors = activeTab === "pending" ? pendingTutors : declinedTutors;
  const totalPages = Math.ceil(currentTutors.length / itemsPerPage);
  const paginatedTutors = currentTutors.slice(
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
          <LoadingOverlay isLoading={isLoading || isFetching} message="Loading approvals..." />
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
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Tutor Applications</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Review and manage tutor applications</p>
              </div>

              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "pending" | "declined"); setCurrentPage(1); }}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="pending" className="gap-2">
                    Pending
                    {pendingTutors.length > 0 && (
                      <Badge variant="secondary" className="ml-1">{pendingTutors.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="declined" className="gap-2">
                    Declined
                    {declinedTutors.length > 0 && (
                      <Badge variant="secondary" className="ml-1">{declinedTutors.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4 mt-6">

              {isLoading ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    Loading applications...
                  </CardContent>
                </Card>
              ) : currentTutors.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">
                      {activeTab === "pending" ? "No pending tutor applications" : "No declined tutors"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-2">
                    {paginatedTutors.map((tutor: any) => (
                    <Card key={tutor.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                              <UserIcon className="h-5 w-5" />
                              {tutor.profiles?.full_name || "Unknown"}
                              {tutor.registered_year && <span className="text-sm font-normal text-muted-foreground">({tutor.registered_year})</span>}
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
                          {activeTab === "pending" ? (
                            <>
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
                                  updateStatusMutation.mutate({ id: tutor.id, status: "declined" })
                                }
                                disabled={updateStatusMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Decline
                              </Button>
                            </>
                          ) : (
                            <Button
                              className="w-full"
                              onClick={() =>
                                updateStatusMutation.mutate({ id: tutor.id, status: "approved" })
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Re-approve Tutor
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  </div>
                  
                  {renderPagination()}
                </>
              )}
                </TabsContent>

                <TabsContent value="declined" className="space-y-4 mt-6">
                  {isLoadingDeclined ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        Loading declined tutors...
                      </CardContent>
                    </Card>
                  ) : declinedTutors.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No declined tutors</h3>
                        <p className="text-muted-foreground">All tutor applications have been approved or are pending</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="grid gap-2">
                        {paginatedTutors.map((tutor: any) => (
                          <Card key={tutor.id} className="border-red-200">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <CardTitle className="flex items-center gap-2">
                                    <UserIcon className="h-5 w-5" />
                                    {tutor.profiles?.full_name || "Unknown"}
                                    {tutor.registered_year && <span className="text-sm font-normal text-muted-foreground">({tutor.registered_year})</span>}
                                  </CardTitle>
                                  <CardDescription className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {tutor.profiles?.user_id?.substring(0, 8)}...
                                    </span>
                                  </CardDescription>
                                </div>
                                <Badge variant="destructive">Declined</Badge>
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
                                  className="w-full"
                                  onClick={() =>
                                    updateStatusMutation.mutate({ id: tutor.id, status: "approved" })
                                  }
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Re-approve Tutor
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {renderPagination()}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
