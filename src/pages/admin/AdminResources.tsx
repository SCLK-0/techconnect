import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle, FileText, Download, ExternalLink, FileCheck } from "lucide-react";
import { format } from "date-fns";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";

export default function AdminResources() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    const channel = supabase
      .channel('resources-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resources'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pending-resources"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: pendingResources = [], isLoading } = useQuery({
    queryKey: ["pending-resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("resources")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Resource ${variables.status === "approved" ? "approved" : "rejected"}`);
      queryClient.invalidateQueries({ queryKey: ["pending-resources"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
    },
  });

  const totalPages = Math.ceil(pendingResources.length / itemsPerPage);
  const paginatedResources = pendingResources.slice(
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
              <h1 className="text-lg sm:text-xl font-semibold">Resource Approval</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 overflow-auto">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Pending Resources</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Review and approve tutor resources</p>
                </div>
                <Badge variant="secondary" className="text-sm sm:text-base px-3 py-1 sm:px-4 sm:py-2">
                  {pendingResources.length} Pending
                </Badge>
              </div>

              {isLoading ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    Loading resources...
                  </CardContent>
                </Card>
              ) : pendingResources.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                    <p className="text-muted-foreground">No pending resources to review</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4">
                    {paginatedResources.map((resource: any) => (
                    <Card key={resource.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              {resource.title}
                            </CardTitle>
                            <CardDescription>
                              Uploaded {format(new Date(resource.created_at), "MMM dd, yyyy")}
                            </CardDescription>
                          </div>
                          <Badge>Pending Review</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-1">Description</h4>
                          <p className="text-sm text-muted-foreground">
                            {resource.description || "No description provided"}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {resource.file_type || "File"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            {resource.download_count || 0} downloads
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="sm:flex-none"
                            onClick={() => window.open(resource.file_url, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <div className="hidden sm:block flex-1" />
                          <Button
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: resource.id, status: "approved" })
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1 sm:flex-none"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: resource.id, status: "rejected" })
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
