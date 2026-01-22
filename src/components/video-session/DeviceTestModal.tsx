import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, Settings } from "lucide-react";
import { toast } from "sonner";
import { AudioVisualizer } from "./AudioVisualizer";
import { DeviceSelector } from "./DeviceSelector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

interface DeviceTestModalProps {
  open: boolean;
  onContinue: (stream: MediaStream) => void;
  onCancel: () => void;
  sessionData: any;
}

export function DeviceTestModal({ open, onContinue, onCancel, sessionData }: DeviceTestModalProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [userProfile, setUserProfile] = useState<{ full_name?: string; avatar_url?: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load user profile for camera off display
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", user.id)
          .single();
        if (profile) {
          setUserProfile(profile);
        }
      }
    };
    if (open) {
      loadProfile();
    }
  }, [open]);

  const initDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simple request - let browser choose default devices
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.deviceId) setSelectedVideoDevice(settings.deviceId);
      }
      
      if (audioTrack) {
        const settings = audioTrack.getSettings();
        if (settings.deviceId) setSelectedAudioDevice(settings.deviceId);
      }

      setLocalStream(stream);
      setIsLoading(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      toast.success("Camera and microphone ready!");
    } catch (err: any) {
      console.error("Device access error:", err);
      setIsLoading(false);
      
      let errorMessage = "Failed to access camera/microphone. ";
      if (err.name === "NotAllowedError") {
        errorMessage += "Please allow camera/microphone access.";
      } else if (err.name === "NotFoundError") {
        errorMessage += "No camera or microphone found.";
      } else if (err.name === "NotReadableError") {
        errorMessage += "Camera/microphone is in use by another app.";
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
    }
  };


  const handleDeviceChange = async (deviceId: string, kind: "videoinput" | "audioinput") => {
    // Stop current stream and clear video element
    if (localStream) {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    setIsLoading(true);
    setError(null);
    
    // Wait for device to be fully released
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const constraints: MediaStreamConstraints = {
        video: kind === "videoinput" 
          ? { deviceId: { exact: deviceId } }
          : selectedVideoDevice 
            ? { deviceId: { exact: selectedVideoDevice } }
            : true,
        audio: kind === "audioinput"
          ? { deviceId: { exact: deviceId } }
          : selectedAudioDevice
            ? { deviceId: { exact: selectedAudioDevice } }
            : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      if (videoTrack) {
        videoTrack.enabled = isCameraOn;
        const settings = videoTrack.getSettings();
        if (settings.deviceId) setSelectedVideoDevice(settings.deviceId);
      }
      
      if (audioTrack) {
        audioTrack.enabled = isMicOn;
        const settings = audioTrack.getSettings();
        if (settings.deviceId) setSelectedAudioDevice(settings.deviceId);
      }

      setLocalStream(stream);
      setIsLoading(false);
      
      // Update video element with new stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log("Video play error:", e));
      }
    } catch (err: any) {
      console.error("Device change error:", err);
      setIsLoading(false);
      setError("Failed to switch device: " + err.message);
      // Try to reinitialize with defaults
      await initDevices();
    }
  };

  // Bind localStream to video element whenever it changes
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
      videoRef.current.play().catch(e => console.log("Video play error:", e));
    }
  }, [localStream]);

  useEffect(() => {
    if (open) {
      initDevices();
    }
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [open]);

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const handleContinue = () => {
    if (localStream) {
      onContinue(localStream);
    }
  };

  const handleCancel = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };


  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-4xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl break-words">{sessionData?.subject || "Session"}</DialogTitle>
          <DialogDescription className="sr-only">Test your devices</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex items-center justify-center text-white p-4">
                  <div className="text-center">
                    <VideoOff className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm mb-3">{error}</p>
                    <Button variant="secondary" size="sm" onClick={initDevices}>Try Again</Button>
                  </div>
                </div>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              )}

              {!isCameraOn && !isLoading && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 z-10">
                  {userProfile?.avatar_url ? (
                    <img 
                      src={userProfile.avatar_url} 
                      alt={userProfile?.full_name || "You"} 
                      className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-white/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {userProfile?.full_name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  {userProfile?.full_name && (
                    <p className="mt-2 text-white text-sm font-medium">{userProfile.full_name}</p>
                  )}
                  <VideoOff className="w-4 h-4 text-white/50 mt-1" />
                </div>
              )}

              {!isLoading && !error && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                  <Button type="button" size="icon" variant={isCameraOn ? "secondary" : "destructive"} onClick={toggleCamera} className="rounded-full h-12 w-12">
                    {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  <Button type="button" size="icon" variant={isMicOn ? "secondary" : "destructive"} onClick={toggleMic} className="rounded-full h-12 w-12">
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" size="icon" variant="secondary" className="rounded-full h-12 w-12">
                        <Settings className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 z-[100]">
                      <DeviceSelector onDeviceChange={handleDeviceChange} selectedVideoDevice={selectedVideoDevice} selectedAudioDevice={selectedAudioDevice} />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Microphone Test</div>
              <div className="bg-muted/50 rounded-xl p-6 border">
                <AudioVisualizer stream={localStream} isActive={isMicOn && !isLoading && !error} />
              </div>
              <p className="text-xs text-muted-foreground text-center">{isMicOn ? "🎤 Speak to see audio levels" : "🔇 Microphone is muted"}</p>
            </div>
          </div>


          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Subject:</span>
                <span className="text-muted-foreground">{sessionData?.subject}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-sm mb-1">Date:</div>
                  <div className="text-sm text-muted-foreground">
                    {sessionData?.scheduled_at && new Date(sessionData.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-sm mb-1">Time:</div>
                  <div className="text-sm text-muted-foreground">
                    {sessionData?.scheduled_at && new Date(sessionData.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div>
                <div className="font-medium text-sm mb-2">Participants:</div>
                <div className="space-y-2">
                  {sessionData?.tutor_profiles && (
                    <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                        {sessionData.tutor_profiles.full_name?.charAt(0) || 'T'}
                      </div>
                      <span className="text-sm">{sessionData.tutor_profiles.full_name}</span>
                    </div>
                  )}
                  {sessionData?.learner_profiles && (
                    <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-medium">
                        {sessionData.learner_profiles.full_name?.charAt(0) || 'L'}
                      </div>
                      <span className="text-sm">{sessionData.learner_profiles.full_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-primary/10 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Ready to join?</p>
              <p className="text-muted-foreground">Make sure your camera and microphone are working properly.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button onClick={handleContinue} disabled={isLoading || !!error} size="lg" className="w-full sm:w-auto rounded-xl order-1">
            Join the Session
          </Button>
          <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto rounded-xl order-2 sm:order-1">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
