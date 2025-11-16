import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ConfirmEmail = () => {
  const [status, setStatus] = useState<"waiting" | "confirmed" | "error" | "can_close">("waiting");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();
  const shouldStopChecking = useRef(false);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let isConfirmed = false;
    
    // IMMEDIATE CHECK: If this is an OAuth callback (has access_token), check if it's an admin
    const checkIfAdminOAuth = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hasOAuthToken = hashParams.has('access_token');
      
      if (hasOAuthToken) {
        console.log("🔍 OAuth callback detected on confirm-email page");
        
        // Get the session immediately
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log("👤 User session found, checking role...");
          
          // Check if user is admin
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();
          
          if (roleData?.role === "admin") {
            console.log("🔐 Admin OAuth detected! Redirecting to admin/login...");
            // Redirect admin OAuth to admin login page immediately
            navigate("/admin/login", { replace: true });
            return true; // Signal that we're redirecting
          }
        }
      }
      return false; // Not an admin OAuth
    };
    
    // Listen for confirmation from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'email_confirmed' && e.newValue === 'true') {
        console.log("📨 Email confirmed in another tab! Showing 'can close' message.");
        shouldStopChecking.current = true;
        setStatus("can_close");
        if (pollInterval) clearInterval(pollInterval);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    const checkConfirmation = async () => {
      // First check if this is an admin OAuth - if so, redirect immediately
      const isAdminOAuth = await checkIfAdminOAuth();
      if (isAdminOAuth) return; // Stop processing if redirecting
      
      // Don't check again if already confirmed or if we should stop checking
      if (isConfirmed || shouldStopChecking.current) return;
      
      // Check if this is a redirect from email confirmation link
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hasTokenParams = searchParams.get('token_hash') || 
                            searchParams.get('type') || 
                            searchParams.get('access_token') ||
                            hashParams.get('access_token') ||
                            hashParams.get('token_hash');
      const error = searchParams.get('error') || hashParams.get('error');
      const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');
      
      // Check if user came from registration (has state)
      const cameFromRegistration = location.state?.fromRegistration;
      
      // Allow access if: has token params OR came from registration OR already has a session
      // (The session check allows Tab B to work when opened from email link)
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!hasTokenParams && !cameFromRegistration && !currentSession) {
        console.log("Direct access blocked - redirecting to home");
        navigate('/', { replace: true });
        return;
      }
      
      // Handle errors from email confirmation
      if (error) {
        console.error("Email confirmation error:", error, errorDescription);
        setStatus("error");
        setErrorMessage(errorDescription || "Failed to confirm email");
        if (pollInterval) clearInterval(pollInterval);
        return;
      }
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        setStatus("error");
        setErrorMessage(sessionError.message);
        if (pollInterval) clearInterval(pollInterval);
        return;
      }

      // If user has session and email is confirmed
      if (session?.user) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email_confirmed_at || user?.confirmed_at) {
          console.log("✅ Email confirmed! Setting status to confirmed");
          isConfirmed = true;
          setStatus("confirmed");
          
          // Notify other tabs that email is confirmed
          localStorage.setItem('email_confirmed', 'true');
          setTimeout(() => localStorage.removeItem('email_confirmed'), 2000);
          
          // Stop polling
          if (pollInterval) clearInterval(pollInterval);
          
          // Check user role and redirect
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);
          
          toast({
            title: "Email confirmed!",
            description: "Redirecting to your dashboard...",
            duration: 5000,
          });

          // Wait 5 seconds to show the green confirmation state
          setTimeout(() => {
            if (roles && roles.length > 0) {
              const role = roles[0].role;
              console.log("Redirecting to dashboard for role:", role);
              if (role === "learner") {
                navigate("/learner/dashboard", { replace: true });
              } else if (role === "tutor") {
                navigate("/tutor/dashboard", { replace: true });
              } else {
                navigate("/login", { replace: true });
              }
            } else {
              // No role yet, redirect to role selection
              console.log("No role found, redirecting to role selection");
              navigate("/role-selection", { replace: true });
            }
          }, 5000);
        }
      }
    };

    checkConfirmation();
    
    // Poll every 2 seconds to check if email was confirmed
    pollInterval = setInterval(checkConfirmation, 2000);

    // Listen for auth state changes (when user clicks email link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth state changed:", event);
      
      // Don't process if we should stop checking (Tab A showing "can close")
      if (shouldStopChecking.current) {
        console.log("Ignoring auth state change - already showing 'can close' message");
        return;
      }
      
      if (event === "SIGNED_IN" && session && !isConfirmed) {
        console.log("✅ User signed in! Setting status to confirmed");
        isConfirmed = true;
        setStatus("confirmed");
        
        // Notify other tabs that email is confirmed
        localStorage.setItem('email_confirmed', 'true');
        setTimeout(() => localStorage.removeItem('email_confirmed'), 2000);
        
        // Stop polling
        if (pollInterval) clearInterval(pollInterval);
        
        // Check role and redirect
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        
        toast({
          title: "Email confirmed!",
          description: "Redirecting to your dashboard...",
          duration: 5000,
        });

        // Wait 5 seconds to show the green confirmation state
        setTimeout(() => {
          if (roles && roles.length > 0) {
            const role = roles[0].role;
            console.log("Redirecting to dashboard for role:", role);
            if (role === "learner") {
              navigate("/learner/dashboard", { replace: true });
            } else if (role === "tutor") {
              navigate("/tutor/dashboard", { replace: true });
            } else {
              navigate("/login", { replace: true });
            }
          } else {
            console.log("No role found, redirecting to role selection");
            navigate("/role-selection", { replace: true });
          }
        }, 5000);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [searchParams, location, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <Card className="w-full max-w-md shadow-2xl border-2 relative z-10">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            {status === "waiting" && (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary-foreground animate-pulse" />
              </div>
            )}
            {status === "confirmed" && (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
            )}
            {status === "can_close" && (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
            )}
            {status === "error" && (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === "waiting" && "Check Your Email"}
            {status === "confirmed" && "Email Confirmed!"}
            {status === "can_close" && "All Set!"}
            {status === "error" && "Confirmation Error"}
          </CardTitle>
          <CardDescription className="text-base">
            {status === "waiting" && (
              <>
                We've sent a confirmation email to your inbox.
                <br />
                Please click the link in the email to verify your account.
              </>
            )}
            {status === "confirmed" && (
              <>
                Your email has been successfully confirmed!
                <br />
                Redirecting to your dashboard...
              </>
            )}
            {status === "can_close" && (
              <>
                Your email has been confirmed in another tab.
                <br />
                You can safely close this tab now.
              </>
            )}
            {status === "error" && (
              <>
                {errorMessage || "There was an error confirming your email."}
                <br />
                Please try registering again or contact support.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "waiting" && (
            <div className="flex flex-col items-center gap-4 p-6 bg-muted/30 rounded-lg border border-border">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground text-center">
                Waiting for email confirmation...
              </p>
              <div className="space-y-2 text-center">
                <p className="text-xs text-muted-foreground">
                  📧 Didn't receive the email? <strong>Check your spam/junk folder!</strong>
                </p>
              </div>
            </div>
          )}
          {status === "confirmed" && (
            <div className="flex flex-col items-center gap-4 p-6 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <p className="text-sm text-center font-medium">
                ✅ Your account has been confirmed! Redirecting...
              </p>
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            </div>
          )}
          {status === "can_close" && (
            <div className="flex flex-col items-center gap-4 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-center font-medium text-blue-700 dark:text-blue-300">
                ✅ Email confirmed successfully in another tab!
              </p>
              <p className="text-xs text-center text-muted-foreground">
                You can close this tab now. The other tab will redirect you to your dashboard.
              </p>
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center gap-4 p-6 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
              <Button onClick={() => navigate("/role-selection")} variant="outline" className="w-full">
                Back to Registration
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmEmail;
