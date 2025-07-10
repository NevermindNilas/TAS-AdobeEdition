import { io, Socket } from 'socket.io-client';
import { findAvailablePort, testConnection, getStoredPort, storePort, clearStoredPort } from './portUtils';

interface ProgressData {
    fps: number;
    currentFrame: number;
    totalFrames: number;
    eta: number;
    status: string;
}

interface ServerShutdownData {
    message: string;
}

type ProgressUpdateCallback = (data: ProgressData) => void;
type ProcessCompleteCallback = (success: boolean) => void;

class SocketManager {
    private socket: Socket | null = null;
    private static instance: SocketManager;
    private progressCallbacks: ProgressUpdateCallback[] = [];
    private completeCallbacks: ProcessCompleteCallback[] = [];
    private currentPort: number = 8080;
    private isConnecting: boolean = false;
    private connectionRetries: number = 0;
    private maxRetries: number = 3;

    private constructor() {
        this.initializeSocket();
    }

    private async initializeSocket() {
        try {
            this.isConnecting = true;
            const port = await this.findWorkingPort();
            this.currentPort = port;
            this.createSocket(port);
        } catch (error) {
            console.error('Failed to initialize socket:', error);
            this.currentPort = 8080;
            this.createSocket(8080);
        } finally {
            this.isConnecting = false;
        }
    }

    private async findWorkingPort(): Promise<number> {
        // First try the stored port
        const storedPort = getStoredPort();
        
        if (await testConnection(storedPort)) {
            console.log(`Using stored port ${storedPort} (server is running)`);
            return storedPort;
        }

        try {
            const availablePort = await findAvailablePort();
            console.log(`Found available port: ${availablePort}`);
            storePort(availablePort);
            return availablePort;
        } catch (error) {
            console.warn('Could not find available port, using default 8080:', error);
            clearStoredPort();
            return 8080;
        }
    }

    private createSocket(port: number) {
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io(`http://127.0.0.1:${port}`, {
            timeout: 3000,
            reconnection: true,
            reconnectionAttempts: this.maxRetries,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 3000,
        });

        this.setupSocketListeners();
    }

    private setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log(`Connected to server on port ${this.currentPort}!`);
            if (this.socket) {
                this.socket.emit('get_progress');
            }
        });

        this.socket.on('progress_update', (data: ProgressData) => {
            console.log('Progress Update:', data);
            this.progressCallbacks.forEach(callback => callback(data));
            
            if (data.status === 'completed' || data.status === 'failed') {
                this.completeCallbacks.forEach(callback => callback(data.status === 'completed'));
            }
        });

        this.socket.on('process_complete', (data: { success: boolean }) => {
            console.log('Process Complete:', data);
            this.completeCallbacks.forEach(callback => callback(data.success));
        });

        this.socket.on('server_shutdown', (data: ServerShutdownData) => {
            console.log('Server Shutdown:', data.message);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server.');
        });

        this.socket.on('connect_error', (error: Error) => {
            console.error(`Connection error on port ${this.currentPort}:`, error);
            this.handleConnectionError();
        });
    }

    private async handleConnectionError() {
        if (this.connectionRetries < this.maxRetries && !this.isConnecting) {
            this.connectionRetries++;
            console.log(`Retrying connection (attempt ${this.connectionRetries}/${this.maxRetries})`);
            
            try {
                this.isConnecting = true;
                const newPort = await this.findWorkingPort();
                if (newPort !== this.currentPort) {
                    this.currentPort = newPort;
                    this.createSocket(newPort);
                }
            } catch (error) {
                console.error('Failed to find working port during retry:', error);
            } finally {
                this.isConnecting = false;
            }
        }
    }

    public static getInstance(): SocketManager {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }

    public getSocket(): Socket | null {
        return this.socket;
    }

    public getCurrentPort(): number {
        return this.currentPort;
    }

    public isConnected(): boolean {
        return this.socket ? this.socket.connected : false;
    }

    public async reconnect(): Promise<void> {
        try {
            this.connectionRetries = 0;
            this.isConnecting = true;
            const port = await this.findWorkingPort();
            this.currentPort = port;
            this.createSocket(port);
        } catch (error) {
            console.error('Failed to reconnect:', error);
        } finally {
            this.isConnecting = false;
        }
    }

    public requestProgress(): void {
        if (this.socket && this.socket.connected) {
            this.socket.emit('get_progress');
        } else {
            console.warn('Cannot request progress: socket not connected');
        }
    }

    public onProgressUpdate(callback: ProgressUpdateCallback): () => void {
        this.progressCallbacks.push(callback);
        return () => {
            this.progressCallbacks = this.progressCallbacks.filter(cb => cb !== callback);
        };
    }

    public onProcessComplete(callback: ProcessCompleteCallback): () => void {
        this.completeCallbacks.push(callback);
        return () => {
            this.completeCallbacks = this.completeCallbacks.filter(cb => cb !== callback);
        };
    }
}

export const socketManager = SocketManager.getInstance();
