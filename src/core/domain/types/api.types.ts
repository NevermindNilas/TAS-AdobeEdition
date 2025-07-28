export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface BackendRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ExtendScriptRequest {
  function: string;
  args: any[];
  timeout?: number;
  async?: boolean;
}

export interface ExtendScriptResponse<T = any> {
  result?: T;
  error?: ExtendScriptError;
  executionTime: number;
}

export interface ExtendScriptError {
  message: string;
  fileName?: string;
  line?: number;
  stack?: string;
}

export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  id?: string;
  timestamp: number;
}

export interface SSEMessage {
  event: string;
  data: any;
  id?: string;
}

export interface FileUploadRequest {
  file: File;
  destination: string;
  overwrite?: boolean;
  onProgress?: (progress: number) => void;
}

export interface FileDownloadRequest {
  url: string;
  destination: string;
  onProgress?: (progress: number) => void;
  headers?: Record<string, string>;
}

export interface ProcessExecutionRequest {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
}

export interface ProcessExecutionResponse {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  killed: boolean;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: ServiceHealth[];
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'unknown';
  lastCheck: Date;
  message?: string;
  metrics?: Record<string, any>;
}

export interface AuthRequest {
  type: 'api_key' | 'token' | 'oauth';
  credentials: Record<string, string>;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
  refreshToken?: string;
  tokenType: string;
  scope?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  constraints?: Record<string, any>;
}

export interface BatchRequest<T = any> {
  operations: BatchOperation<T>[];
  stopOnError?: boolean;
}

export interface BatchOperation<T = any> {
  id: string;
  method: string;
  params?: T;
}

export interface BatchResponse<T = any> {
  results: BatchResult<T>[];
  hasErrors: boolean;
}

export interface BatchResult<T = any> {
  id: string;
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface CacheConfig {
  ttl: number;
  key: string;
  invalidateOn?: string[];
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}