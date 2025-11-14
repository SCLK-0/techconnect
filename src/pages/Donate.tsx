import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LearnerSidebar } from "@/components/learner/LearnerSidebar";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Heart, Info } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";
import { Upload } from "lucide-react";
import instapayQR from "@/assets/instapay-qr-code.jpg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const donationSchema = z.object({
  amount: z.number().min(10, "Minimum donation is ₱10").max(100000, "Maximum donation is ₱100,000"),
  donorName: z.string().trim().max(100, "Name must be less than 100 characters").optional(),
  proofOfPayment: z.instanceof(File, { message: "Please upload proof of payment" }),
  selectedTutor: z.string().optional(),
});

export default function Donate() {
  const { role, loading } = useUserRole();
  const [donationType, setDonationType] = useState<"platform" | "tutor">("platform");
  const [selectedTutor, setSelectedTutor] = useState("");
  const [amount, setAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const { data: tutors = [] } = useQuery({
    queryKey: ["approved-tutors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tutor_profiles")
        .select("user_id")
        .eq("status", "approved");
      if (error) throw error;
      
      const userIds = data.map(t => t.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      return data.map(t => ({ ...t, tutor_name: profileMap.get(t.user_id) }));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!proofFile) {
      toast.error("Please upload proof of payment");
      return;
    }

    const validation = donationSchema.safeParse({
      amount: parseFloat(amount),
      donorName: donorName || undefined,
      proofOfPayment: proofFile,
      selectedTutor: donationType === "tutor" ? selectedTutor : undefined,
    });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    
    if (donationType === "tutor" && !selectedTutor) {
      toast.error("Please select a tutor");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to donate");
      return;
    }

    // Upload proof of payment
    const fileExt = proofFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('donation-proofs')
      .upload(filePath, proofFile);

    if (uploadError) {
      toast.error("Failed to upload proof of payment: " + uploadError.message);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('donation-proofs')
      .getPublicUrl(filePath);

    // Insert donation record
    const { error } = await supabase.from("donations").insert({
      donor_id: user.id,
      recipient_id: donationType === "tutor" ? selectedTutor : null,
      amount: parseFloat(amount),
      donor_name: donorName || null,
      proof_of_payment: publicUrl,
      recipient_type: donationType,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to submit donation: " + error.message);
      return;
    }

    toast.success("Donation submitted successfully! We will verify your payment shortly.");
    setAmount("");
    setDonorName("");
    setProofFile(null);
    setSelectedTutor("");
  };

  // Don't render until role is loaded to prevent sidebar switching
  if (loading) {
    return null; // Return nothing during load to prevent flash
  }

  const Sidebar = role === "admin" ? AdminSidebar : role === "tutor" ? TutorSidebar : LearnerSidebar;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-between px-6 bg-card">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Donate</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <UserMenu />
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Support Us
                  </CardTitle>
                  <CardDescription>
                    Help us continue providing quality education or show appreciation to a tutor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-6 bg-primary/10 border-primary">
                    <AlertDescription className="text-center space-y-4">
                      <div className="font-semibold text-lg">Scan to Pay via InstaPay</div>
                      <div className="flex justify-center">
                        <img 
                          src={instapayQR} 
                          alt="InstaPay QR Code" 
                          className="w-64 h-64 rounded-lg shadow-md"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Scan with your InstaPay-enabled banking app
                      </div>
                    </AlertDescription>
                  </Alert>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <Label>Donation Type</Label>
                      <RadioGroup value={donationType} onValueChange={(v) => setDonationType(v as any)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="platform" id="platform" />
                          <Label htmlFor="platform" className="cursor-pointer">
                            Platform Development
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="tutor" id="tutor" />
                          <Label htmlFor="tutor" className="cursor-pointer">
                            Specific Tutor
                          </Label>
                          <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
                            <DialogTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 ml-1"
                              >
                                <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-base">
                                  <Info className="h-4 w-4 text-primary" />
                                  About Donations
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3 text-xs sm:text-sm">
                                <div className="space-y-1">
                                  <h3 className="font-semibold text-sm">Monitoring</h3>
                                  <p className="text-muted-foreground leading-relaxed">
                                    All donations are verified by our admin team with proof of payment.
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <h3 className="font-semibold text-sm">Platform Development</h3>
                                  <p className="text-muted-foreground leading-relaxed">
                                    Funds support hosting, features, security, and improvements.
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <h3 className="font-semibold text-sm">Tutor Donations</h3>
                                  <p className="text-muted-foreground leading-relaxed">
                                    100% goes directly to the tutor as appreciation for their teaching.
                                  </p>
                                </div>

                                <div className="border-t pt-3 space-y-1">
                                  <h3 className="font-semibold text-sm">Future: PayMongo Integration</h3>
                                  <p className="text-muted-foreground leading-relaxed">
                                    We're planning automated payments via PayMongo. Currently using InstaPay because it's accessible, transparent, and helps build trust during testing.
                                  </p>
                                </div>

                                <div className="bg-primary/10 p-2.5 rounded-lg">
                                  <p className="text-xs font-medium leading-relaxed">
                                    💙 Thank you for supporting TechConnect!
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </RadioGroup>
                    </div>

                    {donationType === "tutor" && (
                      <div>
                        <Label htmlFor="tutor-select">Select Tutor</Label>
                        <Select value={selectedTutor} onValueChange={setSelectedTutor}>
                          <SelectTrigger id="tutor-select">
                            <SelectValue placeholder="Choose a tutor" />
                          </SelectTrigger>
                          <SelectContent>
                            {tutors.map((tutor) => (
                              <SelectItem key={tutor.user_id} value={tutor.user_id}>
                                {tutor.tutor_name || "Unknown"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="amount">Amount (₱)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="10"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="50"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="donor-name">Your Name (Optional)</Label>
                      <Input
                        id="donor-name"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="Juan Dela Cruz"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Leave blank if you wish to remain anonymous
                      </p>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <Label htmlFor="proof-upload">Upload Proof of Payment</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="proof-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                          className="cursor-pointer"
                          required
                        />
                      </div>
                      {proofFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {proofFile.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Upload a screenshot of your InstaPay payment confirmation
                      </p>
                    </div>

                    <Button type="submit" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Donation
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
