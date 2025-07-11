import { generateToast } from "../../js/main/utils/generateToast";

export const example = () => {};

export const getPath = () => {
    if (app.project.file !== null) {
        return app.project.file.fsName;
    } else {
        return "undefined";
    }
};

let currentLayer: Layer | null = null;
let currentComp: CompItem | null = null;
let earliestInPoint: number = 0;

function anyLayerSelected() {
    if (
        !app.project ||
        !app.project.activeItem ||
        !(app.project.activeItem instanceof CompItem) ||
        app.project.activeItem.selectedLayers.length < 1
    ) {
        return false;
    }

    var comp = app.project.activeItem as CompItem;

    if (comp.selectedLayers.length > 0) {
        currentLayer = comp.selectedLayers[0] as Layer;
        currentComp = comp;
        return true;
    } else {
        return false;
    }
}

function autoclip(tasAppdataPath: string) {
    try {
        var autoClipLogPath = tasAppdataPath + "\\autoclipresults.txt";
        var autoClipLog = new File(autoClipLogPath);
        autoClipLog.open("r");

        if (currentLayer == null) {
            generateToast(2, "Please select a layer.");
            return;
        }

        var inPoint = currentLayer.inPoint;
        var outPoint = currentLayer.outPoint;
        while (!autoClipLog.eof) {
            var line = autoClipLog.readln();
            if (currentComp == null) {
                generateToast(2, "No active composition found.");
                return;
            }
            var parsedInput = parseInputAsFrame(line, currentComp);
            var timestamp = parsedInput + inPoint;
            if (currentLayer == null) {
                generateToast(2, "Please select a layer.");
                return;
            }
            var duplicateLayer = currentLayer.duplicate();
            currentLayer.outPoint = timestamp;
            duplicateLayer.inPoint = timestamp;

            currentLayer = duplicateLayer;
        }
        autoClipLog.close();
    } catch (error: any) {
        generateToast(2, "Error auto-cutting clip: " + error.toString());
    }
}

function importOutput(outPath: string) {
    try {
        if (!app) {
            generateToast(2, "This script is not running in a compatible environment.");
            return;
        }
        if (currentComp == null) {
            var activeComp = app.project.activeItem;
            if (activeComp && activeComp instanceof CompItem && activeComp !== null) {
                currentComp = activeComp;
            } else {
                generateToast(2, "No active or existent composition has been selected.");
                return;
            }
        }

        var importOptions = new ImportOptions(File(outPath));
        var importedFile = app.project.importFile(importOptions);
        var inputLayer = currentComp.layers.add(importedFile as AVItem);

        if (earliestInPoint > 0) {
            inputLayer.startTime = earliestInPoint;
        } else if (earliestInPoint === 0 && currentLayer) {
            if (currentLayer.inPoint < 0) {
                inputLayer.startTime = 0;
            } else {
                inputLayer.startTime = currentLayer.inPoint;
            }
        }

        if (currentLayer) {
            inputLayer.moveBefore(currentLayer);
        } else {
            inputLayer.moveToBeginning();
        }

        if (inputLayer.source.width > currentComp.width) {
            var scaleFactor = (currentComp.width / inputLayer.source.width) * 100;
            var scaleProperty = inputLayer.property("ADBE Transform Group").property("ADBE Scale");
            if (scaleProperty !== null && scaleProperty instanceof Property) {
                scaleProperty.setValue([scaleFactor, scaleFactor]);
            } else {
                generateToast(2, "Unable to access the Scale property.");
            }
        }

        currentLayer = null;
        currentComp = null;
    } catch (error: any) {
        generateToast(2, "Error importing output: " + error.toString());
    }
}

function renderActiveComp(renderMethod: string) {
    try {
        var projectPath = getPath();
        if (projectPath == null) {
            return null;
        }

        projectPath = projectPath.replace(/[^\\]+$/, "");
        var preRendersPath = projectPath + "TAS-PreRenders\\";
        var preRendersDir = new Folder(preRendersPath);
        if (!preRendersDir.exists) {
            preRendersDir.create();
        }

        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            generateToast(2, "No active composition selected.");
            return null;
        }

        var originalWorkAreaStart = comp.workAreaStart;
        var originalWorkAreaDuration = comp.workAreaDuration;

        var template = "Draft";
        var outputContainer = ".mp4";
        renderMethod = renderMethod.toLowerCase();

        if (renderMethod === "high") {
            template = "High Quality";
            outputContainer = ".mov";
        } else if (renderMethod === "lossless") {
            template = "Lossless";
            outputContainer = ".avi";
        } else {
            template = "Lossless";
            outputContainer = ".avi";
        }

        if (comp.selectedLayers.length > 0) {
            var selectedLayers = comp.selectedLayers;
            var layerStart = selectedLayers[0].inPoint;
            var layerEnd = selectedLayers[0].outPoint;

            for (var i = 0; i < selectedLayers.length; i++) {
                var selectedLayer = selectedLayers[i];
                layerStart = Math.min(layerStart, selectedLayer.inPoint);
                layerEnd = Math.max(layerEnd, selectedLayer.outPoint);
            }

            comp.workAreaStart = Math.max(layerStart, 0);

            var calculatedDuration;
            if (layerStart < 0) {
                calculatedDuration = layerEnd;
            } else {
                calculatedDuration = layerEnd - layerStart;
            }

            var minDuration = comp.frameDuration;
            var workAreaDuration = Math.max(calculatedDuration, minDuration);

            var maxAllowedDuration = comp.duration - comp.workAreaStart;
            workAreaDuration = Math.min(workAreaDuration, maxAllowedDuration);

            comp.workAreaDuration = workAreaDuration;
        }

        earliestInPoint = comp.workAreaStart;
        var renderQueueItem = app.project.renderQueue.items.add(comp);
        var chars = "ABCDEFGHIJKLMNOPQRSTVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var randomId = "";
        for (var i = 0; i < 5; i++) {
            randomId += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        var outputName: string;
        if (comp.selectedLayers.length === 1) {
            var layerName = comp.selectedLayers[0].name;
            var cleanLayerName = layerName.replace(/[^a-zA-Z0-9_\-]/g, "_");
            outputName = cleanLayerName + "_" + randomId + outputContainer;
        } else {
            outputName = "Prerender_" + randomId + outputContainer;
        }
        var outputPath = preRendersPath + outputName;
        var outputModule = renderQueueItem.outputModule(1);

        try {
            outputModule.applyTemplate(template);
        } catch (error: any) {
            if (template === "High Quality") {
                template = "Lossless";
                outputContainer = ".avi";
                outputName = outputName.replace(".mov", ".avi");
                outputPath = preRendersPath + outputName;
                outputModule.applyTemplate(template);
            } else {
        generateToast(2, "Error applying render template: " + error.toString() + ". Please check the pre-render settings.");
            }
        }

        outputModule.file = new File(outputPath);

        app.project.renderQueue.render();
        app.project.renderQueue.showWindow(false);
        comp.workAreaStart = originalWorkAreaStart;
        comp.workAreaDuration = originalWorkAreaDuration;

        var info = {
            input: outputPath,
            inpoint: 0,
            outpoint: 0,
            name: outputName,
            layerIndex: comp.selectedLayers[0].index,
            layerInpoint: comp.selectedLayers[0].inPoint,
        };

        currentComp = comp;
        currentLayer = comp.selectedLayers[0] as AVLayer;

        return info;
    } catch (error: any) {
        generateToast(2, "Error rendering active composition: " + error.toString());
        return null;
    }
}

function clearCache(): void {
    try {
        app.purge(PurgeTarget.ALL_CACHES);
    } catch (error: any) {
        generateToast(2, "Error clearing cache: " + error.toString());
    }
}

function createAdjustmentLayer(duration: string) {
    if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        return;
    }

    const comp = app.project.activeItem as CompItem;
    if (comp.selectedLayers.length < 1) {
        return false;
    }

    const selectedLayer = comp.selectedLayers[0] as AVLayer;
    const frameDuration = 1 / comp.frameRate;
    let adjustmentLayerDuration = frameDuration;

    switch (duration) {
        case "1":
            adjustmentLayerDuration = frameDuration;
            break;
        case "2":
            adjustmentLayerDuration = 2 * frameDuration;
            break;
        case "3":
            adjustmentLayerDuration = 3 * frameDuration;
            break;
        case "4":
            adjustmentLayerDuration = 4 * frameDuration;
            break;
        case "entire":
            adjustmentLayerDuration = selectedLayer.outPoint - selectedLayer.inPoint;
            break;
    }

    const adjustmentLayer = comp.layers.addSolid(
        [1, 1, 1],
        "Adjustment Layer",
        comp.width,
        comp.height,
        comp.pixelAspect,
        adjustmentLayerDuration
    );
    adjustmentLayer.adjustmentLayer = true;
    adjustmentLayer.startTime = selectedLayer.inPoint;

    if (duration !== "entire") {
        adjustmentLayer.outPoint = adjustmentLayer.startTime + adjustmentLayerDuration;
    } else {
        adjustmentLayer.outPoint = selectedLayer.outPoint;
    }

    adjustmentLayer.moveBefore(selectedLayer);
    return true;
}
function createSolidLayer(duration: string, hexColor: string) {
    if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        generateToast(2, "Please select a composition.");
        return;
    }

    const comp = app.project.activeItem as CompItem;
    if (comp.selectedLayers.length < 1) {
        return false;
    }

    const selectedLayer = comp.selectedLayers[0] as AVLayer;
    const frameDuration = 1 / comp.frameRate;
    let solidLayerDuration = frameDuration;

    switch (duration) {
        case "1":
            solidLayerDuration = frameDuration;
            break;
        case "2":
            solidLayerDuration = 2 * frameDuration;
            break;
        case "3":
            solidLayerDuration = 3 * frameDuration;
            break;
        case "4":
            solidLayerDuration = 4 * frameDuration;
            break;
        case "entire":
            solidLayerDuration = selectedLayer.outPoint - selectedLayer.inPoint;
            break;
    }

    const solidLayer = comp.layers.addSolid(
        [0, 0, 0],
        "Solid Layer",
        comp.width,
        comp.height,
        comp.pixelAspect,
        solidLayerDuration
    );
    solidLayer.startTime = selectedLayer.inPoint;

    if (duration !== "entire") {
        solidLayer.outPoint = solidLayer.startTime + solidLayerDuration;
    } else {
        solidLayer.outPoint = selectedLayer.outPoint;
    }

    solidLayer.moveBefore(selectedLayer);
    return true;
}

function createNullLayer(duration: string) {
    if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        generateToast(2, "Please select a composition.");
        return;
    }

    const comp = app.project.activeItem as CompItem;
    if (comp.selectedLayers.length < 1) {
        return false;
    }

    const selectedLayer = comp.selectedLayers[0] as AVLayer;
    const frameDuration = 1 / comp.frameRate;
    let nullLayerDuration = frameDuration;

    switch (duration) {
        case "1":
            nullLayerDuration = frameDuration;
            break;
        case "2":
            nullLayerDuration = 2 * frameDuration;
            break;
        case "3":
            nullLayerDuration = 3 * frameDuration;
            break;
        case "4":
            nullLayerDuration = 4 * frameDuration;
            break;
        case "entire":
            nullLayerDuration = selectedLayer.outPoint - selectedLayer.inPoint;
            break;
    }

    const nullLayer = comp.layers.addNull(nullLayerDuration);
    nullLayer.startTime = selectedLayer.inPoint;

    if (duration !== "entire") {
        nullLayer.outPoint = nullLayer.startTime + nullLayerDuration;
    } else {
        nullLayer.outPoint = selectedLayer.outPoint;
    }

    nullLayer.moveBefore(selectedLayer);
    return true;
}

export const sequenceLayers = (order: string) => {
    if (!app.project?.activeItem || !(app.project.activeItem instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    const comp = app.project.activeItem as CompItem;
    const selectedLayers = comp.selectedLayers;

    if (selectedLayers.length < 2) {
        return false;
    }

    if (order !== "topDown" && order !== "bottomUp") {
        generateToast(2, "Invalid order. Use 'topDown' or 'bottomUp'.");
        return;
    }

    const sortedLayers = selectedLayers.slice().sort((a, b) => {
        return order === "bottomUp" ? b.index - a.index : a.index - b.index;
    });

    app.beginUndoGroup("Sequence Layers");

    let currentTime = sortedLayers[0].inPoint;
    for (const layer of sortedLayers) {
        const offset = layer.inPoint - layer.startTime;
        layer.startTime = currentTime - offset;
        currentTime += layer.outPoint - layer.inPoint;
    }

    app.endUndoGroup();
    return true;
};

export const takeAScreenshot = (output: string) => {
    if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        return false;
    }
    const comp = app.project.activeItem as CompItem;
    comp.saveFrameToPng(comp.time, new File(output));

    return true;
};

function precomposeSelectedLayers(name?: string): boolean | string {
    try {
        if (
            !app.project ||
            !app.project.activeItem ||
            !(app.project.activeItem instanceof CompItem)
        ) {
            return "Please select a composition.";
        }

        const comp = app.project.activeItem as CompItem;
        const selectedLayers = comp.selectedLayers;

        if (selectedLayers.length < 1) {
            return "Please select at least one layer.";
        }

        let earlyInPoint = selectedLayers[0].inPoint;
        let latestOutPoint = selectedLayers[0].outPoint;

        for (let i = 1; i < selectedLayers.length; i++) {
            earlyInPoint = Math.min(earlyInPoint, selectedLayers[i].inPoint);
            latestOutPoint = Math.max(latestOutPoint, selectedLayers[i].outPoint);
        }

        const timeSpan = latestOutPoint - earlyInPoint;

        const layerIndices: number[] = [];
        for (let i = 0; i < selectedLayers.length; i++) {
            layerIndices.push(selectedLayers[i].index);
        }

        const lowestIndex = Math.min(...layerIndices);

        const precompName = name || "Precomp " + new Date().getTime();

        app.beginUndoGroup("Precompose Layers");

        const newComp = comp.layers.precompose(layerIndices, precompName, true);

        newComp.duration = timeSpan;

        for (let i = 1; i <= newComp.numLayers; i++) {
            const layer = newComp.layer(i);
            layer.startTime -= earliestInPoint;
        }

        const precompLayer = comp.layer(lowestIndex) as AVLayer;
        precompLayer.startTime = earliestInPoint;
        precompLayer.inPoint = earliestInPoint;
        precompLayer.outPoint = latestOutPoint;

        app.endUndoGroup();
        return true;
    } catch (error: any) {
        alert("Error precomposing layers: " + error.toString());
        return false;
    }
}

export const precompose = (name?: string) => {
    return precomposeSelectedLayers(name);
};

export const screenshot = (output: string) => {
    return takeAScreenshot(output);
};

export const sortLayers = (order: string) => {
    return sequenceLayers(order);
};
export const addSolidLayer = (layerLength: string, hexColor: string) => {
    return createSolidLayer(layerLength, hexColor);
};

export const addAdjustmentLayer = (layerLength: string) => {
    return createAdjustmentLayer(layerLength);
};

export const addNullLayer = (layerLenght: string) => {
    return createNullLayer(layerLenght);
};

export const importVideo = (outPath: string) => {
    return importOutput(outPath);
};

export const isAnyLayerSelected = () => {
    return anyLayerSelected();
};

export const render = (renderMethod: string) => {
    return renderActiveComp(renderMethod);
};

export const autoClip = (tasAppdataPath: string) => {
    return autoclip(tasAppdataPath);
};

export const clear = () => {
    return clearCache();
};

export const removeDuplicates = () => {
    return removeDuplicateFrames();
};


function frameToTime(frameNumber: number, comp: CompItem): number {
    return frameNumber / comp.frameRate;
}


function parseInputAsFrame(input: string | number, comp: CompItem): number {
    if (typeof input === "string") {
        const parsed = parseFloat(input);
        if (parsed === Math.floor(parsed) && parsed > comp.frameRate) {
            return frameToTime(parsed, comp);
        } else {
            return parsed;
        }
    }
    return input;
}

export const removeDuplicateFrames = (
    samplingAccuracy: number = 4,
    primaryThreshold: number = 5,
    secondaryThreshold: number = 3,
    maxConsecutiveSkips: number = 2
): boolean => {
    try {
        if (!app.project?.activeItem || !(app.project.activeItem instanceof CompItem)) {
            generateToast(2, "No composition selected");
            return false;
        }

        const comp = app.project.activeItem as CompItem;
        if (comp.selectedLayers.length === 0) {
            generateToast(2, "Please select at least one layer");
            return false;
        }

        app.beginUndoGroup("Remove Duplicate Frames (Improved)");

        const selected = comp.selectedLayers;
        const width = comp.width;
        const height = comp.height;
        const frameDuration = comp.frameDuration;

        const colorText = comp.layers.addText();
        colorText.enabled = false;
        const colorSourceText = colorText.property("Source Text") as Property;

        for (let i = 0; i < selected.length; i++) {
            const layer = selected[i] as AVLayer;
            const outPoint = layer.outPoint;
            const inPoint = layer.inPoint;

            if (!layer.canSetTimeRemapEnabled) {
                generateToast(2, `Layer "${layer.name}" does not support time remapping`);
                continue;
            }

            layer.timeRemapEnabled = false;
            layer.timeRemapEnabled = true;

            let curTime = inPoint;
            let prevFrame: number[][] = [];
            let consecutiveSkips = 0;

            const timeRemapProperty = layer.property("ADBE Time Remapping") as Property;
            timeRemapProperty.addKey(curTime);

            const totalFrames = Math.floor((outPoint - inPoint) / frameDuration);

            for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
                curTime = inPoint + frameDuration * frameIndex;
                comp.time = curTime;

                if (curTime >= outPoint) {
                    break;
                }

                const curFrame = sampleFrameColors(colorSourceText, layer, width, height, samplingAccuracy);

                if (frameIndex > 0) {
                    const colorDifference = calculateFrameDifference(curFrame, prevFrame);
                    const identicalPixels = countIdenticalPixels(curFrame, prevFrame);
                    const allPixelsIdentical = identicalPixels === samplingAccuracy;

                    const shouldKeepFrame = 
                        (!allPixelsIdentical && colorDifference >= primaryThreshold) ||
                        (allPixelsIdentical && colorDifference >= primaryThreshold) ||
                        (consecutiveSkips >= maxConsecutiveSkips && colorDifference >= secondaryThreshold);

                    if (shouldKeepFrame) {
                        timeRemapProperty.addKey(curTime);
                        prevFrame = curFrame.slice();
                        consecutiveSkips = 0;
                    } else {
                        consecutiveSkips++;
                    }
                } else {
                    prevFrame = curFrame.slice();
                }
            }

            cleanupTimeRemapKeyframes(timeRemapProperty, layer, frameDuration);
        }

        if (colorText && colorText.index <= comp.numLayers) {
            colorText.remove();
        }

        app.endUndoGroup();
        return true;
    } catch (error: any) {
        generateToast(2, "Error removing duplicate frames: " + error.toString());
        return false;
    }
};

function sampleFrameColors(
    colorSourceText: Property,
    layer: AVLayer,
    width: number,
    height: number,
    accuracy: number
): number[][] {
    const samples: number[][] = [];
    const sampleWidth = width / accuracy;
    const sampleHeight = height / 4;

    for (let x = 0; x < accuracy; x++) {
        const sampleX = (x + 0.5) * sampleWidth;
        const sampleY = height / 2;

        colorSourceText.expression = `
            var layer = thisComp.layer("${layer.name}");
            var color = layer.sampleImage([${sampleX}, ${sampleY}], [${sampleWidth/2}, ${sampleHeight/2}]);
            var r = Math.round(color[0] * 255);
            var g = Math.round(color[1] * 255);
            var b = Math.round(color[2] * 255);
            r + "," + g + "," + b;
        `;

        const rgbString = colorSourceText.value.toString();
        const rgbValues = rgbString.split(",");
        const r = parseInt(rgbValues[0]) || 0;
        const g = parseInt(rgbValues[1]) || 0;
        const b = parseInt(rgbValues[2]) || 0;

        samples[x] = [r, g, b];
    }

    return samples;
}

function calculateFrameDifference(curFrame: number[][], prevFrame: number[][]): number {
    let totalDifference = 0;
    
    for (let i = 0; i < curFrame.length; i++) {
        if (curFrame[i] && prevFrame[i]) {
            const rDiff = Math.abs(curFrame[i][0] - prevFrame[i][0]);
            const gDiff = Math.abs(curFrame[i][1] - prevFrame[i][1]);
            const bDiff = Math.abs(curFrame[i][2] - prevFrame[i][2]);
            totalDifference += rDiff + gDiff + bDiff;
        }
    }
    
    return totalDifference;
}

function countIdenticalPixels(curFrame: number[][], prevFrame: number[][]): number {
    let identicalCount = 0;
    
    for (let i = 0; i < curFrame.length; i++) {
        if (curFrame[i] && prevFrame[i]) {
            const rDiff = Math.abs(curFrame[i][0] - prevFrame[i][0]);
            const gDiff = Math.abs(curFrame[i][1] - prevFrame[i][1]);
            const bDiff = Math.abs(curFrame[i][2] - prevFrame[i][2]);
            
            if (rDiff + gDiff + bDiff === 0) {
                identicalCount++;
            }
        }
    }
    
    return identicalCount;
}

function cleanupTimeRemapKeyframes(
    timeRemapProperty: Property,
    layer: AVLayer,
    frameDuration: number
): void {
    const numKeys = timeRemapProperty.numKeys;
    
    if (numKeys <= 1) return;

    if (timeRemapProperty.keyTime(numKeys) === layer.outPoint) {
        timeRemapProperty.removeKey(numKeys);
    }

    const finalNumKeys = timeRemapProperty.numKeys;
    let timeOffset = frameDuration;
    
    for (let keyIndex = 2; keyIndex <= finalNumKeys; keyIndex++) {
        if (keyIndex <= timeRemapProperty.numKeys) {
            const keyValue = timeRemapProperty.keyValue(keyIndex);
            timeRemapProperty.removeKey(keyIndex);
            timeRemapProperty.setValueAtTime(layer.inPoint + timeOffset, [keyValue]);
            timeOffset += frameDuration;
        }
    }

    layer.outPoint = layer.inPoint + timeOffset;
}
