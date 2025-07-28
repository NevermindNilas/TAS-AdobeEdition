export interface Project {
  id: string;
  name: string;
  path: string;
  type: 'aftereffects' | 'premiere';
  createdAt: Date;
  modifiedAt: Date;
  settings?: ProjectSettings;
}

export interface ProjectSettings {
  defaultRenderQuality: string;
  outputDirectory: string;
  preserveOriginals: boolean;
}

export interface Layer {
  id: string;
  name: string;
  index: number;
  type: LayerType;
  inPoint: number;
  outPoint: number;
  startTime: number;
  duration: number;
  width: number;
  height: number;
  isSelected: boolean;
  parent?: string;
}

export enum LayerType {
  Video = 'video',
  Audio = 'audio',
  Image = 'image',
  Text = 'text',
  Shape = 'shape',
  Adjustment = 'adjustment',
  Null = 'null',
  Solid = 'solid',
  Precomp = 'precomp'
}

export interface Composition {
  id: string;
  name: string;
  width: number;
  height: number;
  pixelAspect: number;
  frameRate: number;
  duration: number;
  layers: Layer[];
  workAreaStart: number;
  workAreaDuration: number;
}

export interface RenderSettings {
  outputModule: string;
  renderTemplate: string;
  outputPath: string;
  container: '.mp4' | '.mov' | '.avi';
  quality: 'draft' | 'high' | 'lossless';
}

export interface SystemInfo {
  platform: 'win32' | 'darwin' | 'linux';
  tasVersion: string;
  latestVersion: string;
  currentExeVersion: string;
  isNvidia: boolean;
  isAmd: boolean;
  hasGpu: boolean;
  gpuName?: string;
  totalMemory: number;
  availableMemory: number;
  cpuCores: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  autoSaveInterval: number;
  showTooltips: boolean;
  confirmDangerousActions: boolean;
  defaultPort: number;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  maxLogEntries: number;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  details?: any;
  source: string;
}

export interface ModelInfo {
  name: string;
  version: string;
  size: number;
  downloaded: boolean;
  path?: string;
  description?: string;
  requirements?: ModelRequirements;
}

export interface ModelRequirements {
  minVram: number;
  minRam: number;
  supportedGpus?: string[];
  dependencies?: string[];
}

export interface BackendInfo {
  available: boolean;
  version?: string;
  port: number;
  status: 'idle' | 'busy' | 'error' | 'offline';
  lastCheck: Date;
  capabilities?: string[];
}

export interface ProcessingJob {
  id: string;
  name: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  input: string;
  output?: string;
  options: any; // ProcessingOptions from processing.types
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  logs?: LogEntry[];
}