// Enhanced Connection Manager for Video Sessions
// Handles WebRTC connection stability, reconnection, and quality monitoring

import { toast } from "sonner";
import { ConnectionMonitor, EnhancedPeerConnection, optimizeStreamForConnection } from "./webrtcConfig";

export interface ConnectionState {
  isConnected: boolean;
  quality: 'good' | 'poor' | 'disconnected';
  reconnectAttempts: number;
  lastConnectedAt: Date | null;
}

export interface StreamState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  tutorStream: MediaStream | null;
  learnerStream: MediaStream | null;
}

export class VideoConnectionManager {
  private peer: any = null;
  private call: any = null;
  private connectionMonitor: ConnectionMonitor | null = null;
  private enhancedConnection: EnhancedPeerConnection | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private qualityCheckTimer: NodeJS.Timeout | null = null;
  
  // State management
  private connectionState: ConnectionState = {
    isConnected: false,
    quality: 'disconnected',
    reconnectAttempts: 0,
    lastConnectedAt: null
  };

  private streamState: StreamState = {
    localStream: null,
    remoteStream: null,
    tutorStream: null,
    learnerStream: null
  };

  // Callbacks
  private onConnectionChange: (state: ConnectionState) => void;
  private onStreamChange: (streams: StreamState) => void;
  private onError: (error: string) => void;

  constructor(
    onConnectionChange: (state: ConnectionState) => void,
    onStreamChange: (streams: StreamState) => void,
    onError: (error: string) => void
  ) {
    this.onConnectionChange = onConnectionChange;
    this.onStreamChange = onStreamChange;
    this.onError = onError;
  }

  // Initialize connection with enhanced stability
  public async initializeConnection(
    userId: string, 
    localStream: MediaStream,
    role: 'tutor' | 'learner' | 'observer' = 'learner'
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(` Initializing enhanced connection for ${role}:`, userId);
      
      // Optimize local stream quality
      this.streamState.localStream = optimizeStreamForConnection(localStream, 'medium');
      this.notifyStreamChange();

      // Create enhanced peer connection
      this.enhancedConnection = new EnhancedPeerConnection(
        userId,
        (peer) => {
          this.peer = peer;
          this.setupPeerEventHandlers();
          resolve(peer.id);
        },
        () => {
          this.onError('Failed to establish peer connection after multiple attempts');
          reject(new Error('Connection failed'));
        }
      );
    });
  }

  // Setup comprehensive peer event handlers
  private setupPeerEventHandlers() {
    if (!this.peer) return;

    // Handle incoming calls
    this.peer.on('call', (call: any) => {
      console.log(' Incoming call from:', call.peer);
      
      // Answer with local stream
      call.answer(this.streamState.localStream);
      this.handleCall(call);
    });

    // Handle peer errors with smart recovery
    this.peer.on('error', (error: any) => {
      console.error('❌ Peer error:', error);
      this.handlePeerError(error);
    });

    // Handle disconnection with immediate recovery
    this.peer.on('disconnected', () => {
      console.log(' Peer disconnected from signaling server');
      this.updateConnectionState({ isConnected: false, quality: 'disconnected' });
      
      // Attempt immediate reconnection
      setTimeout(() => {
        if (this.peer && !this.peer.destroyed) {
          console.log(' Attempting peer reconnection...');
          this.peer.reconnect();
        }
      }, 1000);
    });

    // Handle successful reconnection
    this.peer.on('open', (id: string) => {
      console.log(' Peer reconnected with ID:', id);
      this.connectionState.reconnectAttempts = 0;
      this.updateConnectionState({ quality: 'good' });
    });
  }

  // Make outgoing call with enhanced error handling
  public async makeCall(remotePeerId: string): Promise<void> {
    if (!this.peer || !this.streamState.localStream) {
      throw new Error('Peer or local stream not available');
    }

    console.log(' Making call to:', remotePeerId);
    
    try {
      const call = this.peer.call(remotePeerId, this.streamState.localStream, {
        metadata: {
          timestamp: Date.now(),
          quality: 'medium',
          retry: this.connectionState.reconnectAttempts > 0
        }
      });

      this.handleCall(call);
    } catch (error) {
      console.error('Error making call:', error);
      this.onError('Failed to initiate video call');
    }
  }

  // Enhanced call handling with quality monitoring
  private handleCall(call: any) {
    this.call = call;

    // Set up connection quality monitoring
    call.on('stream', (remoteStream: MediaStream) => {
      console.log(' Remote stream received:', remoteStream.getTracks().length, 'tracks');
      
      // Validate stream
      if (!remoteStream.getTracks().length) {
        console.error('❌ Received empty remote stream');
        this.onError('Received invalid video stream');
        return;
      }

      this.streamState.remoteStream = remoteStream;
      this.notifyStreamChange();
      
      this.updateConnectionState({ 
        isConnected: true, 
        quality: 'good',
        lastConnectedAt: new Date()
      });

      // Start connection quality monitoring
      this.startQualityMonitoring();
      
      // Clear any existing reconnect timers
      this.clearReconnectTimer();
    });

    // Handle call errors with smart retry
    call.on('error', (error: any) => {
      console.error(' Call error:', error);
      this.handleCallError(error);
    });

    // Handle call close with reconnection logic
    call.on('close', () => {
      console.log(' Call closed');
      this.handleCallClose();
    });

    // Monitor ICE connection state for faster disconnect detection
    if (call.peerConnection) {
      call.peerConnection.oniceconnectionstatechange = () => {
        const state = call.peerConnection.iceConnectionState;
        console.log(' ICE connection state:', state);
        
        switch (state) {
          case 'connected':
          case 'completed':
            this.updateConnectionState({ isConnected: true, quality: 'good' });
            break;
          case 'disconnected':
            this.updateConnectionState({ quality: 'poor' });
            this.scheduleReconnect(2000); // Quick reconnect for temporary issues
            break;
          case 'failed':
          case 'closed':
            this.updateConnectionState({ isConnected: false, quality: 'disconnected' });
            this.scheduleReconnect(5000); // Longer delay for failed connections
            break;
        }
      };

      // Monitor connection state changes
      call.peerConnection.onconnectionstatechange = () => {
        const state = call.peerConnection.connectionState;
        console.log(' Connection state:', state);
        
        if (state === 'failed' || state === 'closed') {
          this.handleCallClose();
        }
      };
    }
  }

  // Smart error handling with appropriate responses
  private handlePeerError(error: any) {
    switch (error.type) {
      case 'peer-unavailable':
        console.log(' Peer unavailable, scheduling retry...');
        this.scheduleReconnect(3000);
        break;
      
      case 'network':
        console.log(' Network error, attempting recovery...');
        this.updateConnectionState({ quality: 'poor' });
        this.scheduleReconnect(5000);
        break;
      
      case 'server-error':
        console.log(' Server error, trying alternative connection...');
        this.scheduleReconnect(2000);
        break;
      
      case 'browser-incompatible':
        this.onError('Your browser does not support video calls. Please use Chrome, Firefox, or Edge.');
        break;
      
      case 'ssl-unavailable':
        this.onError('Secure connection required. Please access the site using HTTPS.');
        break;
      
      default:
        console.log(' Unknown peer error:', error.type);
        this.scheduleReconnect(3000);
    }
  }

  // Handle call-specific errors
  private handleCallError(error: any) {
    console.error('Call error details:', error);
    this.updateConnectionState({ isConnected: false, quality: 'disconnected' });
    
    // Attempt to recover the call
    this.scheduleReconnect(2000);
  }

  // Handle call close with reconnection
  private handleCallClose() {
    console.log(' Call connection closed');
    
    this.streamState.remoteStream = null;
    this.notifyStreamChange();
    
    this.updateConnectionState({ isConnected: false, quality: 'disconnected' });
    
    // Stop quality monitoring
    this.stopQualityMonitoring();
    
    // Schedule reconnection
    this.scheduleReconnect(3000);
  }

  // Smart reconnection scheduling
  private scheduleReconnect(delay: number) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Exponential backoff with jitter
    const jitter = Math.random() * 1000;
    const backoffDelay = Math.min(delay * Math.pow(1.5, this.connectionState.reconnectAttempts), 30000);
    const finalDelay = backoffDelay + jitter;

    console.log(` Scheduling reconnect in ${Math.round(finalDelay)}ms (attempt ${this.connectionState.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.attemptReconnection();
    }, finalDelay);
  }

  // Attempt reconnection with enhanced logic
  private async attemptReconnection() {
    if (this.connectionState.reconnectAttempts >= 10) {
      console.log('❌ Max reconnection attempts reached');
      this.onError('Unable to maintain video connection. Please refresh the page.');
      return;
    }

    this.connectionState.reconnectAttempts++;
    console.log(` Attempting reconnection ${this.connectionState.reconnectAttempts}/10`);

    try {
      // If peer is disconnected, try to reconnect to signaling server
      if (this.peer && this.peer.disconnected && !this.peer.destroyed) {
        this.peer.reconnect();
      }

      // Wait a moment for peer to reconnect
      await new Promise(resolve => setTimeout(resolve, 2000));

      // If we have a remote peer ID, try to re-establish the call
      // This would need to be provided by the calling code
      // For now, we'll emit an event that the calling code can handle
      this.onError('reconnect_needed');

    } catch (error) {
      console.error('Reconnection attempt failed:', error);
      this.scheduleReconnect(5000);
    }
  }

  // Start quality monitoring
  private startQualityMonitoring() {
    if (!this.call || this.connectionMonitor) return;

    this.connectionMonitor = new ConnectionMonitor(
      this.peer,
      this.call,
      (quality) => {
        console.log(' Connection quality:', quality);
        this.updateConnectionState({ quality });
        
        if (quality === 'disconnected') {
          this.handleCallClose();
        } else if (quality === 'poor') {
          // Reduce stream quality to improve connection
          this.optimizeStreamQuality('low');
        } else if (quality === 'good') {
          // Restore normal quality
          this.optimizeStreamQuality('medium');
        }
      }
    );
  }

  // Stop quality monitoring
  private stopQualityMonitoring() {
    if (this.connectionMonitor) {
      this.connectionMonitor.stop();
      this.connectionMonitor = null;
    }
  }

  // Optimize stream quality based on connection
  private optimizeStreamQuality(quality: 'high' | 'medium' | 'low') {
    if (!this.streamState.localStream) return;

    console.log(` Optimizing stream quality to: ${quality}`);
    this.streamState.localStream = optimizeStreamForConnection(this.streamState.localStream, quality);
    this.notifyStreamChange();
  }

  // Update connection state and notify
  private updateConnectionState(updates: Partial<ConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    this.onConnectionChange(this.connectionState);
  }

  // Notify about stream changes
  private notifyStreamChange() {
    this.onStreamChange(this.streamState);
  }

  // Clear reconnect timer
  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Get current connection state
  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  // Get current stream state
  public getStreamState(): StreamState {
    return { ...this.streamState };
  }

  // Clean shutdown
  public destroy() {
    console.log(' Destroying connection manager');
    
    this.clearReconnectTimer();
    this.stopQualityMonitoring();
    
    if (this.call) {
      this.call.close();
    }
    
    if (this.enhancedConnection) {
      this.enhancedConnection.destroy();
    }
    
    // Stop all media tracks
    Object.values(this.streamState).forEach(stream => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    });
  }
}

export default VideoConnectionManager;