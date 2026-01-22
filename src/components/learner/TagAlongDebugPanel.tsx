import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Database, Users, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export function TagAlongDebugPanel() {
  const [showDebug, setShowDebug] = useState(false);

  const { data: debugInfo, isLoading, refetch } = useQuery({
    queryKey: ["tag-along-debug"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check if session_participants table exists
      const { data: tableExists, error: tableError } = await supabase
        .from("session_participants" as any)
        .select("count")
        .limit(1);

      // Get sessions that allow observers
      const { data: observableSessions } = await supabase
        .from("sessions" as any)
        .select("id, subject, allow_observers, scheduled_at")
        .eq("allow_observers", true)
        .limit(5);

      // Get user's observer requests
      const { data: myRequests } = await supabase
        .from("session_participants" as any)
        .select("session_id, status, created_at")
        .eq("user_id", user.id)
        .eq("role", "observer");

      // Get requests for user's sessions
      const { data: incomingRequests } = await supabase
        .from("session_participants" as any)
        .select(`
          session_id,
          user_id,
          status,
          created_at
        `)
        .eq("role", "observer")
        .eq("status", "pending");

      return {
        userId: user.id,
        tableExists: !tableError,
        tableError: tableError?.message,
        observableSessions: observableSessions || [],
        myRequests: myRequests || [],
        incomingRequests: incomingRequests || []
      };
    },
    enabled: showDebug
  });

  if (!showDebug) {
    return (
      <Card className="border-dashed border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <Button 
            variant="outline" 
            onClick={() => setShowDebug(true)}
            className="w-full"
          >
            <Settings className="mr-2 h-4 w-4" />
            Show Tag-Along Debug Info
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4" />
          Tag-Along Debug Panel
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDebug(false)}
          >
            Hide
          </Button>
        </CardTitle>
        <CardDescription>
          Debug information for tag-along sessions feature
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Refresh Data
          </Button>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading debug info...</div>
        ) : debugInfo ? (
          <div className="space-y-4 text-sm">
            <div>
              <strong>User ID:</strong> <code className="text-xs">{debugInfo.userId}</code>
            </div>

            <div>
              <strong>Database Table:</strong>{" "}
              {debugInfo.tableExists ? (
                <Badge variant="default" className="text-xs"> session_participants exists</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">❌ Table missing: {debugInfo.tableError}</Badge>
              )}
            </div>

            <div>
              <strong>Sessions Allowing Observers:</strong>{" "}
              <Badge variant="secondary">{debugInfo.observableSessions.length} found</Badge>
              {debugInfo.observableSessions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {debugInfo.observableSessions.map((session: any) => (
                    <div key={session.id} className="text-xs bg-white p-2 rounded border">
                      <div><strong>Subject:</strong> {session.subject}</div>
                      <div><strong>ID:</strong> <code>{session.id}</code></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <strong>My Observer Requests:</strong>{" "}
              <Badge variant="secondary">{debugInfo.myRequests.length} requests</Badge>
              {debugInfo.myRequests.length > 0 && (
                <div className="mt-2 space-y-1">
                  {debugInfo.myRequests.map((request: any, index: number) => (
                    <div key={index} className="text-xs bg-white p-2 rounded border">
                      <div><strong>Status:</strong> {request.status}</div>
                      <div><strong>Session:</strong> <code>{request.session_id}</code></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <strong>Incoming Requests:</strong>{" "}
              <Badge variant="secondary">{debugInfo.incomingRequests.length} pending</Badge>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No debug info available</div>
        )}
      </CardContent>
    </Card>
  );
}