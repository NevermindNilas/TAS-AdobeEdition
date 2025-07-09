import { io, Socket } from 'socket.io-client';

interface ProgressData {
    fps: number;
    currentFrame: number;
    totalFrames: number;
    eta: number; // Estimated time remaining in seconds
    status: string; // e.g., "processing", "waiting", "completed", "failed", etc.
    // Add other properties as needed based on server's progress_update
}

interface ServerShutdownData {
    message: string;
}

type ProgressUpdateCallback = (data: ProgressData) => void;
type ProcessCompleteCallback = (success: boolean) => void;

class SocketManager {
    private socket: Socket;
    private static instance: SocketManager;
    private progressCallbacks: ProgressUpdateCallback[] = [];
    private completeCallbacks: ProcessCompleteCallback[] = [];

    private constructor() {
        this.socket = io('http://127.0.0.1:8080'); // Connect to the Socket.IO server

        this.socket.on('connect', () => {
            console.log('Connected to server!');
            // Request current progress when connected
            this.socket.emit('get_progress');
        });

        this.socket.on('progress_update', (data: ProgressData) => {
            console.log('Progress Update:', data);
            this.progressCallbacks.forEach(callback => callback(data));
            
            // Check if process is complete based on status
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
    }

    public static getInstance(): SocketManager {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }

    public getSocket(): Socket {
        return this.socket;
    }

    public requestProgress(): void {
        this.socket.emit('get_progress');
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
