import { evalTS } from "../../lib/utils/bolt";
import { generateToast } from "./generateToast";
import { getValidatedAEContext, executeProcessHelper, addPortToCommand, getTASPaths } from "./helpers";
import { fs, path } from "../../lib/cep/node";

export interface QueueItem {
    id: string;
    layerName: string;
    layerIndex: number;
    status: 'pending' | 'pre-rendering' | 'processing' | 'completed' | 'failed';
    progress?: number;
    error?: string;
    currentFrame?: number;
    totalFrames?: number;
    processingFps?: number;
    estimatedTimeRemaining?: number;
    progressBarStatus?: string;
    phase?: 'pre-render' | 'process';
    preRenderedFile?: string;
}

export interface ProcessingOptions {
    preRenderAlgorithm: string;
    resize: boolean;
    resizeFactor: string;
    interpolate: boolean;
    interpolateFactor: string;
    interpolationModel: string;
    upscale: boolean;
    upscaleModel: string;
    deduplicate: boolean;
    deduplicateMethod: string;
    deduplicateSensitivity: number;
    restore: boolean;
    restoreModel: string;
    sharpening: boolean;
    sharpeningSensitivity: number;
    encodeAlgorithm: string;
    bitDepth: string;
    aiPrecision: string;
    enablePreview: boolean;
    slowMotion: boolean;
    rifeensemble: boolean;
    dynamicScale: boolean;
    forceStatic: boolean;
}

export class QueueManager {
    private queue: QueueItem[] = [];
    private isProcessing = false;
    private currentItem: QueueItem | null = null;
    private onQueueUpdate?: (queue: QueueItem[]) => void;
    private onProgressUpdate?: (progress: any) => void;
    private resetProgress?: (status?: string) => void;
    private setFullLogs?: (logs: string[]) => void;
    private setIsProcessCancelled?: (cancelled: boolean) => void;
    private processCancelledRef?: { current: boolean };
    private executeProcess?: any;
    private processingOptions?: ProcessingOptions;

    constructor(callbacks: {
        onQueueUpdate?: (queue: QueueItem[]) => void;
        onProgressUpdate?: (progress: any) => void;
        resetProgress?: (status?: string) => void;
        setFullLogs?: (logs: string[]) => void;
        setIsProcessCancelled?: (cancelled: boolean) => void;
        processCancelledRef?: { current: boolean };
        executeProcess?: any;
    }) {
        this.onQueueUpdate = callbacks.onQueueUpdate;
        this.onProgressUpdate = callbacks.onProgressUpdate;
        this.resetProgress = callbacks.resetProgress;
        this.setFullLogs = callbacks.setFullLogs;
        this.setIsProcessCancelled = callbacks.setIsProcessCancelled;
        this.processCancelledRef = callbacks.processCancelledRef;
        this.executeProcess = callbacks.executeProcess;
    }

    // Method to update progress for current queue item
    updateCurrentItemProgress(progressData: any): void {
        console.log("QueueManager updateCurrentItemProgress called with:", progressData);
        console.log("Current item:", this.currentItem);
        
        if (this.currentItem) {
            this.currentItem.currentFrame = progressData.currentFrame || 0;
            this.currentItem.totalFrames = progressData.totalFrames || 100;
            this.currentItem.processingFps = progressData.fps || 0;
            this.currentItem.estimatedTimeRemaining = progressData.eta || 0;
            this.currentItem.progressBarStatus = progressData.status || 'Processing...';
            
            const currentFrame = this.currentItem.currentFrame || 0;
            const totalFrames = this.currentItem.totalFrames || 100;
            this.currentItem.progress = totalFrames > 0 
                ? (currentFrame / totalFrames) * 100 
                : 0;
                
            console.log("Updated current item:", {
                currentFrame: this.currentItem.currentFrame,
                totalFrames: this.currentItem.totalFrames,
                processingFps: this.currentItem.processingFps,
                estimatedTimeRemaining: this.currentItem.estimatedTimeRemaining,
                progress: this.currentItem.progress
            });
                
            this.notifyQueueUpdate();
        } else {
            console.log("No current item to update");
        }
    }

    setProcessingOptions(options: ProcessingOptions) {
        this.processingOptions = options;
    }

    async addSelectedLayersToQueue(): Promise<boolean> {
        try {
            const aeContext = await getValidatedAEContext();
            if (!aeContext) return false;

            // Get all selected layers from After Effects
            const selectedLayers = await evalTS("getSelectedLayers");
            if (!selectedLayers || selectedLayers.length === 0) {
                generateToast(2, "No layers selected. Please select one or more layers.");
                return false;
            }

            // Add each selected layer to the queue
            for (const layer of selectedLayers) {
                const queueItem: QueueItem = {
                    id: `${layer.index}_${Date.now()}_${Math.random()}`,
                    layerName: layer.name,
                    layerIndex: layer.index,
                    status: 'pending'
                };
                this.queue.push(queueItem);
            }

            this.notifyQueueUpdate();
            generateToast(3, `Added ${selectedLayers.length} layer(s) to processing queue.`);
            return true;
        } catch (error) {
            console.error("Error adding layers to queue:", error);
            generateToast(2, "Error adding layers to queue.");
            return false;
        }
    }

    async startQueue(): Promise<void> {
        if (this.isProcessing) {
            generateToast(2, "Queue is already processing.");
            return;
        }

        if (this.queue.length === 0) {
            generateToast(2, "Queue is empty. Add layers to the queue first.");
            return;
        }

        if (!this.processingOptions) {
            generateToast(2, "Processing options not set.");
            return;
        }

        this.isProcessing = true;
        this.notifyQueueUpdate();
        generateToast(3, `Starting queue processing with ${this.queue.length} layer(s).`);

        try {
            // Phase 1: Pre-render all layers first
            await this.preRenderAllLayers();
            
            // Phase 2: Process all pre-rendered layers
            await this.processAllLayers();
        } catch (error) {
            console.error("Error processing queue:", error);
            this.isProcessing = false;
            this.notifyQueueUpdate();
        }
    }

    private async preRenderAllLayers(): Promise<void> {
        generateToast(3, "Phase 1: Pre-rendering all layers...");
        
        for (const item of this.queue) {
            if (item.status === 'pending') {
                if (this.processCancelledRef?.current) {
                    break;
                }
                
                this.currentItem = item;
                item.status = 'pre-rendering';
                item.phase = 'pre-render';
                item.progressBarStatus = 'Pre-rendering...';
                this.notifyQueueUpdate();
                
                try {
                    await this.preRenderLayer(item);
                    item.progressBarStatus = 'Pre-render complete';
                } catch (error) {
                    item.status = 'failed';
                    item.error = error instanceof Error ? error.message : 'Pre-render failed';
                    generateToast(2, `Pre-render failed for "${item.layerName}": ${item.error}`);
                }
                
                this.notifyQueueUpdate();
            }
        }
        
        this.currentItem = null;
        generateToast(3, "Phase 1 complete: All layers pre-rendered");
    }

    private async processAllLayers(): Promise<void> {
        generateToast(3, "Phase 2: Processing all layers...");
        
        for (const item of this.queue) {
            if (item.status === 'pre-rendering') {
                if (this.processCancelledRef?.current) {
                    break;
                }
                
                this.currentItem = item;
                item.status = 'processing';
                item.phase = 'process';
                item.progressBarStatus = 'Processing...';
                this.notifyQueueUpdate();
                
                try {
                    await this.processPreRenderedLayer(item);
                    item.status = 'completed';
                    item.progressBarStatus = 'Complete';
                    generateToast(3, `Layer "${item.layerName}" processed successfully.`);
                } catch (error) {
                    item.status = 'failed';
                    item.error = error instanceof Error ? error.message : 'Processing failed';
                    generateToast(2, `Processing failed for "${item.layerName}": ${item.error}`);
                }
                
                this.notifyQueueUpdate();
            }
        }
        
        this.currentItem = null;
        this.isProcessing = false;
        this.notifyQueueUpdate();
        
        const completedCount = this.queue.filter(item => item.status === 'completed').length;
        const failedCount = this.queue.filter(item => item.status === 'failed').length;
        
        generateToast(1, `Queue processing complete! ${completedCount} succeeded, ${failedCount} failed.`);
    }



    private async preRenderLayer(queueItem: QueueItem): Promise<void> {
        console.log("preRenderLayer called for:", queueItem.layerName);
        
        // Select the specific layer in After Effects
        console.log("Selecting layer by index:", queueItem.layerIndex);
        const layerSelected = await evalTS("selectLayerByIndex", queueItem.layerIndex);
        if (!layerSelected) {
            console.error("Could not select layer");
            throw new Error(`Could not select layer at index ${queueItem.layerIndex}`);
        }
        console.log("Layer selected successfully");

        // Render the layer
        console.log("Starting render with algorithm:", this.processingOptions?.preRenderAlgorithm);
        const renderAlgo = this.processingOptions?.preRenderAlgorithm || 'high';
        const info = await evalTS("render", renderAlgo);
        console.log("Render result:", info);
        
        if (info === "undefined") {
            console.error("Rendering failed");
            throw new Error("Rendering failed. Consider using an alternative encoding method.");
        }

        const input = info?.input;
        if (!input) {
            console.error("No input file from render");
            throw new Error("No input file from render");
        }
        console.log("Input file:", input);

        // Store the pre-rendered file path in the queue item
        queueItem.preRenderedFile = input;
    }

    private async processPreRenderedLayer(queueItem: QueueItem): Promise<void> {
        console.log("processPreRenderedLayer called for:", queueItem.layerName);
        
        if (!this.processingOptions || !this.executeProcess) {
            console.error("Missing processing options or execute function");
            throw new Error("Processing options or execute function not available");
        }

        const input = queueItem.preRenderedFile;
        if (!input) {
            throw new Error("No pre-rendered file available");
        }

        // Check if any processing options are enabled
        const hasProcessingOptions = this.processingOptions.interpolate || 
                                   this.processingOptions.upscale || 
                                   this.processingOptions.deduplicate || 
                                   this.processingOptions.restore || 
                                   this.processingOptions.sharpening || 
                                   this.processingOptions.resize;

        console.log("Has processing options:", hasProcessingOptions);

        if (!hasProcessingOptions) {
            // Just import the rendered video without processing
            console.log("No processing options enabled, importing video directly");
            await evalTS("importVideo", input);
            return;
        }

        // Build the processing command
        const aeContext = await getValidatedAEContext();
        if (!aeContext) {
            throw new Error("Could not get AE context");
        }

        const { projectFolderPath } = aeContext;
        const randomNumbers = Math.floor(Math.random() * 100000);
        const outName = `Chain_${queueItem.layerName}_${randomNumbers}.mp4`;
        const tasChainFolder = path.join(projectFolderPath.replace(/\\$/, ""), "/TAS-Chain");
        
        if (!fs.existsSync(tasChainFolder)) {
            fs.mkdirSync(tasChainFolder, { recursive: true });
        }

        const outFile = projectFolderPath.replace(/\\$/, "") + "/TAS-Chain/" + outName;
        const command = this.buildChainCommand(input, outFile);

        // Execute the processing command with progress tracking
        return new Promise((resolve, reject) => {
            // Check for cancellation before starting
            if (this.processCancelledRef?.current) {
                reject(new Error('Processing cancelled'));
                return;
            }

            console.log("About to call executeProcess with command:", command);
            
            if (!this.executeProcess) {
                console.error("executeProcess is not available");
                reject(new Error('executeProcess function not available'));
                return;
            }

            try {
                const result = this.executeProcess(command, `Processing ${queueItem.layerName}`, () => {
                    // Success callback - check for cancellation
                    console.log("Processing completed successfully");
                    if (this.processCancelledRef?.current) {
                        reject(new Error('Processing cancelled'));
                        return;
                    }
                    
                    evalTS("importVideo", outFile);
                    resolve();
                }, input, outFile);
                
                console.log("executeProcess returned:", result);
            } catch (error) {
                console.error("Error calling executeProcess:", error);
                reject(error);
            }
        });
    }

    private async processLayer(queueItem: QueueItem): Promise<void> {
        console.log("processLayer called for:", queueItem.layerName);
        
        if (!this.processingOptions || !this.executeProcess) {
            console.error("Missing processing options or execute function");
            throw new Error("Processing options or execute function not available");
        }

        console.log("Selecting layer by index:", queueItem.layerIndex);
        // Select the specific layer in After Effects
        const layerSelected = await evalTS("selectLayerByIndex", queueItem.layerIndex);
        if (!layerSelected) {
            console.error("Could not select layer");
            throw new Error(`Could not select layer at index ${queueItem.layerIndex}`);
        }
        console.log("Layer selected successfully");

        // Render the layer
        console.log("Starting render with algorithm:", this.processingOptions.preRenderAlgorithm);
        const renderAlgo = this.processingOptions.preRenderAlgorithm;
        const info = await evalTS("render", renderAlgo);
        console.log("Render result:", info);
        
        if (info === "undefined") {
            console.error("Rendering failed");
            throw new Error("Rendering failed. Consider using an alternative encoding method.");
        }

        const input = info?.input;
        if (!input) {
            console.error("No input file from render");
            throw new Error("No input file from render");
        }
        console.log("Input file:", input);

        // Check if any processing options are enabled
        const hasProcessingOptions = this.processingOptions.interpolate || 
                                   this.processingOptions.upscale || 
                                   this.processingOptions.deduplicate || 
                                   this.processingOptions.restore || 
                                   this.processingOptions.sharpening || 
                                   this.processingOptions.resize;

        console.log("Has processing options:", hasProcessingOptions);

        if (!hasProcessingOptions) {
            // Just import the rendered video without processing
            console.log("No processing options enabled, importing video directly");
            await evalTS("importVideo", input);
            return;
        }

        // Build the processing command
        const aeContext = await getValidatedAEContext();
        if (!aeContext) {
            throw new Error("Could not get AE context");
        }

        const { projectFolderPath } = aeContext;
        const randomNumbers = Math.floor(Math.random() * 100000);
        const outName = `Chain_${queueItem.layerName}_${randomNumbers}.mp4`;
        const tasChainFolder = path.join(projectFolderPath.replace(/\\$/, ""), "/TAS-Chain");
        
        if (!fs.existsSync(tasChainFolder)) {
            fs.mkdirSync(tasChainFolder, { recursive: true });
        }

        const outFile = projectFolderPath.replace(/\\$/, "") + "/TAS-Chain/" + outName;
        const command = this.buildChainCommand(input, outFile);

        // Execute the processing command
        return new Promise((resolve, reject) => {
            // Check for cancellation before starting
            if (this.processCancelledRef?.current) {
                reject(new Error('Processing cancelled'));
                return;
            }

            console.log("About to call executeProcess with command:", command);
            
            if (!this.executeProcess) {
                console.error("executeProcess is not available");
                reject(new Error('executeProcess function not available'));
                return;
            }

            try {
                const result = this.executeProcess(command, `Processing ${queueItem.layerName}`, () => {
                    // Success callback - check for cancellation
                    console.log("Processing completed successfully");
                    if (this.processCancelledRef?.current) {
                        reject(new Error('Processing cancelled'));
                        return;
                    }
                    
                    evalTS("importVideo", outFile);
                    resolve();
                }, input, outFile);
                
                console.log("executeProcess returned:", result);
            } catch (error) {
                console.error("Error calling executeProcess:", error);
                reject(error);
            }
        });
    }

    private buildChainCommand(input: string, outFile: string): string {
        if (!this.processingOptions) {
            throw new Error("Processing options not set");
        }

        const { pythonExePath, mainPyPath } = getTASPaths();
        
        const inputQuoted = `"${input}"`;
        const outFileQuoted = `"${outFile}"`;
        
        const attempt = [
            `"${pythonExePath}"`,
            `"${mainPyPath}"`,
            "--input",
            inputQuoted,
            "--output",
            outFileQuoted,
            "--ae",
        ];

        const opts = this.processingOptions;

        if (opts.enablePreview) {
            attempt.push("--preview");
        }

        if (opts.encodeAlgorithm) {
            attempt.push("--encode_method", opts.encodeAlgorithm);
        }

        if (opts.bitDepth) {
            attempt.push("--bit_depth", opts.bitDepth);
        }

        if (opts.resize) {
            attempt.push("--resize", "--resize_factor", opts.resizeFactor);
        }

        if (opts.interpolate) {
            const newinterpolateFactor = opts.interpolateFactor.endsWith("x") 
                ? opts.interpolateFactor.slice(0, -1) 
                : opts.interpolateFactor;

            if (isNaN(Number(newinterpolateFactor))) {
                throw new Error("Invalid interpolation factor");
            }

            attempt.push(
                "--interpolate",
                "--interpolate_factor",
                newinterpolateFactor,
                "--interpolate_method",
                opts.interpolationModel
            );

            if (opts.slowMotion) attempt.push("--slowmo");
            if (opts.rifeensemble) attempt.push("--ensemble");
            if (opts.dynamicScale) attempt.push("--dynamic_scale");
        }

        if (opts.upscale) {
            attempt.push("--upscale", "--upscale_method", opts.upscaleModel);
            if (opts.forceStatic) attempt.push("--static");
        }

        if (opts.deduplicate) {
            attempt.push(
                "--dedup",
                "--dedup_sens",
                String(opts.deduplicateSensitivity * 100),
                "--dedup_method",
                opts.deduplicateMethod
            );
        }

        if (opts.restore) {
            attempt.push("--restore", "--restore_method", opts.restoreModel);
        }

        if (opts.sharpening) {
            attempt.push(
                "--sharpen",
                "--sharpen_sens",
                String(opts.sharpeningSensitivity * 100)
            );
        }

        if (opts.aiPrecision) {
            attempt.push("--half", opts.aiPrecision);
        }

        return addPortToCommand(attempt.join(" "));
    }

    clearQueue(): void {
        if (this.isProcessing) {
            generateToast(2, "Cannot clear queue while processing. Cancel processing first.");
            return;
        }
        
        this.queue = [];
        this.notifyQueueUpdate();
        generateToast(3, "Queue cleared.");
    }

    removeFromQueue(itemId: string): void {
        if (this.isProcessing && this.currentItem?.id === itemId) {
            generateToast(2, "Cannot remove currently processing item.");
            return;
        }

        this.queue = this.queue.filter(item => item.id !== itemId);
        this.notifyQueueUpdate();
        generateToast(3, "Item removed from queue.");
    }

    cancelProcessing(): void {
        if (!this.isProcessing) {
            generateToast(2, "No processing to cancel.");
            return;
        }

        // Set cancellation flags
        if (this.processCancelledRef) {
            this.processCancelledRef.current = true;
        }
        
        if (this.setIsProcessCancelled) {
            this.setIsProcessCancelled(true);
        }

        // Kill running processes
        try {
            const { child_process } = require("../../lib/cep/node");
            const killCommand = "taskkill /f /im python.exe & taskkill /f /im ffmpeg.exe & taskkill /f /im ffprobe.exe";
            child_process.exec(killCommand, (error: any) => {
                if (error) {
                    console.warn("Error killing processes:", error);
                }
            });
        } catch (error) {
            console.warn("Error executing kill command:", error);
        }

        // Reset progress
        if (this.resetProgress) {
            this.resetProgress("Processing cancelled");
        }

        // Mark current item as cancelled and reset all pending items
        if (this.currentItem) {
            this.currentItem.status = 'failed';
            this.currentItem.error = 'Cancelled by user';
        }

        // Reset all pending items to pending status (they can be restarted)
        this.queue.forEach(item => {
            if (item.status === 'processing') {
                item.status = 'failed';
                item.error = 'Cancelled by user';
            }
        });

        this.isProcessing = false;
        this.currentItem = null;
        this.notifyQueueUpdate();

        generateToast(2, "Queue processing cancelled.");
    }

    getQueue(): QueueItem[] {
        return [...this.queue];
    }

    isQueueProcessing(): boolean {
        return this.isProcessing;
    }

    getCurrentItem(): QueueItem | null {
        return this.currentItem;
    }

    private notifyQueueUpdate(): void {
        if (this.onQueueUpdate) {
            this.onQueueUpdate([...this.queue]);
        }
    }
}