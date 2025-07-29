/**
 * Application Constants
 * Centralized location for all application constants including defaults and model examples
 */

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default configuration values for the application
 */
export const DEFAULT_VALUES = {
    // Version and core settings
    tasVersion: "2.3.6",
    preRenderAlgorithm: "high",
    
    // Processing options
    deduplicate: false,
    restore: false,
    upscale: false,
    interpolate: false,
    sharpening: false,
    rifeensemble: false,
    offlineMode: false,
    
    // Model settings
    segmentMethod: "anime",
    deduplicateMethod: "ssim",
    encodeAlgorithm: "x264",
    restoreModel: "anime1080fixer",
    upscaleModel: "shufflecugan",
    interpolationModel: "rife4.6",
    depthModel: "og_distill_small_v2",
    
    // Sensitivity settings
    deduplicateSensitivity: 0.5,
    sharpeningSensitivity: 0.5,
    autoCutSensitivity: 0.5,
    
    // Quality settings
    depthQuality: "high",
    bitDepth: "8bit",
    aiPrecision: "true",
    
    // UI and display settings
    youtubeUrl: "",
    interpolateFactor: "2",
    resizeFactor: "2",
    resize: false,
    uiScale: "medium",
    tabListOrientation: "horizontal",
    
    // Progress and state
    isProcessing: false,
    isBackendAvailable: false,
    progressBarValue: 0,
    downloadProgress: 0,
    isDownloading: false,
    progressBarState: "indeterminate",
    showDownloadDialog: false,
    
    // Version and backend info
    latestVersion: "unknown",
    CurrentVersionOfExe: "Not Available",
    TASFULLORLITE: "FULL" as "FULL" | "LITE",
    
    // Feature flags
    enablePreview: false,
    deletePreRender: false,
    canIShowUpdateDialog: true,
    dynamicScale: false,
    forceStatic: false,
    disableDonatePopup: false,
    
    // Layer settings
    adjustmentLayerLength: "1",
    solidLayerLength: "1",
    solidLayerColor: "#000000",
    nullLayerLength: "1",
    toolboxLayerLength: "1",
    sortLayerMethod: "topDown",
    
    // Interpolation factor options
    interpolationFactorList: [
        { name: "2x", value: "2" },
        { name: "2.5x", value: "2.5" },
        { name: "3x", value: "3" },
        { name: "4x", value: "4" },
        { name: "5x", value: "5" },
        { name: "6x", value: "6" },
        { name: "8x", value: "8" },
        { name: "16x", value: "16" },
        { name: "32x", value: "32" },
        { name: "64x", value: "64" },
    ],
} as const;

// =============================================================================
// MODEL EXAMPLES
// =============================================================================

/**
 * Model example images for upscale models
 * These URLs point to example images showing the visual quality of each upscale model
 */
export const UPSCALE_MODEL_EXAMPLES = {
    shufflecugan: "https://files.catbox.moe/7ppoj4.png",
    compact: "https://files.catbox.moe/l9xlz9.png",
    ultracompact: "https://files.catbox.moe/feu7fo.png",
    superultracompact: "https://files.catbox.moe/kv4yh7.png",
    aniscale2: "https://files.catbox.moe/y22vc4.png",
    span: "https://files.catbox.moe/0wiigm.png", // Using ModernSpanimationV2 for span
    "open-proteus": "https://files.catbox.moe/yugo9m.png",
    // Models without specific examples will show fallback text
    "shufflecugan-tensorrt": "https://files.catbox.moe/7ppoj4.png",
    "span-tensorrt": "https://files.catbox.moe/0wiigm.png",
    "aniscale2-directml": "https://files.catbox.moe/y22vc4.png",
    "open-proteus-directml": "https://files.catbox.moe/yugo9m.png",
    "rtmosr-directml": null,
    "rtmosr-tensorrt": null,
    "compact-tensorrt": "https://files.catbox.moe/l9xlz9.png",
    "ultracompact-tensorrt": "https://files.catbox.moe/feu7fo.png",
    "superultracompact-tensorrt": "https://files.catbox.moe/kv4yh7.png",
    "compact-directml": "https://files.catbox.moe/l9xlz9.png",
    "ultracompact-directml": "https://files.catbox.moe/feu7fo.png",
    "superultracompact-directml": "https://files.catbox.moe/kv4yh7.png",
    "aniscale2-tensorrt": "https://files.catbox.moe/y22vc4.png",
    "open-proteus-tensorrt": "https://files.catbox.moe/yugo9m.png",
    default: "https://files.catbox.moe/7ppoj4.png", // Default fallback
} as const;

/**
 * Model example images for depth models
 * These URLs point to example images showing the visual quality of each depth model
 */
export const DEPTH_MODEL_EXAMPLES = {
    distill_base_v2: "https://files.catbox.moe/fmyj1d.png",
    distill_small_v2: "https://files.catbox.moe/pva2vb.png",
    og_base_v2: "https://files.catbox.moe/jjjif0.png",
    og_distill_base_v2: "https://files.catbox.moe/7tugf9.png",
    og_distill_small_v2: "https://files.catbox.moe/kkujv9.png",
    og_large_v2: "https://files.catbox.moe/bitvfy.png",
    og_small_v2: "https://files.catbox.moe/28i39s.png",
    // TensorRT and DirectML variants use the same examples as their base models or null if not available
    "distill_small_v2-tensorrt": null,
    "distill_base_v2-tensorrt": null,
    "distill_large_v2-tensorrt": null,
    "distill_small_v2-directml": null,
    "distill_base_v2-directml": null,
    "distill_large_v2-directml": null,
    "og_small_v2-tensorrt": null,
    "og_base_v2-tensorrt": null,
    "og_large_v2-tensorrt": null,
    "og_distill_small_v2-tensorrt": null,
    "og_distill_base_v2-tensorrt": null,
    "small_v2-tensorrt": null,
    "base_v2-tensorrt": null,
    "large_v2-tensorrt": null,
    default: "https://files.catbox.moe/28i39s.png", // Default fallback
} as const;

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

// TAS installation types
export type TASInstallationType = "FULL" | "LITE";

// Type definitions for better type safety
export type UpscaleModelKey = keyof typeof UPSCALE_MODEL_EXAMPLES;
export type DepthModelKey = keyof typeof DEPTH_MODEL_EXAMPLES;

// Legacy export for backward compatibility
export const DEFAULT = DEFAULT_VALUES;