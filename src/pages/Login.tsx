import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Fetch profile and role in parallel for faster login
        const [profileResult, roleResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("is_active")
            .eq("user_id", data.user.id)
            .single(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id)
            .single()
        ]);

        // If user is not active, sign them out and show error
        if (profileResult.data && !profileResult.data.is_active) {
          await supabase.auth.signOut();
          toast({
            title: "Account Deactivated",
            description: "Your account has been deactivated. Please contact an administrator.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const userRole = roleResult.data?.role;

        // Set tutor online status in background (don't wait)
        if (userRole === "tutor") {
          supabase
            .from("tutor_profiles")
            .update({ is_online: true })
            .eq("user_id", data.user.id)
            .then(({ error: updateError }) => {
              if (updateError) {
                console.error("Error setting tutor online:", updateError);
              }
            });
        }

        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });

        // Redirect based on role immediately
        if (userRole === "admin") {
          navigate("/admin/dashboard");
        } else if (userRole === "tutor") {
          navigate("/tutor/dashboard");
        } else if (userRole === "learner") {
          navigate("/learner/dashboard");
        } else {
          navigate("/role-selection");
        }
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password reset link sent!",
        description: "Check your email inbox (and spam folder) for the reset link.",
      });
      
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      // Check if it's an email sending error
      const isEmailError = error.message?.includes("email") || error.message?.includes("Error sending");
      
      toast({
        title: isEmailError ? "Email was not sent" : "Error",
        description: isEmailError 
          ? "This may be because the email address is not verified in our system during testing. Please use a verified email address or contact support."
          : error.message || "Failed to send reset email",
        variant: isEmailError ? "default" : "destructive",
      });
      
      // Close dialog even if email fails (request was still processed)
      if (isEmailError) {
        setShowForgotPassword(false);
        setResetEmail("");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/role-selection" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
            <Link to="/" className="text-sm text-center text-muted-foreground hover:text-primary">
              ← Back to home
            </Link>
          </CardFooter>
        </form>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl">Reset Password</DialogTitle>
            <DialogDescription className="text-sm">
              Enter your email address and we'll send you a link to reset your password. Check your spam folder if you don't see the email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={resetLoading} className="w-full sm:w-auto">
                {resetLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
