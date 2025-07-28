import { AuthenticationService } from '../security/AuthenticationService';
import { ValidationService } from '../security/ValidationService';

export interface SocketConfig {
  baseUrl: string;
  secure?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
}

export interface ProgressData {
  fps: number;
  frame: number;
  totalFrames: number;
  eta: number;
  tasETA: number;
  frameType?: string;
  status?: string;
}

export class SecureSocketManager {
  private static instance: SecureSocketManager | null = null;
  private eventSource: EventSource | null = null;
  private authService: AuthenticationService;
  private config: Required<SocketConfig>;
  private reconnectAttempts = 0;
  private destroyed = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  private constructor(config: SocketConfig) {
    this.authService = AuthenticationService.getInstance();
    this.config = {
      secure: process.env.NODE_ENV === 'production',
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      ...config
    };
  }

  public static getInstance(config?: SocketConfig): SecureSocketManager {
    if (!SecureSocketManager.instance && config) {
      SecureSocketManager.instance = new SecureSocketManager(config);
    }
    return SecureSocketManager.instance!;
  }

  /**
   * Initializes the secure SSE connection
   */
  public async init(): Promise<void> {
    if (this.eventSource || this.destroyed) return;

    try {
      // Ensure we have authentication
      const authToken = await this.ensureAuthentication();
      
      // Build secure URL
      const url = this.buildSecureUrl();
      
      // Create EventSource with authentication
      this.eventSource = new EventSource(url);
      
      this.setupEventHandlers();
      this.startHeartbeat();
      
    } catch (error) {
      console.error('Failed to initialize secure socket:', error);
      this.handleReconnection();
    }
  }

  /**
   * Ensures we have valid authentication
   */
  private async ensureAuthentication() {
    let authToken = this.authService.getAuthToken();
    
    if (!authToken) {
      authToken = await this.authService.createAuthToken();
    }
    
    return authToken;
  }

  /**
   * Builds secure URL with authentication
   */
  private buildSecureUrl(): string {
    const protocol = this.config.secure ? 'https:' : 'http:';
    const baseUrl = `${protocol}//${this.config.baseUrl}/progress/stream`;
    
    try {
      return this.authService.createAuthenticatedWebSocketUrl(baseUrl);
    } catch (error) {
      console.error('Failed to create authenticated URL:', error);
      throw error;
    }
  }

  /**
   * Sets up event handlers for the EventSource
   */
  private setupEventHandlers(): void {
    if (!this.eventSource) return;

    this.eventSource.onopen = () => {
      console.log('Secure SSE connection established');
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = ValidationService.parseJsonSafely<ProgressData>(event.data);
        this.handleProgressUpdate(data);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.cleanup();
      this.handleReconnection();
    };

    // Handle custom events
    this.eventSource.addEventListener('auth_required', () => {
      this.handleAuthenticationRequired();
    });

    this.eventSource.addEventListener('heartbeat', () => {
      this.resetHeartbeat();
    });
  }

  /**
   * Handles progress updates
   */
  private handleProgressUpdate(data: ProgressData): void {
    // Validate data
    if (!this.isValidProgressData(data)) {
      console.warn('Invalid progress data received');
      return;
    }

    // Emit to listeners
    this.emit('progress', data);
  }

  /**
   * Validates progress data
   */
  private isValidProgressData(data: any): data is ProgressData {
    return (
      typeof data === 'object' &&
      typeof data.fps === 'number' &&
      typeof data.frame === 'number' &&
      typeof data.totalFrames === 'number' &&
      typeof data.eta === 'number'
    );
  }

  /**
   * Handles authentication required event
   */
  private async handleAuthenticationRequired(): Promise<void> {
    try {
      await this.authService.createAuthToken();
      this.reconnect();
    } catch (error) {
      console.error('Failed to re-authenticate:', error);
    }
  }

  /**
   * Handles reconnection with exponential backoff
   */
  private handleReconnection(): void {
    if (this.destroyed || this.reconnectAttempts >= this.config.reconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('connection_failed');
      return;
    }

    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.destroyed) {
        this.init();
      }
    }, delay);
  }

  /**
   * Starts heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.eventSource?.readyState === EventSource.OPEN) {
        // Send heartbeat to server if needed
        this.sendHeartbeat();
      } else {
        this.handleReconnection();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Resets heartbeat timer
   */
  private resetHeartbeat(): void {
    this.startHeartbeat();
  }

  /**
   * Stops heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Sends heartbeat to server
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      const headers = this.authService.getAuthHeaders();
      await fetch(`${this.config.secure ? 'https' : 'http'}://${this.config.baseUrl}/heartbeat`, {
        method: 'POST',
        headers
      });
    } catch (error) {
      console.warn('Heartbeat failed:', error);
    }
  }

  /**
   * Adds event listener
   */
  public on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Removes event listener
   */
  public off(event: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emits event to listeners
   */
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Sends data to server securely
   */
  public async send(endpoint: string, data: any): Promise<Response> {
    try {
      const headers = this.authService.getAuthHeaders();
      const url = `${this.config.secure ? 'https' : 'http'}://${this.config.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.status === 401) {
        await this.handleAuthenticationRequired();
        // Retry once after re-authentication
        return this.send(endpoint, data);
      }

      return response;
    } catch (error) {
      console.error('Failed to send data:', error);
      throw error;
    }
  }

  /**
   * Reconnects the socket
   */
  public reconnect(): void {
    this.cleanup();
    this.reconnectAttempts = 0;
    this.init();
  }

  /**
   * Cleans up resources
   */
  private cleanup(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.stopHeartbeat();
  }

  /**
   * Destroys the socket manager
   */
  public destroy(): void {
    this.destroyed = true;
    this.cleanup();
    this.listeners.clear();
    SecureSocketManager.instance = null;
  }

  /**
   * Gets connection status
   */
  public isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}