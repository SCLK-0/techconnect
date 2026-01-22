import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";

// Import observer-specific components
import { ObservableSessionsBrowser } from "@/components/learner/ObservableSessionsBrowser";
import { ObserverRequestsManager } from "@/components/learner/ObserverRequestsManager";

const ObserverSessions = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Observer Sessions</h1>
          <p className="text-muted-foreground mt-2">
            Request to observe tutoring sessions and manage observer requests
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Sessions You Can Observe
              </CardTitle>
              <CardDescription>
                Browse sessions that allow observers and request to watch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ObservableSessionsBrowser />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observer Requests Management</CardTitle>
              <CardDescription>
                Manage incoming requests from users who want to observe your sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ObserverRequestsManager />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ObserverSessions;