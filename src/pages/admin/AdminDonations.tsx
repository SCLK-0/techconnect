import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { DollarSign, CheckCircle, Clock, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminDonations() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('donations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'donations'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-donations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: donations = [], isLoading } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("donations")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Donation marked as ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-donations"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update donation");
    },
  });

  const filteredDonations = donations.filter((donation: any) => {
    return statusFilter === "all" || donation.status === statusFilter;
  });

  const totalAmount = donations
    .filter((d: any) => d.status !== "rejected")
    .reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);
  const verifiedAmount = donations
    .filter((d: any) => d.status === "verified")
    .reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);
  const activeDonationsCount = donations.filter((d: any) => d.status !== "rejected").length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "verified":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center justify-center px-4">
            <div className="w-full max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold">Donation Management</h1>
              </div>
              <div className="flex items-center gap-4">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 px-4 py-6 overflow-auto flex justify-center">
            <div className="space-y-6 w-full max-w-7xl">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₱{totalAmount.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">{activeDonationsCount} donations</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Verified</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₱{verifiedAmount.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      {donations.filter((d: any) => d.status === "verified").length} donations
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {donations.filter((d: any) => d.status === "pending").length}
                    </div>
                    <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">All Donations</h2>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardContent className="p-0">
                  {/* Desktop Table View */}
                  <div className="hidden md:block rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Amount</TableHead>
                          <TableHead>Donor Name</TableHead>
                          <TableHead>Proof of Payment</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">
                              Loading donations...
                            </TableCell>
                          </TableRow>
                        ) : filteredDonations.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center">
                              No donations found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredDonations.map((donation: any) => (
                            <TableRow key={donation.id}>
                              <TableCell className="font-bold">₱{Number(donation.amount).toFixed(2)}</TableCell>
                              <TableCell>{donation.donor_name || "Anonymous"}</TableCell>
                              <TableCell>
                                {donation.proof_of_payment ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md sm:max-w-lg">
                                      <DialogHeader>
                                        <DialogTitle>Proof of Payment</DialogTitle>
                                      </DialogHeader>
                                      <div className="w-full max-h-[60vh] overflow-auto">
                                        <img 
                                          src={donation.proof_of_payment} 
                                          alt="Proof of payment" 
                                          className="w-full h-auto rounded-lg object-contain"
                                        />
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                ) : (
                                  <span className="text-muted-foreground text-sm">No proof</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{donation.recipient_type}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusVariant(donation.status)} className="flex items-center gap-1 w-fit">
                                  {getStatusIcon(donation.status)}
                                  {donation.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{format(new Date(donation.created_at), "MMM dd, yyyy")}</TableCell>
                              <TableCell className="text-right">
                                {donation.status === "pending" && (
                                  <div className="flex gap-1 justify-end">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        updateStatusMutation.mutate({ id: donation.id, status: "verified" })
                                      }
                                      title="Approve"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        updateStatusMutation.mutate({ id: donation.id, status: "rejected" })
                                      }
                                      title="Reject"
                                    >
                                      <XCircle className="h-4 w-4" />
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
                  <div className="md:hidden p-4 space-y-4">
                    {isLoading ? (
                      <div className="text-center py-8">Loading donations...</div>
                    ) : filteredDonations.length === 0 ? (
                      <div className="text-center py-8">No donations found</div>
                    ) : (
                      filteredDonations.map((donation: any) => (
                        <Card key={donation.id}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="text-2xl font-bold">₱{Number(donation.amount).toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">
                                  {donation.donor_name || "Anonymous"}
                                </div>
                              </div>
                              <Badge variant={getStatusVariant(donation.status)} className="flex items-center gap-1">
                                {getStatusIcon(donation.status)}
                                {donation.status}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm">
                              <Badge variant="outline">{donation.recipient_type}</Badge>
                              <span className="text-muted-foreground">
                                {format(new Date(donation.created_at), "MMM dd, yyyy")}
                              </span>
                            </div>

                            {donation.proof_of_payment && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="w-full">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Proof of Payment
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>Proof of Payment</DialogTitle>
                                  </DialogHeader>
                                  <div className="w-full max-h-[60vh] overflow-auto">
                                    <img 
                                      src={donation.proof_of_payment} 
                                      alt="Proof of payment" 
                                      className="w-full h-auto rounded-lg object-contain"
                                    />
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}

                            {donation.status === "pending" && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() =>
                                    updateStatusMutation.mutate({ id: donation.id, status: "verified" })
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() =>
                                    updateStatusMutation.mutate({ id: donation.id, status: "rejected" })
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
