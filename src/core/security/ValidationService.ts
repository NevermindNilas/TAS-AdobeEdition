import * as path from 'path';
import * as os from 'os';
import { fs } from '../../js/lib/cep/node';

export class ValidationService {
  private static readonly DANGEROUS_PATTERNS = [
    /\.\./g,           // Path traversal
    /[;&|`$()<>]/g,    // Shell metacharacters
    /\0/g,             // Null bytes
    /[\x00-\x1F]/g,    // Control characters
  ];

  private static readonly ALLOWED_FILE_EXTENSIONS = [
    '.mp4', '.mov', '.avi', '.mkv', '.webm',  // Video
    '.jpg', '.jpeg', '.png', '.gif', '.bmp',  // Images
    '.aep', '.aepx',                          // After Effects
    '.prproj',                                // Premiere Pro
    '.txt', '.json', '.log'                   // Data files
  ];

  private static readonly MAX_PATH_LENGTH = 260; // Windows MAX_PATH

  /**
   * Validates and sanitizes a file path
   */
  public static validatePath(inputPath: string): string {
    if (!inputPath || typeof inputPath !== 'string') {
      throw new Error('Invalid path: must be a non-empty string');
    }

    // Remove null bytes
    let sanitized = inputPath.replace(/\0/g, '');

    // Normalize path
    sanitized = path.normalize(sanitized);

    // Check for path traversal
    if (sanitized.includes('..')) {
      throw new Error('Path traversal detected');
    }

    // Check path length
    if (sanitized.length > this.MAX_PATH_LENGTH) {
      throw new Error(`Path too long: ${sanitized.length} characters (max: ${this.MAX_PATH_LENGTH})`);
    }

    // Ensure path is absolute
    if (!path.isAbsolute(sanitized)) {
      throw new Error('Path must be absolute');
    }

    // Validate against allowed base paths
    const allowedPaths = [
      os.homedir(),
      os.tmpdir(),
      process.env.APPDATA || '',
      '/Users',
      'C:\\Users',
      process.env.LOCALAPPDATA || ''
    ].filter(Boolean);

    const isAllowed = allowedPaths.some(allowed => 
      sanitized.startsWith(allowed)
    );

    if (!isAllowed) {
      throw new Error('Path outside allowed directories');
    }

    return sanitized;
  }

  /**
   * Validates a filename
   */
  public static validateFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      throw new Error('Invalid filename: must be a non-empty string');
    }

    // Remove invalid characters
    const sanitized = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

    // Check for reserved names (Windows)
    const reserved = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
    if (reserved.test(sanitized)) {
      throw new Error(`Reserved filename: ${filename}`);
    }

    // Ensure it has an allowed extension
    const ext = path.extname(sanitized).toLowerCase();
    if (ext && !this.ALLOWED_FILE_EXTENSIONS.includes(ext)) {
      throw new Error(`File extension not allowed: ${ext}`);
    }

    return sanitized;
  }

  /**
   * Validates command arguments
   */
  public static validateCommandArgs(args: string[]): string[] {
    return args.map(arg => {
      // Check for dangerous patterns
      for (const pattern of this.DANGEROUS_PATTERNS) {
        if (pattern.test(arg)) {
          throw new Error(`Dangerous pattern detected in argument: ${arg}`);
        }
      }
      return arg;
    });
  }

  /**
   * Validates a URL
   */
  public static validateUrl(url: string): URL {
    try {
      const parsed = new URL(url);
      
      // Only allow http(s) protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error(`Invalid protocol: ${parsed.protocol}`);
      }

      // Check for localhost/internal IPs
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return parsed; // Allow localhost
      }

      // Prevent access to internal networks
      const ipPattern = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/;
      if (ipPattern.test(hostname)) {
        throw new Error('Access to internal network addresses not allowed');
      }

      return parsed;
    } catch (error) {
      throw new Error(`Invalid URL: ${error.message}`);
    }
  }

  /**
   * Sanitizes user input for display
   */
  public static sanitizeForDisplay(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validates a port number
   */
  public static validatePort(port: number): number {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid port number: ${port}`);
    }
    
    // Prevent use of well-known ports
    if (port < 1024) {
      throw new Error(`Port ${port} requires elevated privileges`);
    }

    return port;
  }

  /**
   * Validates file size
   */
  public static async validateFileSize(filePath: string, maxSizeBytes: number = 100 * 1024 * 1024): Promise<void> {
    const validPath = this.validatePath(filePath);
    
    try {
      const stats = await fs.promises.stat(validPath);
      if (stats.size > maxSizeBytes) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${maxSizeBytes})`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Creates a safe temporary filename
   */
  public static createSafeTempFilename(prefix: string = 'tmp', extension: string = '.tmp'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const safeName = `${prefix}_${timestamp}_${random}${extension}`;
    return this.validateFilename(safeName);
  }

  /**
   * Validates JSON input
   */
  public static parseJsonSafely<T>(jsonString: string, maxDepth: number = 10): T {
    // Check for excessive nesting (potential DoS)
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (const char of jsonString) {
      if (!inString) {
        if (char === '{' || char === '[') depth++;
        if (char === '}' || char === ']') depth--;
        if (depth > maxDepth) {
          throw new Error('JSON nesting too deep');
        }
      }

      if (char === '"' && !escaped) inString = !inString;
      escaped = !escaped && char === '\\';
    }

    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }
}