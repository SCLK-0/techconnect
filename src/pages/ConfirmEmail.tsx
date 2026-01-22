import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ConfirmEmail = () => {
  const [status, setStatus] = useState<"waiting" | "confirmed" | "error">("waiting");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let redirectTimeout: NodeJS.Timeout;
    let localStorageCheckInterval: NodeJS.Timeout;
    
    // Check if user came from registration
    const cameFromRegistration = location.state?.fromRegistration;
    
    // Clear any stale confirmation data from previous sessions on mount
    if (cameFromRegistration) {
      console.log(" Clearing stale localStorage data (came from registration)");
      localStorage.removeItem('email_confirmed');
      localStorage.removeItem('email_confirmed_role');
      localStorage.removeItem('email_confirmed_timestamp');
    }
    
    // Function to redirect based on role
    const redirectToDashboard = (role: string | null) => {
      console.log(" Redirecting to dashboard for role:", role);
      
      if (role === "learner") {
        navigate("/learner/dashboard", { replace: true });
      } else if (role === "tutor") {
        navigate("/tutor/dashboard", { replace: true });
      } else if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        fetchRoleAndRedirect();
      }
    };
    
    // Fetch role from database and redirect
    const fetchRoleAndRedirect = async () => {
      console.log(" Fetching role from database...");
      
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("Session refresh error:", refreshError);
      }
      
      const userId = session?.user?.id;
      if (!userId) {
        console.log("No user ID found, redirecting to login");
        navigate("/login", { replace: true });
        return;
      }
      
      for (let attempt = 0; attempt < 5; attempt++) {
        console.log(`Attempt ${attempt + 1} to fetch role...`);
        
        const { data: roles, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        
        if (roleError) {
          console.error("Role fetch error:", roleError);
        }
        
        if (roles && roles.length > 0) {
          const role = roles[0].role;
          console.log(" Role found:", role);
          
          if (role === "learner") {
            navigate("/learner/dashboard", { replace: true });
          } else if (role === "tutor") {
            navigate("/tutor/dashboard", { replace: true });
          } else if (role === "admin") {
            navigate("/admin/dashboard", { replace: true });
          }
          return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(" No role found after retries");
      navigate("/role-selection", { replace: true });
    };
    
    // Listen for confirmation from Tab B (AuthCallback) via localStorage
    const handleStorageChange = (e: StorageEvent) => {
      console.log(" Storage event received:", e.key, e.newValue);
      
      if (e.key === 'email_confirmed' && e.newValue === 'true') {
        console.log(" Email confirmed signal received from Tab B!");
        
        if (pollInterval) clearInterval(pollInterval);
        if (localStorageCheckInterval) clearInterval(localStorageCheckInterval);
        
        setStatus("confirmed");
        
        toast({
          title: "Email Confirmed!",
          description: "Redirecting to your dashboard...",
        });
        
        const role = localStorage.getItem('email_confirmed_role');
        console.log("Role from localStorage:", role);
        
        redirectTimeout = setTimeout(() => {
          redirectToDashboard(role);
        }, 1500);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Initial access check
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!cameFromRegistration && !session) {
        console.log("⛔ Direct access blocked - redirecting to home");
        navigate('/', { replace: true });
        return false;
      }
      return true;
    };
    
    checkAccess();
    
    // Check localStorage for recent confirmation (with timestamp validation)
    const checkLocalStorageNow = () => {
      const confirmed = localStorage.getItem('email_confirmed');
      const confirmedTimestamp = localStorage.getItem('email_confirmed_timestamp');
      
      if (confirmed === 'true' && confirmedTimestamp) {
        const timestamp = parseInt(confirmedTimestamp, 10);
        const now = Date.now();
        const isRecent = (now - timestamp) < 60000; // 60 seconds
        
        if (isRecent) {
          console.log(" Found recent email_confirmed in localStorage!");
          setStatus("confirmed");
          if (pollInterval) clearInterval(pollInterval);
          if (localStorageCheckInterval) clearInterval(localStorageCheckInterval);
          
          const role = localStorage.getItem('email_confirmed_role');
          
          toast({
            title: "Email Confirmed!",
            description: "Redirecting to your dashboard...",
          });
          
          redirectTimeout = setTimeout(() => {
            redirectToDashboard(role);
          }, 1500);
        } else {
          console.log(" Found stale email_confirmed in localStorage, ignoring");
          localStorage.removeItem('email_confirmed');
          localStorage.removeItem('email_confirmed_role');
          localStorage.removeItem('email_confirmed_timestamp');
        }
      }
    };
    
    checkLocalStorageNow();
    localStorageCheckInterval = setInterval(checkLocalStorageNow, 1000);
    
    // Track initial confirmed_at to detect changes
    let initialConfirmedAt: string | null = null;
    let hasCheckedInitial = false;
    
    const checkEmailConfirmed = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        const confirmedAt = user.email_confirmed_at || user.confirmed_at;
        
        if (!hasCheckedInitial) {
          initialConfirmedAt = confirmedAt || null;
          hasCheckedInitial = true;
          console.log(" Initial confirmed_at state:", initialConfirmedAt);
          return;
        }
        
        // Only trigger if confirmed_at changed from null to a value
        if (confirmedAt && !initialConfirmedAt) {
          console.log(" Email confirmed detected via auth polling!");
          setStatus("confirmed");
          if (pollInterval) clearInterval(pollInterval);
          if (localStorageCheckInterval) clearInterval(localStorageCheckInterval);
          
          toast({
            title: "Email Confirmed!",
            description: "Redirecting to your dashboard...",
          });
          
          redirectTimeout = setTimeout(() => {
            fetchRoleAndRedirect();
          }, 1500);
        }
      } catch (error) {
        console.error("Error checking email confirmation:", error);
      }
    };
    
    pollInterval = setInterval(checkEmailConfirmed, 3000);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(" Auth state changed:", event, session?.user?.email);
      
      if (event === "SIGNED_IN" && session) {
        const user = session.user;
        const isEmailConfirmed = user?.email_confirmed_at || user?.confirmed_at;
        
        console.log(" Email confirmed status:", isEmailConfirmed);
        
        // Only trigger if email is actually confirmed AND we didn't have it confirmed initially
        if (isEmailConfirmed && !initialConfirmedAt) {
          console.log(" SIGNED_IN event with newly confirmed email!");
          setStatus("confirmed");
          if (pollInterval) clearInterval(pollInterval);
          if (localStorageCheckInterval) clearInterval(localStorageCheckInterval);
          
          toast({
            title: "Email Confirmed!",
            description: "Redirecting to your dashboard...",
          });

          redirectTimeout = setTimeout(() => {
            fetchRoleAndRedirect();
          }, 1500);
        } else {
          console.log(" SIGNED_IN but email not yet confirmed or was already confirmed, waiting...");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
      if (localStorageCheckInterval) clearInterval(localStorageCheckInterval);
      if (redirectTimeout) clearTimeout(redirectTimeout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location, navigate, toast]);

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
            {status === "error" && (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === "waiting" && "Check Your Email"}
            {status === "confirmed" && "Email Confirmed!"}
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
                   Didn't receive the email? <strong>Check your spam/junk folder!</strong>
                </p>
              </div>
            </div>
          )}
          {status === "confirmed" && (
            <div className="flex flex-col items-center gap-4 p-6 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <p className="text-sm text-center font-medium">
                 Your account has been confirmed! Redirecting...
              </p>
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
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
