// Observer WebRTC - Receive-only connections from tutor and learner
// Observers don't send any media, they only receive streams

import { supabase } from "@/integrations/supabase/client";
import { getWebRTCConfig } from "./webrtcConfig";

export interface ObserverCallbacks {
  onTutorStream: (stream: MediaStream) => void;
  onLearnerStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: 'connecting' | 'connected' | 'disconnected' | 'failed') => void;
  onError: (error: string) => void;
}

export class ObserverWebRTC {
  private tutorConnection: RTCPeerConnection | null = null;
  private learnerConnection: RTCPeerConnection | null = null;
  private channel: any = null;
  private sessionId: string;
  private oderId: string;
  private callbacks: ObserverCallbacks;
  private isChannelReady = false;
  private tutorIceCandidatesQueue: RTCIceCandidateInit[] = [];
  private learnerIceCandidatesQueue: RTCIceCandidateInit[] = [];
  private hasTutorRemoteDescription = false;
  private hasLearnerRemoteDescription = false;
  private presenceAnnouncementCount = 0;
  private presenceInterval: NodeJS.Timeout | null = null;
  
  // Track streams to prevent duplicate callbacks causing video twitching
  private tutorStreamId: string | null = null;
  private learnerStreamId: string | null = null;

  constructor(
    sessionId: string,
    oderId: string,
    callbacks: ObserverCallbacks
  ) {
    this.sessionId = sessionId;
    this.oderId = oderId;
    this.callbacks = callbacks;
  }

  async initialize(): Promise<void> {
    console.log(" Initializing Observer WebRTC (receive-only)");
    
    // Subscribe to signaling channel
    await this.subscribeToSignaling();
    
    // Wait longer for channel to be ready AND for tutor/learner to have subscribed
    // This is critical for initial join - tutor/learner need time to subscribe to observer channel
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Announce observer presence to request streams
    this.announcePresence();
  }

  private createPeerConnection(forRole: 'tutor' | 'learner'): RTCPeerConnection {
    const config = getWebRTCConfig(false);
    const pc = new RTCPeerConnection(config);
    
    console.log(` Created receive-only connection for ${forRole} stream`);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(` Observer sending ICE candidate for ${forRole}`);
        this.sendSignal({
          type: 'observer-ice-candidate',
          candidate: event.candidate.toJSON(),
          targetRole: forRole
        });
      }
    };

    // Handle connection state
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log(` Observer ICE state for ${forRole}:`, state);
      
      if (state === 'connected' || state === 'completed') {
        this.callbacks.onConnectionStateChange('connected');
      } else if (state === 'disconnected') {
        this.callbacks.onConnectionStateChange('disconnected');
      } else if (state === 'failed') {
        this.callbacks.onConnectionStateChange('failed');
      }
    };

    // Handle remote tracks - THE KEY PART
    // Use a stable stream reference to prevent video twitching
    pc.ontrack = (event) => {
      console.log(` Observer received ${forRole} track:`, event.track.kind);
      
      let stream: MediaStream;
      if (event.streams && event.streams[0]) {
        stream = event.streams[0];
      } else {
        stream = new MediaStream([event.track]);
      }
      
      // Only call callback if this is a new stream (prevents twitching from multiple track events)
      if (forRole === 'tutor') {
        if (this.tutorStreamId !== stream.id) {
          this.tutorStreamId = stream.id;
          console.log(` Calling onTutorStream callback (new stream: ${stream.id})`);
          this.callbacks.onTutorStream(stream);
        } else {
          console.log(` Skipping duplicate tutor stream callback (same stream: ${stream.id})`);
        }
      } else {
        if (this.learnerStreamId !== stream.id) {
          this.learnerStreamId = stream.id;
          console.log(` Calling onLearnerStream callback (new stream: ${stream.id})`);
          this.callbacks.onLearnerStream(stream);
        } else {
          console.log(` Skipping duplicate learner stream callback (same stream: ${stream.id})`);
        }
      }
    };

    return pc;
  }

  private async subscribeToSignaling() {
    const observerChannelName = `observer-${this.sessionId}`;
    console.log(" Observer subscribing to channel:", observerChannelName);
    
    this.channel = supabase.channel(observerChannelName, {
      config: { broadcast: { self: false } }
    });

    this.channel
      .on('broadcast', { event: 'observer-signal' }, async ({ payload }: any) => {
        if (payload.targetObserverId !== this.oderId) return;
        console.log(" Observer received signal:", payload.type, "from:", payload.role);
        await this.handleSignal(payload);
      })
      .subscribe((status: string) => {
        console.log(" Observer channel status:", status);
        if (status === 'SUBSCRIBED') {
          this.isChannelReady = true;
          this.callbacks.onConnectionStateChange('connecting');
        }
      });
  }

  private async announcePresence() {
    if (!this.isChannelReady) {
      setTimeout(() => this.announcePresence(), 500);
      return;
    }
    
    const sendPresence = async () => {
      if (!this.channel || !this.isChannelReady) return;
      try {
        await this.channel.send({
          type: 'broadcast',
          event: 'observer-presence',
          payload: { oderId: this.oderId, role: 'observer', timestamp: Date.now() }
        });
        console.log(" Presence announced");
      } catch (e) {
        console.error(" Error sending presence:", e);
      }
    };
    
    // Send immediately then every second for 15 seconds (increased from 10)
    await sendPresence();
    for (let i = 1; i <= 15; i++) {
      setTimeout(async () => {
        if (!this.hasTutorRemoteDescription || !this.hasLearnerRemoteDescription) {
          console.log(` Rapid presence ${i}/15`);
          await sendPresence();
        }
      }, i * 1000);
    }
    
    // Then slower announcements for longer (30 announcements over 90 seconds)
    setTimeout(() => {
      this.presenceInterval = setInterval(async () => {
        this.presenceAnnouncementCount++;
        if (this.presenceAnnouncementCount > 30 || 
            (this.hasTutorRemoteDescription && this.hasLearnerRemoteDescription)) {
          if (this.presenceInterval) clearInterval(this.presenceInterval);
          return;
        }
        console.log(` Slow presence ${this.presenceAnnouncementCount}`);
        await sendPresence();
      }, 3000);
    }, 17000); // Start after rapid phase ends
  }

  private async sendSignal(signal: any) {
    if (!this.channel || !this.isChannelReady) return;
    await this.channel.send({
      type: 'broadcast',
      event: 'observer-signal',
      payload: { ...signal, oderId: this.oderId, role: 'observer', timestamp: Date.now() }
    });
  }

  private async handleSignal(payload: any) {
    try {
      if (payload.type === 'observer-offer') {
        await this.handleOffer(payload);
      } else if (payload.type === 'observer-ice-candidate') {
        await this.handleIceCandidate(payload);
      }
    } catch (error) {
      console.error(" Error handling signal:", error);
      this.callbacks.onError("Observer signaling error: " + (error as Error).message);
    }
  }

  private async handleOffer(payload: any) {
    const fromRole = payload.role as 'tutor' | 'learner';
    console.log(` Handling offer from ${fromRole}`);
    
    let pc: RTCPeerConnection;
    if (fromRole === 'tutor') {
      if (!this.tutorConnection) this.tutorConnection = this.createPeerConnection('tutor');
      pc = this.tutorConnection;
    } else {
      if (!this.learnerConnection) this.learnerConnection = this.createPeerConnection('learner');
      pc = this.learnerConnection;
    }
    
    await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    
    if (fromRole === 'tutor') {
      this.hasTutorRemoteDescription = true;
      await this.processIceCandidateQueue('tutor');
    } else {
      this.hasLearnerRemoteDescription = true;
      await this.processIceCandidateQueue('learner');
    }
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    console.log(` Sending answer to ${fromRole}`);
    await this.channel.send({
      type: 'broadcast',
      event: 'observer-signal',
      payload: {
        type: 'observer-answer',
        sdp: pc.localDescription,
        oderId: this.oderId,
        role: 'observer',
        targetRole: fromRole,
        timestamp: Date.now()
      }
    });
  }

  private async handleIceCandidate(payload: any) {
    const fromRole = payload.role as 'tutor' | 'learner';
    const candidate = new RTCIceCandidate(payload.candidate);
    
    if (fromRole === 'tutor') {
      if (this.hasTutorRemoteDescription && this.tutorConnection) {
        await this.tutorConnection.addIceCandidate(candidate);
      } else {
        this.tutorIceCandidatesQueue.push(payload.candidate);
      }
    } else {
      if (this.hasLearnerRemoteDescription && this.learnerConnection) {
        await this.learnerConnection.addIceCandidate(candidate);
      } else {
        this.learnerIceCandidatesQueue.push(payload.candidate);
      }
    }
  }

  private async processIceCandidateQueue(forRole: 'tutor' | 'learner') {
    const queue = forRole === 'tutor' ? this.tutorIceCandidatesQueue : this.learnerIceCandidatesQueue;
    const pc = forRole === 'tutor' ? this.tutorConnection : this.learnerConnection;
    
    for (const candidate of queue) {
      try {
        await pc?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error adding queued ICE candidate:", error);
      }
    }
    
    if (forRole === 'tutor') {
      this.tutorIceCandidatesQueue = [];
    } else {
      this.learnerIceCandidatesQueue = [];
    }
  }

  destroy() {
    console.log(" Destroying Observer WebRTC");
    if (this.presenceInterval) clearInterval(this.presenceInterval);
    if (this.channel) this.channel.unsubscribe();
    if (this.tutorConnection) this.tutorConnection.close();
    if (this.learnerConnection) this.learnerConnection.close();
    this.tutorConnection = null;
    this.learnerConnection = null;
    this.channel = null;
  }
}
