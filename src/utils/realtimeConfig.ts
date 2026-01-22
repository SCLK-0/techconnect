/**
 * Optimized Supabase Realtime configuration to reduce connection issues
 */

export const REALTIME_CONFIG = {
  // Channel configuration for better performance
  channel: {
    config: {
      broadcast: { 
        self: false,
        ack: false // Disable acknowledgments for better performance
      },
      presence: { 
        key: 'user_id' 
      },
    },
  },
  
  // Connection retry configuration
  retry: {
    maxAttempts: 5,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
  },
  
  // Heartbeat configuration
  heartbeat: {
    interval: 30000, // 30 seconds
    timeout: 10000,  // 10 seconds
  },
  
  // Message throttling
  throttle: {
    cursor: 100,      // 100ms for cursor events
    drawing: 50,      // 50ms for drawing events
    broadcast: 16,    // ~60fps for general broadcasts
  },
};

/**
 * Create a channel with optimized configuration
 */
export function createOptimizedChannel(
  supabase: any,
  channelName: string,
  options?: {
    enablePresence?: boolean;
    enableBroadcast?: boolean;
  }
) {
  const config = {
    broadcast: options?.enableBroadcast !== false ? { 
      self: false,
      ack: false // Disable acknowledgments for better performance
    } : undefined,
    presence: options?.enablePresence !== false ? { 
      key: 'user_id' 
    } : undefined,
  };

  return supabase.channel(channelName, { 
    config,
    // Add these options to improve connection stability
    timeout: 10000,
    heartbeatIntervalMs: 30000,
  });
}

/**
 * Retry mechanism for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxAttempts: number = REALTIME_CONFIG.retry.maxAttempts
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      const delay = Math.min(
        REALTIME_CONFIG.retry.initialDelay * Math.pow(REALTIME_CONFIG.retry.backoffFactor, attempt - 1),
        REALTIME_CONFIG.retry.maxDelay
      );
      
      console.warn(`Operation failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Safely send a broadcast message with proper error handling
 */
export async function safeBroadcast(
  channel: any,
  event: string,
  payload: any,
  options?: { timeout?: number }
): Promise<boolean> {
  if (!channel) {
    console.warn("Cannot broadcast: channel is null");
    return false;
  }

  try {
    const result = await Promise.race([
      channel.send({
        type: 'broadcast',
        event,
        payload,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Broadcast timeout')), options?.timeout || 5000)
      )
    ]);

    if (result !== 'ok') {
      console.warn(`Broadcast ${event} returned:`, result);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Broadcast ${event} failed:`, error);
    return false;
  }
}
export class ConnectionHealthMonitor {
  private isHealthy: boolean = true;
  private lastHeartbeat: number = Date.now();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private onHealthChange?: (isHealthy: boolean) => void;
  
  constructor(onHealthChange?: (isHealthy: boolean) => void) {
    this.onHealthChange = onHealthChange;
    this.startHeartbeat();
  }
  
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastHeartbeat = now - this.lastHeartbeat;
      
      const wasHealthy = this.isHealthy;
      this.isHealthy = timeSinceLastHeartbeat < REALTIME_CONFIG.heartbeat.timeout;
      
      if (wasHealthy !== this.isHealthy && this.onHealthChange) {
        this.onHealthChange(this.isHealthy);
      }
    }, REALTIME_CONFIG.heartbeat.interval);
  }
  
  recordHeartbeat(): void {
    this.lastHeartbeat = Date.now();
    
    if (!this.isHealthy) {
      this.isHealthy = true;
      if (this.onHealthChange) {
        this.onHealthChange(true);
      }
    }
  }
  
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  getHealth(): boolean {
    return this.isHealthy;
  }
}