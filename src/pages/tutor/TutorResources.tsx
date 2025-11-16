import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileText, Check, Clock, X, Expand, Download, Calendar, Trash2, Maximize2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { LoadingOverlay } from "@/components/LoadingOverlay";

export default function TutorResources() {
  const { user } = useUserRole();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const queryClient = useQueryClient();
  const [initialLoad, setInitialLoad] = useState(true);


  const { data: resources = [], isLoading, isFetching, isSuccess } = useQuery({
    queryKey: ["tutor-resources", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("tutor_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", resourceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resource deleted successfully");
      setSelectedResource(null);
      queryClient.invalidateQueries({ queryKey: ["tutor-resources"] });
    },
    onError: (error: any) => {
      toast.error("Failed to delete: " + error.message);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !user) throw new Error("Missing required data");

      setUploading(true);
      
      // Verify user is authenticated
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        console.error("Auth error:", authError);
        throw new Error("Authentication required. Please log in again.");
      }

      console.log("Authenticated user ID:", authUser.id);

      const fileExt = file.name.split(".").pop();
      const filePath = `${authUser.id}/${crypto.randomUUID()}.${fileExt}`;

      console.log("Uploading file to storage:", filePath);
      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(`Storage error: ${uploadError.message}`);
      }

      console.log("File uploaded successfully, getting public URL");
      const { data: { publicUrl } } = supabase.storage
        .from("resources")
        .getPublicUrl(filePath);

      console.log("Inserting resource record:", {
        tutor_id: authUser.id,
        title,
        description,
        file_url: publicUrl,
        file_type: fileExt || "unknown",
        status: "pending",
      });

      const { error: insertError } = await supabase
        .from("resources")
        .insert({
          tutor_id: authUser.id,
          title,
          description,
          file_url: publicUrl,
          file_type: fileExt || "unknown",
          status: "pending",
        });

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw new Error(`Database error: ${insertError.message}`);
      }

      console.log("Resource uploaded successfully!");
    },
    onSuccess: () => {
      toast.success("Resource uploaded! Awaiting admin approval.");
      setTitle("");
      setDescription("");
      setFile(null);
      setUploading(false);
      queryClient.invalidateQueries({ queryKey: ["tutor-resources"] });
    },
    onError: (error) => {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !file) {
      toast.error("Please fill all fields");
      return;
    }
    uploadMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><Check className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  const totalPages = Math.ceil(resources.length / itemsPerPage);
  const paginatedResources = resources.slice(
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
          <LoadingOverlay isLoading={initialLoad || isLoading || isFetching} message="Loading resources..." />
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
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Resources</h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Upload and manage your teaching materials
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Upload New Resource</CardTitle>
                  <CardDescription>Share your materials with learners</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Introduction to Programming"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                        placeholder="Describe what this resource covers"
                        rows={3}
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {description.length}/500 characters
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="file">File</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => document.getElementById('file')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {file ? file.name : "Choose File"}
                      </Button>
                      <Input
                        id="file"
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground">
                        Accepted formats: PDF, DOC, DOCX, PPT, PPTX, TXT
                      </p>
                    </div>
                    <Button type="submit" disabled={uploading}>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Resource"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">My Uploaded Resources</h2>
                {resources.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No resources uploaded yet
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {paginatedResources.map((resource) => (
                    <Card 
                      key={resource.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors relative"
                      onClick={() => setSelectedResource(resource)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1 min-w-0 overflow-hidden">
                            <CardTitle className="flex items-center gap-2 w-full">
                              <FileText className="w-5 h-5 flex-shrink-0" />
                              <span className="truncate block flex-1 min-w-0">{resource.title}</span>
                            </CardTitle>
                            <CardDescription className="line-clamp-2 break-words">
                              {resource.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Maximize2 className="w-4 h-4 text-muted-foreground" />
                            {getStatusBadge(resource.status)}
                          </div>
                        </div>
                      </CardHeader>
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

      {/* Resource Modal - Recreated */}
      <Dialog open={!!selectedResource} onOpenChange={() => setSelectedResource(null)}>
        <DialogContent className="sm:max-w-md w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto rounded-lg">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base pr-6">
              {selectedResource?.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Uploaded {selectedResource && new Date(selectedResource.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedResource && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-xs font-medium">File Type</p>
                  <p className="text-xs text-muted-foreground uppercase">{selectedResource.file_type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium">Status</p>
                  {getStatusBadge(selectedResource.status)}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Description</p>
                <div className="bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
                  <p className="text-xs whitespace-pre-wrap break-words">{selectedResource.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                {selectedResource.status === 'approved' && (
                  <Button className="w-full" onClick={() => window.open(selectedResource.file_url, '_blank')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
                
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => {
                    if (confirm('Delete this resource?')) {
                      deleteMutation.mutate(selectedResource.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
