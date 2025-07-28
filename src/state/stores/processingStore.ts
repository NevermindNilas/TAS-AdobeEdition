import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  ProcessingOptions, 
  ProcessingStatus, 
  ProgressData,
  PreRenderAlgorithm,
  UpscaleModel,
  InterpolationModel,
  DeduplicateMethod,
  RestoreModel,
  BitDepth
} from '../../core/domain/types/processing.types';

interface ProcessingState {
  // Processing options
  options: ProcessingOptions;
  
  // Processing state
  isProcessing: boolean;
  status: ProcessingStatus;
  progress: number;
  currentFrame: number;
  totalFrames: number;
  fps: number;
  eta: number;
  tasETA: number;
  
  // Process control
  currentProcessId: string | null;
  processHistory: ProcessHistoryItem[];
  
  // Actions
  updateOptions: (options: Partial<ProcessingOptions>) => void;
  updateOption: <K extends keyof ProcessingOptions>(key: K, value: ProcessingOptions[K]) => void;
  startProcessing: (processId: string) => void;
  updateProgress: (progress: ProgressData) => void;
  stopProcessing: () => void;
  setStatus: (status: ProcessingStatus) => void;
  resetOptions: () => void;
  addToHistory: (item: ProcessHistoryItem) => void;
  clearHistory: () => void;
}

interface ProcessHistoryItem {
  id: string;
  timestamp: Date;
  options: ProcessingOptions;
  status: ProcessingStatus;
  duration?: number;
  outputPath?: string;
  error?: string;
}

const defaultOptions: ProcessingOptions = {
  // Pre-render settings
  preRenderAlgorithm: PreRenderAlgorithm.High,
  
  // Resize options
  resize: false,
  resizeFactor: 1.0,
  
  // Deduplication
  deduplicate: false,
  deduplicateMethod: DeduplicateMethod.Simple,
  deduplicateThreshold: 5,
  deduplicateConsecutiveSkip: 2,
  
  // Restoration
  restore: false,
  restoreModel: RestoreModel.BSRGAN,
  
  // Upscaling
  upscale: false,
  upscaleModel: UpscaleModel.ShuffleCugan,
  upscaleTimes: 2,
  
  // Interpolation
  interpolate: false,
  interpolationModel: InterpolationModel.RIFE,
  interpolateFactor: 2,
  interpolateMode: 'normal',
  
  // Depth mapping
  depthMap: false,
  depthModel: 'small_v2',
  
  // Other options
  bitDepth: BitDepth.Eight,
  aiPrecision: false,
  deletePreRender: true,
  forceStatic: false,
  keepAudio: true,
};

export const useProcessingStore = create<ProcessingState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        options: defaultOptions,
        isProcessing: false,
        status: ProcessingStatus.Idle,
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
        fps: 0,
        eta: 0,
        tasETA: 0,
        currentProcessId: null,
        processHistory: [],
        
        // Actions
        updateOptions: (newOptions) =>
          set((state) => {
            Object.assign(state.options, newOptions);
          }),
          
        updateOption: (key, value) =>
          set((state) => {
            state.options[key] = value;
          }),
          
        startProcessing: (processId) =>
          set((state) => {
            state.isProcessing = true;
            state.status = ProcessingStatus.Preparing;
            state.currentProcessId = processId;
            state.progress = 0;
            state.currentFrame = 0;
            state.totalFrames = 0;
            state.fps = 0;
            state.eta = 0;
            state.tasETA = 0;
          }),
          
        updateProgress: (progressData) =>
          set((state) => {
            state.progress = (progressData.currentFrame / progressData.totalFrames) * 100;
            state.currentFrame = progressData.currentFrame;
            state.totalFrames = progressData.totalFrames;
            state.fps = progressData.fps;
            state.eta = progressData.eta;
            state.tasETA = progressData.tasETA;
            state.status = progressData.status || state.status;
          }),
          
        stopProcessing: () =>
          set((state) => {
            state.isProcessing = false;
            state.status = ProcessingStatus.Cancelled;
            state.currentProcessId = null;
          }),
          
        setStatus: (status) =>
          set((state) => {
            state.status = status;
            if (status === ProcessingStatus.Completed || 
                status === ProcessingStatus.Failed ||
                status === ProcessingStatus.Cancelled) {
              state.isProcessing = false;
            }
          }),
          
        resetOptions: () =>
          set((state) => {
            state.options = defaultOptions;
          }),
          
        addToHistory: (item) =>
          set((state) => {
            // Keep only last 50 items
            state.processHistory = [item, ...state.processHistory].slice(0, 50);
          }),
          
        clearHistory: () =>
          set((state) => {
            state.processHistory = [];
          }),
      })),
      {
        name: 'processing-storage',
        partialize: (state) => ({ 
          options: state.options,
          processHistory: state.processHistory.slice(0, 10) // Only persist last 10
        }),
      }
    ),
    {
      name: 'TAS-ProcessingStore'
    }
  )
);

// Selectors
export const selectProcessingOptions = (state: ProcessingState) => state.options;
export const selectProcessingProgress = (state: ProcessingState) => ({
  progress: state.progress,
  currentFrame: state.currentFrame,
  totalFrames: state.totalFrames,
  fps: state.fps,
  eta: state.eta,
  tasETA: state.tasETA
});
export const selectIsProcessing = (state: ProcessingState) => state.isProcessing;
export const selectProcessingStatus = (state: ProcessingState) => state.status;