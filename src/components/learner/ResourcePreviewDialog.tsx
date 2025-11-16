import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Resource {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  tutor_name?: string;
  download_count?: number;
  created_at: string;
}

interface ResourcePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource | null;
  onDownload: () => void;
}

export const ResourcePreviewDialog = ({
  open,
  onOpenChange,
  resource,
  onDownload,
}: ResourcePreviewDialogProps) => {
  if (!resource) return null;

  const getFileIcon = (fileType: string) => {
    return <FileText className="h-5 w-5" />;
  };

  const canPreviewInline = (fileType: string) => {
    const previewableTypes = ['pdf', 'txt', 'jpg', 'jpeg', 'png', 'gif'];
    return previewableTypes.includes(fileType.toLowerCase());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon(resource.file_type)}
            {resource.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className="text-sm">
              {resource.file_type.toUpperCase()}
            </Badge>
            {resource.tutor_name && (
              <span className="text-sm text-muted-foreground">
                By {resource.tutor_name}
              </span>
            )}
            {resource.download_count !== undefined && (
              <span className="text-sm text-muted-foreground">
                {resource.download_count} downloads
              </span>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {resource.description || "No description provided"}
            </p>
          </div>

          {canPreviewInline(resource.file_type) && (
            <div className="border rounded-lg overflow-hidden bg-muted/30">
              <div className="p-4 bg-muted/50 border-b">
                <h4 className="text-sm font-semibold">Preview</h4>
              </div>
              <div className="p-4">
                {resource.file_type.toLowerCase() === 'pdf' ? (
                  <iframe
                    src={resource.file_url}
                    className="w-full h-[500px] border-0"
                    title="PDF Preview"
                  />
                ) : ['jpg', 'jpeg', 'png', 'gif'].includes(resource.file_type.toLowerCase()) ? (
                  <img
                    src={resource.file_url}
                    alt={resource.title}
                    className="w-full h-auto max-h-[500px] object-contain"
                  />
                ) : resource.file_type.toLowerCase() === 'txt' ? (
                  <iframe
                    src={resource.file_url}
                    className="w-full h-[500px] border-0 bg-white"
                    title="Text Preview"
                  />
                ) : null}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => window.open(resource.file_url, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </Button>
            <Button 
              className="flex-1"
              onClick={() => {
                onDownload();
                onOpenChange(false);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
