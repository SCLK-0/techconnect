import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Peer from "peerjs";
import { Button } from "@/components/ui/button";
import { WhiteboardCanvas } from "@/components/video-session/WhiteboardCanvas";
import { SessionChat } from "@/components/video-session/SessionChat";
import { AssetsPanel } from "@/components/video-session/AssetsPanel";
import { 
  VideoOff, 
  Maximize,
  Eye,
  EyeOff,
  PhoneOff,
  ArrowLeft,
  MessageSquare,
  X,
  RefreshCw,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface AdminMonitorViewProps {
  sessionId: string;
}

export function AdminMonitorView({ sessionId }: AdminMonitorViewProps) {
  const navigate = useNavigate();
  const { user } = useUserRole();
  
  // Session data
  const [sessionData, setSessionData] = useState<any>(null);
  const [sessionStatus, setSessionStatus] = useState<"waiting" | "in_progress" | "completed">("waiting");
  
  // Video streams
  const [tutorStream, setTutorStream] = useState<MediaStream | null>(null);
  const [learnerStream, setLearnerStream] = useState<MediaStream | null>(null);
  
  // Camera states
  const [tutorCameraOn, setTutorCameraOn] = useState(true);
  const [learnerCameraOn, setLearnerCameraOn] = useState(true);
  
  // UI state
  const [activePanel, setActivePanel] = useState<"whiteboard" | "assets">("whiteboard");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenVideo, setFullscreenVideo] = useState<'tutor' | 'learner' | null>(null);
  const [hasShownSessionEndedToast, setHasShownSessionEndedToast] = useState(false);
  
  // Refs
  const tutorVideoRef = useRef<HTMLVideoElement>(null);
  const learnerVideoRef = useRef<HTMLVideoElement>(null);
  const fullscreenTutorVideoRef = useRef<HTMLVideoElement>(null);
  const fullscreenLearnerVideoRef = useRef<HTMLVideoElement>(null);
  const monitorChannelRef = useRef<any>(null);
  const sessionChannelRef = useRef<any>(null);
  const monitorRequestChannelRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const peerRef = useRef<Peer | null>(null);

  // Helper function to handle session completion (prevents duplicate toasts)
  const handleSessionCompletion = useCallback(() => {
    if (hasShownSessionEndedToast) return;
    
    console.log("Admin: Session completed, showing toast and navigating");
    setHasShownSessionEndedToast(true);
    toast.info("Session has ended");
    
    // Cleanup
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (monitorChannelRef.current) {
      supabase.removeChannel(monitorChannelRef.current);
      monitorChannelRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    // Small delay to ensure toast is shown before navigation
    setTimeout(() => {
      navigate("/admin/live-monitoring", { replace: true });
    }, 500);
  }, [hasShownSessionEndedToast, navigate]);

  // Load session data
  useEffect(() => {
    if (!sessionId || !user) return;

    const loadSession = async () => {
      const { data: session, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error || !session) {
        toast.error("Session not found");
        navigate("/admin/live-monitoring");
        return;
      }

      // Fetch profiles
      const { data: tutorProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.tutor_id)
        .single();

      const { data: learnerProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.learner_id)
        .single();

      setSessionData({
        ...session,
        tutor_profile: tutorProfile,
        learner_profile: learnerProfile,
      });
      
      const status = session.session_status as "waiting" | "in_progress" | "completed";
      setSessionStatus(status || "waiting");
    };

    loadSession();
  }, [sessionId, user, navigate]);

  // Initialize PeerJS and setup monitoring - REFINED VERSION
  useEffect(() => {
    if (!sessionId || !user || !sessionData) return;

    let hasTutorStream = false;
    let hasLearnerStream = false;
    let adminPeerId: string | null = null;
    let connectionAttempts = 0;
    const maxConnectionAttempts = 5;

    // Refined stream request function with better timing
    const sendStreamRequests = () => {
      if (!adminPeerId) return;
      
      console.log("Admin: Sending stream requests (attempt", ++connectionAttempts, ")");
      
      const payload = { 
        admin_id: user.id,
        monitor_peer_id: adminPeerId,
        timestamp: Date.now() // Add timestamp for deduplication
      };
      
      // Send on all channels with error handling
      const sendToChannel = (channel: any, event: string) => {
        if (channel) {
          channel.send({
            type: 'broadcast',
            event,
            payload
          }).catch((err: any) => console.log(`Error sending ${event}:`, err));
        }
      };
      
      sendToChannel(monitorChannelRef.current, 'admin_joined');
      sendToChannel(sessionChannelRef.current, 'admin_request_stream');
      sendToChannel(monitorRequestChannelRef.current, 'monitor_request_stream');
    };

    const setupPeer = async () => {
      console.log(" Admin: Setting up refined PeerJS monitoring");
      
      const newPeer = new Peer(`admin-monitor-${user.id}-${Date.now()}`, {
        secure: true,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
          ]
        },
        debug: 0 // Reduce debug noise
      });
      
      peerRef.current = newPeer;

      newPeer.on("open", async (peerId) => {
        console.log(" Admin: Peer ready with ID:", peerId);
        adminPeerId = peerId;
        
        // Setup channels with better error handling
        const setupChannel = (channelName: string, ref: any) => {
          const channel = supabase.channel(channelName);
          ref.current = channel;
          return new Promise<void>((resolve) => {
            channel.subscribe((status) => {
              if (status === "SUBSCRIBED") {
                console.log(` Admin: ${channelName} ready`);
                resolve();
              }
            });
          });
        };
        
        // Setup all channels in parallel
        await Promise.all([
          setupChannel(`session-monitoring-${sessionId}`, monitorChannelRef),
          setupChannel(`session-${sessionId}`, sessionChannelRef),
          setupChannel(`monitor-request-${sessionId}`, monitorRequestChannelRef)
        ]);
        
        console.log(" Admin: All channels ready, starting connection sequence");
        
        // Immediate first request
        sendStreamRequests();
        
        // Staggered follow-up requests for reliability
        const requestTimes = [500, 1200, 2500, 5000];
        requestTimes.forEach(delay => {
          setTimeout(() => {
            if (connectionAttempts < maxConnectionAttempts && (!hasTutorStream || !hasLearnerStream)) {
              sendStreamRequests();
            }
          }, delay);
        });
        
        // Regular heartbeat every 3 seconds (less aggressive)
        heartbeatIntervalRef.current = setInterval(() => {
          if (adminPeerId && peerRef.current && !peerRef.current.destroyed) {
            sendStreamRequests();
          }
        }, 3000);
        
        // Smart retry - only retry if we're missing streams
        retryIntervalRef.current = setInterval(() => {
          if (connectionAttempts < maxConnectionAttempts && (!hasTutorStream || !hasLearnerStream)) {
            console.log(" Admin: Smart retry - missing streams");
            sendStreamRequests();
          }
        }, 2000);
        
        // Stop aggressive retries after reasonable time
        setTimeout(() => {
          if (retryIntervalRef.current) {
            clearInterval(retryIntervalRef.current);
            retryIntervalRef.current = null;
            console.log(" Admin: Stopped aggressive retries, keeping heartbeat");
          }
        }, 30000); // Reduced from 60s to 30s
      });

      // Improved call handling with deduplication
      const activeCalls = new Map<string, any>();
      
      newPeer.on("call", async (call) => {
        const callPeerId = call.peer;
        console.log(" Admin: Incoming call from:", callPeerId);
        
        // Prevent duplicate calls
        if (activeCalls.has(callPeerId)) {
          console.log(" Admin: Duplicate call ignored");
          call.close();
          return;
        }
        
        activeCalls.set(callPeerId, call);
        call.answer(); // Answer without sending stream (monitor mode)
        
        // Get session data once
        const { data: session } = await supabase
          .from("sessions")
          .select("tutor_peer_id, learner_peer_id")
          .eq("id", sessionId)
          .single();
        
        const isTutor = callPeerId === session?.tutor_peer_id;
        const isLearner = callPeerId === session?.learner_peer_id;
        
        call.on("stream", (stream) => {
          console.log(" Admin: Stream received from:", callPeerId, 
            "video:", stream.getVideoTracks().length, 
            "audio:", stream.getAudioTracks().length);
          
          // Handle tutor stream
          if (isTutor && !hasTutorStream) {
            hasTutorStream = true;
            setTutorStream(stream);
            
            // Smooth video setup
            requestAnimationFrame(() => {
              if (tutorVideoRef.current && stream.active) {
                tutorVideoRef.current.srcObject = stream;
                tutorVideoRef.current.play().catch(e => 
                  console.log("Tutor video play error:", e));
              }
            });
            
            // Monitor video track state
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
              const updateCameraState = () => setTutorCameraOn(videoTrack.enabled && videoTrack.readyState === 'live');
              updateCameraState();
              videoTrack.addEventListener('mute', () => setTutorCameraOn(false));
              videoTrack.addEventListener('unmute', updateCameraState);
              videoTrack.addEventListener('ended', () => {
                setTutorCameraOn(false);
                hasTutorStream = false;
                setTutorStream(null);
              });
            }
          }
          
          // Handle learner stream
          if (isLearner && !hasLearnerStream) {
            hasLearnerStream = true;
            setLearnerStream(stream);
            
            // Smooth video setup
            requestAnimationFrame(() => {
              if (learnerVideoRef.current && stream.active) {
                learnerVideoRef.current.srcObject = stream;
                learnerVideoRef.current.play().catch(e => 
                  console.log("Learner video play error:", e));
              }
            });
            
            // Monitor video track state
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
              const updateCameraState = () => setLearnerCameraOn(videoTrack.enabled && videoTrack.readyState === 'live');
              updateCameraState();
              videoTrack.addEventListener('mute', () => setLearnerCameraOn(false));
              videoTrack.addEventListener('unmute', updateCameraState);
              videoTrack.addEventListener('ended', () => {
                setLearnerCameraOn(false);
                hasLearnerStream = false;
                setLearnerStream(null);
              });
            }
          }
        });
        
        // Clean call handling
        const cleanupCall = () => {
          activeCalls.delete(callPeerId);
          if (isTutor && hasTutorStream) {
            hasTutorStream = false;
            setTutorStream(null);
            setTutorCameraOn(false);
          }
          if (isLearner && hasLearnerStream) {
            hasLearnerStream = false;
            setLearnerStream(null);
            setLearnerCameraOn(false);
          }
        };
        
        call.on("close", () => {
          console.log(" Admin: Call closed from:", callPeerId);
          cleanupCall();
        });
        
        call.on("error", (err) => {
          console.error(" Admin: Call error from", callPeerId, ":", err);
          cleanupCall();
        });
      });

      // Better error handling
      newPeer.on("error", (err) => {
        console.error(" Admin: Peer error:", err);
        if (err.type === 'peer-unavailable') {
          console.log(" Admin: Peer unavailable, will retry");
        }
      });
      
      newPeer.on("disconnected", () => {
        console.log(" Admin: Peer disconnected, attempting reconnect");
        if (!newPeer.destroyed) {
          newPeer.reconnect();
        }
      });
    };

    setupPeer();

    return () => {
      console.log(" Admin: Cleaning up monitoring");
      
      // Clear intervals
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
      
      // Clean up channels
      [monitorChannelRef, sessionChannelRef, monitorRequestChannelRef].forEach(ref => {
        if (ref.current) {
          supabase.removeChannel(ref.current);
          ref.current = null;
        }
      });
      
      // Clean up peer
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      
      // Reset streams
      setTutorStream(null);
      setLearnerStream(null);
    };
  }, [sessionId, user, sessionData]);
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
      
      // Send admin_left and cleanup channels
      if (monitorChannelRef.current) {
        monitorChannelRef.current.send({
          type: 'broadcast',
          event: 'admin_left',
          payload: { admin_id: user?.id }
        });
        supabase.removeChannel(monitorChannelRef.current);
        monitorChannelRef.current = null;
      }
      if (sessionChannelRef.current) {
        supabase.removeChannel(sessionChannelRef.current);
        sessionChannelRef.current = null;
      }
      if (monitorRequestChannelRef.current) {
        supabase.removeChannel(monitorRequestChannelRef.current);
        monitorRequestChannelRef.current = null;
      }
      
      // Destroy peer
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [sessionId, user, sessionData]);

  // Ensure video elements stay in sync with streams
  // Use a more robust approach that handles both regular and fullscreen video elements
  useEffect(() => {
    if (!tutorStream) return;
    
    console.log(" Admin: Setting tutor video stream, tracks:", tutorStream.getTracks().map(t => `${t.kind}:${t.enabled}:${t.readyState}`));
    
    const setVideoStream = (videoEl: HTMLVideoElement | null) => {
      if (videoEl) {
        videoEl.srcObject = tutorStream;
        videoEl.muted = true; // Ensure muted for autoplay
        videoEl.play().then(() => {
          console.log(" Admin: Tutor video playing successfully");
        }).catch(e => {
          console.log(" Admin: Tutor video play error:", e);
          // Retry after a short delay
          setTimeout(() => {
            videoEl.play().catch(e2 => console.log(" Admin: Tutor video retry play error:", e2));
          }, 500);
        });
      }
    };
    
    setVideoStream(tutorVideoRef.current);
    setVideoStream(fullscreenTutorVideoRef.current);
    
    // Also set up an interval to ensure video keeps playing
    const playInterval = setInterval(() => {
      if (tutorVideoRef.current && tutorVideoRef.current.paused && tutorStream.active) {
        console.log(" Admin: Tutor video paused, attempting to play");
        tutorVideoRef.current.play().catch(() => {});
      }
    }, 2000);
    
    return () => clearInterval(playInterval);
  }, [tutorStream]);

  useEffect(() => {
    if (!learnerStream) return;
    
    console.log(" Admin: Setting learner video stream, tracks:", learnerStream.getTracks().map(t => `${t.kind}:${t.enabled}:${t.readyState}`));
    
    const setVideoStream = (videoEl: HTMLVideoElement | null) => {
      if (videoEl) {
        videoEl.srcObject = learnerStream;
        videoEl.muted = true; // Ensure muted for autoplay
        videoEl.play().then(() => {
          console.log(" Admin: Learner video playing successfully");
        }).catch(e => {
          console.log(" Admin: Learner video play error:", e);
          // Retry after a short delay
          setTimeout(() => {
            videoEl.play().catch(e2 => console.log(" Admin: Learner video retry play error:", e2));
          }, 500);
        });
      }
    };
    
    setVideoStream(learnerVideoRef.current);
    setVideoStream(fullscreenLearnerVideoRef.current);
    
    // Also set up an interval to ensure video keeps playing
    const playInterval = setInterval(() => {
      if (learnerVideoRef.current && learnerVideoRef.current.paused && learnerStream.active) {
        console.log(" Admin: Learner video paused, attempting to play");
        learnerVideoRef.current.play().catch(() => {});
      }
    }, 2000);
    
    return () => clearInterval(playInterval);
  }, [learnerStream]);
  
  // Also update fullscreen video refs when fullscreen state changes
  useEffect(() => {
    if (!isFullscreen) return;
    
    if (fullscreenVideo === 'tutor' && tutorStream && fullscreenTutorVideoRef.current) {
      fullscreenTutorVideoRef.current.srcObject = tutorStream;
      fullscreenTutorVideoRef.current.play().catch(e => console.log("Fullscreen tutor video play error:", e));
    } else if (fullscreenVideo === 'learner' && learnerStream && fullscreenLearnerVideoRef.current) {
      fullscreenLearnerVideoRef.current.srcObject = learnerStream;
      fullscreenLearnerVideoRef.current.play().catch(e => console.log("Fullscreen learner video play error:", e));
    }
  }, [isFullscreen, fullscreenVideo, tutorStream, learnerStream]);

  // Subscribe to media state broadcasts and session_ended event
  useEffect(() => {
    if (!sessionId || !sessionData) return;

    const mediaChannel = supabase
      .channel(`session-${sessionId}`)
      .on('broadcast', { event: 'media_state' }, (payload) => {
        console.log(" Admin: Received media_state", payload.payload);
        const { userId, camera } = payload.payload;
        
        if (userId === sessionData.tutor_id) {
          setTutorCameraOn(camera ?? true);
        } else if (userId === sessionData.learner_id) {
          setLearnerCameraOn(camera ?? true);
        }
      })
      .on('broadcast', { event: 'session_ended' }, (payload) => {
        console.log(" Admin: Received session_ended broadcast", payload.payload);
        handleSessionCompletion();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(mediaChannel);
    };
  }, [sessionId, sessionData, navigate]);

  // Subscribe to session status changes
  useEffect(() => {
    if (!sessionId) return;

    const sessionChannel = supabase
      .channel(`admin-session-status-${sessionId}`)
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
          const status = newSession.session_status as "waiting" | "in_progress" | "completed";
          setSessionStatus(status || "waiting");
          
          if (status === "completed") {
            handleSessionCompletion();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
    };
  }, [sessionId, navigate]);

  // Stop monitoring - simplified
  const handleStopMonitoring = async () => {
    console.log(" Stopping admin monitoring");
    
    // Clear heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    // Send admin_left - simple single broadcast
    if (monitorChannelRef.current) {
      try {
        await monitorChannelRef.current.send({
          type: 'broadcast',
          event: 'admin_left',
          payload: { admin_id: user?.id }
        });
        console.log(" Admin left broadcast sent");
      } catch (e) {
        console.log("Error sending admin_left:", e);
      }
      supabase.removeChannel(monitorChannelRef.current);
      monitorChannelRef.current = null;
    }
    
    // Cleanup
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    
    setTutorStream(null);
    setLearnerStream(null);
    
    toast.success("Stopped monitoring");
    navigate("/admin/live-monitoring", { replace: true });
  };

  // Force end session
  const handleForceEnd = async () => {
    if (!sessionId) return;
    
    const confirmed = window.confirm("Are you sure you want to force end this session? This will immediately end the meeting for both tutor and learner.");
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("sessions")
        .update({ 
          session_status: "completed",
          ended_at: new Date().toISOString(),
          end_reason: "admin_force_ended"
        })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Session force ended");
      navigate("/admin/live-monitoring");
    } catch (error) {
      console.error("Error force ending session:", error);
      toast.error("Failed to end session");
    }
  };

  // Retry connection to get streams
  const handleRetryConnection = async () => {
    if (!peerRef.current || !user) {
      toast.error("Peer connection not ready");
      return;
    }
    
    toast.info("Requesting video streams from participants...");
    
    const peerId = peerRef.current.id;
    
    // Send requests on all existing channels
    if (monitorChannelRef.current) {
      monitorChannelRef.current.send({
        type: 'broadcast',
        event: 'admin_joined',
        payload: { 
          admin_id: user.id,
          monitor_peer_id: peerId
        }
      });
    }
    
    if (sessionChannelRef.current) {
      sessionChannelRef.current.send({
        type: 'broadcast',
        event: 'admin_request_stream',
        payload: { 
          admin_id: user.id,
          monitor_peer_id: peerId
        }
      });
    }
    
    if (monitorRequestChannelRef.current) {
      monitorRequestChannelRef.current.send({
        type: 'broadcast',
        event: 'monitor_request_stream',
        payload: { 
          admin_id: user.id,
          monitor_peer_id: peerId
        }
      });
    }
    
    // Send multiple times for reliability
    setTimeout(() => {
      if (monitorChannelRef.current) {
        monitorChannelRef.current.send({
          type: 'broadcast',
          event: 'admin_joined',
          payload: { admin_id: user.id, monitor_peer_id: peerId }
        });
      }
      if (sessionChannelRef.current) {
        sessionChannelRef.current.send({
          type: 'broadcast',
          event: 'admin_request_stream',
          payload: { admin_id: user.id, monitor_peer_id: peerId }
        });
      }
      if (monitorRequestChannelRef.current) {
        monitorRequestChannelRef.current.send({
          type: 'broadcast',
          event: 'monitor_request_stream',
          payload: { admin_id: user.id, monitor_peer_id: peerId }
        });
      }
    }, 500);
  };

  // Render camera off overlay
  const renderCameraOffOverlay = (
    hasStream: boolean,
    cameraOn: boolean,
    profile: any,
    label: string,
    stream: MediaStream | null
  ) => {
    // Check if stream has active video tracks
    const hasVideoTrack = stream?.getVideoTracks().some(t => t.readyState === 'live') ?? false;
    
    // Show overlay if no stream, camera is off, or no active video track
    if (hasStream && cameraOn && hasVideoTrack) return null;
    
    return (
      <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-white bg-gradient-to-br from-gray-900 to-gray-800 z-20">
        {profile?.avatar_url ? (
          <img 
            src={profile.avatar_url} 
            alt={profile?.full_name || label} 
            className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-lg mb-2"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-white/20 flex items-center justify-center mb-2">
            <span className="text-lg font-bold text-white">
              {profile?.full_name?.charAt(0).toUpperCase() || label.charAt(0)}
            </span>
          </div>
        )}
        <p className="text-xs font-medium mb-1">{profile?.full_name || label}</p>
        <VideoOff className="w-4 h-4 opacity-50" />
        <p className="text-[10px] opacity-50 mt-1">
          {!hasStream ? "Connecting..." : !hasVideoTrack ? "No Video" : "Camera Off"}
        </p>
      </div>
    );
  };

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleStopMonitoring} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Monitoring Session</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{sessionData.subject}</span>
          <div className="h-6 w-px bg-border" />
          {(!tutorStream || !learnerStream) && (
            <Button variant="outline" size="sm" onClick={handleRetryConnection} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleStopMonitoring} className="gap-2">
            <EyeOff className="h-4 w-4" />
            Stop Monitoring
          </Button>
          <Button variant="destructive" size="sm" onClick={handleForceEnd} className="gap-2">
            <PhoneOff className="h-4 w-4" />
            Force End
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 overflow-hidden min-h-0">
        {/* Left Panel - Whiteboard/Assets */}
        <div className="hidden lg:flex lg:flex-[0_0_68%] bg-card rounded-lg border shadow-sm overflow-hidden flex-col min-h-0">
          <div className="flex border-b shrink-0">
            <button
              onClick={() => setActivePanel("whiteboard")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activePanel === "whiteboard" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Whiteboard (View Only)
            </button>
            <button
              onClick={() => setActivePanel("assets")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activePanel === "assets" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Assets (View Only)
            </button>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            <div className={activePanel === "whiteboard" ? "h-full" : "hidden h-full"}>
              <WhiteboardCanvas 
                sessionId={sessionId} 
                isMonitorMode={true}
                isPeerConnected={true}
                isSessionInProgress={sessionStatus === "in_progress"}
              />
            </div>
            <div className={activePanel === "assets" ? "h-full" : "hidden h-full"}>
              <AssetsPanel sessionId={sessionId} isMonitorMode={true} />
            </div>
          </div>
        </div>

        {/* Right Panel - Video & Chat */}
        <div className="flex-1 lg:flex-[0_0_32%] flex flex-col gap-3 min-h-0">
          {/* Video Feeds */}
          <div className="bg-card rounded-lg border shadow-sm overflow-hidden shrink-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
              {/* Tutor Video */}
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video rounded-lg overflow-hidden group">
                <video
                  ref={tutorVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!tutorStream ? 'hidden' : ''}`}
                />
                {renderCameraOffOverlay(!!tutorStream, tutorCameraOn, sessionData.tutor_profile, "Tutor", tutorStream)}
                <div className="absolute top-1 left-1 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[10px] font-medium bg-black/60 z-30">
                  Tutor
                </div>
                {tutorStream && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-30"
                    onClick={() => { setFullscreenVideo('tutor'); setIsFullscreen(true); }}
                  >
                    <Maximize className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Learner Video */}
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-700 aspect-video rounded-lg overflow-hidden group">
                <video
                  ref={learnerVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!learnerStream ? 'hidden' : ''}`}
                />
                {renderCameraOffOverlay(!!learnerStream, learnerCameraOn, sessionData.learner_profile, "Learner", learnerStream)}
                <div className="absolute top-1 left-1 backdrop-blur-sm px-1.5 py-0.5 rounded text-white text-[10px] font-medium bg-black/60 z-30">
                  Learner
                </div>
                {learnerStream && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-30"
                    onClick={() => { setFullscreenVideo('learner'); setIsFullscreen(true); }}
                  >
                    <Maximize className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Session Info */}
            <div className="px-3 py-2 border-t bg-muted/30">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {sessionData.tutor_profile?.full_name} → {sessionData.learner_profile?.full_name}
                </span>
                <span className={`px-2 py-0.5 rounded-full ${
                  sessionStatus === "in_progress" ? "bg-green-500/20 text-green-600" : "bg-yellow-500/20 text-yellow-600"
                }`}>
                  {sessionStatus === "in_progress" ? "In Progress" : "Waiting"}
                </span>
              </div>
              {/* Debug info */}
              <div className="text-[10px] text-muted-foreground mt-1">
                Tutor: {tutorStream ? `${tutorStream.getVideoTracks().length}v/${tutorStream.getAudioTracks().length}a` : 'none'} | 
                Learner: {learnerStream ? `${learnerStream.getVideoTracks().length}v/${learnerStream.getAudioTracks().length}a` : 'none'}
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex-1 bg-card rounded-lg border shadow-sm overflow-hidden min-h-0 flex flex-col">
            <div className="px-3 py-2 border-b flex items-center shrink-0">
              <span className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Session Chat (View Only)
              </span>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <SessionChat sessionId={sessionId} userId={user?.id || ""} isMonitorMode={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Video Modal */}
      {isFullscreen && fullscreenVideo && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-8" onClick={() => setIsFullscreen(false)}>
          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <video
              autoPlay
              playsInline
              ref={fullscreenVideo === 'tutor' ? fullscreenTutorVideoRef : fullscreenLearnerVideoRef}
              className="w-full h-full object-contain"
            />
            {((fullscreenVideo === 'tutor' && (!tutorCameraOn || !tutorStream)) || 
              (fullscreenVideo === 'learner' && (!learnerCameraOn || !learnerStream))) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <VideoOff className="w-16 h-16 text-white/50 mb-4" />
                <p className="text-white text-lg">Camera Off</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/60 hover:bg-black/80 text-white"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-white text-sm">
              {fullscreenVideo === 'tutor' ? 'Tutor' : 'Learner'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
