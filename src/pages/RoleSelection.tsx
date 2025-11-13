import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const RoleSelection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkExistingRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();
          
          // If user has a role, redirect to their dashboard
          if (roleData?.role === "admin") {
            navigate("/admin/dashboard");
            return;
          } else if (roleData?.role === "tutor") {
            navigate("/tutor/dashboard");
            return;
          } else if (roleData?.role === "learner") {
            navigate("/learner/dashboard");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking role:", error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingRole();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold">Choose Your Role</h1>
          <p className="text-muted-foreground">
            Select your role to get started with TechConnect
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Learner Card */}
          <Card className="group hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer">
            <CardHeader>
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>I'm a Learner</CardTitle>
              <CardDescription>
                Find expert tutors and book 1-on-1 sessions to enhance your skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• Search and filter tutors by expertise</li>
                <li>• Book scheduled or instant sessions</li>
                <li>• Access learning resources</li>
                <li>• Track your learning progress</li>
              </ul>
              <Button asChild className="w-full">
                <Link to="/register/learner">Continue as Learner</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Tutor Card */}
          <Card className="group hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer">
            <CardHeader>
              <div className="w-16 h-16 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <CardTitle>I'm a Tutor</CardTitle>
              <CardDescription>
                Share your knowledge and help students succeed in their learning journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• Set your availability and schedule</li>
                <li>• Accept session requests</li>
                <li>• Share learning resources</li>
                <li>• Build your tutoring profile</li>
              </ul>
              <Button asChild className="w-full" variant="secondary">
                <Link to="/register/tutor">Continue as Tutor</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
        
        <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-primary">
          ← Back to home
        </Link>
      </div>
    </div>
  );
};

export default RoleSelection;
