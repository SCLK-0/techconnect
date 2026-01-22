import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VideoControls } from "@/components/video-session/VideoControls";
import { WhiteboardCanvas } from "@/components/video-session/WhiteboardCanvas";
import { SessionChat } from "@/components/video-session/SessionChat";
import { AssetsPanel } from "@/components/video-session/AssetsPanel";
import { SessionTimer } from "@/components/video-session/SessionTimer";
import { SessionFeedbackModal } from "@/components/video-session/SessionFeedbackModal";
import { SessionLogModal } from "@/components/video-session/SessionLogModal";
import { WaitingRoom } from "@/components/video-session/WaitingRoom";
import { TutorAdmitControl } from "@/components/video-session/TutorAdmitControl";
import { DeviceTestModal } from "@/components/video-session/DeviceTestModal";
import { DeviceSelector } from "@/components/video-session/DeviceSelector";
import { AudioVisualizer } from "@/components/video-session/AudioVisualizer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Video, 
  VideoOff, 
  Maximize, 
  Mic, 
  MicOff, 
  X, 
  Settings, 
  MonitorUp,
  Upload,
  MessageSquare,
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAudioLevel } from "@/hooks/useAudioLevel";
import { SupabaseWebRTC } from "@/utils/supabaseSignaling";
import { ObserverWebRTC } from "@/utils/observerWebRTC";
import { Badge } from "@/components/ui/badge";
import { ConnectionStatus } from "@/components/video-session/ConnectionStatus";
import { Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Connection state type for the new signaling
interface ConnectionState {
  isConnected: boolean;
  quality: 'good' | 'poor' | 'disconnected';
  reconnectAttempts: number;
  lastConnectedAt: Date | null;
}

// Component to show profile picture when remote video is disabled
function RemoteCameraOffIndicator({ 
  isCameraOn, 
  isScreenSharing, 
  profilePicture, 
  userName 
}: { 
  isCameraOn: boolean; 
  isScreenSharing: boolean; 
  profilePicture?: string; 
  userName?: string;
}) {
  // Show video if camera is on OR screen sharing
  if (isCameraOn || isScreenSharing) {
    return null;
  }

  // Camera is off and not screen sharing - show profile picture
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg z-20">
      {profilePicture ? (
        <img 
          src={profilePicture} 
          alt={userName || "User"} 
          className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-lg"
        />
      ) : (
        <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-white/20 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {userName?.charAt(0).toUpperCase() || "?"}
          </span>
        </div>
      )}
      {userName && (
        <p className="mt-2 text-white text-xs font-medium">{userName}</p>
      )}
      <VideoOff className="w-4 h-4 text-white/50 mt-1" />
    </div>
  );
}

export default function VideoSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useUserRole();
  
  // Supabase WebRTC signaling (replaces PeerJS)
  const webrtcRef = useRef<SupabaseWebRTC | null>(null);
  const observerWebrtcRef = useRef<ObserverWebRTC | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    quality: 'disconnected',
    reconnectAttempts: 0,
    lastConnectedAt: null
  });
  
  // Check if in observer mode (tag-along viewing)
  const [isObserverMode, setIsObserverMode] = useState(() => {
    return window.location.pathname.startsWith('/observer/');
  });
  
  // Check if in monitor mode (admin viewing)
  const [isMonitorMode, setIsMonitorMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const monitorParam = params.get('monitor');
    return monitorParam === 'true';
  });
  const [adminMonitoring, setAdminMonitoring] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const monitorParam = params.get('monitor');
    const isAdminMonitor = monitorParam === 'true' && role === 'admin';
    setIsMonitorMode(isAdminMonitor);
    
    // Check if in observer mode
    const isObserver = window.location.pathname.startsWith('/observer/');
    setIsObserverMode(isObserver);
    
    // Ensure admin in monitor mode or observer doesn't see waiting room or device test
    if (isAdminMonitor || isObserver) {
      setHasTestedDevices(true);
    }
  }, [role]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [tutorStream, setTutorStream] = useState<MediaStream | null>(null);
  const [learnerStream, setLearnerStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activePanel, setActivePanel] = useState<"whiteboard" | "assets">("whiteboard");
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logModalShown, setLogModalShown] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [sessionStatus, setSessionStatus] = useState<"waiting" | "in_progress" | "completed">("waiting");
  const [showAdmitControl, setShowAdmitControl] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [showDeviceTest, setShowDeviceTest] = useState(false);
  const [hasTestedDevices, setHasTestedDevices] = useState(() => {
    // Skip device test for monitor mode from the start
    const params = new URLSearchParams(window.location.search);
    return params.get('monitor') === 'true';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenVideo, setFullscreenVideo] = useState<'local' | 'remote' | 'tutor' | 'learner' | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [hasNotifiedMonitoring, setHasNotifiedMonitoring] = useState(false);
  const [remoteCameraOn, setRemoteCameraOn] = useState(false);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);
  const [hasReceivedRemoteState, setHasReceivedRemoteState] = useState(false);
  
  // Observer mode camera states - default to false (show camera-off indicator until confirmed on)
  const [tutorCameraOn, setTutorCameraOn] = useState(false);
  const [learnerCameraOn, setLearnerCameraOn] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log(" remoteCameraOn changed to:", remoteCameraOn, "hasReceivedRemoteState:", hasReceivedRemoteState);
  }, [remoteCameraOn, hasReceivedRemoteState]);
  
  useEffect(() => {
    console.log(" remoteScreenSharing changed to:", remoteScreenSharing);
  }, [remoteScreenSharing]);
  
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [disconnectStartTime, setDisconnectStartTime] = useState<number | null>(null);
  const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(null);
  
  // Track active observers for indicator
  const [activeObservers, setActiveObservers] = useState<{id: string, name: string}[]>([]);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const tutorVideoRef = useRef<HTMLVideoElement>(null);
  const learnerVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callRef = useRef<any>(null);
  const sessionChannelRef = useRef<any>(null);
  const mediaChannelRef = useRef<any>(null);
  
  // Ref to prevent duplicate admit control triggers
  const admitControlShownRef = useRef(false);
  
  // Ref to track current session status (avoids stale closure in callbacks)
  const sessionStatusRef = useRef<"waiting" | "in_progress" | "completed">("waiting");

  // Audio level detection for monitor mode
  const { isSpeaking: tutorSpeaking } = useAudioLevel({ 
    stream: tutorStream, 
    threshold: 25 
  });
  const { isSpeaking: learnerSpeaking } = useAudioLevel({ 
    stream: learnerStream, 
    threshold: 25 
  });

  // Audio level detection for regular mode (tutor/learner)
  const { isSpeaking: localSpeaking } = useAudioLevel({
    stream: localStream,
    threshold: 25
  });
  const { isSpeaking: remoteSpeaking } = useAudioLevel({
    stream: remoteStream,
    threshold: 25
  });

  // Debug logging for whiteboard connection status
  useEffect(() => {
    const peerConnectedStatus = connectionState.isConnected;
    console.log(" Whiteboard peer status - connectionState.isConnected:", connectionState.isConnected, "remoteStream:", remoteStream !== null, "=> isPeerConnected:", peerConnectedStatus);
    
    // Fallback: If we have remote stream but connection state says disconnected, fix it
    if (remoteStream && !connectionState.isConnected) {
      console.log(" Fixing connection state - we have remote stream but state says disconnected");
      setConnectionState(prev => ({
        ...prev,
        isConnected: true,
        quality: 'good',
        lastConnectedAt: new Date()
      }));
    }
  }, [connectionState.isConnected, remoteStream]);
  
  // Ensure local video element gets the stream when it changes
  useEffect(() => {
    const setupLocalVideo = async () => {
      if (localStream && localVideoRef.current) {
        console.log(" LocalStream changed, updating video element");
        console.log(" Stream tracks:", localStream.getTracks().map(t => `${t.kind}: ${t.label} (enabled: ${t.enabled})`));
        console.log(" Video element current srcObject:", localVideoRef.current.srcObject ? 'has srcObject' : 'no srcObject');
        
        // Check if srcObject is already set to this stream
        if (localVideoRef.current.srcObject === localStream) {
          console.log(" srcObject already set to this stream, ensuring playback");
          try {
            await localVideoRef.current.play();
            console.log(" Local video playing (already had stream)");
          } catch (e) {
            console.log(" Play error (already had stream):", e);
          }
          return;
        }
        
        // Set the srcObject
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.muted = true; // Always mute local video to prevent feedback
        
        // Force the video to play
        try {
          await localVideoRef.current.play();
          console.log(" Local video playing successfully");
        } catch (e) {
          console.log(" Local video auto-play prevented:", e);
          // Try again after a short delay
          setTimeout(async () => {
            try {
              if (localVideoRef.current && localVideoRef.current.srcObject) {
                await localVideoRef.current.play();
                console.log(" Local video playing after retry");
              }
            } catch (retryError) {
              console.log("❌ Local video play failed on retry:", retryError);
            }
          }, 500);
        }
      } else {
        console.log(" No local stream or video ref:", { 
          hasStream: !!localStream, 
          hasRef: !!localVideoRef.current 
        });
      }
    };
    
    setupLocalVideo();
  }, [localStream]);

  // Debug effect to log local stream state
  useEffect(() => {
    console.log(" Local stream state changed:", {
      hasStream: !!localStream,
      tracks: localStream?.getTracks().map(t => `${t.kind}: ${t.enabled}`) || [],
      videoRef: !!localVideoRef.current,
      videoSrcObject: localVideoRef.current?.srcObject ? 'set' : 'not set'
    });
    
    // If we have a stream, always try to set it on the video element
    if (localStream && localVideoRef.current) {
      console.log(" Setting local video srcObject");
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play()
        .then(() => console.log(" Local video playing"))
        .catch(e => console.log(" Play error:", e));
    }
  }, [localStream]);

  // Also try to set video when ref changes or component mounts
  useEffect(() => {
    // Small delay to ensure video element is mounted
    const timer = setTimeout(() => {
      if (localStream && localVideoRef.current) {
        console.log(" Delayed video setup - setting srcObject");
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play()
          .then(() => console.log(" Delayed local video playing"))
          .catch(e => console.log(" Delayed play error:", e));
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [localStream]);

  // Additional effect: When hasTestedDevices changes to true, ensure video is set
  useEffect(() => {
    if (hasTestedDevices && localStream && !showDeviceTest) {
      console.log(" Device test complete, ensuring video is set up");
      // Multiple attempts with increasing delays to handle race conditions
      const delays = [100, 300, 600, 1000];
      const timers = delays.map(delay => 
        setTimeout(() => {
          if (localVideoRef.current && localStream) {
            if (localVideoRef.current.srcObject !== localStream) {
              console.log(` Setting video srcObject (${delay}ms delay)`);
              localVideoRef.current.srcObject = localStream;
            }
            localVideoRef.current.muted = true;
            localVideoRef.current.play()
              .then(() => console.log(` Video playing (${delay}ms delay)`))
              .catch(e => console.log(` Play error (${delay}ms delay):`, e));
          }
        }, delay)
      );
      
      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [hasTestedDevices, showDeviceTest, localStream]);

  // Initialize camera immediately when session is ready
  useEffect(() => {
    const initCamera = async () => {
      if (sessionData && !localStream && !isMonitorMode && !isObserverMode && hasTestedDevices) {
        console.log(" Auto-initializing camera...");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          console.log(" Camera initialized:", stream.getTracks().map(t => t.kind));
          setLocalStream(stream);
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.muted = true;
            await localVideoRef.current.play();
            console.log(" Local video playing");
          }
        } catch (error) {
          console.error("❌ Failed to initialize camera:", error);
        }
      }
    };
    
    initCamera();
  }, [sessionData, hasTestedDevices, isMonitorMode, isObserverMode]);

  // Ensure remote video element gets the stream when it changes
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log(" RemoteStream changed, updating video element");
      console.log(" Remote stream tracks:", remoteStream.getTracks().map(t => `${t.kind}: ${t.label} (enabled: ${t.enabled}, readyState: ${t.readyState})`));
      
      const videoElement = remoteVideoRef.current;
      
      // Set up event listeners to detect when video actually has data
      const handleLoadedData = () => {
        console.log(" Remote video has loaded data - video should be visible now");
      };
      
      const handleCanPlay = () => {
        console.log(" Remote video can play");
        videoElement.play().catch(e => console.log(" Play after canplay failed:", e));
      };
      
      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('canplay', handleCanPlay);
      
      // Always set the srcObject
      console.log(" Setting srcObject on remote video element");
      videoElement.srcObject = remoteStream;
      
      // Try to play immediately
      videoElement.play()
        .then(() => console.log(" Remote video playing"))
        .catch(e => console.log(" Remote video auto-play prevented:", e));
      
      return () => {
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [remoteStream]);
  
  // Additional effect to retry setting remote video and ensure it plays
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      const videoElement = remoteVideoRef.current;
      
      // Function to check if video is actually displaying
      const checkVideoPlaying = () => {
        if (!videoElement) return false;
        // Video is playing if it has dimensions and isn't paused
        return videoElement.videoWidth > 0 && videoElement.videoHeight > 0 && !videoElement.paused;
      };
      
      // Retry with increasing delays
      const delays = [100, 300, 500, 1000, 2000, 3000];
      const timers = delays.map(delay =>
        setTimeout(() => {
          if (videoElement && remoteStream) {
            // Check if video is already playing properly
            if (checkVideoPlaying()) {
              console.log(` Remote video already playing at ${delay}ms check`);
              return;
            }
            
            console.log(` Retry setting remote video (${delay}ms) - videoWidth: ${videoElement.videoWidth}, paused: ${videoElement.paused}`);
            
            // Re-set srcObject to force refresh
            videoElement.srcObject = null;
            videoElement.srcObject = remoteStream;
            
            videoElement.play().catch(() => {});
          }
        }, delay)
      );
      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [remoteStream]);

  // Observer mode: Set tutor video when stream is received
  useEffect(() => {
    if (tutorStream && tutorVideoRef.current) {
      console.log(" Setting tutor video stream for observer");
      const tracks = tutorStream.getTracks();
      console.log(" Tutor stream tracks:", tracks.map(t => `${t.kind}: readyState=${t.readyState}, enabled=${t.enabled}, muted=${t.muted}`));
      
      // Check if video track exists and is live
      const videoTrack = tracks.find(t => t.kind === 'video');
      if (videoTrack) {
        console.log(" Tutor video track settings:", videoTrack.getSettings());
        
        // Note: We can't reliably detect camera on/off from the receiver's video track
        // because the track shows enabled=true even when sender has camera off (just sends black frames)
        // We rely ONLY on the media-state channel for camera state
        // The mute/ended events are still useful for detecting connection issues
        
        videoTrack.addEventListener('mute', () => {
          console.log(" Tutor video track muted (network issue)");
        });
        videoTrack.addEventListener('unmute', () => {
          console.log(" Tutor video track unmuted");
        });
        videoTrack.addEventListener('ended', () => {
          console.log(" Tutor video track ended");
        });
      }
      
      tutorVideoRef.current.srcObject = tutorStream;
      
      const playVideo = async () => {
        try {
          // First try muted (browsers allow muted autoplay)
          if (tutorVideoRef.current) {
            tutorVideoRef.current.muted = true;
            await tutorVideoRef.current.play();
            console.log(" Tutor video playing (muted) for observer");
            // Then unmute after a short delay
            setTimeout(() => {
              if (tutorVideoRef.current) {
                tutorVideoRef.current.muted = false;
                console.log(" Tutor video unmuted");
              }
            }, 100);
          }
        } catch (e) {
          console.log(" Tutor video auto-play prevented:", e);
        }
      };
      
      // Add event listeners for debugging
      const handleLoadedData = () => {
        console.log(" Tutor video has loaded data for observer");
      };
      tutorVideoRef.current.addEventListener('loadeddata', handleLoadedData);
      
      playVideo();
      
      // Retry playing multiple times in case of timing issues - more aggressive
      const retryDelays = [300, 600, 1000, 2000, 3000];
      const timers = retryDelays.map(delay => 
        setTimeout(() => {
          if (tutorVideoRef.current && tutorStream) {
            const videoElement = tutorVideoRef.current;
            
            // Check if video is already playing properly
            if (videoElement.videoWidth > 0 && !videoElement.paused) {
              console.log(` Tutor video already playing at ${delay}ms check`);
              return;
            }
            
            console.log(` Retry tutor video (${delay}ms) - videoWidth: ${videoElement.videoWidth}, paused: ${videoElement.paused}`);
            
            // Force refresh srcObject
            videoElement.srcObject = null;
            videoElement.srcObject = tutorStream;
            
            videoElement.muted = true;
            videoElement.play().then(() => {
              setTimeout(() => {
                if (tutorVideoRef.current) tutorVideoRef.current.muted = false;
              }, 100);
            }).catch(() => {});
          }
        }, delay)
      );
      
      return () => {
        timers.forEach(t => clearTimeout(t));
        if (tutorVideoRef.current) {
          tutorVideoRef.current.removeEventListener('loadeddata', handleLoadedData);
        }
      };
    }
  }, [tutorStream]);

  // Observer mode: Set learner video when stream is received
  useEffect(() => {
    if (learnerStream && learnerVideoRef.current) {
      console.log(" Setting learner video stream for observer");
      const tracks = learnerStream.getTracks();
      console.log(" Learner stream tracks:", tracks.map(t => `${t.kind}: readyState=${t.readyState}, enabled=${t.enabled}, muted=${t.muted}`));
      
      // Check if video track exists and is live
      const videoTrack = tracks.find(t => t.kind === 'video');
      if (videoTrack) {
        console.log(" Learner video track settings:", videoTrack.getSettings());
        
        // Note: We can't reliably detect camera on/off from the receiver's video track
        // because the track shows enabled=true even when sender has camera off (just sends black frames)
        // We rely ONLY on the media-state channel for camera state
        // The mute/ended events are still useful for detecting connection issues
        
        videoTrack.addEventListener('mute', () => {
          console.log(" Learner video track muted (network issue)");
        });
        videoTrack.addEventListener('unmute', () => {
          console.log(" Learner video track unmuted");
        });
        videoTrack.addEventListener('ended', () => {
          console.log(" Learner video track ended");
        });
      }
      
      learnerVideoRef.current.srcObject = learnerStream;
      
      const playVideo = async () => {
        try {
          // First try muted (browsers allow muted autoplay)
          if (learnerVideoRef.current) {
            learnerVideoRef.current.muted = true;
            await learnerVideoRef.current.play();
            console.log(" Learner video playing (muted) for observer");
            // Then unmute after a short delay
            setTimeout(() => {
              if (learnerVideoRef.current) {
                learnerVideoRef.current.muted = false;
                console.log(" Learner video unmuted");
              }
            }, 100);
          }
        } catch (e) {
          console.log(" Learner video auto-play prevented:", e);
        }
      };
      
      // Add event listeners for debugging
      const handleLoadedData = () => {
        console.log(" Learner video has loaded data for observer");
      };
      learnerVideoRef.current.addEventListener('loadeddata', handleLoadedData);
      
      playVideo();
      
      // Retry playing multiple times in case of timing issues - more aggressive
      const retryDelays = [300, 600, 1000, 2000, 3000];
      const timers = retryDelays.map(delay => 
        setTimeout(() => {
          if (learnerVideoRef.current && learnerStream) {
            const videoElement = learnerVideoRef.current;
            
            // Check if video is already playing properly
            if (videoElement.videoWidth > 0 && !videoElement.paused) {
              console.log(` Learner video already playing at ${delay}ms check`);
              return;
            }
            
            console.log(` Retry learner video (${delay}ms) - videoWidth: ${videoElement.videoWidth}, paused: ${videoElement.paused}`);
            
            // Force refresh srcObject
            videoElement.srcObject = null;
            videoElement.srcObject = learnerStream;
            
            videoElement.muted = true;
            videoElement.play().then(() => {
              setTimeout(() => {
                if (learnerVideoRef.current) learnerVideoRef.current.muted = false;
              }, 100);
            }).catch(() => {});
          }
        }, delay)
      );
      
      return () => {
        timers.forEach(t => clearTimeout(t));
        if (learnerVideoRef.current) {
          learnerVideoRef.current.removeEventListener('loadeddata', handleLoadedData);
        }
      };
    }
  }, [learnerStream]);
  
  // When learner is admitted (status changes to in_progress), ensure video is set
  useEffect(() => {
    if (sessionStatus === "in_progress" && localStream && role === "learner") {
      console.log("🎓 Learner admitted! Ensuring video is set");
      const timer = setTimeout(() => {
        if (localVideoRef.current && localStream) {
          console.log(" Setting learner video after admission");
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.play()
            .then(() => console.log(" Learner video playing after admission"))
            .catch(e => console.log(" Auto-play prevented:", e));
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sessionStatus, role, localStream]);

  // CRITICAL: Initialize WebRTC for learner when session is in_progress
  // This handles the case where the realtime subscription misses the status change
  useEffect(() => {
    if (sessionStatus === "in_progress" && role === "learner" && !webrtcRef.current && hasTestedDevices) {
      console.log(" Learner: Session is in_progress, checking if WebRTC needs initialization");
      
      const currentStream = localStreamRef.current;
      if (currentStream) {
        const tracks = currentStream.getTracks();
        const hasActiveTracks = tracks.some(t => t.readyState === 'live');
        
        if (hasActiveTracks) {
          console.log(" Learner: Initializing WebRTC (session already in_progress)");
          initializeWebRTC(currentStream);
        } else {
          console.log(" Learner: Stream not active, re-acquiring media");
          navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(newStream => {
              console.log(" Learner: Got new stream");
              setLocalStream(newStream);
              localStreamRef.current = newStream;
              initializeWebRTC(newStream);
            })
            .catch(err => {
              console.error("❌ Learner: Failed to acquire media:", err);
              toast.error("Failed to initialize camera. Please refresh the page.");
            });
        }
      } else {
        console.log(" Learner: No stream yet, will retry when stream is available");
      }
    }
  }, [sessionStatus, role, hasTestedDevices, localStream]);

  // Start heartbeat when connected
  useEffect(() => {
    if (isConnected && sessionStatus === "in_progress") {
      console.log(" Starting heartbeat to detect disconnects");
      startHeartbeat();
    } else {
      stopHeartbeat();
    }
    
    return () => {
      stopHeartbeat();
    };
  }, [isConnected, sessionStatus]);

  // Clear peer ID when browser closes/refreshes
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (sessionId && user) {
        console.log(" Browser closing - clearing peer ID");
        const peerIdField = role === "tutor" ? "tutor_peer_id" : "learner_peer_id";
        await supabase
          .from("sessions")
          .update({ [peerIdField]: null })
          .eq("id", sessionId);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [sessionId, user, role]);

  // Load session data first
  useEffect(() => {
    if (!user || !sessionId) return;

    const loadSessionData = async () => {
      try {
        const { data: session, error } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .maybeSingle();

        if (error) {
          console.error("Error loading session:", error);
          toast.error("Failed to load session");
          navigate(role === "tutor" ? "/tutor/sessions" : role === "admin" ? "/admin/live-monitoring" : "/learner/sessions");
          return;
        }

        if (!session) {
          toast.error("Session not found");
          navigate(role === "tutor" ? "/tutor/sessions" : role === "admin" ? "/admin/live-monitoring" : "/learner/sessions");
          return;
        }

        // Check observer permissions if in observer mode
        if (isObserverMode) {
          console.log(" Observer mode - checking permissions for user:", user.id, "session:", sessionId);
          
          // Check if user has approved observer access to this session
          const { data: observerAccess, error: observerError } = await supabase
            .from("session_participants" as any)
            .select("status")
            .eq("session_id", sessionId)
            .eq("user_id", user.id)
            .eq("role", "observer")
            .eq("status", "approved")
            .maybeSingle();

          if (observerError) {
            console.error("Error checking observer permissions:", observerError);
            toast.error("Failed to verify observer permissions");
            navigate("/learner/sessions");
            return;
          }

          if (!observerAccess) {
            console.log("❌ Observer access denied - no approved permission found");
            toast.error("You don't have permission to observe this session");
            navigate("/learner/sessions");
            return;
          }

          console.log(" Observer access granted");
        }

        // Fetch tutor and learner profiles
        const { data: tutorProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.tutor_id)
          .maybeSingle();

        const { data: learnerProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.learner_id)
          .maybeSingle();

        setSessionData({
          ...session,
          tutor_profiles: tutorProfile,
          learner_profiles: learnerProfile,
        });

        // Set initial session status
        const status = session.session_status as "waiting" | "in_progress" | "completed";
        setSessionStatus(status || "waiting");
        sessionStatusRef.current = status || "waiting";
        
        // If session is already completed, show session log or redirect
        if (status === "completed") {
          console.log(" Session already completed on load");
          
          if (role === "tutor" && !isMonitorMode) {
            // Show session log modal for tutors if not shown yet
            setIsLoadingMedia(false);
            setHasTestedDevices(true);
            if (!logModalShown) {
              console.log(" Showing log modal for tutor");
              toast.info("This session has ended");
              setShowLogModal(true);
              setLogModalShown(true);
            } else {
              // If log was already shown, redirect away
              console.log(" Log already shown, redirecting tutor");
              window.location.replace("/tutor/sessions");
            }
            return; // Don't initialize media devices
          }
          
          if (role === "learner") {
            // Show session log for learners
            console.log(" Showing log for learner");
            toast.info("This session has ended");
            setIsLoadingMedia(false);
            setHasTestedDevices(true);
            if (!logModalShown && !isMonitorMode) {
              setShowLogModal(true);
              setLogModalShown(true);
            }
            return; // Don't initialize media devices
          }
        }
        
        // Show admit control immediately ONLY if learner is waiting (not if already in progress)
        // Use ref to prevent duplicate triggers
        if (role === "tutor" && session.learner_peer_id && session.session_status === "waiting" && !admitControlShownRef.current) {
          console.log(" Learner already waiting on load - showing admit control");
          admitControlShownRef.current = true;
          setShowAdmitControl(true);
        }
        
        setIsLoadingMedia(false);
        
        // Skip device test for monitor mode or observer mode - immediately initialize
        if (isMonitorMode) {
          setHasTestedDevices(true);
          setShowDeviceTest(false);
          // For monitors, initialize peer without local media
          initializeMonitorMode();
        } else if (isObserverMode) {
          setHasTestedDevices(true);
          setShowDeviceTest(false);
          // For observers, initialize peer without local media
          initializeObserverMode();
        } else {
          // For regular users, show device test after a brief delay to avoid flash
          setTimeout(() => setShowDeviceTest(true), 50);
        }
      } catch (error) {
        console.error("Error loading session:", error);
        toast.error("Failed to load session");
        navigate(role === "tutor" ? "/tutor/sessions" : role === "admin" ? "/admin/live-monitoring" : "/learner/sessions");
      }
    };

    loadSessionData();
  }, [user, sessionId, role, navigate, isMonitorMode]);

  // Ref to store localStream for use in callbacks (avoids stale closure)
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Keep localStreamRef in sync with localStream state
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Subscribe to session status changes (for learners in waiting room)
  useEffect(() => {
    if (!sessionId || !user) return;

    console.log("Setting up session status subscription for user:", user.id, "role:", role);

    const sessionChannel = supabase
      .channel(`session-status-${sessionId}-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const newSession = payload.new as any;
          console.log(" Session status update received:", {
            session_status: newSession.session_status,
            status: newSession.status,
            learner_peer_id: newSession.learner_peer_id,
            tutor_peer_id: newSession.tutor_peer_id
          });
          
          // Tutor: Show admit control when learner joins (learner_peer_id is set)
          // Use ref to prevent duplicate triggers
          if (role === "tutor" && newSession.learner_peer_id && newSession.session_status === "waiting" && !admitControlShownRef.current) {
            console.log(" Learner joined via realtime - showing admit control");
            admitControlShownRef.current = true;
            setShowAdmitControl(true);
          }
          
          // Update session status
          if (newSession.session_status) {
            const status = newSession.session_status as "waiting" | "in_progress" | "completed";
            console.log(" Updating sessionStatus from", sessionStatus, "to", status);
            setSessionStatus(status);
            sessionStatusRef.current = status;
            
            if (status === "in_progress" && role === "learner") {
              console.log(" Learner admitted! Initializing WebRTC connection");
              toast.success("You've been admitted to the session!");
              
              // NOW initialize WebRTC for learner (they were waiting)
              // Use ref to get current stream value (avoids stale closure)
              const currentStream = localStreamRef.current;
              if (currentStream && !webrtcRef.current) {
                // Verify stream is still active
                const tracks = currentStream.getTracks();
                const hasActiveTracks = tracks.some(t => t.readyState === 'live');
                
                if (hasActiveTracks) {
                  console.log(" Learner: Initializing WebRTC after admission with stream:", currentStream.id);
                  initializeWebRTC(currentStream);
                } else {
                  console.log(" Learner: Stream tracks are not active, re-acquiring media");
                  // Re-acquire media stream
                  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                    .then(newStream => {
                      console.log(" Learner: Got new stream after admission");
                      setLocalStream(newStream);
                      localStreamRef.current = newStream;
                      initializeWebRTC(newStream);
                    })
                    .catch(err => {
                      console.error("❌ Learner: Failed to re-acquire media:", err);
                      toast.error("Failed to initialize camera. Please refresh the page.");
                    });
                }
              } else if (webrtcRef.current) {
                console.log(" Learner: WebRTC already initialized");
              } else {
                console.log(" Learner: No stream available, re-acquiring media");
                // Re-acquire media stream
                navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                  .then(newStream => {
                    console.log(" Learner: Got new stream after admission (no previous stream)");
                    setLocalStream(newStream);
                    localStreamRef.current = newStream;
                    initializeWebRTC(newStream);
                  })
                  .catch(err => {
                    console.error("❌ Learner: Failed to acquire media:", err);
                    toast.error("Failed to initialize camera. Please refresh the page.");
                  });
              }
            }
            
            // Notify observer when session starts
            if (status === "in_progress" && isObserverMode) {
              console.log(" Session started! Observer can now watch");
              toast.success("Session has started! You can now observe.");
            }
            
            if (status === "completed") {
              console.log(" Session completed via realtime - cleaning up");
              toast.info("Session has ended");
              // Clean up all media tracks
              cleanupMediaTracks();
              
              if (isMonitorMode) {
                // Admin in monitor mode - navigate back to monitoring dashboard
                console.log(" Admin monitor - navigating to dashboard");
                navigate("/admin/live-monitoring");
              } else if (isObserverMode) {
                // Observer mode - navigate back to learner sessions
                console.log(" Observer - session ended, navigating to sessions");
                navigate("/learner/sessions");
              } else {
                // Tutor or learner - show session log modal
                console.log(" Showing session log modal");
                if (!logModalShown) {
                  setShowLogModal(true);
                  setLogModalShown(true);
                }
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Unsubscribing from session status channel");
      sessionChannel.unsubscribe();
    };
  }, [sessionId, user, role]);

  // Polling fallback for admit control (in case realtime misses the update)
  useEffect(() => {
    if (!sessionId || !user || role !== "tutor" || sessionStatus !== "waiting") {
      // Reset the ref when session status changes
      if (sessionStatus === "in_progress") {
        admitControlShownRef.current = false;
      }
      return;
    }
    
    console.log(" Starting admit control polling fallback");
    
    const checkForLearner = async () => {
      // Skip if we've already shown admit control
      if (admitControlShownRef.current) return;
      
      const { data: session } = await supabase
        .from("sessions")
        .select("learner_peer_id, session_status")
        .eq("id", sessionId)
        .single();
      
      if (session?.learner_peer_id && session?.session_status === "waiting" && !admitControlShownRef.current) {
        console.log(" Polling found learner waiting - showing admit control");
        admitControlShownRef.current = true;
        setShowAdmitControl(true);
      }
    };
    
    // Check immediately
    checkForLearner();
    
    // Then poll every 2 seconds
    const interval = setInterval(checkForLearner, 2000);
    
    return () => {
      console.log(" Stopping admit control polling");
      clearInterval(interval);
    };
  }, [sessionId, user, role, sessionStatus]);

  // Subscribe to observer presence (for tutor/learner to see who's actually watching)
  useEffect(() => {
    if (!sessionId || !user || isMonitorMode || isObserverMode) return;
    
    // Only tutors and learners need to see observer indicators
    if (role !== "tutor" && role !== "learner") return;

    console.log(" Setting up observer presence tracking via broadcast");

    // Track observers using broadcast events (more reliable than presence)
    const observerTrackingChannel = supabase.channel(`observer-tracking-${sessionId}`);
    
    // Store active observers with timestamps for cleanup
    const observerMap = new Map<string, { name: string, lastSeen: number }>();
    
    // Cleanup stale observers every 5 seconds (more responsive)
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 10000; // 10 seconds without heartbeat = stale
      let changed = false;
      
      observerMap.forEach((data, oderId) => {
        if (now - data.lastSeen > staleThreshold) {
          console.log(" Removing stale observer (no heartbeat for 10s):", data.name);
          observerMap.delete(oderId);
          changed = true;
        }
      });
      
      if (changed) {
        const observers = Array.from(observerMap.entries()).map(([id, data]) => ({
          id,
          name: data.name
        }));
        setActiveObservers(observers);
      }
    }, 5000); // Check every 5 seconds
    
    observerTrackingChannel
      .on('broadcast', { event: 'observer_heartbeat' }, ({ payload }) => {
        console.log(" Received observer heartbeat:", payload);
        const { oderId, observerName } = payload;
        
        const wasNew = !observerMap.has(oderId);
        observerMap.set(oderId, { name: observerName || "Observer", lastSeen: Date.now() });
        
        if (wasNew) {
          console.log(" New observer detected:", observerName);
          // Broadcast camera state to new observer
          const currentStream = localStreamRef.current;
          if (currentStream && mediaChannelRef.current) {
            const videoTrack = currentStream.getVideoTracks()[0];
            const cameraState = videoTrack ? videoTrack.enabled : false;
            console.log(" Broadcasting camera state to new observer:", cameraState);
            mediaChannelRef.current.send({
              type: 'broadcast',
              event: 'media_state',
              payload: { oderId: user.id, camera: cameraState, role: role }
            });
          }
        }
        
        const observers = Array.from(observerMap.entries()).map(([id, data]) => ({
          id,
          name: data.name
        }));
        setActiveObservers(observers);
      })
      .on('broadcast', { event: 'observer_leave' }, ({ payload }) => {
        console.log(" Observer leaving:", payload);
        const { oderId } = payload;
        observerMap.delete(oderId);
        
        const observers = Array.from(observerMap.entries()).map(([id, data]) => ({
          id,
          name: data.name
        }));
        setActiveObservers(observers);
      })
      .subscribe((status) => {
        console.log(" Observer tracking channel status:", status);
      });

    return () => {
      console.log(" Cleaning up observer tracking");
      clearInterval(cleanupInterval);
      observerTrackingChannel.unsubscribe();
    };
  }, [sessionId, user, role, isMonitorMode, isObserverMode]);

  // Subscribe to media state changes (camera on/off, screen sharing)
  useEffect(() => {
    if (!sessionId || !user || isMonitorMode || isObserverMode) return;

    console.log(" Setting up media state subscription");

    const mediaChannel = supabase
      .channel(`media-state-${sessionId}`)
      .on('broadcast', { event: 'media_state' }, (payload) => {
        const { oderId, camera, screenSharing } = payload.payload;
        
        // Ignore our own state changes
        if (oderId === user.id) return;
        
        console.log(" Received remote media state:", { oderId, camera, screenSharing });
        
        if (camera !== undefined) {
          setRemoteCameraOn(camera);
          setHasReceivedRemoteState(true);
        }
        if (screenSharing !== undefined) {
          setRemoteScreenSharing(screenSharing);
        }
      })
      .on('broadcast', { event: 'media_state_response' }, (payload) => {
        // Response to our request for media state (after reconnection)
        const { oderId, camera, role: senderRole } = payload.payload;
        
        // Ignore our own responses
        if (oderId === user.id) return;
        
        console.log(" Received media state response:", { oderId, camera, senderRole });
        
        if (camera !== undefined) {
          setRemoteCameraOn(camera);
          setHasReceivedRemoteState(true);
        }
      })
      .on('broadcast', { event: 'request_media_state' }, (payload) => {
        // Other user is requesting current camera state
        console.log(" Received request for media state from:", payload.payload);
        
        // Use localStreamRef to get current stream (avoids stale closure)
        const currentStream = localStreamRef.current;
        if (currentStream && mediaChannelRef.current) {
          const videoTrack = currentStream.getVideoTracks()[0];
          const cameraState = videoTrack ? videoTrack.enabled : false;
          
          console.log(" Responding with camera state:", cameraState, "role:", role);
          mediaChannelRef.current.send({
            type: 'broadcast',
            event: 'media_state_response',
            payload: { oderId: user.id, camera: cameraState, role: role }
          });
        } else {
          console.log(" Cannot respond - no stream or channel:", { hasStream: !!currentStream, hasChannel: !!mediaChannelRef.current });
        }
      })
      .subscribe((status) => {
        console.log(" Media state subscription status:", status);
        if (status === 'SUBSCRIBED') {
          mediaChannelRef.current = mediaChannel;
          
          // Broadcast initial camera state when connected
          if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
              mediaChannel.send({
                type: 'broadcast',
                event: 'media_state',
                payload: { oderId: user.id, camera: videoTrack.enabled }
              });
              console.log(" Broadcast initial camera state:", videoTrack.enabled);
            }
          }
        }
      });

    return () => {
      console.log(" Unsubscribing from media state channel");
      mediaChannel.unsubscribe();
      mediaChannelRef.current = null;
    };
  }, [sessionId, user, isMonitorMode, isObserverMode, localStream]);

  // Initialize Supabase WebRTC signaling (replaces PeerJS)
  const initializeWebRTC = async (mediaStream: MediaStream) => {
    try {
      console.log(" Initializing Supabase WebRTC signaling");
      
      // Set connection state to connecting (not connected yet)
      // Use quality 'poor' to indicate we're in connecting state but not disconnected
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        quality: 'poor', // 'poor' shows "Connecting..." in ConnectionStatus
        reconnectAttempts: 0
      }));
      
      // Clean up existing connection
      if (webrtcRef.current) {
        webrtcRef.current.destroy();
      }

      // Set local stream immediately
      setLocalStream(mediaStream);

      // Create new WebRTC connection with Supabase signaling
      webrtcRef.current = new SupabaseWebRTC(
        sessionId!,
        user!.id,
        role as 'tutor' | 'learner',
        {
          onRemoteStream: (stream) => {
            console.log(" Remote stream received via Supabase signaling");
            setRemoteStream(stream);
            setConnectionState(prev => ({
              ...prev,
              isConnected: true,
              quality: 'good',
              lastConnectedAt: new Date()
            }));
            
            // Request media state from the other user when we get their stream
            // This handles reconnection scenarios where we need to know their camera state
            // Use multiple requests with increasing delays to ensure we get the state
            const delays = [300, 800, 1500, 3000];
            delays.forEach((delay, index) => {
              setTimeout(() => {
                if (mediaChannelRef.current) {
                  console.log(` Requesting media state (attempt ${index + 1})`);
                  mediaChannelRef.current.send({
                    type: 'broadcast',
                    event: 'request_media_state',
                    payload: { requesterId: user!.id }
                  });
                }
              }, delay);
            });
          },
          onConnectionStateChange: (state) => {
            console.log(" Connection state:", state);
            
            // Notify user of connection changes
            if (state === 'disconnected') {
              toast.warning("The other participant has disconnected.");
              // Clear remote video to show they're gone
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
              }
              setRemoteStream(null);
              // Reset remote camera state so we show proper indicator when they reconnect
              setHasReceivedRemoteState(false);
              setRemoteCameraOn(false);
              setRemoteScreenSharing(false);
            } else if (state === 'failed') {
              toast.error("Connection failed. Please check your internet connection.");
            }
            
            setConnectionState(prev => {
              // Show reconnected toast if we were previously disconnected
              if (state === 'connected' && !prev.isConnected && prev.quality === 'disconnected') {
                toast.success("Reconnected!");
                // Request media state from the other user after reconnection
                if (mediaChannelRef.current) {
                  console.log(" Requesting media state after reconnection");
                  mediaChannelRef.current.send({
                    type: 'broadcast',
                    event: 'request_media_state',
                    payload: { oderId: user!.id }
                  });
                }
              }
              
              return {
                ...prev,
                isConnected: state === 'connected',
                quality: state === 'connected' ? 'good' : state === 'disconnected' ? 'poor' : 'disconnected'
              };
            });
          },
          onError: (error) => {
            console.error("WebRTC error:", error);
            toast.error("Connection error: " + error);
          }
        }
      );

      // Initialize with local stream
      await webrtcRef.current.initialize(mediaStream);
      
      console.log(" Supabase WebRTC initialized");
      
      // Mark user as present in session
      const updateField = role === "tutor" ? "tutor_peer_id" : "learner_peer_id";
      await supabase.from("sessions").update({ 
        [updateField]: user!.id // Use user ID as presence marker
      }).eq("id", sessionId);

    } catch (error) {
      console.error("Failed to initialize WebRTC:", error);
      throw error;
    }
  };

  // Clean up WebRTC connection
  const cleanupWebRTC = async () => {
    if (webrtcRef.current) {
      webrtcRef.current.destroy();
      webrtcRef.current = null;
    }
    
    if (observerWebrtcRef.current) {
      observerWebrtcRef.current.destroy();
      observerWebrtcRef.current = null;
    }
    
    // Clean up observer tracking channel (send leave event and clear heartbeat)
    if (sessionChannelRef.current) {
      // Clear heartbeat interval if it exists
      if ((sessionChannelRef.current as any)._heartbeatInterval) {
        clearInterval((sessionChannelRef.current as any)._heartbeatInterval);
      }
      
      // Remove beforeunload handler if it exists
      if ((sessionChannelRef.current as any)._beforeUnloadHandler) {
        window.removeEventListener('beforeunload', (sessionChannelRef.current as any)._beforeUnloadHandler);
      }
      
      // Send leave event if we're an observer - do this BEFORE unsubscribing
      if (isObserverMode && user) {
        try {
          await sessionChannelRef.current.send({
            type: 'broadcast',
            event: 'observer_leave',
            payload: { oderId: user.id }
          });
          console.log(" Observer leave event sent");
          // Small delay to ensure message is sent before unsubscribing
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
          console.log(" Error sending leave event:", e);
        }
      }
      
      supabase.removeChannel(sessionChannelRef.current);
      sessionChannelRef.current = null;
    }
    
    // Reset connection state
    setConnectionState({
      isConnected: false,
      quality: 'disconnected',
      reconnectAttempts: 0,
      lastConnectedAt: null
    });
  };

  // Clean up on component unmount - ensure camera is released
  useEffect(() => {
    return () => {
      console.log(" Component unmounting - cleaning up everything");
      cleanupMediaTracks();
      cleanupWebRTC();
    };
  }, []);

  const handleDeviceTestCancel = () => {
    navigate(role === "tutor" ? "/tutor/sessions" : "/learner/sessions");
  };

  const toggleCamera = () => {
    console.log(" Toggle camera clicked - localStream:", !!localStream);
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
        console.log(" Camera toggled to:", videoTrack.enabled);
        
        // Broadcast camera state change
        if (mediaChannelRef.current) {
          mediaChannelRef.current.send({
            type: 'broadcast',
            event: 'media_state',
            payload: { oderId: user!.id, camera: videoTrack.enabled }
          });
          console.log(" Broadcast camera state:", videoTrack.enabled);
        }
      } else {
        console.log("❌ No video track found");
        toast.error("No camera available");
      }
    } else {
      console.log("❌ No local stream available");
      toast.error("Camera not initialized");
    }
  };

  const toggleMic = () => {
    console.log("🎤 Toggle mic clicked - localStream:", !!localStream);
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        console.log("🎤 Mic toggled to:", audioTrack.enabled);
        
        // Broadcast mic state change
        if (mediaChannelRef.current) {
          mediaChannelRef.current.send({
            type: 'broadcast',
            event: 'media_state',
            payload: { oderId: user!.id, mic: audioTrack.enabled }
          });
          console.log(" Broadcast mic state:", audioTrack.enabled);
        }
      } else {
        console.log("❌ No audio track found");
        toast.error("No microphone available");
      }
    } else {
      console.log("❌ No local stream available");
      toast.error("Microphone not initialized");
    }
  };

  // Handle device change from settings modal
  const handleDeviceChange = async (deviceId: string, kind: "videoinput" | "audioinput") => {
    console.log(` Changing ${kind} to device:`, deviceId);
    
    try {
      // Save current camera/mic states
      const currentCameraState = isCameraOn;
      const currentMicState = isMicOn;
      
      // Stop current tracks
      if (localStream) {
        if (kind === "videoinput") {
          localStream.getVideoTracks().forEach(track => track.stop());
        } else {
          localStream.getAudioTracks().forEach(track => track.stop());
        }
      }
      
      // Get new stream with selected device
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
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Apply previous camera/mic states
      const videoTrack = newStream.getVideoTracks()[0];
      const audioTrack = newStream.getAudioTracks()[0];
      if (videoTrack) videoTrack.enabled = currentCameraState;
      if (audioTrack) audioTrack.enabled = currentMicState;
      
      // Update state
      if (kind === "videoinput") {
        setSelectedVideoDevice(deviceId);
      } else {
        setSelectedAudioDevice(deviceId);
      }
      
      setLocalStream(newStream);
      localStreamRef.current = newStream;
      
      // Update video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
        localVideoRef.current.play().catch(() => {});
      }
      
      // Replace track in WebRTC connection if connected
      if (webrtcRef.current && kind === "videoinput" && videoTrack) {
        const oldVideoTrack = localStream?.getVideoTracks()[0];
        if (oldVideoTrack) {
          await webrtcRef.current.replaceTrack(videoTrack, oldVideoTrack);
          console.log(" Replaced video track in WebRTC connection");
        }
      }
      
      console.log(` ${kind} changed successfully`);
    } catch (error) {
      console.error(`❌ Error changing ${kind}:`, error);
      toast.error(`Failed to switch ${kind === "videoinput" ? "camera" : "microphone"}`);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;

        // Update local video ref to show screen
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Replace video track for remote peer - THIS IS THE KEY PART
        const screenTrack = screenStream.getVideoTracks()[0];
        if (webrtcRef.current && localStream) {
          const cameraTrack = localStream.getVideoTracks()[0];
          if (cameraTrack && screenTrack) {
            await webrtcRef.current.replaceTrack(screenTrack, cameraTrack);
            console.log(" Replaced camera track with screen track for remote peer");
          }
        }
        
        // Listen for screen share end
        screenTrack.onended = () => {
          console.log(" Screen sharing ended");
          stopScreenShare();
        };

        setIsScreenSharing(true);
        
        // Broadcast screen sharing state
        if (mediaChannelRef.current) {
          mediaChannelRef.current.send({
            type: 'broadcast',
            event: 'media_state',
            payload: { 
              oderId: user!.id, 
              screenSharing: true,
              camera: isCameraOn // Include camera state since we're replacing video track
            }
          });
          console.log(" Broadcast screen sharing started");
        }
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      toast.error("Failed to share screen");
    }
  };

  const stopScreenShare = async () => {
    // Get screen track before stopping (for logging)
    const hadScreenTrack = screenStreamRef.current?.getVideoTracks()[0];
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    setIsScreenSharing(false);
    
    // Restore camera stream to local video
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
    
    // Replace screen track back to camera track for remote peer
    if (webrtcRef.current && localStream) {
      const cameraTrack = localStream.getVideoTracks()[0];
      if (cameraTrack) {
        // Pass undefined for oldTrack since screen track is already stopped
        await webrtcRef.current.replaceTrack(cameraTrack);
        console.log(" Restored camera track for remote peer");
      }
    }
    
    // Broadcast screen sharing stopped
    if (mediaChannelRef.current) {
      mediaChannelRef.current.send({
        type: 'broadcast',
        event: 'media_state',
        payload: { 
          oderId: user!.id, 
          screenSharing: false,
          camera: isCameraOn // Include current camera state
        }
      });
      console.log(" Broadcast screen sharing stopped");
    }
  };

  const handleAdmitLearner = async () => {
    console.log(" handleAdmitLearner called, current showAdmitControl:", showAdmitControl);
    
    try {
      // Hide admit control immediately for better UX
      setShowAdmitControl(false);
      console.log(" Set showAdmitControl to false");
      
      // Update session status FIRST - this triggers learner to initialize WebRTC
      const { error, data } = await supabase
        .from("sessions")
        .update({ session_status: "in_progress" })
        .eq("id", sessionId)
        .select();

      console.log(" Database update result:", { error, data });

      if (error) {
        console.error("Error admitting learner:", error);
        toast.error("Failed to admit learner");
        // Show admit control again if failed
        setShowAdmitControl(true);
        return;
      }

      console.log(" Learner admitted successfully");
      setSessionStatus("in_progress");
      sessionStatusRef.current = "in_progress";
      toast.success("Learner admitted to session");
      
      // Note: We don't reinitialize tutor's WebRTC here anymore
      // The signaling class handles reconnection when it detects learner's presence
    } catch (error) {
      console.error("Error in handleAdmitLearner:", error);
      toast.error("Failed to admit learner");
      // Show admit control again if failed
      setShowAdmitControl(true);
    }
  };

  const handleEndSession = async () => {
    try {
      // Immediately update local state for faster UI response
      setSessionStatus("completed");
      sessionStatusRef.current = "completed";
      
      // Clean up media tracks immediately
      cleanupMediaTracks();
      cleanupWebRTC();
      
      // Update database
      const { error } = await supabase
        .from("sessions")
        .update({ session_status: "completed" })
        .eq("id", sessionId);

      if (error) {
        console.error("Error ending session:", error);
        toast.error("Failed to end session");
        // Revert state if database update failed
        setSessionStatus("in_progress");
        sessionStatusRef.current = "in_progress";
        return;
      }

      console.log(" Session ended successfully");
      toast.success("Session ended");
      
      // Show session log modal immediately (don't wait for realtime)
      if (!logModalShown) {
        setShowLogModal(true);
        setLogModalShown(true);
      }
    } catch (error) {
      console.error("Error in handleEndSession:", error);
      toast.error("Failed to end session");
    }
  };

  const handleLogModalComplete = () => {
    setShowLogModal(false);
    // Ensure camera is released before navigating
    cleanupMediaTracks();
    cleanupWebRTC();
    
    if (role === "learner") {
      // Learner sees feedback after session log
      setShowFeedbackModal(true);
    } else {
      // Tutor goes directly to sessions page (no feedback for tutor)
      navigate("/tutor/sessions");
    }
  };

  const handleFeedbackComplete = () => {
    setShowFeedbackModal(false);
    // Ensure camera is released before navigating
    cleanupMediaTracks();
    cleanupWebRTC();
    navigate("/learner/sessions");
  };

  // Comprehensive cleanup function to stop all media tracks
  const cleanupMediaTracks = () => {
    console.log(" Cleaning up all media tracks");
    
    // Stop local stream tracks (from state)
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log(` Stopped local ${track.kind} track from state`);
      });
    }
    
    // Also stop from ref (in case state is stale)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(` Stopped local ${track.kind} track from ref`);
      });
      localStreamRef.current = null;
    }
    
    // Stop tracks directly from video elements (most reliable - handles stale state)
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(` Stopped ${track.kind} track from local video element`);
      });
    }
    
    if (remoteVideoRef.current?.srcObject) {
      const stream = remoteVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(` Stopped ${track.kind} track from remote video element`);
      });
    }
    
    if (tutorVideoRef.current?.srcObject) {
      const stream = tutorVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(` Stopped ${track.kind} track from tutor video element`);
      });
    }
    
    if (learnerVideoRef.current?.srcObject) {
      const stream = learnerVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(` Stopped ${track.kind} track from learner video element`);
      });
    }
    
    // Stop remote stream tracks (from state)
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        track.stop();
        console.log(` Stopped remote ${track.kind} track`);
      });
    }
    
    // Stop tutor stream tracks (for observer mode)
    if (tutorStream) {
      tutorStream.getTracks().forEach(track => {
        track.stop();
        console.log(` Stopped tutor ${track.kind} track`);
      });
    }
    
    // Stop learner stream tracks (for observer mode)
    if (learnerStream) {
      learnerStream.getTracks().forEach(track => {
        track.stop();
        console.log(` Stopped learner ${track.kind} track`);
      });
    }
    
    // Stop screen share stream tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(` Stopped screen share ${track.kind} track`);
      });
      screenStreamRef.current = null;
    }
    
    // Clear video elements srcObject
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (tutorVideoRef.current) {
      tutorVideoRef.current.srcObject = null;
    }
    if (learnerVideoRef.current) {
      learnerVideoRef.current.srcObject = null;
    }
    
    // Clear stream states
    setLocalStream(null);
    setRemoteStream(null);
    setTutorStream(null);
    setLearnerStream(null);
    setIsScreenSharing(false);
    
    console.log(" Media tracks cleanup completed - camera should be released");
  };

  // Placeholder functions for missing functionality
  const initializeMonitorMode = async () => {
    console.log(" Monitor mode initialization");
    // Monitors don't participate in WebRTC - they just view whiteboard and chat
    // Set connection state to indicate view-only mode
    setConnectionState({
      isConnected: true, // Mark as "connected" so UI doesn't show disconnected warnings
      quality: 'good',
      reconnectAttempts: 0,
      lastConnectedAt: new Date()
    });
  };

  const initializeObserverMode = async () => {
    console.log(" Observer mode initialization - setting up receive-only WebRTC");
    
    // Clean up any existing observer connection
    if (observerWebrtcRef.current) {
      observerWebrtcRef.current.destroy();
    }
    
    // Create observer WebRTC connection to receive streams
    observerWebrtcRef.current = new ObserverWebRTC(
      sessionId!,
      user!.id,
      {
        onTutorStream: (stream) => {
          console.log(" Received tutor stream");
          setTutorStream(stream);
          // Also set as remote stream for compatibility
          if (!remoteStream) {
            setRemoteStream(stream);
          }
        },
        onLearnerStream: (stream) => {
          console.log(" Received learner stream");
          setLearnerStream(stream);
        },
        onConnectionStateChange: (state) => {
          console.log(" Observer connection state:", state);
          setConnectionState(prev => ({
            ...prev,
            isConnected: state === 'connected',
            quality: state === 'connected' ? 'good' : 'disconnected'
          }));
        },
        onError: (error) => {
          console.error(" Observer WebRTC error:", error);
          toast.error("Connection error: " + error);
        }
      }
    );
    
    await observerWebrtcRef.current.initialize();
    
    // Set initial connection state to indicate view-only mode
    setConnectionState({
      isConnected: true, // Mark as "connected" so UI doesn't show disconnected warnings
      quality: 'good',
      reconnectAttempts: 0,
      lastConnectedAt: new Date()
    });
    
    // Subscribe to media-state channel to get camera on/off updates from tutor/learner
    const mediaStateChannel = supabase.channel(`media-state-${sessionId}`);
    mediaStateChannel
      .on('broadcast', { event: 'media_state' }, (payload) => {
        const { oderId, camera } = payload.payload;
        console.log(" Observer received media state:", payload.payload);
        
        // Determine if this is from tutor or learner using sessionData
        if (sessionData?.tutor_id === oderId) {
          console.log(" Tutor camera state from broadcast:", camera);
          if (camera !== undefined) setTutorCameraOn(camera);
        } else if (sessionData?.learner_id === oderId) {
          console.log(" Learner camera state from broadcast:", camera);
          if (camera !== undefined) setLearnerCameraOn(camera);
        }
      })
      .on('broadcast', { event: 'media_state_response' }, (payload) => {
        // Response to our request for current state
        const { oderId, camera, role } = payload.payload;
        console.log(" Observer received media state response:", payload.payload);
        
        if (role === 'tutor' && camera !== undefined) {
          setTutorCameraOn(camera);
        } else if (role === 'learner' && camera !== undefined) {
          setLearnerCameraOn(camera);
        }
      })
      .subscribe(async (status) => {
        console.log(" Observer media-state channel status:", status);
        if (status === 'SUBSCRIBED') {
          // Request current camera state from tutor and learner
          console.log(" Requesting current camera states");
          await mediaStateChannel.send({
            type: 'broadcast',
            event: 'request_media_state',
            payload: { requesterId: user!.id, role: 'observer' }
          });
          
          // Retry requesting camera state a few times in case tutor/learner weren't ready
          const retryDelays = [1000, 2000, 3000, 4000];
          retryDelays.forEach(delay => {
            setTimeout(async () => {
              console.log(` Retrying camera state request after ${delay}ms`);
              await mediaStateChannel.send({
                type: 'broadcast',
                event: 'request_media_state',
                payload: { requesterId: user!.id, role: 'observer' }
              });
            }, delay);
          });
          
          // Note: We don't have a fallback to assume cameras are on
          // If we don't receive state, the camera-off indicator will show (safer default)
        }
      });
    
    // Store for cleanup
    mediaChannelRef.current = mediaStateChannel;
    
    // Get observer's name from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user!.id)
      .single();
    
    const observerName = profile?.full_name || "Observer";
    
    // Broadcast observer presence via heartbeat so tutor/learner can see we're watching
    const observerTrackingChannel = supabase.channel(`observer-tracking-${sessionId}`);
    
    observerTrackingChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log(" Observer tracking channel subscribed, starting heartbeats");
        
        // Send initial heartbeat immediately
        await observerTrackingChannel.send({
          type: 'broadcast',
          event: 'observer_heartbeat',
          payload: { oderId: user!.id, observerName }
        });
        
        // Send heartbeats every 5 seconds
        const heartbeatInterval = setInterval(async () => {
          try {
            await observerTrackingChannel.send({
              type: 'broadcast',
              event: 'observer_heartbeat',
              payload: { oderId: user!.id, observerName }
            });
            console.log(" Observer heartbeat sent");
          } catch (e) {
            console.error(" Error sending heartbeat:", e);
          }
        }, 5000);
        
        // Store interval for cleanup
        (observerTrackingChannel as any)._heartbeatInterval = heartbeatInterval;
        
        // Add beforeunload handler to send leave event when page closes
        const handleBeforeUnload = () => {
          // Use sendBeacon for reliable delivery on page close
          // Since we can't use sendBeacon with Supabase channels, we'll send synchronously
          try {
            observerTrackingChannel.send({
              type: 'broadcast',
              event: 'observer_leave',
              payload: { oderId: user!.id }
            });
          } catch (e) {
            console.log(" Error sending leave on beforeunload:", e);
          }
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        (observerTrackingChannel as any)._beforeUnloadHandler = handleBeforeUnload;
      }
    });
    
    // Store channel ref for cleanup
    sessionChannelRef.current = observerTrackingChannel;
  };

  const startHeartbeat = () => {
    console.log(" Starting heartbeat - placeholder");
    // TODO: Implement heartbeat functionality
  };

  const stopHeartbeat = () => {
    console.log(" Stopping heartbeat - placeholder");
    // TODO: Implement heartbeat stop functionality
  };

  const initializePeerConnection = async (existingStream?: MediaStream) => {
    console.log(" Initializing peer connection, existingStream:", !!existingStream, "role:", role);
    try {
      let stream: MediaStream;
      
      // Use existing stream from device test if provided, otherwise get new one
      if (existingStream) {
        console.log(" Using existing stream from device test");
        console.log(" Stream tracks:", existingStream.getTracks().map(t => `${t.kind}: ${t.label} (enabled: ${t.enabled})`));
        stream = existingStream;
      } else {
        console.log(" Requesting camera and microphone access...");
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      }
      
      console.log(" Got media stream:", stream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
      
      // CRITICAL: Set local stream state FIRST before changing UI state
      // This ensures the stream is available when the video element mounts
      setLocalStream(stream);
      
      // Update camera/mic state based on track enabled status
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      if (videoTrack) {
        setIsCameraOn(videoTrack.enabled);
        console.log(" Camera track enabled:", videoTrack.enabled);
      }
      if (audioTrack) {
        setIsMicOn(audioTrack.enabled);
        console.log("🎤 Mic track enabled:", audioTrack.enabled);
      }
      
      // For LEARNER: Don't initialize WebRTC yet - wait until admitted
      // Just mark that device test is done and set peer_id to signal we're waiting
      // Use ref to get current session status (avoids stale closure)
      const currentSessionStatus = sessionStatusRef.current;
      console.log(" Checking session status for learner - ref:", currentSessionStatus, "state:", sessionStatus);
      
      if (role === "learner" && currentSessionStatus === "waiting") {
        console.log(" Learner: Saving stream but NOT initializing WebRTC (waiting for admit)");
        
        // Set learner_peer_id to signal we're in waiting room
        await supabase.from("sessions").update({ 
          learner_peer_id: user!.id
        }).eq("id", sessionId);
        
        // Change UI state to show waiting room
        setHasTestedDevices(true);
        setShowDeviceTest(false);
        return; // Don't initialize WebRTC yet
      }
      
      // For TUTOR: Initialize WebRTC immediately
      await initializeWebRTC(stream);
      
      // NOW change UI state - this triggers re-render with video element
      setHasTestedDevices(true);
      setShowDeviceTest(false);
      
      // Use requestAnimationFrame + setTimeout to ensure video element is mounted
      // before trying to set srcObject
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (localVideoRef.current && stream) {
            console.log(" Setting video srcObject after UI update");
            localVideoRef.current.srcObject = stream;
            localVideoRef.current.muted = true;
            localVideoRef.current.play()
              .then(() => console.log(" Local video playing after UI update"))
              .catch(e => console.log(" Play error after UI update:", e));
          }
        }, 100);
      });
      
    } catch (error: any) {
      console.error("Failed to initialize peer connection:", error);
      toast.error("Failed to initialize video connection: " + error.message);
    }
  };

  // Show loading while fetching session data
  if (!sessionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  // Show device test modal FIRST (skip for monitor mode and observer mode)
  if (showDeviceTest && !hasTestedDevices && !isMonitorMode && !isObserverMode) {
    return (
      <div className="h-screen bg-background">
        <DeviceTestModal
          open={showDeviceTest}
          onContinue={initializePeerConnection}
          onCancel={handleDeviceTestCancel}
          sessionData={sessionData}
        />
      </div>
    );
  }

  // Show waiting room SECOND if learner is waiting (skip for monitor mode and observer mode)
  if (sessionStatus === "waiting" && role === "learner" && !isMonitorMode && !isObserverMode && sessionData && hasTestedDevices) {
    console.log(" Showing waiting room - sessionStatus:", sessionStatus, "role:", role);
    
    return (
      <div className="h-screen bg-background">
        <WaitingRoom sessionData={sessionData} role={role} />
      </div>
    );
  }

  // Show waiting screen for observers if session hasn't started yet
  if (sessionStatus === "waiting" && isObserverMode && sessionData) {
    console.log(" Observer waiting - session not in progress yet");
    
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4 space-y-4">
          <Eye className="h-12 w-12 mx-auto text-purple-500 animate-pulse" />
          <h2 className="text-xl font-semibold">Waiting for Session to Start</h2>
          <p className="text-muted-foreground">
            The tutor and learner haven't started the session yet. You'll be able to observe once they begin.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium">{sessionData.subject}</p>
            <p className="text-muted-foreground mt-1">
              {sessionData.tutor_profiles?.full_name} with {sessionData.learner_profiles?.full_name}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/learner/sessions")}>
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  // Show loading screen THIRD if session data is not loaded yet
  if (!sessionData || isLoadingMedia) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {sessionStatus === "completed" && !isMonitorMode && !isObserverMode && !showLogModal ? 
              "Session completed" : 
              "Preparing video session..."
            }
          </p>
        </div>
      </div>
    );
  }

  const showCompletionScreen = sessionStatus === "completed" && !isMonitorMode && !isObserverMode && !showLogModal;
  
  console.log(" Showing main session interface - sessionStatus:", sessionStatus, "role:", role);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Tutor Admit Control */}
      {showAdmitControl && role === "tutor" && (
        <TutorAdmitControl
          key="tutor-admit-control"
          learnerName={sessionData?.learner_profiles?.full_name || "Learner"}
          onAdmit={handleAdmitLearner}
          onReject={() => setShowAdmitControl(false)}
        />
      )}

      {/* Header */}
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{sessionData.subject || "Interactive Session"}</h1>
          <p className="text-sm text-muted-foreground">
            {isMonitorMode ? (
              <>Admin Monitoring Mode - Observing session</>
            ) : isObserverMode ? (
              <>Tag-Along Mode - View Only</>
            ) : (
              <>
                Session with{" "}
                {role === "tutor"
                  ? sessionData.learner_profiles?.full_name
                  : sessionData.tutor_profiles?.full_name}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Observer Indicator - Show when observers are watching */}
          {!isMonitorMode && !isObserverMode && activeObservers.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium cursor-default border border-purple-200 dark:border-purple-700 animate-in fade-in duration-300">
                    <Eye className="w-4 h-4" />
                    <span>Observers: {activeObservers.length}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium mb-1">Currently watching:</p>
                  <ul className="text-sm space-y-0.5">
                    {activeObservers.map((observer) => (
                      <li key={observer.id} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        {observer.name}
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Enhanced Connection Status Indicator */}
          <ConnectionStatus connectionState={connectionState} isViewOnly={isMonitorMode || isObserverMode} />
          
          {!isMonitorMode && !isObserverMode && <SessionTimer sessionId={sessionId!} onTimeout={async () => {
            // Prevent multiple timeout triggers
            if (sessionStatus === "completed" || logModalShown) {
              console.log(" Timeout already handled, skipping");
              return;
            }
            
            console.log(" Session timeout - auto-ending session");
            
            // Clean up media tracks first
            cleanupMediaTracks();
            
            // Update session to completed when timeout occurs
            await supabase
              .from("sessions")
              .update({ 
                session_status: "completed",
                status: "completed" 
              })
              .eq("id", sessionId);
            
            // Update local state
            setSessionStatus("completed");
            sessionStatusRef.current = "completed";
            
            // Show appropriate modal based on role
            if (!logModalShown) {
              console.log(" Showing log modal after timeout");
              setShowLogModal(true);
              setLogModalShown(true);
              toast.info("Session time has ended");
            }
          }} />}
          {isMonitorMode ? (
            <>
              <Button variant="destructive" onClick={handleEndSession}>
                Force End Session
              </Button>
              <Button variant="outline" onClick={() => navigate("/admin/live-monitoring")}>
                Stop Monitoring
              </Button>
            </>
          ) : isObserverMode ? (
            <Button variant="outline" onClick={() => navigate("/learner/sessions")}>
              Leave Observing
            </Button>
          ) : (
            role === "tutor" && (
              <Button variant="destructive" onClick={handleEndSession}>
                End Session
              </Button>
            )
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 overflow-hidden min-h-0">
        {/* Left Panel - Whiteboard/Assets */}
        <div className="hidden lg:flex lg:flex-[0_0_68%] bg-card rounded-lg border shadow-sm overflow-hidden flex-col min-h-0">
          <div className="flex border-b shrink-0">
            <div className="flex-1">
              <button
                onClick={() => setActivePanel("whiteboard")}
                className={`w-full py-3 px-4 text-sm font-medium transition-colors ${
                  activePanel === "whiteboard"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Whiteboard {(isMonitorMode || isObserverMode) && "(View Only)"}
              </button>
            </div>
            <div className="flex-1">
              <button
                onClick={() => setActivePanel("assets")}
                className={`w-full py-3 px-4 text-sm font-medium transition-colors ${
                  activePanel === "assets"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Assets {(isMonitorMode || isObserverMode) && "(View Only)"}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            <div className={activePanel === "whiteboard" ? "h-full" : "hidden h-full"}>
              <WhiteboardCanvas 
                sessionId={sessionId!} 
                isMonitorMode={isMonitorMode || isObserverMode}
                isPeerConnected={connectionState.isConnected || !!remoteStream}
                isSessionInProgress={sessionStatus === "in_progress"}
              />
            </div>
            <div className={activePanel === "assets" ? "h-full" : "hidden h-full"}>
              <AssetsPanel sessionId={sessionId!} isMonitorMode={isMonitorMode || isObserverMode} />
            </div>
          </div>
        </div>

        {/* Right Panel - Video & Chat */}
        <div className="flex-1 lg:flex-[0_0_32%] flex flex-col gap-3 min-h-0">
          {/* Video Feeds Section */}
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden shrink-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
              {/* Observer/Monitor Mode - Show actual video streams */}
              {(isObserverMode || isMonitorMode) ? (
                <>
                  {/* Tutor Video */}
                  <div className={`relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video rounded-lg overflow-hidden group ${
                    tutorSpeaking ? 'ring-4 ring-primary shadow-lg shadow-primary/50' : ''
                  }`}>
                    <video
                      ref={tutorVideoRef}
                      autoPlay
                      playsInline
                      muted={false}
                      className="w-full h-full object-cover"
                      onLoadedMetadata={() => console.log(" Tutor video metadata loaded")}
                      onCanPlay={() => {
                        console.log(" Tutor video can play");
                        tutorVideoRef.current?.play().catch(() => {});
                      }}
                      onPlay={() => console.log(" Tutor video started playing")}
                    />
                    {/* Show placeholder if no tutor stream yet */}
                    {!tutorStream && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                        <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-white/20 flex items-center justify-center mb-2">
                          <span className="text-xl font-bold text-white">
                            {sessionData?.tutor_profiles?.full_name?.charAt(0).toUpperCase() || "T"}
                          </span>
                        </div>
                        <p className="text-white text-xs font-medium">{sessionData?.tutor_profiles?.full_name || "Tutor"}</p>
                        <p className="text-white/50 text-[10px] mt-1">Waiting for video...</p>
                      </div>
                    )}
                    {/* Show camera off indicator when tutor has camera disabled */}
                    {tutorStream && !tutorCameraOn && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 z-20">
                        <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-white/20 flex items-center justify-center mb-2">
                          <span className="text-xl font-bold text-white">
                            {sessionData?.tutor_profiles?.full_name?.charAt(0).toUpperCase() || "T"}
                          </span>
                        </div>
                        <p className="text-white text-xs font-medium">{sessionData?.tutor_profiles?.full_name || "Tutor"}</p>
                        <VideoOff className="w-4 h-4 text-white/50 mt-1" />
                      </div>
                    )}
                    {/* Label */}
                    <div className={`absolute top-1 left-1 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[10px] font-medium z-10 ${
                      tutorSpeaking ? 'bg-primary' : 'bg-black/60'
                    }`}>
                      Tutor
                    </div>
                    {/* Fullscreen button for observer - visible on hover */}
                    {tutorStream && (
                      <button
                        onClick={() => setFullscreenVideo(fullscreenVideo === 'tutor' ? null : 'tutor')}
                        className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-black/80"
                        title="Fullscreen"
                      >
                        <Maximize className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {/* Learner Video */}
                  <div className={`relative bg-gradient-to-br from-gray-800 to-gray-700 aspect-video rounded-lg overflow-hidden group ${
                    learnerSpeaking ? 'ring-4 ring-primary shadow-lg shadow-primary/50' : ''
                  }`}>
                    <video
                      ref={learnerVideoRef}
                      autoPlay
                      playsInline
                      muted={false}
                      className="w-full h-full object-cover"
                      onLoadedMetadata={() => console.log(" Learner video metadata loaded")}
                      onCanPlay={() => {
                        console.log(" Learner video can play");
                        learnerVideoRef.current?.play().catch(() => {});
                      }}
                      onPlay={() => console.log(" Learner video started playing")}
                    />
                    {/* Show placeholder if no learner stream yet */}
                    {!learnerStream && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700">
                        <div className="w-12 h-12 rounded-full bg-secondary/20 border-2 border-white/20 flex items-center justify-center mb-2">
                          <span className="text-xl font-bold text-white">
                            {sessionData?.learner_profiles?.full_name?.charAt(0).toUpperCase() || "L"}
                          </span>
                        </div>
                        <p className="text-white text-xs font-medium">{sessionData?.learner_profiles?.full_name || "Learner"}</p>
                        <p className="text-white/50 text-[10px] mt-1">Waiting for video...</p>
                      </div>
                    )}
                    {/* Show camera off indicator when learner has camera disabled */}
                    {learnerStream && !learnerCameraOn && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700 z-20">
                        <div className="w-12 h-12 rounded-full bg-secondary/20 border-2 border-white/20 flex items-center justify-center mb-2">
                          <span className="text-xl font-bold text-white">
                            {sessionData?.learner_profiles?.full_name?.charAt(0).toUpperCase() || "L"}
                          </span>
                        </div>
                        <p className="text-white text-xs font-medium">{sessionData?.learner_profiles?.full_name || "Learner"}</p>
                        <VideoOff className="w-4 h-4 text-white/50 mt-1" />
                      </div>
                    )}
                    {/* Label */}
                    <div className={`absolute top-1 left-1 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[10px] font-medium z-10 ${
                      learnerSpeaking ? 'bg-primary' : 'bg-black/60'
                    }`}>
                      Learner
                    </div>
                    {/* Fullscreen button for observer - visible on hover */}
                    {learnerStream && (
                      <button
                        onClick={() => setFullscreenVideo(fullscreenVideo === 'learner' ? null : 'learner')}
                        className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-black/80"
                        title="Fullscreen"
                      >
                        <Maximize className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Remote Video */}
                  <div className={`relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video rounded-lg overflow-hidden group transition-all duration-200 ${
                    remoteSpeaking ? 'ring-4 ring-primary shadow-lg shadow-primary/50' : ''
                  }`}>
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      onLoadedMetadata={() => console.log(" Remote video metadata loaded")}
                      onCanPlay={() => console.log(" Remote video can play")}
                      onPlay={() => console.log(" Remote video started playing")}
                      onError={(e) => console.error(" Remote video error:", e)}
                    />
                    {/* Show overlay when not connected AND no remote stream */}
                    {!connectionState.isConnected && !remoteStream && (
                      <div className="absolute inset-0 w-full h-full flex flex-col text-white bg-gradient-to-br from-gray-900 to-gray-800">
                        <div className="flex items-center justify-center gap-2 p-4 bg-background/20">
                          <VideoOff className="w-5 h-5 opacity-75" />
                          <p className="text-sm font-medium">
                            {sessionStatus === "waiting" 
                              ? (role === "tutor" ? "Waiting for learner..." : "Waiting for tutor...")
                              : "Connecting..."
                            }
                          </p>
                        </div>
                        <div className="flex-1 bg-black/50" />
                      </div>
                    )}
                    {/* Show waiting indicator when connected but no remote stream yet */}
                    {connectionState.isConnected && !remoteStream && (
                      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-white bg-gradient-to-br from-gray-900 to-gray-800">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                        <p className="text-sm font-medium">Waiting for video...</p>
                      </div>
                    )}
                    {/* Show camera off overlay when remote user has camera disabled */}
                    {remoteStream && hasReceivedRemoteState && !remoteCameraOn && !remoteScreenSharing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 z-20">
                        <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-white/20 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {(role === "tutor" 
                              ? sessionData?.learner_profiles?.full_name 
                              : sessionData?.tutor_profiles?.full_name
                            )?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <p className="mt-2 text-white text-xs font-medium">
                          {role === "tutor" 
                            ? sessionData?.learner_profiles?.full_name 
                            : sessionData?.tutor_profiles?.full_name}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-white/50">
                          <VideoOff className="w-4 h-4" />
                          <span className="text-xs">Camera off</span>
                        </div>
                      </div>
                    )}
                    {/* Label */}
                    <div className={`absolute top-1 left-1 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[10px] font-medium transition-colors z-30 ${
                      remoteSpeaking ? 'bg-primary' : 'bg-black/60'
                    }`}>
                      {role === "tutor" ? "Learner" : "Tutor"}
                    </div>
                    {/* Fullscreen button - visible on hover */}
                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                      <button
                        onClick={() => setFullscreenVideo('remote')}
                        className="p-1.5 rounded bg-black/60 hover:bg-black/80 text-white transition-colors"
                        title="Fullscreen"
                      >
                        <Maximize className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Local Video */}
                  <div className={`relative bg-gradient-to-br from-gray-800 to-gray-700 aspect-video rounded-lg overflow-hidden group transition-all duration-200 ${
                    localSpeaking && isMicOn ? 'ring-4 ring-primary shadow-lg shadow-primary/50' : ''
                  }`}>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      onLoadedMetadata={() => console.log(" Local video metadata loaded")}
                      onCanPlay={() => console.log(" Local video can play")}
                      onPlay={() => console.log(" Local video started playing")}
                      onError={(e) => console.error(" Local video error:", e)}
                    />
                    {/* Label */}
                    <div className={`absolute top-1 left-1 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[10px] font-medium transition-colors z-30 ${
                      localSpeaking && isMicOn ? 'bg-primary' : 'bg-black/60'
                    }`}>
                      {isScreenSharing ? "Your Screen" : "You"}
                    </div>
                    {/* Controls inside video - visible on hover */}
                    <div className="absolute bottom-1 left-1 right-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                      <button
                        onClick={toggleCamera}
                        className={`p-1.5 rounded ${isCameraOn ? 'bg-black/60 hover:bg-black/80' : 'bg-red-500/80 hover:bg-red-500'} text-white transition-colors`}
                        title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                      >
                        {isCameraOn ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={toggleMic}
                        className={`p-1.5 rounded ${isMicOn ? 'bg-black/60 hover:bg-black/80' : 'bg-red-500/80 hover:bg-red-500'} text-white transition-colors`}
                        title={isMicOn ? "Mute" : "Unmute"}
                      >
                        {isMicOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={toggleScreenShare}
                        className={`p-1.5 rounded ${isScreenSharing ? 'bg-primary hover:bg-primary/80' : 'bg-black/60 hover:bg-black/80'} text-white transition-colors`}
                        title={isScreenSharing ? "Stop sharing" : "Share screen"}
                      >
                        <MonitorUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setShowSettings(true)}
                        className="p-1.5 rounded bg-black/60 hover:bg-black/80 text-white transition-colors"
                        title="Settings"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setFullscreenVideo('local')}
                        className="p-1.5 rounded bg-black/60 hover:bg-black/80 text-white transition-colors"
                        title="Fullscreen"
                      >
                        <Maximize className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Show placeholder ONLY when camera is intentionally off */}
                    {localStream && !isCameraOn && !isScreenSharing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg z-20">
                        <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-white/20 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {(role === "tutor" ? sessionData?.tutor_profiles?.full_name : sessionData?.learner_profiles?.full_name)?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <VideoOff className="w-4 h-4 text-white/50 mt-1" />
                        <p className="text-xs text-white/70 mt-1">Camera off</p>
                      </div>
                    )}
                    {/* Show loading when no stream yet */}
                    {!localStream && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg z-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                        <p className="text-xs text-white/70">Loading camera...</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="hidden lg:flex flex-1 bg-card rounded-lg border shadow-sm overflow-hidden min-h-0 flex-col">
            <SessionChat sessionId={sessionId!} userId={user!.id} disableFullscreen={false} isMonitorMode={isMonitorMode || isObserverMode} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <SessionLogModal
        open={showLogModal}
        onOpenChange={setShowLogModal}
        sessionId={sessionId!}
        userRole={role}
        onComplete={handleLogModalComplete}
      />

      <SessionFeedbackModal
        open={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
        sessionId={sessionId!}
        onComplete={handleFeedbackComplete}
      />

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Session Settings</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Left Column - Camera Preview */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Camera Preview</label>
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden aspect-video">
                  <video
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    ref={(el) => {
                      if (el && localStream) {
                        el.srcObject = localStream;
                      }
                    }}
                  />
                  {!isCameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <VideoOff className="w-12 h-12 text-white opacity-75" />
                    </div>
                  )}
                  {/* Quick controls */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant={isCameraOn ? "secondary" : "destructive"}
                      onClick={toggleCamera}
                      className="rounded-full h-10 w-10"
                    >
                      {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant={isMicOn ? "secondary" : "destructive"}
                      onClick={toggleMic}
                      className="rounded-full h-10 w-10"
                    >
                      {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Microphone Test */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Microphone Test</label>
                <div className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl p-4 border border-border/50">
                  <AudioVisualizer stream={localStream} isActive={isMicOn} />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {isMicOn ? "🎤 Speak to see audio levels" : "🔇 Microphone is muted"}
                </p>
              </div>
            </div>

            {/* Right Column - Device Selection */}
            <div className="space-y-4">
              <DeviceSelector
                onDeviceChange={handleDeviceChange}
                selectedVideoDevice={selectedVideoDevice}
                selectedAudioDevice={selectedAudioDevice}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Video Overlay */}
      {fullscreenVideo && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFullscreenVideo(null);
          }}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              autoPlay
              playsInline
              muted={fullscreenVideo === 'local'}
              className="max-w-full max-h-full object-contain rounded-lg"
              ref={(el) => {
                if (!el) return;
                // For local video, use screen stream if screen sharing, otherwise local stream
                const stream = 
                  fullscreenVideo === 'tutor' ? tutorStream :
                  fullscreenVideo === 'learner' ? learnerStream :
                  fullscreenVideo === 'remote' ? remoteStream :
                  fullscreenVideo === 'local' ? (isScreenSharing && screenStreamRef.current ? screenStreamRef.current : localStream) : null;
                if (stream && el.srcObject !== stream) {
                  el.srcObject = stream;
                  el.play().catch(() => {});
                }
              }}
            />
            {/* Camera off indicator for remote user */}
            {fullscreenVideo === 'remote' && hasReceivedRemoteState && !remoteCameraOn && !remoteScreenSharing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg">
                <div className="w-32 h-32 rounded-full bg-primary/20 border-4 border-white/20 flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">
                    {(role === "tutor" 
                      ? sessionData?.learner_profiles?.full_name 
                      : sessionData?.tutor_profiles?.full_name
                    )?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
                <p className="mt-4 text-white text-lg font-medium">
                  {role === "tutor" 
                    ? sessionData?.learner_profiles?.full_name 
                    : sessionData?.tutor_profiles?.full_name}
                </p>
                <div className="flex items-center gap-2 mt-2 text-white/70">
                  <VideoOff className="w-5 h-5" />
                  <span className="text-sm">Camera off</span>
                </div>
              </div>
            )}
            {/* Camera off indicator for local user */}
            {fullscreenVideo === 'local' && !isCameraOn && !isScreenSharing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg">
                <div className="w-32 h-32 rounded-full bg-primary/20 border-4 border-white/20 flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">
                    {(role === "tutor" 
                      ? sessionData?.tutor_profiles?.full_name 
                      : sessionData?.learner_profiles?.full_name
                    )?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
                <p className="mt-4 text-white text-lg font-medium">You</p>
                <div className="flex items-center gap-2 mt-2 text-white/70">
                  <VideoOff className="w-5 h-5" />
                  <span className="text-sm">Camera off</span>
                </div>
              </div>
            )}
            {/* Camera off indicator for tutor (observer mode) */}
            {fullscreenVideo === 'tutor' && !tutorCameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg">
                <div className="w-32 h-32 rounded-full bg-primary/20 border-4 border-white/20 flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">
                    {sessionData?.tutor_profiles?.full_name?.charAt(0).toUpperCase() || "T"}
                  </span>
                </div>
                <p className="mt-4 text-white text-lg font-medium">
                  {sessionData?.tutor_profiles?.full_name || 'Tutor'}
                </p>
                <div className="flex items-center gap-2 mt-2 text-white/70">
                  <VideoOff className="w-5 h-5" />
                  <span className="text-sm">Camera off</span>
                </div>
              </div>
            )}
            {/* Camera off indicator for learner (observer mode) */}
            {fullscreenVideo === 'learner' && !learnerCameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg">
                <div className="w-32 h-32 rounded-full bg-primary/20 border-4 border-white/20 flex items-center justify-center">
                  <span className="text-5xl font-bold text-white">
                    {sessionData?.learner_profiles?.full_name?.charAt(0).toUpperCase() || "L"}
                  </span>
                </div>
                <p className="mt-4 text-white text-lg font-medium">
                  {sessionData?.learner_profiles?.full_name || 'Learner'}
                </p>
                <div className="flex items-center gap-2 mt-2 text-white/70">
                  <VideoOff className="w-5 h-5" />
                  <span className="text-sm">Camera off</span>
                </div>
              </div>
            )}
            {/* Close button */}
            <button
              onClick={() => setFullscreenVideo(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              title="Exit fullscreen (or click outside)"
            >
              <X className="w-6 h-6" />
            </button>
            {/* Label */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded bg-black/60 text-white text-sm font-medium">
              {fullscreenVideo === 'tutor' && (sessionData?.tutor_profiles?.full_name || 'Tutor')}
              {fullscreenVideo === 'learner' && (sessionData?.learner_profiles?.full_name || 'Learner')}
              {fullscreenVideo === 'remote' && (role === 'tutor' ? sessionData?.learner_profiles?.full_name : sessionData?.tutor_profiles?.full_name)}
              {fullscreenVideo === 'local' && (isScreenSharing ? 'Your Screen' : 'You')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}