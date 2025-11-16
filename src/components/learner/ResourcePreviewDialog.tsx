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

  const getFilePreview = () => {
    const fileType = resource.file_type.toLowerCase();
    
    // PDF files
    if (fileType === 'pdf') {
      return (
        <iframe
          src={`${resource.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
          className="w-full h-[600px] border-0 rounded"
          title="PDF Preview"
        />
      );
    }
    
    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType)) {
      return (
        <img
          src={resource.file_url}
          alt={resource.title}
          className="w-full h-auto max-h-[600px] object-contain rounded"
        />
      );
    }
    
    // Text files
    if (fileType === 'txt') {
      return (
        <iframe
          src={resource.file_url}
          className="w-full h-[600px] border-0 bg-white rounded"
          title="Text Preview"
        />
      );
    }
    
    // Office documents (Word, Excel, PowerPoint)
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileType)) {
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resource.file_url)}`}
          className="w-full h-[600px] border-0 rounded"
          title="Office Document Preview"
        />
      );
    }
    
    // For other file types, show a message
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center p-8 bg-muted/30 rounded">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Preview not available</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This file type cannot be previewed in the browser.
        </p>
        <Button onClick={() => window.open(resource.file_url, '_blank')}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in New Tab
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon(resource.file_type)}
            {resource.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
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

          <div className="border rounded-lg overflow-hidden bg-muted/30">
            <div className="p-3 bg-muted/50 border-b">
              <h4 className="text-sm font-semibold">File Preview</h4>
            </div>
            <div className="p-4">
              {getFilePreview()}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
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
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
