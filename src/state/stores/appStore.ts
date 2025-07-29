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
  tasVersion: '2.3.6',
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

        checkBackendAvailability: async () => {
          set((state) => {
            state.backendStatus = 'connecting';
          });

          try {
            const port = get().backendPort;
            const response = await fetch(`http://127.0.0.1:${port}/health`, {
              method: 'GET',
              signal: AbortSignal.timeout(5000)
            });

            const available = response.ok;

            set((state) => {
              state.isBackendAvailable = available;
              state.backendStatus = available ? 'connected' : 'error';
            });
          } catch (error) {
            set((state) => {
              state.isBackendAvailable = false;
              state.backendStatus = 'error';
            });
          }
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