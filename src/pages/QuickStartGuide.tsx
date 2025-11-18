import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UserPlus, Search, Calendar, Video, MessageSquare, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QuickStartGuide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Quick Start Guide</h1>
          <p className="text-xl text-muted-foreground">
            Get started with TechConnect in minutes
          </p>
        </div>

        {/* For Learners */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-primary">For Learners</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>1. Create Your Account</CardTitle>
                    <CardDescription>Sign up as a learner</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Click "Get Started" on the homepage</li>
                  <li>Choose "Sign Up" and select "Learner"</li>
                  <li>Fill in your details and verify your email</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>2. Find a Tutor</CardTitle>
                    <CardDescription>Browse available tutors</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Go to "Find Tutors" from your dashboard</li>
                  <li>Filter by subject, year level, or availability</li>
                  <li>View tutor profiles and ratings</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>3. Book a Session</CardTitle>
                    <CardDescription>Schedule or request instant help</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Choose between scheduled sessions or instant requests</li>
                  <li>Select date, time, and subject</li>
                  <li>Add any specific topics or questions</li>
                  <li>Confirm your booking</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>4. Join Your Session</CardTitle>
                    <CardDescription>Connect with your tutor</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Click "Join Session" when it's time</li>
                  <li>Test your camera and microphone</li>
                  <li>Wait for the tutor to admit you</li>
                  <li>Use video, chat, and whiteboard tools</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>5. Rate Your Experience</CardTitle>
                    <CardDescription>Help others find great tutors</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>After the session, rate your tutor</li>
                  <li>Leave feedback about your experience</li>
                  <li>View session logs and notes</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* For Tutors */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-primary">For Tutors</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>1. Create Your Tutor Profile</CardTitle>
                    <CardDescription>Set up your account</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Sign up and select "Tutor"</li>
                  <li>Complete your profile with subjects and expertise</li>
                  <li>Set your hourly rate</li>
                  <li>Add a professional photo and bio</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>2. Set Your Availability</CardTitle>
                    <CardDescription>Let learners know when you're free</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Go to "Availability" in your dashboard</li>
                  <li>Set your weekly schedule</li>
                  <li>Enable instant requests if desired</li>
                  <li>Update as needed</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>3. Receive Booking Requests</CardTitle>
                    <CardDescription>Get notified of new sessions</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Receive notifications for new bookings</li>
                  <li>Review session details</li>
                  <li>Accept or decline requests</li>
                  <li>Respond to instant requests quickly</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Video className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>4. Conduct Your Session</CardTitle>
                    <CardDescription>Teach effectively online</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Join the session and admit the learner</li>
                  <li>Use video, audio, and screen sharing</li>
                  <li>Collaborate on the interactive whiteboard</li>
                  <li>Share resources and files</li>
                  <li>End the session when complete</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>5. Build Your Reputation</CardTitle>
                    <CardDescription>Grow your tutoring business</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Receive ratings and reviews from learners</li>
                  <li>Track your earnings and session history</li>
                  <li>Improve based on feedback</li>
                  <li>Build a strong profile to attract more students</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tips */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Pro Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ Test your camera and microphone before your first session</li>
              <li>✓ Use a stable internet connection for best video quality</li>
              <li>✓ Keep your profile updated with accurate information</li>
              <li>✓ Communicate clearly about session expectations</li>
              <li>✓ Be punctual and professional</li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button size="lg" onClick={() => navigate("/auth")}>
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
}
