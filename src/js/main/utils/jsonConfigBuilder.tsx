import { path, os, fs } from "../../lib/cep/node";
import type { ProcessingOptions } from "../../../core/domain/types/processing.types";

export interface TASJsonConfig {
    input: string;
    output: string;
    inpoint?: number;
    outpoint?: number;
    preview?: boolean;
    
    interpolate?: boolean;
    interpolate_method?: string;
    interpolate_factor?: number;
    slowmo?: boolean;
    ensemble?: boolean;
    dynamic_scale?: boolean;
    static_step?: boolean;
    interpolate_first?: boolean;
    
    upscale?: boolean;
    upscale_method?: string;
    upscale_factor?: number;
    custom_model?: string;
    
    dedup?: boolean;
    dedup_method?: string;
    dedup_sens?: number;
    smooth_dedup?: boolean;
    
    sharpen?: boolean;
    sharpen_sens?: number;
    restore?: boolean;
    restore_method?: string | string[];
    resize?: boolean;
    resize_factor?: number;
    output_scale?: string;
    
    segment?: boolean;
    segment_method?: string;
    
    autoclip?: boolean;
    autoclip_sens?: number;
    scenechange?: boolean;
    scenechange_method?: string;
    scenechange_sens?: number;
    
    depth?: boolean;
    depth_method?: string;
    depth_quality?: string;
    
    encode_method?: string;
    custom_encoder?: string;
    
    obj_detect?: boolean;
    obj_detect_method?: string;
    
    benchmark?: boolean;
    offline?: string | string[];
    ae?: string;
    bit_depth?: string;
    half?: boolean;
    static?: boolean;
    precision?: string;
    compile_mode?: string;
}

export function buildJsonConfig(
    input: string,
    output: string,
    options: Partial<ProcessingOptions>,
    aeCommsUrl?: string
): TASJsonConfig {
    const config: TASJsonConfig = {
        input,
        output
    };

    if (options.depthMap) {
        config.depth = true;
        config.depth_method = options.depthModel;
    }

    if (options.upscale) {
        config.upscale = true;
        config.upscale_method = options.upscaleModel;
        config.upscale_factor = options.upscaleTimes || 2;
    }

    if (options.interpolate) {
        config.interpolate = true;
        config.interpolate_method = options.interpolationModel;
        config.interpolate_factor = options.interpolateFactor;
    }

    if (options.restore) {
        config.restore = true;
        // Support both single model (restoreModel) and multiple models (restoreModels)
        if (options.restoreModels && options.restoreModels.length > 0) {
            config.restore_method = options.restoreModels;
        } else if (options.restoreModel) {
            config.restore_method = options.restoreModel;
        }
    }

    if (options.deduplicate) {
        config.dedup = true;
        config.dedup_method = options.deduplicateMethod;
        config.dedup_sens = options.deduplicateThreshold;
    }

    if (options.resize) {
        config.resize = true;
        config.resize_factor = options.resizeFactor;
    }

    if (options.bitDepth !== undefined) {
        config.bit_depth = `${options.bitDepth}bit`;
    }
    if (options.aiPrecision !== undefined) config.half = options.aiPrecision;
    if (options.forceStatic !== undefined) config.static = options.forceStatic;

    if (aeCommsUrl) {
        config.ae = aeCommsUrl;
    }

    return config;
}

export function saveJsonConfig(config: TASJsonConfig): string {
    const tempDir = os.tmpdir();
    const configPath = path.join(tempDir, `tas-config-${Date.now()}.json`);
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { encoding: 'utf8' });
    
    return configPath;
}

export function cleanupJsonConfig(configPath: string): void {
    try {
        if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
        }
    } catch (error) {
        console.warn("Failed to cleanup config file:", error);
    }
}

export function buildJsonCommand(
    pythonExePath: string,
    mainPyPath: string,
    configPath: string
): string {
    return `"${pythonExePath}" "${mainPyPath}" --json "${configPath}"`;
}
