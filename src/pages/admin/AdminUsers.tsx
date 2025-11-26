import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo.png";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";
import { Search, UserX, Calendar, UserCheck, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { useUserRole } from "@/hooks/useUserRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminUsers() {
  const { user: currentUser } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [yearLevelFilter, setYearLevelFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const itemsPerPage = 7;
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, isFetching, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      console.log("Fetching admin users...");
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        toast.error(`Failed to load users: ${profilesError.message}`);
        throw profilesError;
      }

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        // Don't throw, just continue without roles
      }

      // Fetch learner year levels
      const { data: learnerProfiles } = await supabase
        .from("learner_profiles")
        .select("user_id, registered_year");

      // Fetch tutor year levels
      const { data: tutorProfiles } = await supabase
        .from("tutor_profiles")
        .select("user_id, registered_year");

      // Merge profiles with their roles and year levels
      const usersWithRoles = profiles?.map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        const learnerProfile = learnerProfiles?.find(lp => lp.user_id === profile.user_id);
        const tutorProfile = tutorProfiles?.find(tp => tp.user_id === profile.user_id);
        
        return {
          ...profile,
          user_roles: roles?.filter(r => r.user_id === profile.user_id) || [],
          registered_year: learnerProfile?.registered_year || tutorProfile?.registered_year
        };
      }) || [];

      console.log("Fetched users with roles:", usersWithRoles);
      return usersWithRoles;
    },
  });

  // Show error toast if query fails
  if (error) {
    console.error("Query error:", error);
  }

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      console.log("Toggling user status:", { userId, isActive });
      
      const { data, error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("user_id", userId)
        .select();
      
      if (error) {
        console.error("Error updating user status:", error);
        throw error;
      }
      
      console.log("User status updated:", data);
      return { userId, isActive };
    },
    onSuccess: async (data) => {
      toast.success(
        data.isActive 
          ? "✅ User activated successfully! They can now access the system." 
          : "🚫 User deactivated successfully! Their access has been restricted.",
        { duration: 4000 }
      );
      // Force refetch the data
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.refetchQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
      toast.error(error.message || "Failed to update user status");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log("Deleting user:", userId);
      
      // Delete user's profile (cascading will handle related records)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);
      
      if (error) {
        console.error("Error deleting user:", error);
        throw error;
      }
      
      return userId;
    },
    onSuccess: async () => {
      toast.success("🗑️ User account deleted successfully!");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.refetchQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete user account");
    },
  });

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const userRole = user.user_roles?.[0]?.role || "none";
    const matchesRole = roleFilter === "all" || userRole === roleFilter;

    const matchesYearLevel = yearLevelFilter === "all" || user.registered_year === yearLevelFilter;

    return matchesSearch && matchesRole && matchesYearLevel;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
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

  // Check if a user is admin
  const isUserAdmin = (user: any) => user.user_roles?.[0]?.role === "admin";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col relative">
          <LoadingOverlay isLoading={isLoading || isFetching} message="Loading users..." />
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
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="tutor">Tutor</SelectItem>
                    <SelectItem value="learner">Learner</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={yearLevelFilter} onValueChange={setYearLevelFilter}>
                  <SelectTrigger className="w-full sm:w-[140px]">
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

              <Card>
                <CardHeader>
                  <CardTitle>All Users ({filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Desktop Table View */}
                  <div className="hidden md:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">
                              Loading users...
                            </TableCell>
                          </TableRow>
                        ) : filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedUsers.map((user: any) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.full_name || "No name"}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {user.user_id?.substring(0, 8)}...
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  user.user_roles?.[0]?.role === "admin" ? "destructive" :
                                  user.user_roles?.[0]?.role === "tutor" ? "default" : "secondary"
                                }>
                                  {user.user_roles?.[0]?.role || "none"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={user.is_active ? "default" : "secondary"}>
                                  {user.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.created_at ? format(new Date(user.created_at), "MMM dd, yyyy") : "N/A"}
                              </TableCell>
                              <TableCell className="text-right">
                                {!isUserAdmin(user) && (
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant={user.is_active ? "destructive" : "default"}
                                      size="sm"
                                      onClick={() => {
                                        toggleUserStatusMutation.mutate({
                                          userId: user.user_id,
                                          isActive: !user.is_active,
                                        });
                                      }}
                                      disabled={toggleUserStatusMutation.isPending}
                                      className="transition-all duration-300 hover:scale-105"
                                    >
                                      {toggleUserStatusMutation.isPending ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Processing...
                                        </>
                                      ) : user.is_active ? (
                                        <>
                                        <UserX className="h-4 w-4 mr-2" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <UserCheck className="h-4 w-4 mr-2" />
                                        Activate
                                      </>
                                    )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setUserToDelete(user);
                                        setDeleteDialogOpen(true);
                                      }}
                                      disabled={deleteUserMutation.isPending}
                                      className="transition-all duration-300 hover:scale-105 hover:bg-destructive hover:text-destructive-foreground"
                                      title="Delete account permanently"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {isLoading ? (
                      <div className="text-center py-8">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center py-8">No users found</div>
                    ) : (
                      paginatedUsers.map((user: any) => (
                        <Card key={user.id}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold">{user.full_name || "No name"}</h3>
                                <p className="text-xs font-mono text-muted-foreground">
                                  {user.user_id?.substring(0, 8)}...
                                </p>
                              </div>
                              <Badge variant={
                                user.user_roles?.[0]?.role === "admin" ? "destructive" :
                                user.user_roles?.[0]?.role === "tutor" ? "default" : "secondary"
                              }>
                                {user.user_roles?.[0]?.role || "none"}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Joined: {user.created_at ? format(new Date(user.created_at), "MMM dd, yyyy") : "N/A"}
                              </span>
                              <Badge variant={user.is_active ? "default" : "secondary"}>
                                {user.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>

                            {!isUserAdmin(user) && (
                              <Button
                                variant={user.is_active ? "destructive" : "default"}
                                size="sm"
                                className="w-full transition-all duration-300 hover:scale-105"
                                onClick={() => {
                                  toggleUserStatusMutation.mutate({
                                    userId: user.user_id,
                                    isActive: !user.is_active,
                                  });
                                }}
                                disabled={toggleUserStatusMutation.isPending}
                              >
                                {toggleUserStatusMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : user.is_active ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                  
                  {renderPagination()}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{userToDelete?.full_name || "this user"}</strong>'s account?
              <br /><br />
              This action cannot be undone. All user data, sessions, and related records will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete) {
                  deleteUserMutation.mutate(userToDelete.user_id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
