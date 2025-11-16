import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield } from "lucide-react";

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log("🔍 Checking admin auth status...");
      
      // Check if this is an OAuth callback
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const isCallback = hashParams.has('access_token');
      
      if (isCallback) {
        console.log("✅ OAuth callback detected, processing...");
        setLoading(true); // Show loading while processing
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if user is already authenticated (callback or existing session)
      if (session?.user) {
        console.log("👤 User session found:", session.user.email);
        
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        console.log("🎭 User role:", roleData?.role);

        if (roleData?.role === "admin") {
          console.log("✅ Admin verified! Redirecting to dashboard...");
          // Clean up the admin OAuth flag
          sessionStorage.removeItem('admin_oauth_attempt');
          // Show toast first
          toast({
            title: "Welcome Admin!",
            description: "Access granted.",
            duration: 2000,
          });
          // Wait to ensure toast is visible
          await new Promise(resolve => setTimeout(resolve, 1200));
          navigate("/admin/dashboard", { replace: true });
        } else if (isCallback) {
          // Only show error and sign out if this was a new login attempt
          console.log("❌ Not an admin, denying access");
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges.",
            variant: "destructive",
            duration: 3000,
          });
          // Wait to show toast before signing out
          await new Promise(resolve => setTimeout(resolve, 2000));
          await supabase.auth.signOut();
          setLoading(false);
        }
      } else if (isCallback) {
        console.log("⚠️ OAuth callback but no session found");
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log("🔐 Starting Google OAuth for admin...");
      
      // Store a flag in sessionStorage to indicate this is an admin OAuth attempt
      sessionStorage.setItem('admin_oauth_attempt', 'true');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin/login`,
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;
      // Note: User will be redirected to Google, then back (possibly through confirm-email)
      // The loading state will persist until the redirect happens
    } catch (error: any) {
      console.error("❌ Google OAuth error:", error);
      sessionStorage.removeItem('admin_oauth_attempt');
      toast({
        title: "Sign-in failed",
        description: error.message || "Could not sign in with Google",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
          <CardDescription>
            Restricted area for authorized administrators only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            type="button" 
            className="w-full" 
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <p className="text-xs text-center text-muted-foreground">
            Only authorized admin accounts can access this area
          </p>
          <Link to="/" className="text-sm text-center text-muted-foreground hover:text-primary">
            ← Back to home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;
