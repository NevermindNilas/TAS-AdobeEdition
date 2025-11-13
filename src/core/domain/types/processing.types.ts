export enum PreRenderAlgorithm {
  High = 'high',
  Medium = 'medium', 
  Low = 'low',
  Lossless = 'lossless'
}

export enum DeduplicateMethod {
  None = 'none',
  Simple = 'simple',
  Advanced = 'advanced'
}

export enum RestoreModel {
  BSRGAN = 'bsrgan',
  Deoldify = 'deoldify',
  CodeFormer = 'codeformer',
  GFPGAN = 'gfpgan'
}

export enum UpscaleModel {
  ShuffleCugan = 'shufflecugan',
  Compact = 'compact',
  UltraCompact = 'ultracompact',
  AniScale2 = 'aniscale2',
  Span = 'span',
  OpenProteus = 'open-proteus'
}

export enum InterpolationModel {
  RIFE = 'rife',
  RIFEG = 'rifeg',
  GMFSSOrtPlanet = 'gmfssortplanet',
  GMFSS = 'gmfss'
}

export enum BitDepth {
  Eight = 8,
  Ten = 10,
  Sixteen = 16
}

export enum ProcessingStatus {
  Idle = 'idle',
  Preparing = 'preparing',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled'
}

export interface ProcessingOptions {
  // Pre-render settings
  preRenderAlgorithm: PreRenderAlgorithm;
  
  // Resize options
  resize: boolean;
  resizeFactor: number;
  resizeHeight?: number;
  
  // Deduplication
  deduplicate: boolean;
  deduplicateMethod: DeduplicateMethod;
  deduplicateThreshold: number;
  deduplicateConsecutiveSkip: number;
  
  // Restoration
  restore: boolean;
  restoreModel?: RestoreModel | string;
  restoreModels?: string[];
  
  // Upscaling
  upscale: boolean;
  upscaleModel: UpscaleModel;
  upscaleTimes: number;
  upscaleCompression?: number;
  upscaleSkipThreshold?: number;
  
  // Interpolation
  interpolate: boolean;
  interpolationModel: InterpolationModel;
  interpolateFactor: number;
  interpolateMode: 'normal' | 'scenechange';
  
  // Depth mapping
  depthMap: boolean;
  depthModel: string;
  depthFocus?: boolean;
  depthDilation?: number;
  depthBlur?: number;
  
  // Other options
  bitDepth: BitDepth;
  aiPrecision: boolean;
  deletePreRender: boolean;
  forceStatic: boolean;
  keepAudio: boolean;
  audioOffset?: number;
  
  // Performance
  gpuIndex?: number;
  threads?: number;
}

export interface ProcessingResult {
  outputPath: string;
  duration: number;
  frameCount: number;
  status: ProcessingStatus;
  error?: string;
  stats?: ProcessingStats;
}

export interface ProcessingStats {
  startTime: number;
  endTime: number;
  framesProcessed: number;
  averageFps: number;
  peakMemoryUsage: number;
  gpuUtilization: number;
}

export interface ProgressData {
  fps: number;
  currentFrame: number;
  totalFrames: number;
  eta: number;
  tasETA: number;
  status: ProcessingStatus;
  frameType?: string;
  phase?: string;
  memory?: number;
  gpu?: number;
}

export interface ProcessCommand {
  executable: string;
  args: string[];
  options: ProcessingOptions;
  input: string;
  output: string;
  workingDirectory: string;
}