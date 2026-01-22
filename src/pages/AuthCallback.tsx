import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log(" AuthCallback: Starting email confirmation handling...");
        console.log("URL:", window.location.href);
        console.log("Hash:", window.location.hash);
        
        // Check for error in URL params
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        
        if (error) {
          console.error("❌ Error in URL:", error, errorDescription);
          setErrorMsg(errorDescription || error);
          setStatus("error");
          return;
        }

        // Check if we have tokens in the URL hash (Supabase email confirmation)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        console.log("Token type:", type, "Has access token:", !!accessToken);

        // If we have tokens, set the session manually
        if (accessToken && refreshToken) {
          console.log(" Setting session from URL tokens...");
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (setSessionError) {
            console.error("❌ Error setting session:", setSessionError);
            setErrorMsg("Failed to establish session: " + setSessionError.message);
            setStatus("error");
            return;
          }
          console.log(" Session set from tokens");
        } else {
          // Wait a moment for Supabase to process the tokens from the URL
          console.log(" Waiting for Supabase to process tokens...");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Get the session - Supabase should have processed the tokens by now
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("❌ Session error:", sessionError);
          setErrorMsg("Session error: " + sessionError.message);
          setStatus("error");
          return;
        }

        if (!session) {
          console.log(" No session found after token processing");
          // Try to get user to see if email was confirmed but no session
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            console.log("No user found - redirecting to login");
            setErrorMsg("No session found. Please try logging in.");
            setStatus("error");
            setTimeout(() => navigate("/login", { replace: true }), 3000);
            return;
          }
        }

        const user = session?.user;
        if (!user) {
          console.log("No user in session - redirecting to login");
          navigate("/login", { replace: true });
          return;
        }

        console.log(" User authenticated:", user.email);
        console.log(" User metadata:", user.user_metadata);

        // Get user metadata
        const metadata = user.user_metadata;

        // Create profile and role based on metadata
        let role: "learner" | "tutor" | null = null;

        // Check if this is a tutor FIRST (has is_tutor flag or subject_expertise)
        // This must come before learner check because tutors also have registered_year
        if (metadata?.is_tutor || metadata?.subject_expertise) {
          console.log(" Creating tutor profile...");
          console.log("Tutor metadata - subject_expertise:", metadata.subject_expertise);
          console.log("Tutor metadata - registered_year:", metadata.registered_year);
          role = "tutor";
          
          // Step 1: Create base profile first
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              user_id: user.id,
              full_name: metadata.full_name || "User",
              avatar_url: metadata.avatar_url || null,
              bio: metadata.bio || null
            }, { onConflict: 'user_id' });
          
          if (profileError) {
            console.error("Profile error:", profileError);
          } else {
            console.log(" Base profile created");
          }

          // Step 2: Create tutor profile with all data
          const tutorData = {
            user_id: user.id,
            bio: metadata.bio || "",
            subject_expertise: metadata.subject_expertise || [],
            registered_year: metadata.registered_year || null,
            status: 'pending' // New tutors start as pending
          };
          console.log("Creating tutor profile with data:", tutorData);
          
          const { error: tutorError } = await supabase
            .from("tutor_profiles")
            .upsert(tutorData, { onConflict: 'user_id' });
          
          if (tutorError) {
            console.error("Tutor profile error:", tutorError);
          } else {
            console.log(" Tutor profile created with subjects:", metadata.subject_expertise);
          }

          // Step 3: Assign tutor role
          const { data: existingRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "tutor")
            .maybeSingle();
          
          if (!existingRole) {
            const { error: roleError } = await supabase
              .from("user_roles")
              .insert({ user_id: user.id, role: "tutor" });
            
            if (roleError && !roleError.message.includes("duplicate")) {
              console.error("Role error:", roleError);
            } else {
              console.log(" Tutor role assigned");
            }
          }
        }
        // Check if this is a learner (has subjects_of_interest - learner-specific field)
        else if (metadata?.subjects_of_interest) {
          console.log(" Creating learner profile...");
          role = "learner";
          
          // Step 1: Create base profile first
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              user_id: user.id,
              full_name: metadata.full_name || "User",
              avatar_url: metadata.avatar_url || null
            }, { onConflict: 'user_id' });
          
          if (profileError) {
            console.error("Profile error:", profileError);
          } else {
            console.log(" Base profile created");
          }

          // Step 2: Create learner profile
          const { error: learnerError } = await supabase
            .from("learner_profiles")
            .upsert({
              user_id: user.id,
              registered_year: metadata.registered_year,
              subjects_of_interest: metadata.subjects_of_interest
            }, { onConflict: 'user_id' });
          
          if (learnerError) {
            console.error("Learner profile error:", learnerError);
          } else {
            console.log(" Learner profile created");
          }

          // Step 3: Assign learner role
          const { data: existingRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "learner")
            .maybeSingle();
          
          if (!existingRole) {
            const { error: roleError } = await supabase
              .from("user_roles")
              .insert({ user_id: user.id, role: "learner" });
            
            if (roleError && !roleError.message.includes("duplicate")) {
              console.error("Role error:", roleError);
            } else {
              console.log(" Learner role assigned");
            }
          }
        } else {
          console.log(" No role metadata found in user data");
          console.log("Available metadata keys:", Object.keys(metadata || {}));
        }

        // Notify the waiting tab (Tab A) that email is confirmed
        console.log(" Notifying other tabs that email is confirmed, role:", role);
        
        // Set localStorage with timestamp to prevent stale data issues
        localStorage.setItem('email_confirmed', 'true');
        localStorage.setItem('email_confirmed_role', role || '');
        localStorage.setItem('email_confirmed_timestamp', Date.now().toString());
        
        // Trigger storage event manually for same-origin tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'email_confirmed',
          newValue: 'true',
          oldValue: null,
          storageArea: localStorage
        }));
        
        // Clean up after a longer delay to ensure Tab A picks it up
        setTimeout(() => {
          localStorage.removeItem('email_confirmed');
          localStorage.removeItem('email_confirmed_role');
          localStorage.removeItem('email_confirmed_timestamp');
        }, 10000);

        // Show success message in this tab (Tab B)
        setStatus("success");
        console.log(" AuthCallback complete - showing success message, role:", role);

      } catch (error: any) {
        console.error("❌ Error in auth callback:", error);
        setErrorMsg(error.message || "Unknown error occurred");
        setStatus("error");
      }
    };

    // Run the callback handler
    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <Card className="w-full max-w-md shadow-2xl border-2 relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "loading" && (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
            )}
            {status === "error" && (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <CardTitle className={`text-2xl font-bold ${status === "success" ? "text-blue-600 dark:text-blue-400" : ""}`}>
            {status === "loading" && "Confirming Your Email"}
            {status === "success" && "All Set!"}
            {status === "error" && "Something Went Wrong"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Please wait while we confirm your email and set up your account..."}
            {status === "success" && "Your email has been confirmed and your account is ready!"}
            {status === "error" && errorMsg}
          </CardDescription>
        </CardHeader>
        {status === "success" && (
          <CardContent>
            <div className="flex flex-col items-center gap-4 p-6 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-center font-medium text-blue-700 dark:text-blue-300">
                 Email confirmed successfully!
              </p>
              <p className="text-xs text-center text-muted-foreground">
                You can close this tab now. Your other tab will redirect you to your dashboard.
              </p>
            </div>
          </CardContent>
        )}
        {status === "error" && (
          <CardContent>
            <div className="flex flex-col items-center gap-4 p-6 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
              <p className="text-xs text-center text-muted-foreground">
                Please try logging in or registering again.
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default AuthCallback;
