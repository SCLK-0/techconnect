import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, MonitorUp, Settings } from "lucide-react";

interface VideoControlsProps {
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleScreenShare: () => void;
}

export function VideoControls({
  isCameraOn,
  isMicOn,
  isScreenSharing,
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
}: VideoControlsProps) {
  return (
    <div className="p-3 bg-background border-b flex items-center justify-center gap-2">
      <Button
        variant={isCameraOn ? "default" : "destructive"}
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleCamera();
        }}
        title={isCameraOn ? "Turn off camera" : "Turn on camera"}
        type="button"
      >
        {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
      </Button>
      <Button
        variant={isMicOn ? "default" : "destructive"}
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleMic();
        }}
        title={isMicOn ? "Mute microphone" : "Unmute microphone"}
        type="button"
      >
        {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      </Button>
      <Button
        variant={isScreenSharing ? "secondary" : "outline"}
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleScreenShare();
        }}
        title={isScreenSharing ? "Stop sharing" : "Share screen"}
        type="button"
      >
        <MonitorUp className="h-4 w-4" />
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        title="Settings"
        type="button"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}
