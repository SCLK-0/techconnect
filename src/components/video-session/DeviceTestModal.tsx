import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { AudioVisualizer } from "./AudioVisualizer";
import { DeviceSelector } from "./DeviceSelector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings } from "lucide-react";

interface DeviceTestModalProps {
  open: boolean;
  onContinue: (stream: MediaStream) => void;
  onCancel: () => void;
  sessionData: any;
  role: "tutor" | "learner" | "admin" | null;
}

export function DeviceTestModal({ open, onContinue, onCancel, sessionData, role }: DeviceTestModalProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const initDevices = async (videoDeviceId?: string, audioDeviceId?: string, preserveStates?: { camera: boolean, mic: boolean }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Requesting camera and microphone access...", preserveStates ? "with preserved states" : "");
      
      const constraints: MediaStreamConstraints = {
        video: videoDeviceId 
          ? { deviceId: { exact: videoDeviceId } }
          : true,
        audio: audioDeviceId
          ? { deviceId: { exact: audioDeviceId } }
          : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log("Stream obtained:", stream.getTracks().map(t => `${t.kind}: ${t.label}`));

      // Get actual device IDs from the stream
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      // Apply preserved states if provided
      if (preserveStates) {
        console.log("Applying preserved states:", preserveStates);
        if (videoTrack) {
          videoTrack.enabled = preserveStates.camera;
          setIsCameraOn(preserveStates.camera);
        }
        if (audioTrack) {
          audioTrack.enabled = preserveStates.mic;
          setIsMicOn(preserveStates.mic);
        }
      }
      
      if (videoTrack) {
        const videoSettings = videoTrack.getSettings();
        console.log("Active video device:", videoSettings.deviceId, videoTrack.label, "enabled:", videoTrack.enabled);
        if (videoSettings.deviceId) {
          setSelectedVideoDevice(videoSettings.deviceId);
        }
      }
      
      if (audioTrack) {
        const audioSettings = audioTrack.getSettings();
        console.log("Active audio device:", audioSettings.deviceId, audioTrack.label, "enabled:", audioTrack.enabled);
        if (audioSettings.deviceId) {
          setSelectedAudioDevice(audioSettings.deviceId);
        }
      }

      setLocalStream(stream);
      setIsLoading(false);
      
      // Set video source with delay to ensure ref is ready
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.log("Video play error:", e));
        }
      }, 200);
      
      toast.success("Camera and microphone ready!");
      return stream;
    } catch (err: any) {
      console.error("Device access error:", err);
      
      setIsLoading(false);
      let errorMessage = "Failed to access camera/microphone. ";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage += "Please click 'Allow' when your browser asks for permission.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage += "No camera or microphone found. Please connect devices and try again.";
      } else if (err.name === "NotReadableError") {
        errorMessage += "Camera/microphone is in use by another application. Please close other apps.";
      } else if (err.name === "OverconstrainedError") {
        errorMessage += "Device constraints not supported.";
      } else {
        errorMessage += "Please check your browser settings and refresh the page.";
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    let mounted = true;

    const init = async () => {
      if (mounted) {
        await initDevices();
      }
    };

    init();

    return () => {
      mounted = false;
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }
    };
  }, [open]);

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  };

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  const handleDeviceChange = async (deviceId: string, kind: "videoinput" | "audioinput") => {
    // Save current camera/mic states before reinitializing
    const currentCameraState = isCameraOn;
    const currentMicState = isMicOn;
    
    console.log("Device change - saving states:", { camera: currentCameraState, mic: currentMicState });
    
    if (kind === "videoinput") {
      setSelectedVideoDevice(deviceId);
      // Stop current stream and reinitialize with new device
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      await initDevices(deviceId, selectedAudioDevice, { camera: currentCameraState, mic: currentMicState });
    } else {
      setSelectedAudioDevice(deviceId);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      await initDevices(selectedVideoDevice, deviceId, { camera: currentCameraState, mic: currentMicState });
    }
  };

  const handleContinue = () => {
    if (localStream) {
      onContinue(localStream);
    }
  };

  const handleCancel = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-4xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl break-words">{sessionData?.subject || "Interactive Session"}</DialogTitle>
          <DialogDescription className="sr-only">
            Test your camera and microphone before joining the session
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Video Preview */}
          <div className="space-y-4">
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden aspect-video">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Loading devices...</p>
                    <p className="text-xs mt-2 opacity-75">This may take a few seconds</p>
                  </div>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center px-4">
                    <VideoOff className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm mb-4">{error}</p>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => initDevices()}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Camera off overlay - Must be before controls to not block them */}
              {!isCameraOn && !isLoading && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
                  <VideoOff className="w-12 h-12 text-white opacity-75" />
                </div>
              )}

              {/* Controls Overlay - Higher z-index to be above camera-off overlay */}
              {!isLoading && !error && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                  <Button
                    type="button"
                    size="icon"
                    variant={isCameraOn ? "secondary" : "destructive"}
                    onClick={toggleCamera}
                    className="rounded-full h-12 w-12"
                  >
                    {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant={isMicOn ? "secondary" : "destructive"}
                    onClick={toggleMic}
                    className="rounded-full h-12 w-12"
                  >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="rounded-full h-12 w-12"
                        title="Settings"
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <DeviceSelector 
                        onDeviceChange={handleDeviceChange}
                        selectedVideoDevice={selectedVideoDevice}
                        selectedAudioDevice={selectedAudioDevice}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Audio Test */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Microphone Test</div>
              <div className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl p-6 border border-border/50">
                <AudioVisualizer stream={localStream} isActive={isMicOn && !isLoading && !error} />
              </div>
              <p className="text-xs text-muted-foreground text-center font-medium">
                {isMicOn ? "🎤 Speak to see audio levels" : "🔇 Microphone is muted"}
              </p>
            </div>
          </div>

          {/* Session Details */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Subject:</span>
                <span className="text-muted-foreground break-words">{sessionData?.subject}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-sm mb-1">Date:</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(sessionData?.scheduled_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-sm mb-1">Time:</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(sessionData?.scheduled_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              <div>
                <div className="font-medium text-sm mb-2">Participants:</div>
                <div className="space-y-2">
                  {sessionData?.tutor_profiles && (
                    <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium flex-shrink-0">
                        {sessionData.tutor_profiles.full_name?.charAt(0) || 'T'}
                      </div>
                      <span className="text-sm break-words">{sessionData.tutor_profiles.full_name}</span>
                    </div>
                  )}
                  {sessionData?.learner_profiles && (
                    <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-medium flex-shrink-0">
                        {sessionData.learner_profiles.full_name?.charAt(0) || 'L'}
                      </div>
                      <span className="text-sm break-words">{sessionData.learner_profiles.full_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {sessionData?.learner_comment && (
                <div>
                  <div className="font-medium text-sm mb-1">Comment:</div>
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    {sessionData.learner_comment}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-primary/10 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Ready to join?</p>
              <p className="text-muted-foreground">Make sure your camera and microphone are working properly before joining the session.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button 
            onClick={handleContinue} 
            disabled={isLoading || !!error}
            size="lg"
            className="w-full sm:w-auto rounded-xl order-1"
          >
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
