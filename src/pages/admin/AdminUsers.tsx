import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Shield, UserX, Mail, Calendar, UserCheck, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { useUserRole } from "@/hooks/useUserRole";

export default function AdminUsers() {
  const { user: currentUser } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
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

      // Merge profiles with their roles
      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.user_id) || []
      })) || [];

      console.log("Fetched users with roles:", usersWithRoles);
      return usersWithRoles;
    },
  });

  // Show error toast if query fails
  if (error) {
    console.error("Query error:", error);
  }

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: role as "admin" | "tutor" | "learner" }]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelectedUser(null);
      setNewRole("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to assign role");
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: isActive })
        .eq("user_id", userId);
      if (error) throw error;
      return { userId, isActive };
    },
    onSuccess: (data) => {
      toast.success(
        data.isActive 
          ? "✅ User activated successfully! They can now access the system." 
          : "🚫 User deactivated successfully! Their access has been restricted.",
        { duration: 4000 }
      );
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user status");
    },
  });

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const userRole = user.user_roles?.[0]?.role || "none";
    const matchesRole = roleFilter === "all" || userRole === roleFilter;

    return matchesSearch && matchesRole;
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

  // Check if a user is admin
  const isUserAdmin = (user: any) => user.user_roles?.[0]?.role === "admin";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-center px-3 py-4">
            <div className="w-full max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold">User Management</h1>
              </div>
              <div className="flex items-center gap-4">
                <NotificationBell />
                <UserMenu />
              </div>
            </div>
          </header>

          <main className="flex-1 px-3 py-6 overflow-auto flex justify-center">
            <div className="space-y-6 w-full max-w-5xl">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
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
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="tutor">Tutor</SelectItem>
                    <SelectItem value="learner">Learner</SelectItem>
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
                                <div className="flex justify-end gap-2">
                                  {!isUserAdmin(user) && (
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
                                  )}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedUser(user)}
                                    >
                                      <Shield className="h-4 w-4 mr-2" />
                                      Manage Roles
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Manage User Roles</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>User</Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {user.full_name}
                                        </p>
                                      </div>
                                      <div>
                                        <Label>Current Role</Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {user.user_roles?.[0]?.role || "none"}
                                        </p>
                                      </div>
                                      <div>
                                        <Label htmlFor="role">Assign New Role</Label>
                                        <Select value={newRole} onValueChange={setNewRole}>
                                          <SelectTrigger id="role">
                                            <SelectValue placeholder="Select role" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="tutor">Tutor</SelectItem>
                                            <SelectItem value="learner">Learner</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <Button
                                        className="w-full"
                                        onClick={() => {
                                          if (newRole) {
                                            assignRoleMutation.mutate({
                                              userId: user.user_id,
                                              role: newRole,
                                            });
                                          }
                                        }}
                                        disabled={!newRole || assignRoleMutation.isPending}
                                      >
                                        Assign Role
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {renderPagination()}

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

                            <div className="flex gap-2">
                              {!isUserAdmin(user) && (
                                <Button
                                  variant={user.is_active ? "destructive" : "default"}
                                  size="sm"
                                  className="flex-1 transition-all duration-300 hover:scale-105"
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

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  Manage Roles
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Manage User Roles</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>User</Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {user.full_name}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Current Role</Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {user.user_roles?.[0]?.role || "none"}
                                    </p>
                                  </div>
                                  <div>
                                    <Label htmlFor="role">Assign New Role</Label>
                                    <Select value={newRole} onValueChange={setNewRole}>
                                      <SelectTrigger id="role">
                                        <SelectValue placeholder="Select role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="tutor">Tutor</SelectItem>
                                        <SelectItem value="learner">Learner</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    className="w-full"
                                    onClick={() => {
                                      if (newRole) {
                                        assignRoleMutation.mutate({
                                          userId: user.user_id,
                                          role: newRole,
                                        });
                                      }
                                    }}
                                    disabled={!newRole || assignRoleMutation.isPending}
                                  >
                                    Assign Role
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            </div>
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
    </SidebarProvider>
  );
}
