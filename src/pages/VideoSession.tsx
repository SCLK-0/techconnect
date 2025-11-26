import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Peer from "peerjs";
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
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAudioLevel } from "@/hooks/useAudioLevel";

// Component to show profile picture when remote video is disabled
// Uses props to know the actual state (camera on/off, screen sharing)
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
  
  // Check if in monitor mode (admin viewing) - initialize immediately from URL to prevent flash
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
    
    // Ensure admin in monitor mode doesn't see waiting room or device test
    if (isAdminMonitor) {
      setHasTestedDevices(true);
    }
  }, [role]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [tutorStream, setTutorStream] = useState<MediaStream | null>(null);
  const [learnerStream, setLearnerStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [remotePeerId, setRemotePeerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activePanel, setActivePanel] = useState<"whiteboard" | "assets">("whiteboard");
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logModalShown, setLogModalShown] = useState(false); // Prevent showing log modal twice
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
  const [hasNotifiedMonitoring, setHasNotifiedMonitoring] = useState(false);
  const [remoteCameraOn, setRemoteCameraOn] = useState(false); // Remote user's camera state - default to false to show profile pic until broadcast received
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false); // Remote user's screen share state
  const [hasReceivedRemoteState, setHasReceivedRemoteState] = useState(false); // Track if we've received any broadcast
  
  // Debug logging
  useEffect(() => {
    console.log("🔴 remoteCameraOn changed to:", remoteCameraOn, "hasReceivedRemoteState:", hasReceivedRemoteState);
  }, [remoteCameraOn, hasReceivedRemoteState]);
  
  useEffect(() => {
    console.log("🟢 remoteScreenSharing changed to:", remoteScreenSharing);
  }, [remoteScreenSharing]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [disconnectStartTime, setDisconnectStartTime] = useState<number | null>(null);
  const [disconnectCountdown, setDisconnectCountdown] = useState<number | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const tutorVideoRef = useRef<HTMLVideoElement>(null);
  const learnerVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const disconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callRef = useRef<any>(null);
  const sessionChannelRef = useRef<any>(null);

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
    const peerConnectedStatus = isConnected && remoteStream !== null;
    console.log("🔗 Whiteboard peer status - isConnected:", isConnected, "remoteStream:", remoteStream !== null, "=> isPeerConnected:", peerConnectedStatus);
  }, [isConnected, remoteStream]);
  
  // Ensure local video element gets the stream when it changes
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log("📹 LocalStream changed, updating video element");
      console.log("📹 Stream tracks:", localStream.getTracks().map(t => `${t.kind}: ${t.label} (enabled: ${t.enabled})`));
      if (localVideoRef.current.srcObject !== localStream) {
        console.log("📹 Setting srcObject on video element");
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play()
          .then(() => console.log("✅ Video playing"))
          .catch(e => console.log("⚠️ Auto-play prevented:", e));
      } else {
        console.log("📹 srcObject already set, skipping");
      }
    }
  }, [localStream]);
  
  // When learner is admitted (status changes to in_progress), ensure video is set
  useEffect(() => {
    if (sessionStatus === "in_progress" && localStream && role === "learner") {
      console.log("🎓 Learner admitted! Ensuring video is set");
      const timer = setTimeout(() => {
        if (localVideoRef.current && localStream) {
          console.log("📹 Setting learner video after admission");
          localVideoRef.current.srcObject = localStream;
          localVideoRef.current.play()
            .then(() => console.log("✅ Learner video playing after admission"))
            .catch(e => console.log("⚠️ Auto-play prevented:", e));
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sessionStatus, role, localStream]);

  // Start heartbeat when connected
  useEffect(() => {
    if (isConnected && sessionStatus === "in_progress") {
      console.log("❤️ Starting heartbeat to detect disconnects");
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
        console.log("🚪 Browser closing - clearing peer ID");
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
        
        // If session is already completed, show session log or redirect
        if (status === "completed") {
          console.log("📝 Session already completed on load");
          
          if (role === "tutor" && !isMonitorMode) {
            // Show session log modal for tutors if not shown yet
            setIsLoadingMedia(false);
            setHasTestedDevices(true);
            if (!logModalShown) {
              console.log("📝 Showing log modal for tutor");
              toast.info("This session has ended");
              setShowLogModal(true);
              setLogModalShown(true);
            } else {
              // If log was already shown, redirect away
              console.log("🔄 Log already shown, redirecting tutor");
              window.location.replace("/tutor/sessions");
            }
            return; // Don't initialize media devices
          }
          
          if (role === "learner") {
            // Show session log for learners
            console.log("📝 Showing log for learner");
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
        if (role === "tutor" && session.learner_peer_id && session.session_status === "waiting") {
          console.log("🚪 Learner already waiting on load - showing admit control");
          setShowAdmitControl(true);
        }
        
        setIsLoadingMedia(false);
        
        // Skip device test for monitor mode - immediately initialize
        if (isMonitorMode) {
          setHasTestedDevices(true);
          setShowDeviceTest(false);
          // For monitors, initialize peer without local media
          initializeMonitorMode();
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
          console.log("🔔 Session status update received:", {
            session_status: newSession.session_status,
            status: newSession.status,
            learner_peer_id: newSession.learner_peer_id,
            tutor_peer_id: newSession.tutor_peer_id
          });
          
            // Update session status
            if (newSession.session_status) {
              const status = newSession.session_status as "waiting" | "in_progress" | "completed";
              console.log("📊 Updating sessionStatus from", sessionStatus, "to", status);
              setSessionStatus(status);
              
              if (status === "in_progress" && role === "learner") {
                console.log("✅ Learner admitted! Showing success toast");
                toast.success("You've been admitted to the session!");
              }
              
              if (status === "completed") {
                console.log("📝 Session completed via realtime - cleaning up");
                toast.info("Session has ended");
                // Clean up all media tracks
                cleanupMediaTracks();
                
                if (isMonitorMode) {
                  // Admin in monitor mode - navigate back to monitoring dashboard
                  console.log("👀 Admin monitor - navigating to dashboard");
                  navigate("/admin/live-monitoring");
                } else {
                  // Tutor or learner - show session log modal
                  console.log("📝 Showing session log modal");
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



  // Initialize monitor mode (admin viewing without camera/mic)
  const initializeMonitorMode = async () => {
    try {
      console.log("Initializing monitor mode - no local media needed");
      
      setHasTestedDevices(true);

      // Initialize PeerJS for monitoring - will receive streams from both tutor and learner
      const newPeer = new Peer(`monitor-${user!.id}-${Date.now()}`, {
        secure: true,
        pingInterval: 5000,
        config: {
          iceServers: [
            // Multiple STUN servers for better connectivity
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
            // TURN servers for NAT traversal
            { 
              urls: "turn:openrelay.metered.ca:80",
              username: "openrelayproject",
              credential: "openrelayproject"
            },
            { 
              urls: "turn:openrelay.metered.ca:443",
              username: "openrelayproject",
              credential: "openrelayproject"
            },
            {
              urls: "turn:openrelay.metered.ca:443?transport=tcp",
              username: "openrelayproject",
              credential: "openrelayproject"
            }
          ],
          sdpSemantics: 'unified-plan',
          iceTransportPolicy: 'all',
          iceCandidatePoolSize: 20 // Increased for better connectivity
        },
        debug: import.meta.env.DEV ? 2 : 0, // Only enable debug in development
      });

      setPeer(newPeer);

      newPeer.on("open", async (id) => {
        console.log("Monitor peer ID:", id);
        
        // Broadcast admin monitoring presence with peer ID
        if (!hasNotifiedMonitoring) {
          try {
            const channel = supabase.channel(`session-monitoring-${sessionId}`);
            await channel.subscribe();
            await channel.send({
              type: 'broadcast',
              event: 'admin_joined',
              payload: { 
                admin_id: user!.id,
                monitor_peer_id: id
              }
            });
            setHasNotifiedMonitoring(true);
            // Keep channel open to receive updates
          } catch (error) {
            console.error("Error notifying monitoring presence:", error);
          }
        }
      });

      newPeer.on("call", (call) => {
        console.log("Monitor receiving call from:", call.peer);
        // Answer without a stream (monitor doesn't send media)
        call.answer();
        
        call.on("stream", (stream) => {
          console.log("📹 Monitor received stream from:", call.peer, "Tutor ID:", sessionData?.tutor_peer_id, "Learner ID:", sessionData?.learner_peer_id);
          
          // Determine if this is tutor or learner based on session data
          if (call.peer === sessionData?.tutor_peer_id) {
            console.log("📹 Monitor: Setting tutor stream");
            setTutorStream(stream);
            setTimeout(() => {
              setVideoStream(tutorVideoRef, stream, "Tutor (Monitor)");
            }, 100);
          } else if (call.peer === sessionData?.learner_peer_id) {
            console.log("📹 Monitor: Setting learner stream");
            setLearnerStream(stream);
            setTimeout(() => {
              setVideoStream(learnerVideoRef, stream, "Learner (Monitor)");
            }, 100);
          } else {
            console.warn("⚠️ Monitor: Received stream from unknown peer:", call.peer, "- waiting for session data to identify");
            // Store stream temporarily and try again after a delay
            setTimeout(() => {
              if (call.peer === sessionData?.tutor_peer_id) {
                console.log("📹 Monitor: Identified as tutor stream (delayed)");
                setTutorStream(stream);
                setVideoStream(tutorVideoRef, stream, "Tutor (Monitor)");
              } else if (call.peer === sessionData?.learner_peer_id) {
                console.log("📹 Monitor: Identified as learner stream (delayed)");
                setLearnerStream(stream);
                setVideoStream(learnerVideoRef, stream, "Learner (Monitor)");
              }
            }, 500);
          }
          setIsConnected(true);
        });
      });

      newPeer.on("error", (error) => {
        console.error("Monitor peer error:", error);
      });

    } catch (error: any) {
      console.error("Error initializing monitor mode:", error);
      toast.error("Failed to initialize monitoring");
    }
  };

  // Auto-complete session after disconnect timeout
  const startDisconnectTimer = () => {
    if (disconnectTimeoutRef.current) {
      clearTimeout(disconnectTimeoutRef.current);
    }

    setDisconnectStartTime(Date.now());
    const DISCONNECT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    disconnectTimeoutRef.current = setTimeout(async () => {
      console.log("⏱️ Disconnect timeout reached - auto-completing session");
      
      try {
        // Update session to completed with disconnect reason
        const { error } = await supabase
          .from("sessions")
          .update({
            status: "completed",
            session_status: "completed",
            disconnect_reason: "auto_completed_due_to_disconnect"
          })
          .eq("id", sessionId);

        if (error) {
          console.error("Error auto-completing session:", error);
        } else {
          console.log("✅ Session auto-completed due to disconnect");
          toast.info("Session ended due to disconnect");
          
          // Redirect based on role
          if (role === "tutor") {
            navigate("/tutor/sessions");
          } else if (role === "learner") {
            navigate("/learner/sessions");
          } else if (isMonitorMode) {
            navigate("/admin/sessions");
          } else {
            navigate("/");
          }
        }
      } catch (error) {
        console.error("Error in disconnect timer:", error);
      }
    }, DISCONNECT_TIMEOUT);
  };

  const clearDisconnectTimer = () => {
    if (disconnectTimeoutRef.current) {
      clearTimeout(disconnectTimeoutRef.current);
      disconnectTimeoutRef.current = null;
    }
    setDisconnectStartTime(null);
    setDisconnectCountdown(null);
  };

  // Update countdown timer every second
  useEffect(() => {
    if (!disconnectStartTime) {
      setDisconnectCountdown(null);
      return;
    }

    const DISCONNECT_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    const updateCountdown = () => {
      const elapsed = Date.now() - disconnectStartTime;
      const remaining = Math.max(0, Math.ceil((DISCONNECT_TIMEOUT - elapsed) / 1000));
      setDisconnectCountdown(remaining);
      
      if (remaining === 0) {
        setDisconnectCountdown(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [disconnectStartTime]);

  // Heartbeat system to detect disconnects faster
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    console.log("❤️ Heartbeat started - checking every 1 second for faster disconnect detection");
    
    let lastFrameCheck = Date.now();
    let noFrameCount = 0;
    
    // Check every 1 second for faster detection
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        if (!sessionId) {
          console.log("⚠️ No sessionId, stopping heartbeat");
          return;
        }
        
        // Fast check: Monitor if remote video is frozen (no new frames)
        if (remoteVideoRef.current && remoteStream) {
          const video = remoteVideoRef.current;
          const now = Date.now();
          
          // Check if video is playing and has dimensions
          if (video.readyState >= 2 && video.videoWidth > 0) {
            // Video should be playing - check if it's actually updating
            const timeSinceLastCheck = now - lastFrameCheck;
            
            if (timeSinceLastCheck >= 1000) {
              // Check if video time is progressing or if we're getting new frames
              if (video.paused || video.ended) {
                noFrameCount++;
                console.log(`⚠️ Video appears frozen (paused/ended) - count: ${noFrameCount}`);
              } else {
                noFrameCount = 0;
              }
              
              lastFrameCheck = now;
              
              // If video has been frozen for 3 consecutive checks (3 seconds), trigger disconnect
              if (noFrameCount >= 3) {
                console.log("🔴 DISCONNECT DETECTED! Remote video frozen for 3+ seconds");
                if (isConnected && sessionStatus === "in_progress") {
                  console.log("🔴 Starting disconnect timer NOW");
                  setIsConnected(false);
                  startDisconnectTimer();
                  clearInterval(heartbeatIntervalRef.current!);
                  return;
                }
              }
            }
          }
        }
        
        // Also check database every 3 seconds (less frequent)
        if (Date.now() % 3000 < 1000) {
          const { data: session, error } = await supabase
            .from("sessions")
            .select("session_status, tutor_peer_id, learner_peer_id")
            .eq("id", sessionId)
            .single();
          
          if (error) {
            console.error("Heartbeat query error:", error);
            return;
          }
          
          if (!session) {
            console.log("⚠️ Session not found");
            return;
          }
          
          // If session is completed, stop heartbeat
          if (session.session_status === "completed") {
            console.log("✅ Session already completed, stopping heartbeat");
            clearInterval(heartbeatIntervalRef.current!);
            return;
          }
          
          // Check if the other user's peer ID is still set
          const otherUserPeerId = role === "tutor" ? session.learner_peer_id : session.tutor_peer_id;
          
          if (!otherUserPeerId) {
            console.log("🔴 DISCONNECT DETECTED! Other user's peer ID is missing");
            if (isConnected && sessionStatus === "in_progress") {
              console.log("🔴 Starting disconnect timer NOW");
              setIsConnected(false);
              startDisconnectTimer();
              clearInterval(heartbeatIntervalRef.current!);
            }
          }
        }
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    }, 1000); // Check every 1 second instead of 3
  };
  
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // Reconnection function
  const attemptReconnection = async () => {
    if (isReconnecting || !sessionId || !peer || peer.destroyed || sessionStatus !== "in_progress") {
      return;
    }

    setIsReconnecting(true);
    const maxAttempts = 5;
    
    if (reconnectAttempts >= maxAttempts) {
      console.log("❌ Max reconnection attempts reached");
      toast.error("Unable to reconnect. Please refresh the page.");
      setIsReconnecting(false);
      return;
    }

    const attemptNum = reconnectAttempts + 1;
    const delay = Math.min(2000 * Math.pow(2, attemptNum - 1), 30000); // Exponential backoff, max 30s
    
    console.log(`🔄 Reconnection attempt ${attemptNum}/${maxAttempts} in ${delay}ms`);
    toast.info(`Reconnecting... (attempt ${attemptNum}/${maxAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        // Get latest session data
        const { data: currentSession } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (!currentSession || currentSession.session_status !== "in_progress") {
          console.log("Session no longer in progress, stopping reconnection");
          setIsReconnecting(false);
          return;
        }

        // Determine remote peer ID based on role
        const remotePeerIdToCall = role === "tutor" 
          ? currentSession.learner_peer_id 
          : currentSession.tutor_peer_id;

        if (!remotePeerIdToCall) {
          console.log("Remote peer ID not available yet");
          setReconnectAttempts(prev => prev + 1);
          setIsReconnecting(false);
          attemptReconnection();
          return;
        }

        // Clean up old call if exists
        if (callRef.current) {
          try {
            callRef.current.close();
          } catch (e) {
            console.log("Error closing old call:", e);
          }
        }

        console.log(`📞 Making reconnection call to: ${remotePeerIdToCall}`);
        
        // Get current local stream
        if (!localStream) {
          console.error("No local stream available for reconnection");
          setReconnectAttempts(prev => prev + 1);
          setIsReconnecting(false);
          attemptReconnection();
          return;
        }

        // Make the call
        const newCall = peer.call(remotePeerIdToCall, localStream);
        callRef.current = newCall;

        // Set timeout for call establishment
        const callTimeout = setTimeout(() => {
          console.log("⏰ Call establishment timeout");
          setReconnectAttempts(prev => prev + 1);
          setIsReconnecting(false);
          attemptReconnection();
        }, 10000);

        newCall.on("stream", (remoteStream) => {
          clearTimeout(callTimeout);
          console.log("✅ Reconnection successful - stream received");
          
          setRemoteStream(remoteStream);
          setIsConnected(true);
          setReconnectAttempts(0);
          setIsReconnecting(false);
          
          // Clear disconnect timer since we're reconnected
          clearDisconnectTimer();
          
          setTimeout(() => {
            setVideoStream(remoteVideoRef, remoteStream, "Remote");
            toast.success("Reconnected successfully!");
          }, 100);
        });

        newCall.on("error", (err) => {
          clearTimeout(callTimeout);
          console.error("Reconnection call error:", err);
          setReconnectAttempts(prev => prev + 1);
          setIsReconnecting(false);
          attemptReconnection();
        });

        newCall.on("close", () => {
          console.log("Reconnection call closed");
          setIsConnected(false);
          setIsReconnecting(false);
        });

      } catch (error) {
        console.error("Reconnection error:", error);
        setReconnectAttempts(prev => prev + 1);
        setIsReconnecting(false);
        attemptReconnection();
      }
    }, delay);
  };

  // Initialize peer connection after device test
  const initializePeerConnection = async (stream: MediaStream) => {
    try {
      console.log("Initializing peer connection with stream:", stream.getTracks());
      
      // Track video and audio tracks
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      console.log("Video track:", videoTrack?.label, "enabled:", videoTrack?.enabled);
      console.log("Audio track:", audioTrack?.label, "enabled:", audioTrack?.enabled);
      
      // Ensure camera and mic are enabled by default when joining session
      // (user can toggle them off after joining if they want)
      if (videoTrack) {
        videoTrack.enabled = true;
        console.log("✅ Enabled video track for session");
      }
      if (audioTrack) {
        audioTrack.enabled = true;
        console.log("✅ Enabled audio track for session");
      }
      
      // Sync camera/mic states
      setIsCameraOn(true);
      setIsMicOn(true);
      
      setLocalStream(stream);
      setHasTestedDevices(true);
      setShowDeviceTest(false);

      // Set stream immediately without delay for faster display
      if (localVideoRef.current) {
        console.log("📹 Setting local video stream immediately");
        setVideoStream(localVideoRef, stream, "Local");
      } else {
        // Fallback: wait for React to render the video element
        console.log("📹 Video ref not ready, waiting 100ms");
        setTimeout(() => {
          console.log("📹 Attempting to set local video stream, videoRef exists:", !!localVideoRef.current);
          if (localVideoRef.current) {
            setVideoStream(localVideoRef, stream, "Local");
          } else {
            console.warn("⚠️ Local video ref not ready, retrying in 500ms");
            setTimeout(() => {
              setVideoStream(localVideoRef, stream, "Local");
            }, 500);
          }
        }, 100);
      }

      // Initialize PeerJS - using default cloud server (more reliable than 0.peerjs.com)
      // Add timestamp to peer ID to avoid collisions on reconnection
      const uniquePeerId = `${user!.id}-${Date.now()}`;
      const newPeer = new Peer(uniquePeerId, {
          // Don't specify host/port to use PeerJS cloud server (peerjs.com)
          // This is more reliable than the old 0.peerjs.com server
          secure: true,
          pingInterval: 5000, // Ping every 5 seconds to keep connection alive
          config: {
            iceServers: [
              // Multiple STUN servers for better connectivity
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
              { urls: "stun:stun2.l.google.com:19302" },
              { urls: "stun:stun3.l.google.com:19302" },
              { urls: "stun:stun4.l.google.com:19302" },
              { urls: "stun:global.stun.twilio.com:3478" },
              // TURN servers for NAT traversal
              { 
                urls: "turn:openrelay.metered.ca:80",
                username: "openrelayproject",
                credential: "openrelayproject"
              },
              { 
                urls: "turn:openrelay.metered.ca:443",
                username: "openrelayproject",
                credential: "openrelayproject"
              },
              {
                urls: "turn:openrelay.metered.ca:443?transport=tcp",
                username: "openrelayproject",
                credential: "openrelayproject"
              }
            ],
            sdpSemantics: 'unified-plan',
            iceTransportPolicy: 'all',
            iceCandidatePoolSize: 20 // Increased for better connectivity
          },
          debug: import.meta.env.DEV ? 2 : 0, // Only enable debug in development
        });

      setPeer(newPeer);

      newPeer.on("open", async (id) => {
        console.log("My peer ID is: " + id);
        setPeer(newPeer);
        
        // Update peer ID in database first
        await updateSessionPeerId(id);
        console.log(`✅ ${role} peer ID updated:`, id);
        
        // For both tutor and learner: Check if session is already in progress and the other party is present
        // This handles rejoining scenarios
        const { data: currentSession } = await supabase
          .from("sessions")
          .select("session_status, tutor_peer_id, learner_peer_id")
          .eq("id", sessionId)
          .single();
        
        console.log("🔍 Checking session state for rejoin - status:", currentSession?.session_status, "tutor:", currentSession?.tutor_peer_id, "learner:", currentSession?.learner_peer_id);
        
        if (currentSession?.session_status === "in_progress") {
          // Session is already in progress - handle rejoin for both tutor and learner
          if (role === "tutor" && currentSession.learner_peer_id) {
            console.log("📞 Tutor rejoining in-progress session - calling learner:", currentSession.learner_peer_id);
            setRemotePeerId(currentSession.learner_peer_id);
            setSessionStatus("in_progress");
            toast.info("Reconnecting to learner...");
            
            const call = newPeer.call(currentSession.learner_peer_id, stream);
            callRef.current = call;
            
            call.on("stream", (remoteStream) => {
              console.log("✅ Remote learner stream received:", remoteStream.getTracks());
              
              if (!remoteStream.getTracks().length) {
                console.error("❌ Received empty learner stream");
                toast.error("Connection error: No media from learner");
                return;
              }
              
              setRemoteStream(remoteStream);
              setIsConnected(true);
              
              // Broadcast current state on rejoin
              setTimeout(() => {
                if (sessionChannelRef.current && stream) {
                  // Ensure camera is enabled before broadcasting
                  const videoTrack = stream.getVideoTracks()[0];
                  if (videoTrack && !videoTrack.enabled) {
                    console.warn("⚠️ Video track was disabled! Re-enabling it...");
                    videoTrack.enabled = true;
                    setIsCameraOn(true);
                  }
                  
                  const actualCameraState = videoTrack?.enabled ?? true;
                  
                  sessionChannelRef.current.send({
                    type: 'broadcast',
                    event: 'media_state',
                    payload: { 
                      userId: user!.id, 
                      camera: actualCameraState,
                      screenSharing: isScreenSharing
                    }
                  });
                  console.log("📡 Broadcast state on rejoin - camera:", actualCameraState, "screenSharing:", isScreenSharing);
                }
              }, 500);
              
              setTimeout(() => {
                setVideoStream(remoteVideoRef, remoteStream, "Learner");
                toast.success("✅ Reconnected to learner!");
              }, 100);
            });
            
            call.on("error", (err) => {
              console.error("📞 Call error:", err);
              toast.error("Failed to reconnect to learner");
            });
            
            call.on("close", () => {
              console.log("📞 Call closed - learner disconnected");
              setIsConnected(false);
              setRemoteStream(null);
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
              }
              
              // Start disconnect timer - session will auto-complete after 5 minutes
              if (currentSession.session_status === "in_progress") {
                startDisconnectTimer();
                attemptReconnection();
              }
            });

            // Monitor ICE connection state for faster disconnect detection
            if (call.peerConnection) {
              call.peerConnection.onconnectionstatechange = () => {
                const state = call.peerConnection.connectionState;
                console.log("🔌 ICE connection state changed:", state);
                
                if (state === "disconnected" || state === "failed" || state === "closed") {
                  console.log("⚠️ Connection state indicates disconnect:", state);
                  if (currentSession.session_status === "in_progress" && isConnected) {
                    console.log("🔴 Triggering disconnect timer due to connection state:", state);
                    setIsConnected(false);
                    setRemoteStream(null);
                    if (remoteVideoRef.current) {
                      remoteVideoRef.current.srcObject = null;
                    }
                    startDisconnectTimer();
                    attemptReconnection();
                  }
                }
              };
            }
          }
          else if (role === "learner" && currentSession.tutor_peer_id) {
            console.log("✅ Learner rejoining in-progress session - auto-admitted, waiting for tutor:", currentSession.tutor_peer_id);
            setRemotePeerId(currentSession.tutor_peer_id);
            setSessionStatus("in_progress");
            toast.success("Rejoining session...");
          }
        } else if (role === "learner" && currentSession?.session_status === "waiting") {
          console.log("⏳ Learner in waiting room - need tutor to admit");
          setSessionStatus("waiting");
          toast.info("Waiting for tutor to admit you...");
        }
      });
      
      // Handle peer disconnection
      newPeer.on("disconnected", () => {
        console.log("⚠️ Peer disconnected from server");
        setIsConnected(false);
        
        // Attempt automatic reconnection after a short delay
        setTimeout(() => {
          if (!newPeer.destroyed && newPeer.disconnected) {
            console.log("🔄 Attempting automatic peer reconnection...");
            try {
              newPeer.reconnect();
            } catch (e) {
              console.error("Error during auto-reconnect:", e);
            }
          }
        }, 1000);
      });
      
      // Handle peer errors with proper backoff
      let reconnectTimeout: NodeJS.Timeout | null = null;
      let reconnectAttempt = 0;
      const maxReconnectAttempts = 3;
      
      newPeer.on("error", (error) => {
        console.error("❌ Peer error:", error);
        
        // Handle server connection errors with exponential backoff
        if (error.type === "server-error" || error.message?.includes("Lost connection to server")) {
          console.log("🔄 PeerJS server connection lost");
          
          // Clear any existing reconnect timeout
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
          }
          
          reconnectAttempt++;
          
          // Only show toast after second attempt to avoid false alarms
          if (reconnectAttempt === 2) {
            toast.warning("Connection interrupted - reconnecting...", { duration: 3000 });
          }
          
          if (reconnectAttempt > maxReconnectAttempts) {
            console.log("❌ Max PeerJS reconnect attempts reached");
            toast.error("Connection lost", {
              description: "Unable to reconnect to video server. Please check your internet connection.",
              duration: 5000
            });
            reconnectAttempt = 0;
            return;
          }
          
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.min(2000 * Math.pow(2, reconnectAttempt - 1), 8000);
          console.log(`🔄 Will attempt PeerJS reconnect ${reconnectAttempt}/${maxReconnectAttempts} in ${delay}ms`);
          
          reconnectTimeout = setTimeout(() => {
            if (!newPeer.destroyed && newPeer.disconnected) {
              console.log(`🔄 Attempting PeerJS server reconnect (${reconnectAttempt}/${maxReconnectAttempts})...`);
              try {
                newPeer.reconnect();
                // Reset counter on successful reconnect
                setTimeout(() => {
                  if (!newPeer.disconnected) {
                    reconnectAttempt = 0;
                    console.log("✅ PeerJS reconnected successfully");
                    if (reconnectAttempt >= 2) {
                      toast.success("Connection restored", { duration: 2000 });
                    }
                  }
                }, 2000);
              } catch (e) {
                console.error("Error during reconnect:", e);
              }
            }
          }, delay);
          
          return;
        }
        
        // Reset reconnect counter for non-server errors
        reconnectAttempt = 0;
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        
        if (error.type === "peer-unavailable") {
          console.log("Peer unavailable - will retry connection");
          toast.warning("Peer unavailable - retrying...");
          if (sessionStatus === "in_progress") {
            setTimeout(() => attemptReconnection(), 2000);
          }
        } else if (error.type === "network") {
          toast.error("Network error - check your connection");
          if (sessionStatus === "in_progress") {
            setTimeout(() => attemptReconnection(), 3000);
          }
        } else if (error.type === "disconnected") {
          console.log("Peer server connection lost - attempting reconnect");
          setTimeout(() => {
            if (!newPeer.destroyed) {
              newPeer.reconnect();
            }
          }, 1000);
        } else if (error.type === "browser-incompatible") {
          toast.error("Browser not supported", {
            description: "Please use a modern browser like Chrome, Firefox, or Edge."
          });
        } else if (error.type === "ssl-unavailable") {
          toast.error("Secure connection required", {
            description: "Please access the site using HTTPS."
          });
        } else if (error.type === "webrtc") {
          toast.error("WebRTC error", {
            description: "Your browser may not support video calls. Try updating your browser."
          });
        } else {
          toast.error(`Connection error: ${error.type}`, {
            description: "Please refresh the page and try again."
          });
        }
      });

      newPeer.on("call", (call) => {
        console.log("📞 Incoming call received from:", call.peer);
        // Answer with stream (or empty for monitors)
        if (stream) {
          // Ensure camera is enabled before answering
          const videoTrack = stream.getVideoTracks()[0];
          const audioTrack = stream.getAudioTracks()[0];
          
          if (videoTrack && !videoTrack.enabled) {
            console.warn("⚠️ Video track disabled when answering call! Re-enabling...");
            videoTrack.enabled = true;
            setIsCameraOn(true);
          }
          if (audioTrack && !audioTrack.enabled) {
            console.warn("⚠️ Audio track disabled when answering call! Re-enabling...");
            audioTrack.enabled = true;
            setIsMicOn(true);
          }
          
          console.log("Answering call with local stream tracks:", stream.getTracks().map(t => `${t.kind}: ${t.label} (enabled: ${t.enabled})`));
          call.answer(stream);
        } else {
          console.log("Answering call without stream (monitor mode)");
          call.answer();
        }
        
        call.on("stream", (remoteStream) => {
          console.log("🎥 Remote stream received:", remoteStream.getTracks().map(t => `${t.kind}: ${t.label} (enabled: ${t.enabled})`));
          
          // Validate stream has tracks
          if (!remoteStream.getTracks().length) {
            console.error("❌ Received empty remote stream");
            toast.error("Connection error: No media tracks received");
            return;
          }
          
          setRemoteStream(remoteStream);
          setIsConnected(true); // Set connected immediately when stream is received
          
          // Clear disconnect timer since we're connected
          clearDisconnectTimer();
          
          // Assume camera is ON when we receive the stream (unless broadcast says otherwise)
          setRemoteCameraOn(true);
          setHasReceivedRemoteState(true);
          
          // Broadcast current state when connection is established (with delay to ensure other user is ready)
          setTimeout(() => {
            if (sessionChannelRef.current && localStream) {
              // Ensure camera is enabled before broadcasting
              const videoTrack = localStream.getVideoTracks()[0];
              if (videoTrack && !videoTrack.enabled) {
                console.warn("⚠️ Video track was disabled! Re-enabling it...");
                videoTrack.enabled = true;
                setIsCameraOn(true);
              }
              
              const actualCameraState = videoTrack?.enabled ?? true;
              
              sessionChannelRef.current.send({
                type: 'broadcast',
                event: 'media_state',
                payload: { 
                  userId: user!.id, 
                  camera: actualCameraState,
                  screenSharing: isScreenSharing
                }
              });
              console.log("📡 Broadcast state on connection - camera:", actualCameraState, "(track enabled:", videoTrack?.enabled, ") screenSharing:", isScreenSharing);
            }
          }, 500); // 500ms delay to ensure other user's channel is ready
          
          // Set video element with retry logic
          setVideoStream(remoteVideoRef, remoteStream, "Remote");
        });
        
        // Handle connection errors
        call.on("error", (err) => {
          console.error("📞 Call error:", err);
          toast.error("Connection error occurred");
          setIsConnected(false);
        });
        
        // Detect call close/disconnect
        call.on("close", () => {
          console.log("📞 Call closed - peer disconnected");
          setIsConnected(false);
          setRemoteStream(null);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          
          // Start disconnect timer - session will auto-complete after 5 minutes
          if (sessionStatus === "in_progress") {
            startDisconnectTimer();
            // Trigger automatic reconnection
            attemptReconnection();
          }
        });

        // Monitor ICE connection state for faster disconnect detection
        if (call.peerConnection) {
          call.peerConnection.onconnectionstatechange = () => {
            const state = call.peerConnection.connectionState;
            console.log("🔌 ICE connection state changed:", state);
            
            if (state === "disconnected" || state === "failed" || state === "closed") {
              console.log("⚠️ Connection state indicates disconnect:", state);
              if (sessionStatus === "in_progress" && isConnected) {
                console.log("🔴 Triggering disconnect timer due to connection state:", state);
                setIsConnected(false);
                setRemoteStream(null);
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = null;
                }
                startDisconnectTimer();
                attemptReconnection();
              }
            }
          };
        }
      });

      // Subscribe to session updates for peer ID
      const sessionChannel = supabase
        .channel(`session-${sessionId}`);
      sessionChannelRef.current = sessionChannel;
      
      sessionChannel
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
            
            // Update session status
            if (newSession.session_status) {
              const status = newSession.session_status as "waiting" | "in_progress" | "completed";
              setSessionStatus(status);
              
              // Handle session completion for all roles
              if (status === "completed") {
                toast.info("Session ended by tutor");
                // Clean up all media tracks
                cleanupMediaTracks();
                setRemoteStream(null);
                setPeer(null);
                setRemotePeerId(null);
                setIsConnected(false);
                if (localVideoRef.current) localVideoRef.current.srcObject = null;
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                screenStreamRef.current = null;
                
                if (isMonitorMode) {
                  // Admin in monitor mode - navigate back to monitoring dashboard
                  console.log("👀 Admin monitor - navigating to dashboard");
                  navigate("/admin/live-monitoring");
                } else {
                  // Tutor or learner - show session log modal
                  if (!logModalShown) {
                    setShowLogModal(true);
                    setLogModalShown(true);
                  }
                }
              }
            }

            // Show admit control to tutor ONLY if session is waiting (not for rejoins during in_progress)
            if (role === "tutor" && newSession.learner_peer_id && newSession.session_status === "waiting") {
              console.log("🚪 Learner joined - showing admit control immediately");
              setShowAdmitControl(true);
            }

            // Hide admit control if learner left or session status changed from waiting
            if (role === "tutor" && (!newSession.learner_peer_id || newSession.session_status !== "waiting")) {
              console.log("🚪 Hiding admit control");
              setShowAdmitControl(false);
            }

            // Only tutor initiates the call when session is in progress (prevents race condition)
            if (role === "tutor" && newSession.session_status === "in_progress") {
              const learnerPeerId = newSession.learner_peer_id;
              if (learnerPeerId && learnerPeerId !== remotePeerId && newPeer) {
                setRemotePeerId(learnerPeerId);
                console.log("📞 Tutor calling learner:", learnerPeerId);
                
                // Ensure tutor's camera is enabled before calling
                if (stream) {
                  const videoTrack = stream.getVideoTracks()[0];
                  const audioTrack = stream.getAudioTracks()[0];
                  if (videoTrack && !videoTrack.enabled) {
                    console.warn("⚠️ Tutor's video track disabled! Re-enabling...");
                    videoTrack.enabled = true;
                    setIsCameraOn(true);
                  }
                  if (audioTrack && !audioTrack.enabled) {
                    console.warn("⚠️ Tutor's audio track disabled! Re-enabling...");
                    audioTrack.enabled = true;
                    setIsMicOn(true);
                  }
                }
                
                const call = newPeer.call(learnerPeerId, stream);
                callRef.current = call;
                
                call.on("stream", (remoteStream) => {
                  console.log("✅ Remote learner stream received:", remoteStream.getTracks());
                  
                  // Validate stream
                  if (!remoteStream.getTracks().length) {
                    console.error("❌ Received empty learner stream");
                    toast.error("Connection error: No media from learner");
                    return;
                  }
                  
                  setRemoteStream(remoteStream);
                  setIsConnected(true);
                  
                  // Clear disconnect timer since we're reconnected
                  clearDisconnectTimer();
                  
                  // Assume camera is ON when we receive the stream (unless broadcast says otherwise)
                  setRemoteCameraOn(true);
                  setHasReceivedRemoteState(true);
                  
                  // Broadcast current state when connection is established
                  setTimeout(() => {
                    if (sessionChannelRef.current && stream) {
                      // Ensure camera is enabled before broadcasting
                      const videoTrack = stream.getVideoTracks()[0];
                      if (videoTrack && !videoTrack.enabled) {
                        console.warn("⚠️ Video track was disabled! Re-enabling it...");
                        videoTrack.enabled = true;
                        setIsCameraOn(true);
                      }
                      
                      const actualCameraState = videoTrack?.enabled ?? true;
                      
                      sessionChannelRef.current.send({
                        type: 'broadcast',
                        event: 'media_state',
                        payload: { 
                          userId: user!.id, 
                          camera: actualCameraState,
                          screenSharing: isScreenSharing
                        }
                      });
                      console.log("📡 Tutor broadcast state on connection - camera:", actualCameraState, "screenSharing:", isScreenSharing);
                    }
                  }, 500);
                  
                  // Set video element with retry logic
                  setTimeout(() => {
                    setVideoStream(remoteVideoRef, remoteStream, "Learner");
                  }, 100);
                });
                
                call.on("error", (err) => {
                  console.error("📞 Call error:", err);
                  toast.error(`Connection error: ${err.type}`);
                });
                
                call.on("close", () => {
                  console.log("📞 Call closed - learner disconnected");
                  setIsConnected(false);
                  setRemoteStream(null);
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = null;
                  }
                  
                  // Start disconnect timer - session will auto-complete after 5 minutes
                  if (newSession.session_status === "in_progress") {
                    startDisconnectTimer();
                    // Trigger automatic reconnection
                    attemptReconnection();
                  }
                });

                // Monitor ICE connection state for faster disconnect detection
                if (call.peerConnection) {
                  call.peerConnection.onconnectionstatechange = () => {
                    const state = call.peerConnection.connectionState;
                    console.log("🔌 ICE connection state changed:", state);
                    
                    if (state === "disconnected" || state === "failed" || state === "closed") {
                      console.log("⚠️ Connection state indicates disconnect:", state);
                      if (newSession.session_status === "in_progress" && isConnected) {
                        console.log("🔴 Triggering disconnect timer due to connection state:", state);
                        setIsConnected(false);
                        setRemoteStream(null);
                        if (remoteVideoRef.current) {
                          remoteVideoRef.current.srcObject = null;
                        }
                        startDisconnectTimer();
                        attemptReconnection();
                      }
                    }
                  };
                }
              }
            }
          }
        )
        .on(
          "broadcast",
          { event: "media_state" },
          (payload) => {
            // Update remote user's camera and screen share state
            if (payload.payload.userId !== user!.id) {
              console.log("📡 Received media_state broadcast from other user:", payload.payload);
              setHasReceivedRemoteState(true); // Mark that we've received a broadcast
              if (payload.payload.camera !== undefined) {
                console.log("🔴 Setting remoteCameraOn to:", payload.payload.camera);
                setRemoteCameraOn(payload.payload.camera);
              }
              if (payload.payload.screenSharing !== undefined) {
                console.log("🟢 Setting remoteScreenSharing to:", payload.payload.screenSharing);
                setRemoteScreenSharing(payload.payload.screenSharing);
              }
            } else {
              console.log("📡 Ignoring own broadcast:", payload.payload);
            }
          }
        )
        .subscribe();

      // Subscribe to new chat messages for unread count (mobile only)
      const chatChannel = supabase
        .channel(`chat-mobile-${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "session_messages",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const newMessage = payload.new as any;
            // Only increment if message is not from current user and chat is closed on mobile
            if (newMessage.user_id !== user!.id && !isChatOpen && window.innerWidth < 1024) {
              setUnreadMessages(prev => prev + 1);
            }
          }
        )
        .subscribe();

      // Subscribe to admin monitoring broadcast (for regular users)
      const monitorChannel = supabase
        .channel(`session-monitoring-${sessionId}`)
        .on('broadcast', { event: 'admin_joined' }, (payload) => {
          console.log("Admin joined monitoring with peer ID:", payload.payload.monitor_peer_id);
          setAdminMonitoring(true);
          
          // Call the monitor with our stream
          if (payload.payload.monitor_peer_id && newPeer && stream) {
            console.log("📞 Calling monitor:", payload.payload.monitor_peer_id);
            const monitorCall = newPeer.call(payload.payload.monitor_peer_id, stream);
            
            monitorCall.on("error", (err) => {
              console.error("Error calling monitor:", err);
            });
          }
        })
        .on('broadcast', { event: 'admin_left' }, () => {
          setAdminMonitoring(false);
        })
        .subscribe();

      // Cleanup on unmount
      return () => {
        console.log("🧹 Cleaning up peer connection and media streams");
        
        // Clear reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        // Clear disconnect timeout
        clearDisconnectTimer();
        
        sessionChannel.unsubscribe();
        chatChannel.unsubscribe();
        monitorChannel.unsubscribe();
        
        // Stop all media tracks
        localStream?.getTracks().forEach((track) => {
          track.stop();
          console.log("🎥 Stopped local track on unmount:", track.kind);
        });
        screenStreamRef.current?.getTracks().forEach((track) => {
          track.stop();
          console.log("🖥️ Stopped screen track on unmount:", track.kind);
        });
        
        newPeer.destroy();
        
        // Clear peer_id on disconnect so heartbeat can detect it
        const updateField = role === "learner" ? "learner_peer_id" : "tutor_peer_id";
        supabase
          .from("sessions")
          .update({ [updateField]: null })
          .eq("id", sessionId)
          .then(() => console.log(`🔄 ${role} peer_id cleared on disconnect`))
          .catch(err => console.error(`Error clearing ${role} peer_id:`, err));
      };
    } catch (error: any) {
      console.error("Error initializing peer:", error);
      
      let errorMessage = "Failed to initialize video session";
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = "Camera/microphone permission denied.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "No camera or microphone found.";
      }
      
      setMediaError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDeviceTestCancel = () => {
    navigate(role === "tutor" ? "/tutor/sessions" : "/learner/sessions");
  };

  const updateSessionPeerId = async (peerId: string) => {
    const updateField = role === "tutor" ? "tutor_peer_id" : "learner_peer_id";
    const { error } = await supabase.from("sessions").update({ [updateField]: peerId }).eq("id", sessionId);
    if (error) {
      console.error("Error updating session peer ID:", error);
    }
  };

  const toggleCamera = () => {
    if (localStream && sessionChannelRef.current) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
      
      // Broadcast camera state change using existing channel
      sessionChannelRef.current.send({
        type: 'broadcast',
        event: 'media_state',
        payload: { userId: user!.id, camera: videoTrack.enabled }
      });
      console.log("📡 Broadcast camera state:", videoTrack.enabled);
    }
  };

  const toggleMic = () => {
    if (localStream && sessionChannelRef.current) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
      
      // Broadcast mic state change using existing channel
      sessionChannelRef.current.send({
        type: 'broadcast',
        event: 'media_state',
        payload: { userId: user!.id, mic: audioTrack.enabled }
      });
      console.log("📡 Broadcast mic state:", audioTrack.enabled);
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

        // Replace video track for remote peer
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peer
          ?.connections[remotePeerId!]?.[0]?.peerConnection?.getSenders()
          .find((s: any) => s.track?.kind === "video");

        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        // Handle when user stops sharing via browser UI
        screenTrack.onended = () => {
          console.log("Screen sharing ended by user");
          // Switch back to camera without re-prompting
          const videoTrack = localStream?.getVideoTracks()[0];
          
          if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
          }

          const sender = peer
            ?.connections[remotePeerId!]?.[0]?.peerConnection?.getSenders()
            .find((s: any) => s.track?.kind === "video");

          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }

          screenStreamRef.current = null;
          setIsScreenSharing(false);
          toast.info("Screen sharing stopped");
          
          // Broadcast screen sharing stopped
          if (sessionChannelRef.current) {
            sessionChannelRef.current.send({
              type: 'broadcast',
              event: 'media_state',
              payload: { userId: user!.id, screenSharing: false, camera: isCameraOn }
            });
            console.log("📡 Broadcast screen sharing stopped, camera:", isCameraOn);
          }
        };

        setIsScreenSharing(true);
        
        // Broadcast screen sharing state
        if (sessionChannelRef.current) {
          sessionChannelRef.current.send({
            type: 'broadcast',
            event: 'media_state',
            payload: { userId: user!.id, screenSharing: true }
          });
          console.log("📡 Broadcast screen sharing started");
        }
      } else {
        // Switch back to camera
        const videoTrack = localStream?.getVideoTracks()[0];
        
        // Update local video ref back to camera
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
        }

        const sender = peer
          ?.connections[remotePeerId!]?.[0]?.peerConnection?.getSenders()
          .find((s: any) => s.track?.kind === "video");

        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }

        screenStreamRef.current?.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
        setIsScreenSharing(false);
        
        // Broadcast screen sharing stopped and camera state
        if (sessionChannelRef.current) {
          sessionChannelRef.current.send({
            type: 'broadcast',
            event: 'media_state',
            payload: { userId: user!.id, screenSharing: false, camera: isCameraOn }
          });
          console.log("📡 Broadcast screen sharing stopped (manual), camera:", isCameraOn);
        }
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      if (error.name !== "NotAllowedError") {
        toast.error("Failed to share screen");
      }
    }
  };

  // Helper function to set video stream with retry logic
  const setVideoStream = (videoRef: React.RefObject<HTMLVideoElement>, stream: MediaStream, label: string, maxRetries = 3) => {
    let retries = 0;
    
    const attemptPlay = () => {
      if (!videoRef.current || !stream) {
        console.log(`⚠️ ${label}: videoRef or stream is null`);
        return;
      }
      
      // Validate stream has tracks
      const tracks = stream.getTracks();
      if (tracks.length === 0) {
        console.error(`❌ ${label}: Stream has no tracks`);
        return;
      }
      
      console.log(`📹 Setting ${label} video stream with ${tracks.length} tracks:`, tracks.map(t => `${t.kind}(${t.enabled})`));
      
      try {
        const videoElement = videoRef.current;
        
        // Only set srcObject if it's different to avoid resetting the video
        if (videoElement.srcObject !== stream) {
          videoElement.srcObject = stream;
        }
        
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log(`✅ ${label} video playing successfully`);
              // Wait a bit for video to have dimensions
              setTimeout(() => {
                if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                  console.log(`📺 ${label} video dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
                } else {
                  console.warn(`⚠️ ${label} video has no dimensions yet, forcing render`);
                  // Force a re-render by toggling a style
                  videoElement.style.opacity = '0.99';
                  setTimeout(() => {
                    videoElement.style.opacity = '1';
                  }, 10);
                }
              }, 100);
            })
            .catch((error) => {
              console.log(`❌ ${label} video play error:`, error.name, error.message);
              retries++;
              if (retries < maxRetries) {
                console.log(`🔄 Retrying ${label} video play (${retries}/${maxRetries})...`);
                setTimeout(attemptPlay, 500);
              }
            });
        }
      } catch (error) {
        console.error(`Error setting ${label} video:`, error);
        retries++;
        if (retries < maxRetries) {
          setTimeout(attemptPlay, 500);
        }
      }
    };
    
    attemptPlay();
  };

  // Comprehensive cleanup function to stop all media tracks
  const cleanupMediaTracks = () => {
    console.log("🧹 Cleaning up all media tracks...");
    
    // Stop local stream tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        console.log(`Stopping ${track.kind} track:`, track.label);
        track.stop();
      });
    }
    
    // Stop remote stream tracks
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => {
        console.log(`Stopping remote ${track.kind} track:`, track.label);
        track.stop();
      });
    }
    
    // Stop screen share tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        console.log(`Stopping screen share ${track.kind} track:`, track.label);
        track.stop();
      });
    }
    
    // Stop tutor/learner streams (monitor mode)
    if (tutorStream) {
      tutorStream.getTracks().forEach((track) => {
        console.log(`Stopping tutor ${track.kind} track:`, track.label);
        track.stop();
      });
    }
    
    if (learnerStream) {
      learnerStream.getTracks().forEach((track) => {
        console.log(`Stopping learner ${track.kind} track:`, track.label);
        track.stop();
      });
    }
    
    // Destroy peer connection
    if (peer && !peer.destroyed) {
      peer.destroy();
    }
    
    // Clear video element sources
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (tutorVideoRef.current) tutorVideoRef.current.srcObject = null;
    if (learnerVideoRef.current) learnerVideoRef.current.srcObject = null;
    
    // Clear refs
    screenStreamRef.current = null;
    
    // Clear state
    setLocalStream(null);
    setRemoteStream(null);
    setTutorStream(null);
    setLearnerStream(null);
    setPeer(null);
    setRemotePeerId(null);
    setIsConnected(false);
    
    console.log("✅ Media cleanup complete");
  };

  const endSession = async () => {
    console.log("🔴 End Session clicked - Role:", role, "Monitor Mode:", isMonitorMode);
    
    // Only tutors can end session
    if (!isMonitorMode && role !== "tutor") {
      console.log("❌ Access denied - only tutors can end session");
      toast.error("Only tutors can end the session");
      return;
    }

    console.log("✅ Permission granted - proceeding to end session");

    // Use comprehensive cleanup
    cleanupMediaTracks();

    // If admin monitor mode, notify and exit
    if (isMonitorMode) {
      try {
        const channel = supabase.channel(`session-monitoring-${sessionId}`);
        await channel.subscribe();
        await channel.send({
          type: 'broadcast',
          event: 'admin_left',
          payload: { admin_id: user!.id }
        });
        // Give time for broadcast to send
        await new Promise(resolve => setTimeout(resolve, 500));
        await channel.unsubscribe();
      } catch (error) {
        console.error("Error broadcasting admin_left:", error);
      }
      
      toast.success("Stopped monitoring session");
      navigate("/admin/live-monitoring");
      return;
    }

    console.log("📝 Updating session status to completed...");
    const { error } = await supabase
      .from("sessions")
      .update({ 
        session_status: "completed",
        status: "completed" 
      })
      .eq("id", sessionId);

    if (error) {
      console.error("❌ Error updating session:", error);
      toast.error("Failed to end session: " + error.message);
      return;
    }

    console.log("✅ Session ended successfully");
    toast.success("Session ended");
    
    // Update local state and show session log modal
    setSessionStatus("completed");
    setShowLogModal(true);
    setLogModalShown(true);
  };

  const forceEndSession = async () => {
    if (!isMonitorMode) return;
    
    if (!confirm("Are you sure you want to force-end this session? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("sessions")
        .update({ 
          session_status: "completed",
          status: "completed" 
        })
        .eq("id", sessionId);

      if (error) {
        console.error("Error force-ending session:", error);
        toast.error("Failed to force-end session");
        return;
      }

      // Broadcast to users
      try {
        const channel = supabase.channel(`session-monitoring-${sessionId}`);
        await channel.send({
          type: 'broadcast',
          event: 'admin_force_end',
          payload: { admin_id: user!.id }
        });
      } catch (broadcastError) {
        console.error("Error broadcasting force-end:", broadcastError);
      }

      toast.success("Session force-ended by admin");
      navigate("/admin/live-monitoring");
    } catch (error) {
      console.error("Error in forceEndSession:", error);
      toast.error("Failed to force-end session");
    }
  };

  const handleLogComplete = () => {
    setShowLogModal(false);
    // Only show feedback modal for learners
    if (role === "learner") {
      setShowFeedbackModal(true);
    } else {
      // For tutors, completely replace the page to stop camera and prevent reopening
      window.location.replace("/tutor/sessions");
    }
  };

  const handleFeedbackComplete = () => {
    setShowFeedbackModal(false);
    // Completely replace the page to stop camera and prevent reopening
    const targetPath = role === "tutor" ? "/tutor/sessions" : "/learner/sessions";
    window.location.replace(targetPath);
  };

  const handleAdmitLearner = async () => {
    console.log("🚪 Admitting learner to session:", sessionId);
    
    const { data, error } = await supabase
      .from("sessions")
      .update({ 
        session_status: "in_progress",
        status: "accepted"
      })
      .eq("id", sessionId)
      .select();
    
    if (error) {
      console.error("❌ Error admitting learner:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      toast.error(`Failed to admit learner: ${error.message || 'Unknown error'}`);
      return;
    }
    
    console.log("✅ Learner admitted successfully:", data);
    setShowAdmitControl(false);
    setSessionStatus("in_progress");
    toast.success("Learner admitted to session!");
  };

  const handleRejectLearner = async () => {
    setShowAdmitControl(false);
    toast.info("Learner admission rejected");
    // Optionally, you could update session status or notify the learner
  };

  // Show loading while fetching session data
  if (!sessionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold mb-2">Loading session...</h2>
        </div>
      </div>
    );
  }

  // Show device test modal (skip for monitor mode)
  if (showDeviceTest && !hasTestedDevices && !isMonitorMode) {
    return (
      <DeviceTestModal
        open={showDeviceTest}
        onContinue={initializePeerConnection}
        onCancel={handleDeviceTestCancel}
        sessionData={sessionData}
        role={role}
      />
    );
  }

  // Show waiting room if session is not active yet
  if (sessionStatus === "waiting" && role === "learner" && peer) {
    console.log("🚪 Showing waiting room - sessionStatus:", sessionStatus);
    
    // Update learner peer ID when entering waiting room (not during device test)
    if (!sessionData?.learner_peer_id && peer.id) {
      console.log("📝 Learner entering waiting room, updating peer_id:", peer.id);
      updateSessionPeerId(peer.id);
    }
    
    return <WaitingRoom sessionData={sessionData} role={role} />;
  }

  // Show completion screen if session is completed (but still render modals on top)
  const showCompletionScreen = sessionStatus === "completed" && !isMonitorMode && !showLogModal;
  
  console.log("📹 Showing main session interface - sessionStatus:", sessionStatus, "role:", role);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Tutor Admit Control */}
      {showAdmitControl && role === "tutor" && (
        <TutorAdmitControl
          learnerName={sessionData?.learner_profiles?.full_name || "Learner"}
          onAdmit={handleAdmitLearner}
          onReject={handleRejectLearner}
        />
      )}

      {/* Header */}
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{sessionData.subject || "Interactive Session"}</h1>
          <p className="text-sm text-muted-foreground">
            {isMonitorMode ? (
              <>Admin Monitoring Mode - Observing session</>
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
          {!isMonitorMode && <SessionTimer sessionId={sessionId!} onTimeout={async () => {
            console.log("⏰ Session timeout - auto-ending session");
            
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
            
            // Show appropriate modal based on role
            if (!logModalShown) {
              console.log("📝 Showing log modal after timeout");
              setShowLogModal(true);
              setLogModalShown(true);
            }
          }} />}
          {isMonitorMode ? (
            <>
              <Button variant="destructive" onClick={forceEndSession}>
                Force End Session
              </Button>
              <Button variant="outline" onClick={endSession}>
                Stop Monitoring
              </Button>
            </>
          ) : (
            role === "tutor" && (
              <Button variant="destructive" onClick={endSession}>
                End Session
              </Button>
            )
          )}
        </div>
      </header>

      {/* Disconnect Warning Banner - only show for unexpected disconnects during active sessions */}
      {disconnectCountdown !== null && disconnectCountdown > 0 && !isMonitorMode && sessionStatus === "in_progress" && (
        <div className="bg-destructive text-destructive-foreground px-6 py-3 flex items-center justify-center gap-2 animate-pulse">
          <Clock className="h-5 w-5" />
          <p className="font-medium">
            Connection lost. Session will end in {disconnectCountdown} seconds unless reconnected.
          </p>
        </div>
      )}

      {/* Admin Monitoring Alert for Users */}
      {adminMonitoring && !isMonitorMode && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-6 py-2">
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            Admin is monitoring this session
          </p>
        </div>
      )}

      {/* Main Content - Desktop: Split layout | Mobile: Stacked layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 overflow-hidden min-h-0">
        {/* Left Panel - Whiteboard/Assets - Desktop: 68% | Mobile: Hidden */}
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
                Whiteboard {isMonitorMode && "(View Only)"}
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
                Assets {isMonitorMode && "(View Only)"}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            {/* Keep both components mounted to maintain realtime connections */}
            <div className={activePanel === "whiteboard" ? "h-full" : "hidden h-full"}>
              <WhiteboardCanvas 
                sessionId={sessionId!} 
                isMonitorMode={isMonitorMode}
                isPeerConnected={isConnected && remoteStream !== null}
              />
            </div>
            <div className={activePanel === "assets" ? "h-full" : "hidden h-full"}>
              <AssetsPanel sessionId={sessionId!} isMonitorMode={isMonitorMode} />
            </div>
          </div>
        </div>

        {/* Right Panel - Video & Chat - Desktop: 32% | Mobile: Full width */}
        <div className="flex-1 lg:flex-[0_0_32%] flex flex-col gap-3 min-h-0">
          {/* Video Feeds Section - Desktop: Horizontal | Mobile: Vertical Stack */}
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden shrink-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
              {/* Monitor Mode - Show Both Tutor and Learner */}
              {isMonitorMode ? (
                <>
                  {/* Tutor Video */}
                  <div className={`relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video rounded-lg overflow-hidden group transition-all duration-200 ${
                    tutorSpeaking ? 'ring-4 ring-primary shadow-lg shadow-primary/50' : ''
                  }`}>
                    <video
                      ref={tutorVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {/* Camera Off Overlay - not implemented for monitor mode yet */}
                    {!tutorStream && (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center text-white bg-gradient-to-br from-gray-900 to-gray-800">
                        <div className="text-center">
                          <VideoOff className="w-8 h-8 mx-auto mb-2 opacity-75" />
                          <p className="text-xs opacity-75">Tutor Connecting...</p>
                        </div>
                      </div>
                    )}
                    <div className={`absolute top-1 left-1 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[10px] font-medium transition-colors ${
                      tutorSpeaking ? 'bg-primary' : 'bg-black/60'
                    }`}>
                      Tutor
                    </div>
                    {tutorStream && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setFullscreenVideo('tutor');
                          setIsFullscreen(true);
                        }}
                        title="Fullscreen"
                      >
                        <Maximize className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Learner Video */}
                  <div className={`relative bg-gradient-to-br from-gray-800 to-gray-700 aspect-video rounded-lg overflow-hidden group transition-all duration-200 ${
                    learnerSpeaking ? 'ring-4 ring-primary shadow-lg shadow-primary/50' : ''
                  }`}>
                    <video
                      ref={learnerVideoRef}
                      autoPlay
                      playsInline
                      muted={false}
                      className="w-full h-full object-cover relative z-10"
                    />
                    {/* Camera Off Overlay - handled by the "Learner Connecting..." div below */}
                    {!learnerStream && (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center text-white bg-gradient-to-br from-gray-800 to-gray-700 z-20">
                        <div className="text-center">
                          <VideoOff className="w-8 h-8 mx-auto mb-2 opacity-75" />
                          <p className="text-xs opacity-75">Learner Connecting...</p>
                        </div>
                      </div>
                    )}
                    <div className={`absolute top-1 left-1 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[10px] font-medium transition-colors ${
                      learnerSpeaking ? 'bg-primary' : 'bg-black/60'
                    }`}>
                      Learner
                    </div>
                    {learnerStream && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setFullscreenVideo('learner');
                          setIsFullscreen(true);
                        }}
                        title="Fullscreen"
                      >
                        <Maximize className="h-3 w-3" />
                      </Button>
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
                      className={`w-full h-full object-cover ${isMonitorMode ? 'cursor-default' : ''}`}
                    />
                    {/* Camera Off Overlay - Show only when camera is explicitly off AND not screen sharing */}
                    {isConnected && !remoteCameraOn && !remoteScreenSharing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg z-20">
                        {(role === "tutor" ? sessionData?.learner_profiles?.profile_picture_url : sessionData?.tutor_profiles?.profile_picture_url) ? (
                          <img 
                            src={role === "tutor" ? sessionData?.learner_profiles?.profile_picture_url : sessionData?.tutor_profiles?.profile_picture_url} 
                            alt={role === "tutor" ? sessionData?.learner_profiles?.full_name : sessionData?.tutor_profiles?.full_name} 
                            className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-white/20 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                              {(role === "tutor" ? sessionData?.learner_profiles?.full_name : sessionData?.tutor_profiles?.full_name)?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                        )}
                        {(role === "tutor" ? sessionData?.learner_profiles?.full_name : sessionData?.tutor_profiles?.full_name) && (
                          <p className="mt-2 text-white text-xs font-medium">
                            {role === "tutor" ? sessionData?.learner_profiles?.full_name : sessionData?.tutor_profiles?.full_name}
                          </p>
                        )}
                        <VideoOff className="w-4 h-4 text-white/50 mt-1" />
                      </div>
                    )}
                    {!isConnected && (
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
                    <div className={`absolute top-1 left-1 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[10px] font-medium transition-colors z-30 ${
                      remoteSpeaking ? 'bg-primary' : 'bg-black/60'
                    }`}>
                      {role === "tutor" ? "Learner" : "Tutor"}
                    </div>
                    {(isConnected && remoteStream) ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-30"
                        onClick={() => {
                          setFullscreenVideo('remote');
                          setIsFullscreen(true);
                        }}
                        title="Fullscreen"
                      >
                        <Maximize className="h-3 w-3" />
                      </Button>
                    ) : null}
                  </div>

                  {/* Local Video / Screen Share */}
                  <div className={`relative bg-gradient-to-br from-gray-800 to-gray-700 aspect-video rounded-lg overflow-hidden group transition-all duration-200 ${
                    localSpeaking && isMicOn ? 'ring-4 ring-primary shadow-lg shadow-primary/50' : ''
                  }`}>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      key={localStream ? 'has-stream' : 'no-stream'}
                      className={`w-full h-full object-cover relative z-10 ${isMonitorMode ? 'cursor-default' : ''}`}
                    />
                    <div className={`absolute top-1 left-1 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[10px] font-medium transition-colors z-30 ${
                      localSpeaking && isMicOn ? 'bg-primary' : 'bg-black/60'
                    }`}>
                      {isScreenSharing ? "Your Screen" : "You"}
                    </div>
                    {!isCameraOn && !isScreenSharing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg pointer-events-none z-20">
                        {(role === "tutor" ? sessionData?.tutor_profiles?.profile_picture_url : sessionData?.learner_profiles?.profile_picture_url) ? (
                          <img 
                            src={role === "tutor" ? sessionData?.tutor_profiles?.profile_picture_url : sessionData?.learner_profiles?.profile_picture_url} 
                            alt="You" 
                            className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-white/20 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                              {(role === "tutor" ? sessionData?.tutor_profiles?.full_name : sessionData?.learner_profiles?.full_name)?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                        )}
                        {(role === "tutor" ? sessionData?.tutor_profiles?.full_name : sessionData?.learner_profiles?.full_name) && (
                          <p className="mt-2 text-white text-xs font-medium">
                            {role === "tutor" ? sessionData?.tutor_profiles?.full_name : sessionData?.learner_profiles?.full_name}
                          </p>
                        )}
                        <VideoOff className="w-4 h-4 text-white/50 mt-1" />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 flex gap-1 pointer-events-auto z-30">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={toggleCamera}
                        title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                      >
                        {isCameraOn ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={toggleMic}
                        title={isMicOn ? "Mute" : "Unmute"}
                      >
                        {isMicOn ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 rounded-full hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity ${
                          isScreenSharing ? "bg-primary" : "bg-black/60"
                        }`}
                        onClick={toggleScreenShare}
                        title={isScreenSharing ? "Stop sharing" : "Share screen"}
                      >
                        <MonitorUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setFullscreenVideo('local');
                          setIsFullscreen(true);
                        }}
                        title="Fullscreen"
                      >
                        <Maximize className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Chat Section - Desktop: visible | Mobile: hidden (compact icon only) */}
          <div className="hidden lg:flex flex-1 bg-card rounded-lg border shadow-sm overflow-hidden min-h-0 flex-col">
            <SessionChat sessionId={sessionId!} userId={user!.id} disableFullscreen={false} isMonitorMode={isMonitorMode} />
          </div>

          {/* Mobile Chat & Assets Buttons */}
          <div className="lg:hidden flex gap-2 shrink-0">
            <button
              onClick={() => {
                setIsChatOpen(true);
                setUnreadMessages(0);
              }}
              className="relative flex-1 bg-card rounded-lg border shadow-sm py-3 px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Chat
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>
            <button
              onClick={() => setActivePanel("assets")}
              className="flex-1 bg-card rounded-lg border shadow-sm py-3 px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Assets
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Chat Modal */}
      {isChatOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end justify-center p-0">
          <div className="bg-background w-full h-[90vh] rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b flex items-center justify-between shrink-0 bg-gradient-to-r from-background to-muted/30">
              <h2 className="text-lg font-semibold">Session Chat</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <SessionChat sessionId={sessionId!} userId={user!.id} disableFullscreen={true} isMonitorMode={isMonitorMode} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Assets Panel Modal */}
      {activePanel === "assets" && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end justify-center p-0">
          <div className="bg-background w-full h-[90vh] rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b flex items-center justify-between shrink-0 bg-gradient-to-r from-background to-muted/30">
              <h2 className="text-lg font-semibold">Session Assets</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActivePanel("whiteboard")}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <AssetsPanel sessionId={sessionId!} isMonitorMode={isMonitorMode} />
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Video Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-lg overflow-hidden group" onClick={(e) => e.stopPropagation()}>
            <video
              autoPlay
              playsInline
              muted={fullscreenVideo === 'local'}
              className={`w-full h-full object-contain ${
                (fullscreenVideo === 'local' && !isCameraOn && !isScreenSharing) || 
                (fullscreenVideo === 'remote' && !remoteCameraOn && !remoteScreenSharing) 
                  ? 'hidden' 
                  : ''
              }`}
              ref={(el) => {
                if (el && fullscreenVideo) {
                  // Show screen share if local and sharing, otherwise show appropriate stream
                  if (fullscreenVideo === 'local' && isScreenSharing && screenStreamRef.current) {
                    el.srcObject = screenStreamRef.current;
                  } else if (fullscreenVideo === 'tutor') {
                    el.srcObject = tutorStream;
                  } else if (fullscreenVideo === 'learner') {
                    el.srcObject = learnerStream;
                  } else {
                    el.srcObject = fullscreenVideo === 'local' ? localStream : remoteStream;
                  }
                }
              }}
            />
            

            {/* Camera Off Overlay - Local (works for both demo and regular sessions) */}
            {fullscreenVideo === 'local' && !isCameraOn && !isScreenSharing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                {sessionData?.tutor_profiles?.profile_picture_url || sessionData?.learner_profiles?.profile_picture_url ? (
                  <img 
                    src={role === "tutor" ? sessionData?.tutor_profiles?.profile_picture_url : sessionData?.learner_profiles?.profile_picture_url} 
                    alt="Your profile" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl mb-4"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-primary/20 border-4 border-white/20 flex items-center justify-center mb-4">
                    <span className="text-5xl font-bold text-white">
                      {(role === "tutor" ? sessionData?.tutor_profiles?.full_name : sessionData?.learner_profiles?.full_name)?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                <p className="text-white text-lg font-medium mb-2">
                  {role === "tutor" ? sessionData?.tutor_profiles?.full_name : sessionData?.learner_profiles?.full_name}
                </p>
                <div className="flex items-center gap-2 text-white/70">
                  <VideoOff className="w-5 h-5" />
                  <p className="text-sm">Camera is off</p>
                </div>
              </div>
            )}
            {/* Camera Off Overlay - Remote */}
            {fullscreenVideo === 'remote' && !remoteCameraOn && !remoteScreenSharing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                {(role === "tutor" ? sessionData?.learner_profiles?.profile_picture_url : sessionData?.tutor_profiles?.profile_picture_url) ? (
                  <img 
                    src={role === "tutor" ? sessionData?.learner_profiles?.profile_picture_url : sessionData?.tutor_profiles?.profile_picture_url} 
                    alt="Their profile" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl mb-4"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-primary/20 border-4 border-white/20 flex items-center justify-center mb-4">
                    <span className="text-5xl font-bold text-white">
                      {(role === "tutor" ? sessionData?.learner_profiles?.full_name?.charAt(0).toUpperCase() : sessionData?.tutor_profiles?.full_name?.charAt(0).toUpperCase()) || "?"}
                    </span>
                  </div>
                )}
                <p className="text-white text-lg font-medium mb-2">
                  {role === "tutor" ? sessionData?.learner_profiles?.full_name : sessionData?.tutor_profiles?.full_name}
                </p>
                <div className="flex items-center gap-2 text-white/70">
                  <VideoOff className="w-5 h-5" />
                  <p className="text-sm">Camera is off</p>
                </div>
              </div>
            )}
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white z-30"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            
            {/* Label */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded text-white text-sm z-30">
              {fullscreenVideo === 'local' 
                ? (isScreenSharing ? 'Your Screen' : 'You')
                : fullscreenVideo === 'tutor'
                ? 'Tutor'
                : fullscreenVideo === 'learner'
                ? 'Learner'
                : (role === "tutor" ? "Learner" : "Tutor")}
            </div>
            
            {/* Fullscreen Controls - Only show for local video */}
            {fullscreenVideo === 'local' && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-3 bg-black/80 backdrop-blur-sm rounded-full px-4 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-white hover:bg-white/20"
                    onClick={toggleCamera}
                    title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                  >
                    {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-white hover:bg-white/20"
                    onClick={toggleMic}
                    title={isMicOn ? "Mute" : "Unmute"}
                  >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-white hover:bg-white/20"
                    onClick={toggleScreenShare}
                    title={isScreenSharing ? "Stop sharing" : "Share screen"}
                  >
                    <MonitorUp className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-white hover:bg-white/20"
                    onClick={() => {
                      setIsFullscreen(false);
                      setShowSettings(true);
                    }}
                    title="Settings"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal - Hidden in monitor mode */}
      {showSettings && !isMonitorMode && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div className="bg-card rounded-lg border shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Session Settings</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Video Preview */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Camera Preview</h4>
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

              {/* Device Selection */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Device Settings</h4>
                <DeviceSelector 
                  selectedVideoDevice={localStream?.getVideoTracks()[0]?.getSettings().deviceId}
                  selectedAudioDevice={localStream?.getAudioTracks()[0]?.getSettings().deviceId}
                  onDeviceChange={async (deviceId, kind) => {
                  try {
                    console.log(`Changing ${kind} to device:`, deviceId);
                    
                    // Get current constraints
                    const currentVideoTrack = localStream?.getVideoTracks()[0];
                    const currentAudioTrack = localStream?.getAudioTracks()[0];
                    
                    // Build constraints with selected device
                    const constraints: MediaStreamConstraints = {
                      video: kind === "videoinput" 
                        ? { deviceId: { exact: deviceId } } 
                        : currentVideoTrack ? { deviceId: currentVideoTrack.getSettings().deviceId } : true,
                      audio: kind === "audioinput" 
                        ? { deviceId: { exact: deviceId } } 
                        : currentAudioTrack ? { deviceId: currentAudioTrack.getSettings().deviceId } : true
                    };
                    
                    // Get new stream with selected device
                    const newStream = await navigator.mediaDevices.getUserMedia(constraints);
                    console.log("New stream obtained:", newStream.getTracks().map(t => `${t.kind}: ${t.label}`));
                    
                    // Replace the specific track in local stream
                    if (kind === "videoinput") {
                      const oldVideoTrack = localStream?.getVideoTracks()[0];
                      const newVideoTrack = newStream.getVideoTracks()[0];
                      
                      if (oldVideoTrack && localStream) {
                        const wasEnabled = oldVideoTrack.enabled;
                        localStream.removeTrack(oldVideoTrack);
                        oldVideoTrack.stop();
                        localStream.addTrack(newVideoTrack);
                        
                        // Preserve enabled state
                        newVideoTrack.enabled = wasEnabled;
                        setIsCameraOn(wasEnabled);
                      }
                      
                      // Update local video element
                      if (localVideoRef.current && localStream) {
                        setVideoStream(localVideoRef, localStream, "Local");
                      }
                      
                      // Update state to trigger re-render
                      setLocalStream(localStream);
                      
                      // Update peer connection using callRef
                      if (callRef.current && callRef.current.peerConnection && isConnected) {
                        try {
                          const videoSender = callRef.current.peerConnection.getSenders().find((s: any) => s.track?.kind === "video");
                          if (videoSender) {
                            await videoSender.replaceTrack(newVideoTrack);
                            console.log("✅ Video track replaced in peer connection");
                            toast.success("Camera changed successfully");
                          }
                        } catch (error) {
                          console.error("Error replacing video track:", error);
                        }
                      } else {
                        console.log("⚠️ Cannot update peer connection - not connected or no call active");
                      }
                      
                      // Stop unused audio track from temp stream
                      newStream.getAudioTracks().forEach(t => t.stop());
                    } else {
                      const oldAudioTrack = localStream?.getAudioTracks()[0];
                      const newAudioTrack = newStream.getAudioTracks()[0];
                      
                      if (oldAudioTrack && localStream) {
                        const wasEnabled = oldAudioTrack.enabled;
                        localStream.removeTrack(oldAudioTrack);
                        oldAudioTrack.stop();
                        localStream.addTrack(newAudioTrack);
                        
                        // Preserve enabled state
                        newAudioTrack.enabled = wasEnabled;
                        setIsMicOn(wasEnabled);
                      }
                      
                      // Update peer connection using callRef
                      if (callRef.current && callRef.current.peerConnection && isConnected) {
                        try {
                          const audioSender = callRef.current.peerConnection.getSenders().find((s: any) => s.track?.kind === "audio");
                          if (audioSender) {
                            await audioSender.replaceTrack(newAudioTrack);
                            console.log("✅ Audio track replaced in peer connection");
                            toast.success("Microphone changed successfully");
                          }
                        } catch (error) {
                          console.error("Error replacing audio track:", error);
                        }
                      } else {
                        console.log("⚠️ Cannot update peer connection - not connected or no call active");
                      }
                      
                      // Stop unused video track from temp stream
                      newStream.getVideoTracks().forEach(t => t.stop());
                    }
                    
                    // toast.success(`${kind === "videoinput" ? "Camera" : "Microphone"} changed successfully`); // Removed - too noisy
                  } catch (error: any) {
                    console.error("Error changing device:", error);
                    let errorMsg = "Failed to change device";
                    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                      errorMsg = "Selected device not available";
                    } else if (error.name === "NotAllowedError") {
                      errorMsg = "Permission denied for device";
                    } else if (error.name === "NotReadableError") {
                      errorMsg = "Device is in use by another application";
                    }
                    toast.error(errorMsg);
                  }
                }} />
              </div>

              {/* Microphone Test */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Microphone Test</h4>
                <div className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl p-6 border border-border/50">
                  <AudioVisualizer stream={localStream} isActive={isMicOn} />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {isMicOn ? "🎤 Speak to see audio levels" : "🔇 Microphone is muted"}
                </p>
              </div>
              
              {/* Connection Status */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Connection Status</h4>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Peer Connection</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm font-medium">{isConnected ? "Connected" : "Disconnected"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Session Status</span>
                    <span className="text-sm font-medium capitalize">{sessionStatus}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end">
              <Button onClick={() => setShowSettings(false)}>
                Close Settings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Screen Overlay */}
      {showCompletionScreen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Session Completed</h2>
              <p className="text-muted-foreground">Please fill out the session log below</p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {!isMonitorMode && (
        <SessionLogModal
          open={showLogModal}
          onOpenChange={setShowLogModal}
          sessionId={sessionId!}
          userRole={role}
          onComplete={handleLogComplete}
        />
      )}
      <SessionFeedbackModal
        open={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
        sessionId={sessionId!}
        onComplete={handleFeedbackComplete}
      />
    </div>
  );
}
