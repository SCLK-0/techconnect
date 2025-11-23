import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DonationQRManagerProps {
  userId: string;
  currentQRCode: string;
  onUpdate: (qrCode: string) => void;
}

export function DonationQRManager({ userId, currentQRCode, onUpdate }: DonationQRManagerProps) {
  const [uploading, setUploading] = useState(false);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  const handleQRCodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Save to tutor_profiles
        const { error } = await supabase
          .from("tutor_profiles")
          .update({ donation_qr_code: base64String } as any)
          .eq("user_id", userId);

        if (error) throw error;

        onUpdate(base64String);
        toast.success("Donation QR code uploaded successfully!");
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Error uploading QR code:", error);
      toast.error("Failed to upload QR code");
      setUploading(false);
    }
  };

  const handleRemoveQRCode = async () => {
    try {
      const { error } = await supabase
        .from("tutor_profiles")
        .update({ donation_qr_code: null } as any)
        .eq("user_id", userId);

      if (error) throw error;

      onUpdate("");
      toast.success("Donation QR code removed");
    } catch (error: any) {
      console.error("Error removing QR code:", error);
      toast.error("Failed to remove QR code");
    }
  };

  return (
    <Card className="border-2 w-full max-w-full overflow-hidden">
      <CardHeader>
        <CardTitle>Donation QR Code</CardTitle>
        <CardDescription>
          Upload a QR code for learners to send you tips or donations after sessions (optional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentQRCode ? (
          <div className="space-y-4">
            <div className="relative bg-white p-4 rounded-lg border-2 border-border inline-block">
              <img 
                src={currentQRCode} 
                alt="Donation QR Code" 
                className="w-48 h-48 object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => qrFileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Replace QR Code
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemoveQRCode}
                disabled={uploading}
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                No QR code uploaded yet. Upload one so learners can support you!
              </p>
              <Button
                onClick={() => qrFileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload QR Code
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        
        <input
          ref={qrFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleQRCodeUpload}
          className="hidden"
        />
        
        <p className="text-xs text-muted-foreground">
          💡 Tip: Upload a GCash, PayMaya, or bank QR code. Learners will see this after completing sessions with you.
        </p>
      </CardContent>
    </Card>
  );
}
