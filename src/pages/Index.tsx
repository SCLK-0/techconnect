import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Users, BookOpen, Video, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/logo.png";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle OAuth callback, email confirmations, and password resets
    const handleAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      // Check for auth-related parameters
      const hasAuthToken = hashParams.has('access_token') || searchParams.has('access_token');
      const hasTokenHash = hashParams.has('token_hash') || searchParams.has('token_hash');
      const hasType = hashParams.has('type') || searchParams.has('type');
      const hasError = hashParams.has('error') || searchParams.has('error');
      
      // Check if this is a password reset (type=recovery)
      const type = hashParams.get('type') || searchParams.get('type');
      const isPasswordReset = type === 'recovery';
      
      if (hasAuthToken || hasTokenHash || hasType || hasError) {
        const fullHash = window.location.hash;
        const fullSearch = window.location.search;
        
        if (isPasswordReset) {
          console.log("Password reset detected, redirecting to reset-password");
          navigate(`/reset-password${fullSearch}${fullHash}`, { replace: true });
        } else {
          console.log("Auth parameters detected, redirecting to confirm-email");
          navigate(`/confirm-email${fullSearch}${fullHash}`, { replace: true });
        }
        return;
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="TechConnect Logo" className="w-10 h-10 rounded-xl" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              TechConnect
            </span>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero Section with Promotion Banner */}
      <section className="relative overflow-hidden pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="container relative mx-auto px-4">
          {/* Hero Content */}
          <div className="py-4 sm:py-8">
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">Welcome to TechConnect</span>
              </div>
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight max-w-4xl">
              Learn from{" "}
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                Peer Experts
              </span>
              <br />
              Anytime, Anywhere
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
              Connect with skilled tutors in Programming, Electronics, Automotive, Garments, and more. 
              Experience 1-on-1 sessions with interactive whiteboards and real-time collaboration.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" asChild className="text-lg px-8 shadow-lg hover:shadow-xl transition-all group">
                <Link to="/role-selection">
                  Get Started
                  <Sparkles className="ml-2 w-4 h-4 group-hover:rotate-12 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 border-2 hover:bg-accent/10">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>

            {/* Promotion Banner - Below CTA buttons */}
            <div className="w-full max-w-2xl pt-4">
              <div className="text-center p-6 rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm">
                <div className="inline-flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Limited Offer</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-1">
                  Win <span className="text-primary">₱1,000</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Test our system and get a chance to win
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Platform Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Why Choose TechConnect?
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Video,
                title: "Live Video Sessions",
                description: "High-quality 1-on-1 video calls with crystal clear audio"
              },
              {
                icon: BookOpen,
                title: "Interactive Whiteboard",
                description: "Draw, annotate, and collaborate in real-time"
              },
              {
                icon: Users,
                title: "Expert Tutors",
                description: "Learn from verified peer experts in your field"
              },
              {
                icon: GraduationCap,
                title: "Flexible Scheduling",
                description: "Book sessions or get instant help when available"
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-xl hover:-translate-y-1 duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-5 group-hover:from-primary/30 group-hover:to-accent/30 transition-all group-hover:scale-110 duration-300">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8 p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border-2 border-primary/20 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of students already learning from peer experts
              </p>
              <Button size="lg" asChild className="text-lg px-10 shadow-xl hover:shadow-2xl transition-all group">
                <Link to="/role-selection">
                  Join TechConnect
                  <Sparkles className="ml-2 w-4 h-4 group-hover:rotate-12 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>© 2024 TechConnect. All rights reserved.</p>
            <Link 
              to="/admin/login" 
              className="text-xs text-muted-foreground/50 hover:text-primary transition-colors"
            >
              Admin Access
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
