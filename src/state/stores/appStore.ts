import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { SystemInfo } from '../../core/domain/types/models.types';

interface AppState {
  // Version info
  tasVersion: string;
  latestVersion: string;
  currentExeVersion: string;

  // System info
  isNvidia: boolean;
  isBackendAvailable: boolean;
  isGPUCheckDone: boolean;
  gpuName: string;
  platform: 'win32' | 'darwin' | 'linux';

  // Backend connection
  backendPort: number;
  backendStatus: 'idle' | 'connecting' | 'connected' | 'error';

  // UI state
  selectedTab: string;
  isLoading: boolean;
  loadingMessage: string;

  // Actions
  setTasVersion: (version: string) => void;
  setLatestVersion: (version: string) => void;
  checkBackendAvailability: () => Promise<void>;
  updateSystemInfo: (info: Partial<SystemInfo>) => void;
  setBackendPort: (port: number) => void;
  setBackendStatus: (status: AppState['backendStatus']) => void;
  setSelectedTab: (tab: string) => void;
  setLoading: (loading: boolean, message?: string) => void;
  reset: () => void;
}

const initialState = {
  tasVersion: '2.4.5',
  latestVersion: 'unknown',
  currentExeVersion: 'Not Available',
  isNvidia: false,
  isBackendAvailable: false,
  isGPUCheckDone: false,
  gpuName: '',
  platform: process.platform as 'win32' | 'darwin' | 'linux',
  backendPort: 8080,
  backendStatus: 'idle' as const,
  selectedTab: 'process',
  isLoading: false,
  loadingMessage: ''
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // Actions
        setTasVersion: (version) =>
          set((state) => {
            state.tasVersion = version;
          }),

        setLatestVersion: (version) =>
          set((state) => {
            state.latestVersion = version;
          }),

        /**
         * Checks backend availability with dynamic port detection and retry logic.
         * Scans a port range if the default fails, retries with exponential backoff.
         * Persists the working port if found.
         */
        checkBackendAvailability: async () => {
          set((state) => {
            state.backendStatus = 'connecting';
          });

          const portRange = [8080, 8081, 8082, 8083, 8084]; // Extend as needed
          const maxRetries = 3;
          const baseDelay = 500; // ms

          // Helper to check a single port with retries
          const checkPort = async (port: number) => {
            for (let attempt = 0; attempt < maxRetries; attempt++) {
              try {
                const response = await fetch(`http://127.0.0.1:${port}/health`, {
                  method: 'GET',
                  signal: AbortSignal.timeout(3000)
                });
                if (response.ok) return true;
              } catch (e) {
                // Wait before retrying
                await new Promise(res => setTimeout(res, baseDelay * Math.pow(2, attempt)));
              }
            }
            return false;
          };

          let found = false;
          let workingPort = get().backendPort;
          for (const port of [workingPort, ...portRange.filter(p => p !== workingPort)]) {
            const ok = await checkPort(port);
            if (ok) {
              found = true;
              workingPort = port;
              break;
            }
          }

          set((state) => {
            state.isBackendAvailable = found;
            state.backendStatus = found ? 'connected' : 'error';
            if (found) state.backendPort = workingPort;
          });
        },

        updateSystemInfo: (info) =>
          set((state) => {
            Object.assign(state, info);
          }),

        setBackendPort: (port) =>
          set((state) => {
            state.backendPort = port;
          }),

        setBackendStatus: (status) =>
          set((state) => {
            state.backendStatus = status;
          }),

        setSelectedTab: (tab) =>
          set((state) => {
            state.selectedTab = tab;
          }),

        setLoading: (loading, message = '') =>
          set((state) => {
            state.isLoading = loading;
            state.loadingMessage = message;
          }),

        reset: () =>
          set(() => initialState),
      })),
      {
        name: 'app-storage',
        partialize: (state) => ({
          tasVersion: state.tasVersion,
          isNvidia: state.isNvidia,
          backendPort: state.backendPort,
          selectedTab: state.selectedTab
        }),
      }
    ),
    {
      name: 'TAS-AppStore'
    }
  )
);