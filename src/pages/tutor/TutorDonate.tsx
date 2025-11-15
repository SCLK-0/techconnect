import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TutorSidebar } from "@/components/tutor/TutorSidebar";
import { Heart, Upload } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from "zod";
import instapayQR from "@/assets/instapay-qr-code.jpg";

const donationSchema = z.object({
  amount: z.number().min(10, "Minimum donation is ₱10").max(100000, "Maximum donation is ₱100,000"),
  donorName: z.string().trim().max(100, "Name must be less than 100 characters").optional(),
  proofOfPayment: z.instanceof(File, { message: "Please upload proof of payment" }),
});

export default function TutorDonate() {
  const { user } = useUserRole();
  const [amount, setAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

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
    });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }
    if (!user) return;

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

    const { error } = await supabase.from("donations").insert({
      donor_id: user.id,
      recipient_type: "platform",
      recipient_id: null,
      amount: parseFloat(amount),
      donor_name: donorName || null,
      proof_of_payment: publicUrl,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to submit donation");
    } else {
      toast.success("Donation submitted successfully! We will verify your payment shortly.");
      setAmount("");
      setDonorName("");
      setProofFile(null);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <TutorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center justify-between px-4">
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
                    Support Platform Development
                  </CardTitle>
                  <CardDescription>
                    Help us improve and maintain this tutoring platform
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
                    <div>
                      <Label htmlFor="amount">Amount (₱)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="10"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="100"
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
