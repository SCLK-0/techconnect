import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ConfirmEmail = () => {
  const [status, setStatus] = useState<"waiting" | "confirmed" | "error" | "redirecting">("waiting");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    const checkConfirmation = async () => {
      // Check if this is a redirect from email confirmation
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const hasTokenParams = searchParams.get('token_hash') || searchParams.get('type') || searchParams.get('access_token');
      
      // Check if user has a session (came from registration or email link)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Email confirmation error:", error, errorDescription);
        setStatus("error");
        setErrorMessage(errorDescription || "Failed to confirm email");
        return;
      }
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        setStatus("error");
        setErrorMessage(sessionError.message);
        return;
      }

      if (session?.user) {
        // Check if email is confirmed
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email_confirmed_at || user?.confirmed_at) {
          // User is signed in and confirmed
          setStatus("confirmed");
          
          // Check which role they registered as and redirect accordingly
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id);
          
          if (roles && roles.length > 0) {
            const role = roles[0].role;
            
            toast({
              title: "Email confirmed!",
              description: "Redirecting to your dashboard...",
              duration: 800,
            });

            // Redirect immediately
            setTimeout(() => {
              if (role === "learner") {
                navigate("/learner/dashboard", { replace: true });
              } else if (role === "tutor") {
                navigate("/tutor/dashboard", { replace: true });
              } else {
                navigate("/login", { replace: true });
              }
            }, 1000);
          } else {
            // No role yet, redirect to role selection
            toast({
              title: "Email confirmed!",
              description: "Please select your role to continue...",
              duration: 800,
            });
            setTimeout(() => {
              navigate("/role-selection", { replace: true });
            }, 1000);
          }
        }
      }
    };

    checkConfirmation();
    
    // Poll every 2 seconds to check if email was confirmed
    pollInterval = setInterval(checkConfirmation, 2000);

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setStatus("confirmed");
        
        // Check role and redirect
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);
        
        if (roles && roles.length > 0) {
          const role = roles[0].role;
          
          if (role === "learner") {
            navigate("/learner/dashboard", { replace: true });
          } else if (role === "tutor") {
            navigate("/tutor/dashboard", { replace: true });
          } else {
            navigate("/login", { replace: true });
          }
        } else {
          // No role yet, redirect to role selection
          navigate("/role-selection", { replace: true });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [searchParams, navigate, toast]);

  // Show nothing while redirecting
  if (status === "redirecting") {
    return null;
  }

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
                  📧 Didn't receive the email? <strong>Check your spam/junk folder!</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  ⚠️ Note: During testing, emails can only be sent to verified addresses.
                </p>
                <p className="text-xs text-muted-foreground">
                  If you used an unverified email, please contact support or register with a verified email.
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
