// socket.tsx (SSE version, no socket.io)
// Handles progress updates and process completion via EventSource (SSE)

interface ProgressData {
  fps: number;
  currentFrame: number;
  totalFrames: number;
  eta: number;
  status: string;
}

type ProgressUpdateCallback = (data: ProgressData) => void;
type ProcessCompleteCallback = (success: boolean) => void;

class SSEManager {
  private static instance: SSEManager;
  private eventSource: EventSource | null = null;
  private progressCallbacks = new Set<ProgressUpdateCallback>();
  private completeCallbacks = new Set<ProcessCompleteCallback>();
  private destroyed = false;
  private lastStatus: string | null = null;

  private constructor() {}

  public static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  public init(): void {
    if (this.eventSource || this.destroyed) return;
    // Hardcoded port 8080 as per backend
    console.log('SSE: Opening connection to http://127.0.0.1:8080/progress/stream');
    this.eventSource = new window.EventSource("http://127.0.0.1:8080/progress/stream");
    this.eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data: ProgressData = JSON.parse(event.data);
        this.handleProgressUpdate(data);
      } catch (e) {
        // Ignore parse errors
      }
    };
    this.eventSource.onerror = () => {
      // Optionally handle errors (e.g., reconnect logic)
    };
  }

  public close(): void {
    if (this.eventSource) {
      console.log('SSE: Closing connection');
      this.eventSource.close();
      this.eventSource = null;
    }
    this.lastStatus = null;
  }

  private handleProgressUpdate(data: ProgressData) {
    for (const cb of this.progressCallbacks) cb(data);
    // Detect process completion (status === 'completed' or 'failed')
    if (data.status === "completed" || data.status === "failed") {
      if (this.lastStatus !== data.status) {
        for (const cb of this.completeCallbacks) cb(data.status === "completed");
        this.lastStatus = data.status;
      }
    } else {
      this.lastStatus = null;
    }
  }

  public onProgressUpdate(cb: ProgressUpdateCallback): () => void {
    this.progressCallbacks.add(cb);
    return () => this.progressCallbacks.delete(cb);
  }

  public onProcessComplete(cb: ProcessCompleteCallback): () => void {
    this.completeCallbacks.add(cb);
    return () => this.completeCallbacks.delete(cb);
  }

  public destroy(): void {
    this.destroyed = true;
    this.close();
    this.progressCallbacks.clear();
    this.completeCallbacks.clear();
  }
}

export const socketManager = SSEManager.getInstance();
