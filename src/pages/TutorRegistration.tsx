import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Sparkles, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";

const registrationSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  bio: z.string().trim().min(10, "Bio must be at least 10 characters").max(500, "Bio must be less than 500 characters"),
  subjects: z.array(z.string()).min(1, "Please select at least one subject").max(10, "Maximum 10 subjects allowed"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

const subjects = [
  "Programming",
  "Software Development",
  "Electronics",
  "Circuit Design",
  "Automotive",
  "Mechanical Systems",
  "Garments",
  "Fashion Design",
  "Industrial Design",
  "Manufacturing",
  "Quality Control",
  "Project Management",
  "Other",
];

const TutorRegistration = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [otherSubject, setOtherSubject] = useState("");
  const [bio, setBio] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare subjects list with "Other" replaced by custom input
    const finalSubjects = selectedSubjects.map(subject => 
      subject === "Other" && otherSubject.trim() ? otherSubject.trim() : subject
    ).filter(subject => subject !== "Other" || otherSubject.trim());
    
    const validation = registrationSchema.safeParse({
      fullName,
      bio,
      subjects: finalSubjects,
      password,
    });
    
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedSubjects.includes("Other") && !otherSubject.trim()) {
      toast({
        title: "Please specify subject",
        description: "You selected 'Other', please specify the subject",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Sign up with metadata - profile and tutor data will be created after email confirmation
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm-email`,
          data: {
            full_name: fullName,
            bio: bio,
            subject_expertise: finalSubjects,
            is_tutor: true,
          },
        },
      });

      if (authError) throw authError;

      toast({
        title: "Application submitted!",
        description: "Please check your email (and spam folder) to confirm your account. Your tutor profile will be pending approval after confirmation.",
      });
      
      // Redirect to confirmation page
      navigate("/confirm-email");
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Check for specific error types
      const isUserExists = error.message?.toLowerCase().includes("already") || 
                          error.message?.toLowerCase().includes("registered") ||
                          error.message?.toLowerCase().includes("exists");
      const isEmailError = error.message?.includes("Error sending") || 
                          error.message?.includes("email") && !isUserExists;
      
      if (isUserExists) {
        toast({
          title: "Email already registered",
          description: "This email is already registered. Please sign in instead.",
          variant: "destructive",
        });
      } else if (isEmailError) {
        toast({
          title: "Email was not sent",
          description: "This may be because the email address is not verified in our system during testing. Please use a verified email address or contact support.",
        });
        // If it's just an email error, still redirect to confirmation page
        navigate("/confirm-email");
      } else {
        toast({
          title: "Registration failed",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4 py-12 relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <Card className="w-full max-w-2xl shadow-2xl border-2 relative z-10">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Users className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Tutor Registration
              </CardTitle>
            </div>
          </div>
          <CardDescription className="text-center text-base">
            Complete your profile to get started as a tutor
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
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
                <PasswordStrengthMeter password={password} />
                <p className="text-xs text-muted-foreground">
                  Min 8 chars, uppercase, lowercase, number, special character
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Subject Expertise</Label>
              <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                {subjects.map((subject) => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox
                      id={subject}
                      checked={selectedSubjects.includes(subject)}
                      onCheckedChange={() => handleSubjectToggle(subject)}
                    />
                    <label
                      htmlFor={subject}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {subject}
                    </label>
                  </div>
                ))}
              </div>
              {selectedSubjects.includes("Other") && (
                <div className="space-y-2 mt-3">
                  <Label htmlFor="otherSubject" className="text-sm font-medium">Specify Other Subject</Label>
                  <Input
                    id="otherSubject"
                    placeholder="Enter subject name..."
                    value={otherSubject}
                    onChange={(e) => setOtherSubject(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-semibold">Bio/Introduction</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself and your tutoring experience..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                required
              />
              <p className="text-sm text-muted-foreground">
                Share your experience, qualifications, and what makes you a great tutor
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-8">
            <div className="flex gap-3 w-full">
              <Button type="button" variant="outline" className="flex-1 border-2" asChild>
                <Link to="/role-selection">Back</Link>
              </Button>
              <Button type="submit" className="flex-1 shadow-lg hover:shadow-xl transition-all group" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <Sparkles className="ml-2 w-4 h-4 group-hover:rotate-12 transition-transform" />
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Your account will be reviewed by our team before activation
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default TutorRegistration;
