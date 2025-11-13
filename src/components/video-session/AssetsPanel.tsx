import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Download, FileText, File, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Asset {
  id: string;
  session_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  uploader_name?: string;
}

interface AssetsPanelProps {
  sessionId: string;
  isMonitorMode?: boolean;
}

export function AssetsPanel({ sessionId, isMonitorMode = false }: AssetsPanelProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  useEffect(() => {
    loadAssets();

    // Subscribe to asset changes (insert and delete)
    const channel = supabase
      .channel(`assets-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_assets",
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          console.log("Asset added:", payload.new);
          const newAsset = payload.new as Asset;
          
          // Fetch uploader name
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", newAsset.uploaded_by)
            .single();

          if (profileError) {
            console.error("Error fetching uploader profile:", profileError);
          }

          setAssets((prev) => [...prev, {
            ...newAsset,
            uploader_name: profile?.full_name || "Unknown User",
          }]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "session_assets",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log("Asset deleted - realtime event:", payload.old);
          setAssets((prev) => {
            const filtered = prev.filter((asset) => asset.id !== payload.old.id);
            console.log("Remaining assets after delete:", filtered.length);
            return filtered;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const loadAssets = async () => {
    const { data } = await supabase
      .from("session_assets")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch uploader names separately
      const uploaderIds = [...new Set(data.map(a => a.uploaded_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", uploaderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      const assetsWithNames = data.map(asset => ({
        ...asset,
        uploader_name: profileMap.get(asset.uploaded_by) || "Unknown User",
      }));
      setAssets(assetsWithNames);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload to storage
      const filePath = `session-${sessionId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata
      const { error: dbError } = await supabase.from("session_assets").insert({
        session_id: sessionId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      // Reload assets to ensure UI is updated
      await loadAssets();
      
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const downloadFile = async (asset: Asset) => {
    try {
      const { data, error } = await supabase.storage
        .from("resources")
        .download(asset.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = asset.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("File downloaded");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const deleteFile = async (asset: Asset) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user is the uploader
      if (asset.uploaded_by !== user.id) {
        toast.error("You can only delete files you uploaded");
        return;
      }

      // Optimistically remove from UI immediately
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));

      // Delete from database first
      const { error: dbError } = await supabase
        .from("session_assets")
        .delete()
        .eq("id", asset.id);

      if (dbError) {
        console.error("Database delete error:", dbError);
        // Revert optimistic update on error
        setAssets((prev) => [...prev, asset]);
        throw dbError;
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("resources")
        .remove([asset.file_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Don't throw - file might already be deleted from storage
      }

      toast.success("File deleted successfully");
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast.error(error?.message || "Failed to delete file");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-muted/10">
      {/* Header - Hidden in monitor mode */}
      {!isMonitorMode && (
        <div className="p-4 border-b bg-background/95 backdrop-blur-sm">
          <label htmlFor="file-upload">
            <Button 
              variant="default" 
              disabled={uploading} 
              asChild
              className="w-full shadow-sm"
            >
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Files"}
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Assets List */}
      <ScrollArea className="flex-1 p-4">
        {assets.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center py-12 text-muted-foreground">
              <div className="bg-muted/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 opacity-50" />
              </div>
              <p className="font-medium">No files uploaded yet</p>
              <p className="text-sm mt-2">Upload and share files with your peer</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map((asset) => {
              const isOwner = currentUserId === asset.uploaded_by;

              return (
                <div
                  key={asset.id}
                  className="group p-3 bg-card rounded-lg border shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="bg-primary/10 rounded-lg p-2 shrink-0">
                      <File className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{asset.file_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatFileSize(asset.file_size)} • {format(new Date(asset.created_at), "MMM d, p")}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        Uploaded by {asset.uploader_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => downloadFile(asset)}
                      title="Download"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteFile(asset)}
                        title="Delete"
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
