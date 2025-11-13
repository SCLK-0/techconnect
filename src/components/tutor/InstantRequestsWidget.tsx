import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InstantRequestsWidgetProps {
  userId: string;
}

export function InstantRequestsWidget({ userId }: InstantRequestsWidgetProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const { data: instantRequests = [], isLoading } = useQuery({
    queryKey: ["instant-requests", userId],
    queryFn: async () => {
      // Fetch instant session requests
      const { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select("id, subject, duration, created_at, learner_id")
        .eq("tutor_id", userId)
        .eq("session_type", "instant")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      // Fetch learner profiles
      const learnerIds = sessions?.map(s => s.learner_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", learnerIds);

      // Merge sessions with profile data
      const sessionsWithProfiles = sessions?.map(session => ({
        ...session,
        profiles: profiles?.find(p => p.user_id === session.learner_id) || { full_name: "Unknown", avatar_url: null }
      })) || [];

      return sessionsWithProfiles;
    },
    refetchInterval: 5000, // Refetch every 5 seconds as backup
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: string }) => {
      const { error } = await supabase
        .from("sessions")
        .update({ 
          status,
          session_status: status === "accepted" ? "waiting" : "pending"
        })
        .eq("id", sessionId);
      if (error) throw error;
      return sessionId;
    },
    onSuccess: (sessionId, variables) => {
      queryClient.invalidateQueries({ queryKey: ["instant-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tutor-stats"] });
      
      if (variables.status === "accepted") {
        toast.success("Session accepted! Redirecting...");
        // Navigate immediately
        navigate(`/video-session/${sessionId}`);
      } else {
        toast.success("Session declined");
      }
    },
    onError: () => {
      toast.error("Failed to update session status");
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Instant Requests
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Instant Requests
            </CardTitle>
            {instantRequests.length > 0 && (
              <Badge variant="default" className="ml-2">
                {instantRequests.length}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>Learners waiting for instant sessions</CardDescription>
      </CardHeader>
      <CardContent>
        {instantRequests.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No instant requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {instantRequests
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((request) => {
                    const profile = request.profiles as any;
                    const timeAgo = new Date(request.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div key={request.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile?.avatar_url} />
                          <AvatarFallback>{profile?.full_name?.[0] || "L"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{profile?.full_name || "Unknown"}</p>
                            <Badge variant="secondary" className="text-xs">
                              {timeAgo}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {request.subject} • {request.duration} min
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  sessionId: request.id,
                                  status: "accepted",
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  sessionId: request.id,
                                  status: "rejected",
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
            
            {instantRequests.length > itemsPerPage && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {Math.ceil(instantRequests.length / itemsPerPage)}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(instantRequests.length / itemsPerPage), p + 1))}
                    disabled={currentPage === Math.ceil(instantRequests.length / itemsPerPage)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
