// Direct WebRTC signaling using Supabase Realtime
// This replaces PeerJS with a more reliable signaling mechanism

import { supabase } from "@/integrations/supabase/client";
import { getWebRTCConfig } from "./webrtcConfig";

export interface SignalingCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: 'connecting' | 'connected' | 'disconnected' | 'failed') => void;
  onError: (error: string) => void;
}

export class SupabaseWebRTC {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private channel: any = null;
  private sessionId: string;
  private oderId: string;
  private role: 'tutor' | 'learner';
  private callbacks: SignalingCallbacks;
  private iceCandidatesQueue: RTCIceCandidateInit[] = [];
  private hasRemoteDescription = false;
  private makingOffer = false;
  private ignoreOffer = false;
  private isChannelReady = false;
  private hasSentOffer = false;
  
  // Observer connections - for forwarding streams to observers
  private observerConnections: Map<string, RTCPeerConnection> = new Map();
  
  // Heartbeat for faster disconnect detection
  private dataChannel: RTCDataChannel | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeatReceived: number = Date.now();
  private heartbeatCheckInterval: NodeJS.Timeout | null = null;
  private static readonly HEARTBEAT_INTERVAL = 2000; // Send heartbeat every 2 seconds
  private static readonly HEARTBEAT_TIMEOUT = 6000; // Consider disconnected after 6 seconds without heartbeat

  constructor(
    sessionId: string,
    oderId: string,
    role: 'tutor' | 'learner',
    callbacks: SignalingCallbacks
  ) {
    this.sessionId = sessionId;
    this.oderId = oderId;
    this.role = role;
    this.callbacks = callbacks;
  }

  async initialize(localStream: MediaStream): Promise<void> {
    console.log(" Initializing Supabase WebRTC signaling for", this.role);
    this.localStream = localStream;
    
    // Subscribe to observer channel FIRST (so we can detect observers early)
    this.subscribeToObserverChannel();
    
    // Wait for observer channel to be subscribed before proceeding
    // This ensures we can receive observer presence announcements
    await new Promise<void>((resolve) => {
      const checkReady = () => {
        if (this.isObserverChannelReady) {
          console.log(" Observer channel confirmed ready");
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      // Start checking, but also set a timeout to not block forever
      checkReady();
      setTimeout(() => {
        if (!this.isObserverChannelReady) {
          console.log(" Observer channel timeout - proceeding anyway");
          resolve();
        }
      }, 3000);
    });
    
    // Subscribe to signaling channel
    await this.subscribeToSignaling();
    
    // Wait for channel to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create peer connection with ICE servers
    this.createPeerConnection();
    
    // Announce presence after a short delay
    setTimeout(() => this.announcePresence(), 300);
    
    // For learner: request offer from tutor explicitly
    // This is important when learner joins after tutor has been waiting
    if (this.role === 'learner') {
      // Request offer multiple times to ensure tutor receives it
      setTimeout(() => this.requestOffer(), 1000);
      setTimeout(() => this.requestOffer(), 2000);
      setTimeout(() => this.requestOffer(), 3500);
    }
  }
  
  // Learner requests an offer from tutor
  private async requestOffer() {
    if (this.hasRemoteDescription) {
      console.log(" Already have remote description, not requesting offer");
      return;
    }
    
    if (!this.isChannelReady) {
      console.log(" Channel not ready, cannot request offer");
      return;
    }
    
    console.log(" Learner requesting offer from tutor, channel:", `webrtc-${this.sessionId}`);
    await this.channel.send({
      type: 'broadcast',
      event: 'request-offer',
      payload: {
        oderId: this.oderId,
        role: this.role,
        timestamp: Date.now()
      }
    });
    console.log(" Request-offer sent successfully");
  }

  private createPeerConnection() {
    const config = getWebRTCConfig(false);
    this.peerConnection = new RTCPeerConnection(config);
    
    console.log(" Created RTCPeerConnection for", this.role);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        console.log(` Adding ${track.kind} track to peer connection`);
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(" Sending ICE candidate");
        this.sendSignal({
          type: 'ice-candidate',
          candidate: event.candidate.toJSON()
        });
      }
    };

    // Handle ICE gathering state
    this.peerConnection.onicegatheringstatechange = () => {
      console.log(" ICE gathering state:", this.peerConnection?.iceGatheringState);
    };

    // Handle ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log(" ICE connection state:", state);
      
      switch (state) {
        case 'checking':
          this.callbacks.onConnectionStateChange('connecting');
          break;
        case 'connected':
        case 'completed':
          this.callbacks.onConnectionStateChange('connected');
          break;
        case 'disconnected':
          this.callbacks.onConnectionStateChange('disconnected');
          // Try to restart ICE after a delay
          setTimeout(() => this.restartIce(), 2000);
          break;
        case 'failed':
          this.callbacks.onConnectionStateChange('failed');
          this.callbacks.onError('ICE connection failed');
          break;
      }
    };

    // Handle connection state
    this.peerConnection.onconnectionstatechange = () => {
      console.log(" Connection state:", this.peerConnection?.connectionState);
    };

    // Set up data channel for heartbeat (tutor creates, learner receives)
    if (this.role === 'tutor') {
      this.dataChannel = this.peerConnection.createDataChannel('heartbeat');
      this.setupDataChannel(this.dataChannel);
    } else {
      this.peerConnection.ondatachannel = (event) => {
        console.log(" Received data channel:", event.channel.label);
        if (event.channel.label === 'heartbeat') {
          this.dataChannel = event.channel;
          this.setupDataChannel(this.dataChannel);
        }
      };
    }

    // Handle remote tracks - THIS IS THE KEY PART
    this.peerConnection.ontrack = (event) => {
      console.log(" Received remote track:", event.track.kind, "streams:", event.streams.length);
      
      if (event.streams && event.streams[0]) {
        console.log(" Remote stream has", event.streams[0].getTracks().length, "tracks");
        this.callbacks.onRemoteStream(event.streams[0]);
      } else {
        // Create a new stream if none provided
        console.log(" Creating new MediaStream for remote track");
        const stream = new MediaStream([event.track]);
        this.callbacks.onRemoteStream(stream);
      }
    };

    // DON'T auto-trigger offer on negotiationneeded - we control when to send offers
    this.peerConnection.onnegotiationneeded = () => {
      console.log(" Negotiation needed (will be handled by presence)");
    };
  }

  private async subscribeToSignaling() {
    const channelName = `webrtc-${this.sessionId}`;
    console.log(" Subscribing to signaling channel:", channelName, "as", this.role, "userId:", this.oderId);
    
    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false }
      }
    });

    this.channel
      .on('broadcast', { event: 'signal' }, async ({ payload }: any) => {
        // Ignore our own messages
        if (payload.oderId === this.oderId) return;
        
        console.log(" Received signal:", payload.type, "from:", payload.role, "oderId:", payload.oderId);
        await this.handleSignal(payload);
      })
      .on('broadcast', { event: 'presence' }, async ({ payload }: any) => {
        if (payload.oderId === this.oderId) return;
        
        console.log(" Peer presence detected:", payload.role, "oderId:", payload.oderId, "I am:", this.role);
        
        // Check if we need to reset connection (peer rejoined after disconnect)
        const connectionState = this.peerConnection?.connectionState;
        const iceState = this.peerConnection?.iceConnectionState;
        const isDisconnected = connectionState === 'disconnected' || 
                               connectionState === 'failed' || 
                               connectionState === 'closed' ||
                               iceState === 'disconnected' ||
                               iceState === 'failed' ||
                               iceState === 'closed';
        
        // If we had a connection before but it's now broken, reset for reconnection
        if ((this.hasSentOffer || this.hasRemoteDescription) && isDisconnected) {
          console.log(" Peer rejoined after disconnect - resetting connection");
          this.resetConnectionState();
        }
        
        // When we detect the other peer, initiate connection
        // Tutor always initiates to avoid collision
        if (this.role === 'tutor') {
          // If we haven't connected yet (no remote description), send an offer
          // This handles both initial connection and reconnection after learner joins
          if (!this.hasRemoteDescription) {
            console.log(" Tutor initiating offer to learner (hasSentOffer:", this.hasSentOffer, "hasRemoteDescription:", this.hasRemoteDescription, ")");
            
            // If we previously sent an offer that didn't get answered, reset the connection
            if (this.hasSentOffer) {
              console.log(" Previous offer unanswered, resetting connection state");
              this.resetConnectionState();
              // Wait for reset to complete
              await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            // Small delay to ensure learner is ready
            setTimeout(() => this.createAndSendOffer(), 500);
          } else {
            console.log(" Tutor already connected, not sending new offer");
          }
        }
        
        // Learner: If we see tutor's presence and haven't received an offer yet,
        // re-announce our presence to prompt the tutor to send an offer
        if (this.role === 'learner' && !this.hasRemoteDescription) {
          console.log(" Learner detected tutor, requesting offer");
          // Send a specific request for offer
          await this.channel.send({
            type: 'broadcast',
            event: 'request-offer',
            payload: {
              oderId: this.oderId,
              role: this.role,
              timestamp: Date.now()
            }
          });
        }
      })
      .on('broadcast', { event: 'request-offer' }, async ({ payload }: any) => {
        console.log(" Received request-offer event, payload:", payload, "I am:", this.role);
        if (payload.oderId === this.oderId) return;
        
        // Only tutor responds to offer requests
        if (this.role === 'tutor' && payload.role === 'learner') {
          console.log(" Tutor received offer request from learner, will send offer");
          
          // Reset connection if we had a stale offer
          if (this.hasSentOffer && !this.hasRemoteDescription) {
            console.log(" Resetting stale connection before sending new offer");
            this.resetConnectionState();
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          // Send offer after a short delay
          setTimeout(() => this.createAndSendOffer(), 300);
        }
      })
      .on('broadcast', { event: 'observer-presence' }, async ({ payload }: any) => {
        // Observer wants to receive our stream
        console.log(" RECEIVED observer-presence event!", payload);
        console.log(" Observer presence detected:", payload.oderId, "I am:", this.role, "localStream:", !!this.localStream, "hasRemoteDescription:", this.hasRemoteDescription);
        
        const observerId = payload.oderId;
        
        // Check if we already have a connection to this observer
        const existingConnection = this.observerConnections.get(observerId);
        if (existingConnection) {
          const state = existingConnection.iceConnectionState;
          // If connection is healthy, skip
          if (state === 'connected' || state === 'completed') {
            console.log(" Already have healthy connection to observer:", observerId, state);
            return;
          }
          // Otherwise, the observer probably reconnected - clean up old connection
          console.log(" Observer reconnected, cleaning up old connection:", observerId, state);
          try {
            existingConnection.close();
          } catch (e) {
            console.log(" Error closing old connection:", e);
          }
          this.observerConnections.delete(observerId);
        }
        
        // Only forward stream if we have a local stream
        if (this.localStream) {
          console.log(" Ready to forward stream to observer (hasRemoteDescription:", this.hasRemoteDescription, ")");
          await this.createObserverConnection(observerId);
        } else {
          console.log(" No local stream yet, will retry when available");
          
          // Store observer ID and retry multiple times with longer delays
          const retryTimes = [1000, 2000, 4000, 6000, 10000, 15000];
          
          retryTimes.forEach((delay) => {
            setTimeout(() => {
              if (this.localStream && !this.observerConnections.has(observerId)) {
                console.log(` Retry forwarding stream to observer after ${delay}ms`);
                this.createObserverConnection(observerId);
              }
            }, delay);
          });
        }
      })
      .on('broadcast', { event: 'signal' }, async ({ payload }: any) => {
        // Handle observer answers and ICE candidates
        if (payload.role === 'observer' && payload.targetRole === this.role) {
          await this.handleObserverSignal(payload);
        }
      })
      .subscribe((status: string) => {
        console.log(" Signaling channel status:", status);
        if (status === 'SUBSCRIBED') {
          this.isChannelReady = true;
          this.callbacks.onConnectionStateChange('connecting');
        }
      });
  }
  
  // Observer channel subscription for detecting observer presence
  private observerChannel: any = null;
  private isObserverChannelReady = false;
  
  private subscribeToObserverChannel() {
    const observerChannelName = `observer-${this.sessionId}`;
    console.log(" Subscribing to observer channel:", observerChannelName, "as", this.role);
    
    this.observerChannel = supabase.channel(observerChannelName, {
      config: {
        broadcast: { self: false }
      }
    });
    
    this.observerChannel
      .on('broadcast', { event: 'observer-presence' }, async ({ payload }: any) => {
        console.log(" RECEIVED observer-presence on observer channel!", payload);
        
        const observerId = payload.oderId;
        
        // Check if we already have a healthy connection to this observer
        const existingConnection = this.observerConnections.get(observerId);
        if (existingConnection) {
          const state = existingConnection.iceConnectionState;
          if (state === 'connected' || state === 'completed') {
            console.log(" Already have healthy connection to observer:", observerId, state);
            return;
          }
          // Clean up stale connection
          console.log(" Cleaning up stale observer connection:", observerId, state);
          try {
            existingConnection.close();
          } catch (e) {
            console.log(" Error closing old connection:", e);
          }
          this.observerConnections.delete(observerId);
        }
        
        // Forward stream to observer if we have one
        if (this.localStream) {
          console.log(" Forwarding stream to observer from observer channel");
          await this.createObserverConnection(observerId);
        } else {
          console.log(" No local stream yet, will retry");
          const retryTimes = [1000, 2000, 4000];
          retryTimes.forEach((delay) => {
            setTimeout(() => {
              if (this.localStream && !this.observerConnections.has(observerId)) {
                console.log(` Retry forwarding stream to observer after ${delay}ms`);
                this.createObserverConnection(observerId);
              }
            }, delay);
          });
        }
      })
      .on('broadcast', { event: 'observer-signal' }, async ({ payload }: any) => {
        // Handle observer answers and ICE candidates
        if (payload.role === 'observer' && payload.targetRole === this.role) {
          console.log(" Received signal from observer:", payload.type);
          const pc = this.observerConnections.get(payload.oderId);
          if (pc) {
            await this.handleObserverSignalForConnection(payload, pc, payload.oderId);
          } else {
            console.log(" No connection found for observer:", payload.oderId);
          }
        }
      })
      .subscribe((status: string) => {
        console.log(" Observer channel status:", status);
        if (status === 'SUBSCRIBED') {
          this.isObserverChannelReady = true;
          console.log(" Observer channel ready - can now receive observer presence");
        }
      });
  }

  private async announcePresence() {
    if (!this.isChannelReady) {
      console.log(" Channel not ready, waiting...");
      setTimeout(() => this.announcePresence(), 500);
      return;
    }
    
    console.log(" Announcing presence as:", this.role, "hasRemoteDescription:", this.hasRemoteDescription);
    await this.channel.send({
      type: 'broadcast',
      event: 'presence',
      payload: {
        oderId: this.oderId,
        role: this.role,
        timestamp: Date.now()
      }
    });
    
    // Re-announce presence periodically in case the other peer joins later
    // But only if we haven't connected yet
    setTimeout(() => {
      if (this.channel && !this.hasRemoteDescription) {
        console.log(" Re-announcing presence (still waiting for connection)");
        this.announcePresence();
      }
    }, 3000);
  }

  private async sendSignal(signal: any) {
    if (!this.channel || !this.isChannelReady) {
      console.log(" Channel not ready, cannot send signal");
      return;
    }
    
    await this.channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        ...signal,
        oderId: this.oderId,
        role: this.role,
        timestamp: Date.now()
      }
    });
  }

  private async handleSignal(payload: any) {
    if (!this.peerConnection) return;

    try {
      switch (payload.type) {
        case 'offer':
          await this.handleOffer(payload);
          break;
        case 'answer':
          await this.handleAnswer(payload);
          break;
        case 'ice-candidate':
          await this.handleIceCandidate(payload);
          break;
      }
    } catch (error) {
      console.error("Error handling signal:", error);
      this.callbacks.onError("Signaling error: " + (error as Error).message);
    }
  }

  private async createAndSendOffer() {
    if (!this.peerConnection || this.makingOffer) {
      console.log(" Cannot create offer - peerConnection:", !!this.peerConnection, "makingOffer:", this.makingOffer);
      return;
    }
    
    try {
      this.makingOffer = true;
      this.hasSentOffer = true;
      console.log(" Creating offer, signalingState:", this.peerConnection.signalingState);
      
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      console.log(" Sending offer, SDP type:", offer.type);
      await this.sendSignal({
        type: 'offer',
        sdp: this.peerConnection.localDescription
      });
    } catch (error) {
      console.error("Error creating offer:", error);
      this.hasSentOffer = false;
    } finally {
      this.makingOffer = false;
    }
  }

  private async handleOffer(payload: any) {
    if (!this.peerConnection) return;
    
    // Perfect negotiation pattern - handle offer collision
    const offerCollision = this.makingOffer || 
      this.peerConnection.signalingState !== 'stable';
    
    // Tutor is "polite" peer, learner is "impolite"
    this.ignoreOffer = this.role === 'learner' && offerCollision;
    
    if (this.ignoreOffer) {
      console.log(" Ignoring offer due to collision, signalingState:", this.peerConnection.signalingState);
      return;
    }
    
    // If we already have a remote description and are stable, we might be getting a duplicate offer
    if (this.hasRemoteDescription && this.peerConnection.signalingState === 'stable') {
      console.log(" Already have remote description and stable, might be duplicate offer - processing anyway for renegotiation");
    }
    
    console.log(" Handling offer from", payload.role, "signalingState:", this.peerConnection.signalingState);
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    this.hasRemoteDescription = true;
    
    // Process queued ICE candidates
    await this.processIceCandidateQueue();
    
    // Create and send answer
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    console.log(" Sending answer");
    await this.sendSignal({
      type: 'answer',
      sdp: this.peerConnection.localDescription
    });
  }

  private async handleAnswer(payload: any) {
    if (!this.peerConnection) return;
    
    // Only process answer if we're in the right state (have-local-offer)
    // Ignore if we're already stable (already got an answer)
    if (this.peerConnection.signalingState !== 'have-local-offer') {
      console.log(" Ignoring answer - wrong state:", this.peerConnection.signalingState);
      return;
    }
    
    console.log(" Handling answer from", payload.role);
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    this.hasRemoteDescription = true;
    
    // Process queued ICE candidates
    await this.processIceCandidateQueue();
  }

  private async handleIceCandidate(payload: any) {
    if (!this.peerConnection) return;
    
    try {
      const candidate = new RTCIceCandidate(payload.candidate);
      
      if (this.hasRemoteDescription) {
        console.log(" Adding ICE candidate");
        await this.peerConnection.addIceCandidate(candidate);
      } else {
        console.log(" Queuing ICE candidate (no remote description yet)");
        this.iceCandidatesQueue.push(payload.candidate);
      }
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  }

  private async processIceCandidateQueue() {
    console.log(` Processing ${this.iceCandidatesQueue.length} queued ICE candidates`);
    
    for (const candidate of this.iceCandidatesQueue) {
      try {
        await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error adding queued ICE candidate:", error);
      }
    }
    
    this.iceCandidatesQueue = [];
  }

  private async restartIce() {
    if (!this.peerConnection || this.peerConnection.connectionState === 'closed') return;
    
    console.log(" Restarting ICE");
    try {
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);
      
      await this.sendSignal({
        type: 'offer',
        sdp: this.peerConnection.localDescription
      });
    } catch (error) {
      console.error("Error restarting ICE:", error);
    }
  }

  // Replace local stream (for screen sharing)
  async replaceTrack(newTrack: MediaStreamTrack, oldTrack?: MediaStreamTrack) {
    if (!this.peerConnection) {
      console.log(" No peer connection for track replacement");
      return;
    }
    
    // Find the video sender - either by matching old track or by track kind
    let sender: RTCRtpSender | undefined;
    
    if (oldTrack) {
      sender = this.peerConnection.getSenders().find(s => s.track === oldTrack);
    }
    
    // If we couldn't find by old track, find by kind (video)
    if (!sender) {
      sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video' || (!s.track && newTrack.kind === 'video'));
    }
    
    // Last resort - find any video sender
    if (!sender) {
      sender = this.peerConnection.getSenders().find(s => {
        const params = s.getParameters();
        return params.encodings?.some(e => e.rid === undefined) && newTrack.kind === 'video';
      });
    }
    
    if (sender) {
      await sender.replaceTrack(newTrack);
      console.log(" Track replaced successfully");
    } else {
      console.log(" Could not find sender to replace track");
    }
  }

  // Set up data channel for heartbeat
  private setupDataChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      console.log(" Heartbeat data channel opened");
      this.startHeartbeat();
    };

    channel.onclose = () => {
      console.log(" Heartbeat data channel closed");
      this.stopHeartbeat();
    };

    channel.onmessage = (event) => {
      if (event.data === 'ping') {
        // Respond to ping with pong
        if (channel.readyState === 'open') {
          channel.send('pong');
        }
      } else if (event.data === 'pong') {
        // Received pong, update last heartbeat time
        this.lastHeartbeatReceived = Date.now();
      }
    };

    channel.onerror = (error) => {
      console.error(" Heartbeat data channel error:", error);
    };
  }

  private startHeartbeat() {
    // Send heartbeat pings
    this.heartbeatInterval = setInterval(() => {
      if (this.dataChannel?.readyState === 'open') {
        this.dataChannel.send('ping');
      }
    }, SupabaseWebRTC.HEARTBEAT_INTERVAL);

    // Check for heartbeat timeout - only after we've received at least one heartbeat
    this.lastHeartbeatReceived = Date.now();
    
    // Delay starting the timeout check to avoid false positives during connection setup
    setTimeout(() => {
      this.heartbeatCheckInterval = setInterval(() => {
        const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeatReceived;
        // Only trigger disconnect if we've been connected and heartbeat times out
        if (timeSinceLastHeartbeat > SupabaseWebRTC.HEARTBEAT_TIMEOUT && this.hasRemoteDescription) {
          console.log(" Heartbeat timeout - peer disconnected");
          this.callbacks.onConnectionStateChange('disconnected');
          // Try to restart ICE
          this.restartIce();
        }
      }, SupabaseWebRTC.HEARTBEAT_INTERVAL);
    }, SupabaseWebRTC.HEARTBEAT_TIMEOUT); // Wait before starting timeout checks
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatCheckInterval) {
      clearInterval(this.heartbeatCheckInterval);
      this.heartbeatCheckInterval = null;
    }
  }

  // Reset connection state for reconnection
  private resetConnectionState() {
    console.log(" Resetting connection state for reconnection");
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Close existing data channel
    if (this.dataChannel) {
      try {
        this.dataChannel.close();
      } catch (e) {
        console.log("Data channel already closed");
      }
      this.dataChannel = null;
    }
    
    // Fully close and nullify existing peer connection
    if (this.peerConnection) {
      // Remove all event handlers to prevent callbacks on closed connection
      this.peerConnection.onicecandidate = null;
      this.peerConnection.oniceconnectionstatechange = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.ontrack = null;
      this.peerConnection.ondatachannel = null;
      this.peerConnection.onnegotiationneeded = null;
      this.peerConnection.onicegatheringstatechange = null;
      
      try {
        this.peerConnection.close();
      } catch (e) {
        console.log("Peer connection already closed");
      }
      this.peerConnection = null;
    }
    
    // Reset ALL flags
    this.hasSentOffer = false;
    this.hasRemoteDescription = false;
    this.makingOffer = false;
    this.ignoreOffer = false;
    this.iceCandidatesQueue = [];
    this.lastHeartbeatReceived = Date.now();
    
    // Create completely new peer connection
    this.createPeerConnection();
    
    console.log(" Connection state reset complete, ready for new connection");
  }

  // Clean up
  destroy() {
    console.log(" Destroying Supabase WebRTC");
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.channel) {
      this.channel.unsubscribe();
    }
    
    // Clean up observer channel
    if (this.observerChannel) {
      this.observerChannel.unsubscribe();
      this.observerChannel = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    
    // Clean up observer connections
    this.observerConnections.forEach((pc, oderId) => {
      console.log(" Closing observer connection:", oderId);
      pc.close();
    });
    this.observerConnections.clear();
    
    this.peerConnection = null;
    this.localStream = null;
    this.channel = null;
    this.isChannelReady = false;
  }

  // Create a one-way connection to forward stream to an observer
  private async createObserverConnection(observerId: string) {
    // Check if we already have a connection to this observer
    const existingConnection = this.observerConnections.get(observerId);
    if (existingConnection) {
      // Check if the existing connection is still healthy
      const state = existingConnection.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        console.log(" Observer connection already exists and is healthy:", observerId, state);
        return;
      }
      
      // Connection exists but is stale/failed - clean it up
      console.log(" Cleaning up stale observer connection:", observerId, state);
      try {
        existingConnection.close();
      } catch (e) {
        console.log(" Error closing stale connection:", e);
      }
      this.observerConnections.delete(observerId);
    }
    
    console.log(" Creating connection to forward stream to observer:", observerId);
    
    // Use the existing observer channel instead of creating a new one
    if (!this.observerChannel) {
      console.error(" Observer channel not ready!");
      return;
    }
    
    const config = getWebRTCConfig(false);
    const pc = new RTCPeerConnection(config);
    this.observerConnections.set(observerId, pc);
    
    // Add local tracks (send-only to observer)
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        console.log(` Adding ${track.kind} track for observer - enabled: ${track.enabled}, readyState: ${track.readyState}`);
        pc.addTrack(track, this.localStream!);
      });
    } else {
      console.log(" WARNING: No local stream to forward to observer!");
    }
    
    // Handle ICE candidates for observer - send on the SAME observer channel
    pc.onicecandidate = (event) => {
      if (event.candidate && this.observerChannel) {
        console.log(" Sending ICE candidate to observer");
        this.observerChannel.send({
          type: 'broadcast',
          event: 'observer-signal',
          payload: {
            type: 'observer-ice-candidate',
            candidate: event.candidate.toJSON(),
            role: this.role,
            targetObserverId: observerId,
            timestamp: Date.now()
          }
        });
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log(` Observer connection state (${observerId}):`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed' || pc.iceConnectionState === 'disconnected') {
        console.log(` Observer connection ${observerId} is ${pc.iceConnectionState}, cleaning up`);
        this.observerConnections.delete(observerId);
      }
    };
    
    // Create and send offer to observer on the SAME channel
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      console.log(" Sending offer to observer:", observerId);
      await this.observerChannel.send({
        type: 'broadcast',
        event: 'observer-signal',
        payload: {
          type: 'observer-offer',
          sdp: pc.localDescription,
          role: this.role,
          targetObserverId: observerId,
          timestamp: Date.now()
        }
      });
      console.log(" Offer sent to observer successfully");
    } catch (error) {
      console.error(" Error creating/sending offer for observer:", error);
      this.observerConnections.delete(observerId);
    }
  }

  // Handle signals from observers for a specific connection
  private async handleObserverSignalForConnection(payload: any, pc: RTCPeerConnection, observerId: string) {
    try {
      if (payload.type === 'observer-answer') {
        console.log(" Received answer from observer:", observerId);
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        } else {
          console.log(" Ignoring answer - wrong state:", pc.signalingState);
        }
      } else if (payload.type === 'observer-ice-candidate') {
        console.log(" Received ICE candidate from observer:", observerId);
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    } catch (error) {
      console.error(" Error handling observer signal:", error);
    }
  }

  // Handle signals from observers (answers and ICE candidates) - legacy handler
  private async handleObserverSignal(payload: any) {
    const observerId = payload.oderId;
    const pc = this.observerConnections.get(observerId);
    
    if (!pc) {
      console.log(" No connection found for observer:", observerId);
      return;
    }
    
    await this.handleObserverSignalForConnection(payload, pc, observerId);
  }
}
