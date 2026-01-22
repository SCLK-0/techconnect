// Enhanced WebRTC Configuration for Maximum Stability
// Addresses common connection issues and provides fallback mechanisms

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  sdpSemantics: 'unified-plan';
  iceTransportPolicy: 'all' | 'relay';
  iceCandidatePoolSize: number;
  bundlePolicy: 'balanced' | 'max-bundle' | 'max-compat';
  rtcpMuxPolicy: 'require';
}

// Multiple TURN server providers for maximum reliability
const TURN_SERVERS = [
  // Primary TURN servers (OpenRelay - free but reliable)
  {
    urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443"],
    username: "openrelayproject",
    credential: "openrelayproject"
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject"
  },
  // Backup TURN servers (Twilio STUN/TURN)
  {
    urls: "turn:global.turn.twilio.com:3478?transport=udp",
    username: "your-twilio-username", // Replace with actual credentials if available
    credential: "your-twilio-credential"
  },
  // Additional free TURN servers
  {
    urls: ["turn:numb.viagenie.ca:3478", "turn:numb.viagenie.ca:3479"],
    username: "webrtc@live.com",
    credential: "muazkh"
  },
  {
    urls: "turn:turn.bistri.com:80",
    username: "homeo",
    credential: "homeo"
  }
];

const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
  { urls: "stun:stun.services.mozilla.com:3478" },
  { urls: "stun:stun.ekiga.net:3478" }
];

// Enhanced WebRTC configuration with multiple fallback options
export const getWebRTCConfig = (forceRelay: boolean = false): WebRTCConfig => {
  return {
    iceServers: [
      ...STUN_SERVERS,
      ...TURN_SERVERS
    ],
    sdpSemantics: 'unified-plan',
    iceTransportPolicy: forceRelay ? 'relay' : 'all', // Force TURN if needed
    iceCandidatePoolSize: 30, // Increased for better connectivity
    bundlePolicy: 'max-bundle', // Bundle all media for efficiency
    rtcpMuxPolicy: 'require' // Multiplex RTP and RTCP
  };
};

// PeerJS configuration with enhanced stability
// Try multiple servers as fallback - ordered by reliability
const PEERJS_SERVERS = [
  // Primary: PeerJS public cloud server
  { host: '0.peerjs.com', port: 443, path: '/', secure: true },
  // Fallback 1: Alternative PeerJS endpoint
  { host: 'peerjs.92k.de', port: 443, path: '/', secure: true },
  // Fallback 2: Another public PeerJS server
  { host: 'peer.walkerservers.com', port: 443, path: '/peerjs', secure: true },
];

export const getPeerJSConfig = (forceRelay: boolean = false, serverIndex: number = 0) => {
  const server = PEERJS_SERVERS[serverIndex % PEERJS_SERVERS.length];
  console.log(` Using PeerJS server: ${server.host} (index: ${serverIndex})`);
  
  return {
    host: server.host,
    port: server.port,
    path: server.path,
    secure: server.secure,
    pingInterval: 3000, // More frequent pings for faster disconnect detection
    config: getWebRTCConfig(forceRelay),
    debug: import.meta.env.DEV ? 2 : 0,
  };
};

export const getPeerJSServerCount = () => PEERJS_SERVERS.length;

// Connection quality monitoring
export class ConnectionMonitor {
  private peer: any;
  private call: any;
  private onQualityChange: (quality: 'good' | 'poor' | 'disconnected') => void;
  private monitorInterval: NodeJS.Timeout | null = null;
  private lastBytesReceived = 0;
  private lastBytesSent = 0;
  private consecutivePoorQuality = 0;

  constructor(peer: any, call: any, onQualityChange: (quality: 'good' | 'poor' | 'disconnected') => void) {
    this.peer = peer;
    this.call = call;
    this.onQualityChange = onQualityChange;
    this.startMonitoring();
  }

  private startMonitoring() {
    this.monitorInterval = setInterval(async () => {
      if (!this.call?.peerConnection) return;

      try {
        const stats = await this.call.peerConnection.getStats();
        let quality: 'good' | 'poor' | 'disconnected' = 'good';
        let bytesReceived = 0;
        let bytesSent = 0;
        let packetsLost = 0;
        let packetsReceived = 0;

        stats.forEach((report: any) => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            bytesReceived += report.bytesReceived || 0;
            packetsLost += report.packetsLost || 0;
            packetsReceived += report.packetsReceived || 0;
          }
          if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
            bytesSent += report.bytesSent || 0;
          }
        });

        // Check for data flow
        const receivedDelta = bytesReceived - this.lastBytesReceived;
        const sentDelta = bytesSent - this.lastBytesSent;
        
        // Calculate packet loss rate
        const lossRate = packetsReceived > 0 ? packetsLost / (packetsReceived + packetsLost) : 0;

        if (receivedDelta === 0 && sentDelta === 0) {
          quality = 'disconnected';
        } else if (lossRate > 0.05 || receivedDelta < 1000) { // 5% loss or very low bitrate
          quality = 'poor';
        }

        // Track consecutive poor quality
        if (quality === 'poor') {
          this.consecutivePoorQuality++;
        } else {
          this.consecutivePoorQuality = 0;
        }

        // Trigger callback if quality changed or consistently poor
        if (quality === 'disconnected' || this.consecutivePoorQuality >= 3) {
          this.onQualityChange(quality === 'disconnected' ? 'disconnected' : 'poor');
        } else if (quality === 'good' && this.consecutivePoorQuality === 0) {
          this.onQualityChange('good');
        }

        this.lastBytesReceived = bytesReceived;
        this.lastBytesSent = bytesSent;

      } catch (error) {
        console.error('Error monitoring connection quality:', error);
      }
    }, 2000); // Check every 2 seconds
  }

  public stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }
}

// Enhanced connection establishment with retry logic and server fallback
export class EnhancedPeerConnection {
  private peer: any;
  private connectionAttempts = 0;
  private maxAttempts = 10;
  private forceRelay = false;
  private retryDelay = 2000;
  private currentServerIndex = 0;

  constructor(userId: string, onConnectionEstablished: (peer: any) => void, onConnectionFailed: () => void) {
    this.establishConnection(userId, onConnectionEstablished, onConnectionFailed);
  }

  private async establishConnection(
    userId: string, 
    onConnectionEstablished: (peer: any) => void, 
    onConnectionFailed: () => void
  ) {
    this.connectionAttempts++;
    
    // Cycle through servers every 3 attempts
    if (this.connectionAttempts > 1 && this.connectionAttempts % 3 === 1) {
      this.currentServerIndex = (this.currentServerIndex + 1) % getPeerJSServerCount();
      console.log(` Switching to PeerJS server index: ${this.currentServerIndex}`);
    }
    
    // Force TURN servers after 4 failed attempts
    if (this.connectionAttempts > 4) {
      this.forceRelay = true;
      console.log(` Attempt ${this.connectionAttempts}: Forcing TURN servers for better connectivity`);
    }

    // Exponential backoff for retries
    if (this.connectionAttempts > 1) {
      const delay = Math.min(this.retryDelay * Math.pow(1.3, this.connectionAttempts - 1), 8000);
      console.log(` Waiting ${Math.round(delay)}ms before retry attempt ${this.connectionAttempts}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const uniquePeerId = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const config = getPeerJSConfig(this.forceRelay, this.currentServerIndex);

    try {
      // Destroy previous peer if exists
      if (this.peer && !this.peer.destroyed) {
        this.peer.destroy();
      }

      this.peer = new (await import('peerjs')).default(uniquePeerId, config);

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.peer && !this.peer.open) {
          console.log(` Connection timeout on attempt ${this.connectionAttempts}`);
          this.peer.destroy();
          
          if (this.connectionAttempts < this.maxAttempts) {
            this.establishConnection(userId, onConnectionEstablished, onConnectionFailed);
          } else {
            onConnectionFailed();
          }
        }
      }, 10000); // 10 second timeout per attempt

      this.peer.on('open', (id: string) => {
        clearTimeout(connectionTimeout);
        console.log(` Peer connection established (attempt ${this.connectionAttempts}, server ${this.currentServerIndex}):`, id);
        onConnectionEstablished(this.peer);
      });

      this.peer.on('error', (error: any) => {
        clearTimeout(connectionTimeout);
        console.error(`❌ Peer connection error (attempt ${this.connectionAttempts}):`, error.type, error.message);
        
        // Don't retry on certain fatal errors
        if (error.type === 'browser-incompatible' || error.type === 'ssl-unavailable') {
          console.error('❌ Fatal error - cannot retry');
          onConnectionFailed();
          return;
        }
        
        if (this.connectionAttempts < this.maxAttempts) {
          console.log(` Retrying connection...`);
          this.establishConnection(userId, onConnectionEstablished, onConnectionFailed);
        } else {
          console.error('❌ Max connection attempts reached');
          onConnectionFailed();
        }
      });

      this.peer.on('disconnected', () => {
        console.log(' Peer disconnected, attempting reconnection...');
        if (!this.peer.destroyed) {
          setTimeout(() => {
            if (!this.peer.destroyed && !this.peer.open) {
              this.peer.reconnect();
            }
          }, 1000);
        }
      });

    } catch (error) {
      console.error('Error creating peer:', error);
      if (this.connectionAttempts < this.maxAttempts) {
        setTimeout(() => {
          this.establishConnection(userId, onConnectionEstablished, onConnectionFailed);
        }, 2000);
      } else {
        onConnectionFailed();
      }
    }
  }

  public getPeer() {
    return this.peer;
  }

  public destroy() {
    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy();
    }
  }
}

// Stream quality optimization
export const optimizeStreamForConnection = (stream: MediaStream, quality: 'high' | 'medium' | 'low' = 'medium') => {
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) return stream;

  const constraints = {
    high: { width: 1280, height: 720, frameRate: 30, bitrate: 2000000 },
    medium: { width: 854, height: 480, frameRate: 24, bitrate: 1000000 },
    low: { width: 640, height: 360, frameRate: 15, bitrate: 500000 }
  };

  const config = constraints[quality];
  
  videoTrack.applyConstraints({
    width: { ideal: config.width },
    height: { ideal: config.height },
    frameRate: { ideal: config.frameRate }
  }).catch(error => {
    console.warn('Could not apply video constraints:', error);
  });

  return stream;
};

export default {
  getWebRTCConfig,
  getPeerJSConfig,
  ConnectionMonitor,
  EnhancedPeerConnection,
  optimizeStreamForConnection
};