import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface DonationQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qrCodeUrl: string;
  tutorName: string;
}

export function DonationQRDialog({ open, onOpenChange, qrCodeUrl, tutorName }: DonationQRDialogProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${tutorName}-donation-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Support {tutorName}</DialogTitle>
          <DialogDescription>
            Scan this QR code to send a tip or donation to your tutor as appreciation for their teaching.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative bg-white p-4 rounded-lg border-2 border-border">
            <img 
              src={qrCodeUrl} 
              alt="Donation QR Code" 
              className="w-64 h-64 object-contain"
            />
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            This is optional. Your tutor will appreciate any support you can provide!
          </p>
          
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>
            <Button 
              variant="default" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
