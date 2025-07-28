import { spawn, SpawnOptions } from 'child_process';
import * as path from 'path';
import * as os from 'os';

export interface CommandExecutionOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
  maxBuffer?: number;
}

export class SecureCommandExecutor {
  private static readonly ALLOWED_COMMANDS = [
    'python',
    'python.exe',
    'python3',
    'node',
    'ffmpeg',
    'ffprobe',
    'explorer',
    'open',
    'start'
  ];

  private static readonly SAFE_PATHS = [
    os.homedir(),
    os.tmpdir(),
    process.env.APPDATA || '',
    '/Users',
    'C:\\Users'
  ];

  /**
   * Validates if a command is allowed to be executed
   */
  private static isCommandAllowed(command: string): boolean {
    const cmdName = path.basename(command).toLowerCase();
    return this.ALLOWED_COMMANDS.some(allowed => 
      cmdName === allowed || cmdName.startsWith(allowed)
    );
  }

  /**
   * Validates if a path is safe to access
   */
  private static isPathSafe(inputPath: string): boolean {
    // Normalize the path
    const normalizedPath = path.normalize(inputPath);
    
    // Check for path traversal attempts
    if (normalizedPath.includes('..')) {
      return false;
    }
    
    // Check if path is within allowed directories
    return this.SAFE_PATHS.some(safePath => 
      safePath && normalizedPath.startsWith(safePath)
    );
  }

  /**
   * Sanitizes command arguments to prevent injection
   */
  private static sanitizeArgs(args: string[]): string[] {
    return args.map(arg => {
      // Remove shell metacharacters
      return arg.replace(/[;&|`$()<>\\]/g, '');
    });
  }

  /**
   * Executes a command securely using spawn
   */
  public static async execute(
    command: string,
    args: string[] = [],
    options: CommandExecutionOptions = {}
  ): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve, reject) => {
      // Validate command
      if (!this.isCommandAllowed(command)) {
        reject(new Error(`Command not allowed: ${command}`));
        return;
      }

      // Validate working directory if provided
      if (options.cwd && !this.isPathSafe(options.cwd)) {
        reject(new Error(`Unsafe working directory: ${options.cwd}`));
        return;
      }

      // Sanitize arguments
      const safeArgs = this.sanitizeArgs(args);

      // Prepare spawn options
      const spawnOptions: SpawnOptions = {
        cwd: options.cwd,
        env: {
          ...process.env,
          ...options.env,
          // Remove potentially dangerous environment variables
          LD_PRELOAD: undefined,
          DYLD_INSERT_LIBRARIES: undefined
        },
        shell: false, // Never use shell to prevent injection
        timeout: options.timeout || 300000 // 5 minutes default
      };

      const childProcess = spawn(command, safeArgs, spawnOptions);
      
      let stdout = '';
      let stderr = '';

      // Limit buffer size to prevent memory exhaustion
      const maxBuffer = options.maxBuffer || 10 * 1024 * 1024; // 10MB default

      childProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
        if (stdout.length > maxBuffer) {
          childProcess.kill();
          reject(new Error('stdout exceeded buffer limit'));
        }
      });

      childProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
        if (stderr.length > maxBuffer) {
          childProcess.kill();
          reject(new Error('stderr exceeded buffer limit'));
        }
      });

      childProcess.on('error', (error) => {
        reject(error);
      });

      childProcess.on('close', (code) => {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          code: code || 0
        });
      });
    });
  }

  /**
   * Opens a file or folder safely using the system's default application
   */
  public static async openPath(targetPath: string): Promise<void> {
    // Validate path
    if (!this.isPathSafe(targetPath)) {
      throw new Error(`Unsafe path: ${targetPath}`);
    }

    const platform = os.platform();
    let command: string;
    let args: string[];

    switch (platform) {
      case 'darwin':
        command = 'open';
        args = [targetPath];
        break;
      case 'win32':
        command = 'explorer';
        args = [targetPath];
        break;
      case 'linux':
        command = 'xdg-open';
        args = [targetPath];
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    await this.execute(command, args);
  }
}