import * as crypto from 'crypto';

export interface AuthToken {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

export interface AuthConfig {
  apiKey?: string;
  apiSecret?: string;
  tokenExpiry?: number; // in seconds
  enableRefreshToken?: boolean;
}

export class AuthenticationService {
  private static instance: AuthenticationService;
  private authToken: AuthToken | null = null;
  private config: AuthConfig;

  private constructor(config: AuthConfig = {}) {
    this.config = {
      tokenExpiry: 3600, // 1 hour default
      enableRefreshToken: true,
      ...config
    };
  }

  public static getInstance(config?: AuthConfig): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService(config);
    }
    return AuthenticationService.instance;
  }

  /**
   * Generates a secure random token
   */
  private generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Generates a signature for API requests
   */
  private generateSignature(data: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  /**
   * Creates an authentication token
   */
  public async createAuthToken(): Promise<AuthToken> {
    const token = this.generateToken();
    const expiresAt = Date.now() + (this.config.tokenExpiry! * 1000);
    
    const authToken: AuthToken = {
      token,
      expiresAt
    };

    if (this.config.enableRefreshToken) {
      authToken.refreshToken = this.generateToken(48);
    }

    this.authToken = authToken;
    
    // Store token securely (in production, use secure storage)
    await this.storeToken(authToken);
    
    return authToken;
  }

  /**
   * Validates an authentication token
   */
  public validateToken(token: string): boolean {
    if (!this.authToken || !token) {
      return false;
    }

    // Check if token matches
    if (this.authToken.token !== token) {
      return false;
    }

    // Check if token is expired
    if (Date.now() > this.authToken.expiresAt) {
      return false;
    }

    return true;
  }

  /**
   * Refreshes an authentication token
   */
  public async refreshToken(refreshToken: string): Promise<AuthToken | null> {
    if (!this.authToken || !this.authToken.refreshToken) {
      return null;
    }

    if (this.authToken.refreshToken !== refreshToken) {
      return null;
    }

    // Create new token
    return this.createAuthToken();
  }

  /**
   * Gets the current authentication token
   */
  public getAuthToken(): AuthToken | null {
    if (!this.authToken) {
      return null;
    }

    // Check if expired
    if (Date.now() > this.authToken.expiresAt) {
      this.authToken = null;
      return null;
    }

    return this.authToken;
  }

  /**
   * Creates headers for authenticated requests
   */
  public getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No valid authentication token');
    }

    const timestamp = Date.now().toString();
    const nonce = this.generateToken(16);
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token.token}`,
      'X-Timestamp': timestamp,
      'X-Nonce': nonce
    };

    // Add signature if API secret is configured
    if (this.config.apiSecret) {
      const signatureData = `${token.token}:${timestamp}:${nonce}`;
      headers['X-Signature'] = this.generateSignature(signatureData, this.config.apiSecret);
    }

    return headers;
  }

  /**
   * Validates request signature
   */
  public validateRequestSignature(
    token: string,
    timestamp: string,
    nonce: string,
    signature: string,
    secret: string
  ): boolean {
    // Check timestamp is recent (within 5 minutes)
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Date.now();
    const timeDiff = Math.abs(currentTime - requestTime);
    
    if (timeDiff > 5 * 60 * 1000) {
      return false; // Request too old
    }

    // Recreate signature
    const signatureData = `${token}:${timestamp}:${nonce}`;
    const expectedSignature = this.generateSignature(signatureData, secret);
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Stores token securely (implement based on platform)
   */
  private async storeToken(token: AuthToken): Promise<void> {
    // In production, use secure storage like:
    // - Keychain (macOS)
    // - Credential Manager (Windows)
    // - Secret Service (Linux)
    
    // For now, store in memory only
    // TODO: Implement secure storage based on platform
  }

  /**
   * Clears authentication
   */
  public clearAuth(): void {
    this.authToken = null;
  }

  /**
   * Creates a secure WebSocket URL with authentication
   */
  public createAuthenticatedWebSocketUrl(baseUrl: string): string {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No valid authentication token');
    }

    const url = new URL(baseUrl);
    url.searchParams.append('auth', token.token);
    
    // Add timestamp for additional security
    const timestamp = Date.now().toString();
    url.searchParams.append('ts', timestamp);
    
    if (this.config.apiSecret) {
      const signature = this.generateSignature(
        `${token.token}:${timestamp}`,
        this.config.apiSecret
      );
      url.searchParams.append('sig', signature);
    }

    return url.toString();
  }

  /**
   * Validates WebSocket connection parameters
   */
  public validateWebSocketAuth(params: URLSearchParams): boolean {
    const token = params.get('auth');
    const timestamp = params.get('ts');
    const signature = params.get('sig');

    if (!token || !timestamp) {
      return false;
    }

    // Validate token
    if (!this.validateToken(token)) {
      return false;
    }

    // Check timestamp
    const requestTime = parseInt(timestamp, 10);
    const timeDiff = Math.abs(Date.now() - requestTime);
    if (timeDiff > 60000) { // 1 minute
      return false;
    }

    // Validate signature if present
    if (signature && this.config.apiSecret) {
      const expectedSig = this.generateSignature(
        `${token}:${timestamp}`,
        this.config.apiSecret
      );
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSig)
      );
    }

    return true;
  }
}