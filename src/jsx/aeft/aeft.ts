export const example = () => { };

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

function autoclip(tasAppdataPath: string): string | void {
    try {
        var autoClipLogPath = tasAppdataPath + "\\autoclipresults.txt";
        var autoClipLog = new File(autoClipLogPath);
        autoClipLog.open("r");
        if (currentLayer == null) {
            return "AUTOCLIP ERROR: No layer selected. Please select a layer in the composition before running autoclip.";
        }

        var inPoint = currentLayer.inPoint;
        var outPoint = currentLayer.outPoint;

        // Batch read all lines first
        var lines = [];
        while (!autoClipLog.eof) {
            lines.push(autoClipLog.readln());
        }
        autoClipLog.close();

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (currentComp == null) {
                return "AUTOCLIP ERROR: No active composition found. Please ensure you have an active composition open.";
            }
            var parsedInput = parseInputAsFrame(line, currentComp);
            var timestamp = parsedInput + inPoint;
            if (currentLayer == null) {
                return "AUTOCLIP ERROR: Layer became null during processing. This may indicate a layer was deleted or the selection changed.";
            }
            var duplicateLayer = currentLayer.duplicate();
            currentLayer.outPoint = timestamp;
            duplicateLayer.inPoint = timestamp;

            currentLayer = duplicateLayer;
        }
    } catch (error: any) {
        return "AUTOCLIP CRITICAL ERROR: " + error.toString();
    }
}

export const setViewportZoom = (zoom: number) => {
    try {
        if (
            app.activeViewer &&
            app.activeViewer.views &&
            app.activeViewer.views.length > 0 &&
            typeof zoom === "number"
        ) {
            app.activeViewer.views[0].options.zoom = zoom;
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
};

function renderActiveComp(renderMethod: string): any | string {
    try {
        var comp = app.project.activeItem;
        var originalCompName = (comp && comp instanceof CompItem) ? comp.name : null;

        var projectPath = getPath();
        if (projectPath == null) {
            return null;
        }
        projectPath = projectPath.replace(/[^\\]+$/, "");
        var preRendersPath = projectPath + "TAS-PreRenders\\";
        var preRendersDir = new Folder(preRendersPath);
        if (!preRendersDir.exists) preRendersDir.create();

        if (!comp || !(comp instanceof CompItem)) {
            return "RENDER ERROR: No active composition selected. Please select a composition in the Project panel and make it active.";
        }

        var originalWorkAreaStart = comp.workAreaStart;
        var originalWorkAreaDuration = comp.workAreaDuration;

        var qualityKey = "lossless";
        renderMethod = (renderMethod || "").toLowerCase();
        if (renderMethod === "high") qualityKey = "high"; else if (renderMethod === "draft") qualityKey = "draft";

        var outputContainer = ".avi";
        if (qualityKey === "draft") outputContainer = ".mp4"; else if (qualityKey === "high") outputContainer = ".mov";

        if (comp.selectedLayers.length > 0) {
            var layerStart = comp.selectedLayers[0].inPoint;
            var layerEnd = comp.selectedLayers[0].outPoint;
            for (var s = 0; s < comp.selectedLayers.length; s++) {
                var sel = comp.selectedLayers[s];
                layerStart = Math.min(layerStart, sel.inPoint);
                layerEnd = Math.max(layerEnd, sel.outPoint);
            }
            comp.workAreaStart = Math.max(layerStart, 0);
            var calculatedDuration = (layerStart < 0) ? layerEnd : (layerEnd - layerStart);
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
        for (var r = 0; r < 5; r++) randomId += chars.charAt(Math.floor(Math.random() * chars.length));

        var outputName;
        if (comp.selectedLayers.length === 1) {
            var layerName = comp.selectedLayers[0].name;
            if (layerName.match(/\.(mp4|mov|avi|mkv)$/i)) layerName = layerName.replace(/\.(mp4|mov|avi|mkv)$/i, "");
            var cleanLayerName = layerName.replace(/[^a-zA-Z0-9_\-]/g, "_");
            outputName = cleanLayerName + "_" + randomId + outputContainer;
        } else {
            outputName = "Prerender_" + randomId + outputContainer;
        }
        var outputPath = preRendersPath + outputName;
        var outputModule = renderQueueItem.outputModule(1);

        var norm = function (str: string): string {
            return (str || "")
                .toLowerCase()
                .replace(/[àáâãäå]/g, "a")
                .replace(/[èéêë]/g, "e")
                .replace(/[ìíîï]/g, "i")
                .replace(/[òóôõö]/g, "o")
                .replace(/[ùúûü]/g, "u")
                .replace(/[^a-z0-9]/g, "");
        };
        var TEMPLATE_ALIASES: { [k: string]: string[] } = {
            lossless: ["lossless", "verlustfrei", "sinperdida", "sinperdidas", "sansperte", "senza", "ロスレス", "無損失"],
            high: ["highquality", "high", "hochqualitat", "hohequalitat", "alta", "altaqualidad", "hautequalite", "altaqualita", "高品質"],
            draft: ["draft", "entwurf", "borrador", "brouillon", "bozza", "ドラフト", "下書き"]
        };
        try {
            var availableTemplates: string[] = [];
            try { availableTemplates = (outputModule as any).templates || []; } catch (e) { }
            var chosen: string | null = null;
            var aliases = TEMPLATE_ALIASES[qualityKey] || [];
            for (var t = 0; t < availableTemplates.length && !chosen; t++) {
                var templ = availableTemplates[t];
                var n = norm(templ);
                for (var a = 0; a < aliases.length && !chosen; a++) {
                    if (n.indexOf(aliases[a]) !== -1) chosen = templ;
                }
            }
            if (!chosen && qualityKey !== "lossless") {
                for (var t2 = 0; t2 < availableTemplates.length && !chosen; t2++) {
                    var n2 = norm(availableTemplates[t2]);
                    if (n2.indexOf("lossless") !== -1 || n2.indexOf("verlustfrei") !== -1) chosen = availableTemplates[t2];
                }
            }
            if (chosen) {
                try { (outputModule as any).applyTemplate(chosen); } catch (applyErr) { }
            }
        } catch (locErr) { }

        outputModule.file = new File(outputPath);

        app.project.renderQueue.render();
        app.project.renderQueue.showWindow(false);

        if (originalCompName) {
            for (var idx = 1; idx <= app.project.numItems; idx++) {
                var item = app.project.item(idx);
                if (item && item instanceof CompItem && item.name === originalCompName) {
                    try { item.openInViewer(); } catch (e2) { }
                    break;
                }
            }
        }

        comp.workAreaStart = originalWorkAreaStart;
        comp.workAreaDuration = originalWorkAreaDuration;

        var info = {
            input: outputPath,
            inpoint: 0,
            outpoint: 0,
            name: outputName,
            layerIndex: comp.selectedLayers[0].index,
            layerInpoint: comp.selectedLayers[0].inPoint
        };
        currentComp = comp;
        currentLayer = comp.selectedLayers[0] as AVLayer;
        return info;
    } catch (error: any) {
        return "RENDER CRITICAL ERROR: " + error.toString();
    }
}

function clearCache(): string | void {
    try {
        app.purge(PurgeTarget.ALL_CACHES);
    } catch (error: any) {
        return "CACHE ERROR: Failed to clear After Effects cache. " + error.toString() + ". This may affect performance but is not critical.";
    }
}

function importOutput(outPath: string): string | void {
    try {
        if (!app) {
            return "IMPORT ERROR: After Effects application object not available. This script must run within After Effects.";
        }
        if (currentComp == null) {
            var activeComp = app.project.activeItem;
            if (activeComp && activeComp instanceof CompItem && activeComp !== null) {
                currentComp = activeComp;
            } else {
                return "IMPORT ERROR: No active composition found. Please open a composition and make it active.";
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
                return "IMPORT WARNING: Unable to access the Scale property for auto-scaling. The imported layer may not fit the composition.";
            }
        }

        currentLayer = null;
        currentComp = null;
    } catch (error: any) {
        return "IMPORT CRITICAL ERROR: " + error.toString();
    }
}

function createAdjustmentLayer(duration: string): boolean | string {
    if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        return "ADJUSTMENT LAYER ERROR: No composition selected. Please open and select a composition.";
    }

    const comp = app.project.activeItem as CompItem;
    if (comp.selectedLayers.length < 1) {
        return "ADJUSTMENT LAYER ERROR: No layer selected. Please select a layer in the composition.";
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
function createSolidLayer(duration: string, hexColor: string): boolean | string {
    if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        return "SOLID LAYER ERROR: No composition selected. Please open and select a composition.";
    }

    const comp = app.project.activeItem as CompItem;
    if (comp.selectedLayers.length < 1) {
        return "SOLID LAYER ERROR: No layer selected. Please select a layer in the composition.";
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

function createNullLayer(duration: string): boolean | string {
    if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        return "NULL LAYER ERROR: No composition selected. Please open and select a composition.";
    }

    const comp = app.project.activeItem as CompItem;
    if (comp.selectedLayers.length < 1) {
        return "NULL LAYER ERROR: No layer selected. Please select a layer in the composition.";
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

export const sequenceLayers = (order: string): boolean | string => {
    if (!app.project?.activeItem || !(app.project.activeItem instanceof CompItem)) {
        return "SEQUENCE LAYERS ERROR: No composition selected. Please open and select a composition.";
    }

    const comp = app.project.activeItem as CompItem;
    const selectedLayers = comp.selectedLayers;

    if (selectedLayers.length < 2) {
        return false;
    }

    if (order !== "topDown" && order !== "bottomUp") {
        return "SEQUENCE LAYERS ERROR: Invalid order parameter. Expected 'topDown' or 'bottomUp', received: '" + order + "'.";
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

export const takeAScreenshot = (output: string): boolean | string => {
    // Renders a single PNG frame via Render Queue to ensure all effects (incl. 3rd-party like Deep Glow) are applied.
    try {
        if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
            return "SCREENSHOT ERROR: No composition selected. Please open and select a composition.";
        }

    var comp = app.project.activeItem as CompItem;
    var originalCompName = comp && comp.name ? comp.name : null;

        var outFile = new File(output);
        var outFolder = outFile.parent as Folder;
        if (!outFolder.exists) {
            try { outFolder.create(); } catch (e) { /* ignore */ }
        }

        var outName = outFile.name;
        var dotIdx = outName.lastIndexOf(".");
        var baseName = dotIdx >= 0 ? outName.substring(0, dotIdx) : outName;
        var ext = dotIdx >= 0 ? outName.substring(dotIdx + 1) : "png";
        if ((ext + "").toLowerCase() !== "png") {
            ext = "png";
        }

        var originalTime = comp.time;
        var originalWorkAreaStart = comp.workAreaStart;
        var originalWorkAreaDuration = comp.workAreaDuration;
        var oneFrame = comp.frameDuration;

        var t = Math.max(0, Math.min(originalTime, Math.max(0, comp.duration - oneFrame)));

        var uniqueId = (new Date().getTime()).toString(36);
        var tempPrefix = baseName + "__tas_shot_" + uniqueId + "_"; // we'll render to tempPrefix + [#####].png

        try {
            var stale = outFolder.getFiles(tempPrefix + "*.png");
            for (var si = 0; si < stale.length; si++) {
                try { (stale[si] as File).remove(); } catch (re) { /* ignore */ }
            }
        } catch (glErr) { /* ignore */ }

        comp.workAreaStart = t;
        comp.workAreaDuration = oneFrame;

        var rq = app.project.renderQueue;
        var rqItem = rq.items.add(comp);

        try {
            var rs = (rqItem as any).getSettings && (rqItem as any).getSettings(GetSettingsFormat.STRING_SETTABLE);
            if (rs) {
                rs["Time Span"] = "Work Area Only";
                if (!rs["Quality"]) rs["Quality"] = "Best";
                if (!rs["Resolution"]) rs["Resolution"] = "Full";
                try { (rqItem as any).setSettings(rs); } catch (eSetRS) { /* ignore */ }
            }
        } catch (eRS2) { /* ignore */ }

        try {
            var rqTemplates = (rqItem as any).templates || [];
            var bestName: string | null = null;
            var norm = function (s: string): string {
                return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            };
            var bestAliases = ["bestsettings", "besteinstellungen", "meilleuresparametres", "mejoresajustes", "migliorimpostazioni"];
            for (var rt = 0; rt < rqTemplates.length && !bestName; rt++) {
                var n = norm(rqTemplates[rt]);
                for (var ra = 0; ra < bestAliases.length && !bestName; ra++) {
                    if (n.indexOf(bestAliases[ra]) !== -1) bestName = rqTemplates[rt];
                }
            }
            if (bestName) {
                try { (rqItem as any).applyTemplate(bestName); } catch (eApplyBest) { /* ignore */ }
            }
        } catch (eRS) { /* ignore */ }

        var om = rqItem.outputModule(1);
        var pngCapable = false;
        try {
            var omTemplates = (om as any).templates || [];
            var chosenOM: string | null = null;
            var norm2 = function (s: string): string { return (s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); };
            for (var i = 0; i < omTemplates.length && !chosenOM; i++) {
                var n2 = norm2(omTemplates[i]);
                if (n2.indexOf("png") !== -1) chosenOM = omTemplates[i];
            }
            if (chosenOM) {
                try { (om as any).applyTemplate(chosenOM); pngCapable = true; } catch (eApplyOM) { /* ignore */ }
            }
            if (!pngCapable) {
                try {
                    var omSet = (om as any).getSettings && (om as any).getSettings(GetSettingsFormat.STRING_SETTABLE);
                    if (omSet) {
                        omSet["Format"] = "PNG Sequence";
                        (om as any).setSettings(omSet);
                        pngCapable = true;
                    }
                } catch (forceOM) { /* ignore */ }
            }
        } catch (eOM) { /* ignore */ }

        if (!pngCapable) {
            comp.workAreaStart = originalWorkAreaStart;
            comp.workAreaDuration = originalWorkAreaDuration;
            try { (rqItem as any).remove(); } catch (eRm0) { /* ignore */ }
            try {
                comp.saveFrameToPng(originalTime, outFile);
                return true;
            } catch (fbOM) {
                return "SCREENSHOT ERROR: No PNG output module available and fallback failed.";
            }
        }

        var patternName = tempPrefix + "[#####].png";
        var patternFile = new File(outFolder.fsName + "/" + patternName);
        om.file = patternFile;

        var prevRenderFlags: boolean[] = [];
        try {
            var totalItems = rq.numItems;
            for (var qi = 1; qi <= totalItems; qi++) {
                var it = rq.item(qi);
                prevRenderFlags[qi] = it.render;
                if (it !== rqItem) it.render = false;
            }
        } catch (flagErr) { /* ignore */ }

        rq.showWindow(false);
        rq.render();
        try { rq.showWindow(false); } catch (eHide) { /* ignore */ }
        try {
            if (originalCompName) {
                try { comp.openInViewer(); } catch (eOpen1) {
                    for (var idx = 1; idx <= app.project.numItems; idx++) {
                        var item = app.project.item(idx);
                        if (item && item instanceof CompItem && item.name === originalCompName) {
                            try { item.openInViewer(); } catch (eOpen2) { /* ignore */ }
                            break;
                        }
                    }
                }
            }
        } catch (eFocus) { /* ignore */ }

        try {
            var totalItems2 = rq.numItems;
            for (var qj = 1; qj <= totalItems2; qj++) {
                var it2 = rq.item(qj);
                // @ts-ignore
                if (typeof prevRenderFlags[qj] !== "undefined") it2.render = prevRenderFlags[qj];
            }
        } catch (flagRestoreErr) { /* ignore */ }

        var produced: any[] = outFolder.getFiles(tempPrefix + "*.png");
        if (!produced || produced.length < 1) {
            try {
                comp.saveFrameToPng(originalTime, outFile);
                // Restore state
                comp.workAreaStart = originalWorkAreaStart;
                comp.workAreaDuration = originalWorkAreaDuration;
                try { comp.openInViewer(); } catch (eOpenFB) { /* ignore */ }
                return true;
            } catch (fallbackErr) {
                // Restore state
                comp.workAreaStart = originalWorkAreaStart;
                comp.workAreaDuration = originalWorkAreaDuration;
                return "SCREENSHOT ERROR: Render produced no PNG and fallback failed: " + fallbackErr;
            }
        }

        var pick = produced[0] as File;
        if (produced.length > 1) {
            var newestIdx = 0;
            var newestTime = (produced[0] as File).modified.getTime();
            for (var pf = 1; pf < produced.length; pf++) {
                var mt = (produced[pf] as File).modified.getTime();
                if (mt > newestTime) { newestTime = mt; newestIdx = pf; }
            }
            pick = produced[newestIdx] as File;
        }

        var finalOut = new File(outFolder.fsName + "/" + baseName + "." + ext);
        if (outFile.fsName && outFile.fsName.length > 0) {
            finalOut = outFile;
        }

        if (finalOut.exists) { try { finalOut.remove(); } catch (er) { /* ignore */ } }
        var copied = pick.copy(finalOut.fsName);
        // Clean up temp file
        try { pick.remove(); } catch (er2) { /* ignore */ }

        comp.workAreaStart = originalWorkAreaStart;
        comp.workAreaDuration = originalWorkAreaDuration;
        try { (rqItem as any).remove(); } catch (eRm) { /* ignore */ }
    try { comp.openInViewer(); } catch (eOpen3) { /* ignore */ }

        if (copied) return true;
        try {
            comp.saveFrameToPng(originalTime, outFile);
            // Ensure comp viewer is active
            try { comp.openInViewer(); } catch (eOpen4) { /* ignore */ }
            return true;
        } catch (fb2) {
            return "SCREENSHOT ERROR: Could not move rendered frame to destination (and fallback failed).";
        }
    } catch (error: any) {
        try {
            if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
                var comp2 = app.project.activeItem as CompItem;
                comp2.saveFrameToPng(comp2.time, new File(output));
                try { comp2.openInViewer(); } catch (eOpen5) { /* ignore */ }
                return true;
            }
        } catch (e2) { /* ignore */ }
        return "SCREENSHOT ERROR: Failed to save screenshot. " + error.toString();
    }
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
        return "PRECOMPOSE CRITICAL ERROR: " + error.toString();
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

export const removeDuplicates = (
    samplingAccuracy?: number,
    primaryThreshold?: number,
    secondaryThreshold?: number,
    maxConsecutiveSkips?: number
) => {
    return removeDuplicateFrames(samplingAccuracy, primaryThreshold, secondaryThreshold, maxConsecutiveSkips);
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



export function getSelectedKeyframeBezier() {
    try {
        if (
            !app.project ||
            !app.project.activeItem ||
            !(app.project.activeItem instanceof CompItem)
        ) {
            return "Error: No comp (app.project.activeItem is not a CompItem)";
        }
        var comp = app.project.activeItem as CompItem;
        if (comp.selectedLayers.length === 0) return "Error: No layer selected";
        var layer = comp.selectedLayers[0];
        var selectedProps = layer.selectedProperties;
        if (!selectedProps || selectedProps.length === 0) return "Error: No property selected";
        var prop = null;
        for (var i = 0; i < selectedProps.length; i++) {
            if (
                //@ts-ignore
                selectedProps[i].numKeys &&
                //@ts-ignore
                selectedProps[i].selectedKeys &&
                //@ts-ignore
                selectedProps[i].selectedKeys.length > 1
            ) {
                prop = selectedProps[i];
                break;
            }
        }
        if (!prop) return "Error: No property with 2 selected keyframes (numKeys/selectedKeys)";
        // @ts-ignore
        var keys = prop.selectedKeys;
        if (!keys || keys.length < 2) return "Error: Select 2 keyframes (keys.length=" + (keys ? keys.length : "null") + ")";
        var key1 = keys[0];
        var key2 = keys[1];
        // @ts-ignore
        var interpType1 = prop.keyOutInterpolationType(key1);
        // @ts-ignore
        var interpType2 = prop.keyInInterpolationType(key2);
        if (
            interpType1 !== KeyframeInterpolationType.BEZIER ||
            interpType2 !== KeyframeInterpolationType.BEZIER
        )
            return "Error: Selected keyframes are not bezier (interpType1=" + interpType1 + ", interpType2=" + interpType2 + ")";
        // @ts-ignore
        var outTemp = prop.keyOutTemporalEase(key1);
        // @ts-ignore
        var inTemp = prop.keyInTemporalEase(key2);
        if (!outTemp || !inTemp) return "Error: Could not get temporal ease (outTemp=" + outTemp + ", inTemp=" + inTemp + ")";
        var outInfluence = outTemp[0].influence / 100.0;
        var inInfluence = inTemp[0].influence / 100.0;
        var outSpeed = outTemp[0].speed;
        var inSpeed = inTemp[0].speed;

        // AE's cubic-bezier is not directly accessible, but we can estimate
        // We'll use a common approximation: x1 = outInfluence, y1 = outSpeed, x2 = inInfluence, y2 = inSpeed
        // This is not 100% accurate but gives a usable curve for most cases
        if (outInfluence < 0 || outInfluence > 1 || inInfluence < 0 || inInfluence > 1) {
            return "Error: Influence values must be between 0 and 1 (outInfluence=" + outInfluence + ", inInfluence=" + inInfluence + ")";
        }
        var x1 = Math.max(0, Math.min(1, outInfluence));
        var y1 = Math.max(-1, Math.min(2, outSpeed / 10));
        var x2 = Math.max(0, Math.min(1, inInfluence));
        var y2 = Math.max(-1, Math.min(2, inSpeed / 10));
        return x1.toFixed(3) + "," + y1.toFixed(3) + "," + x2.toFixed(3) + "," + y2.toFixed(3);
    } catch (e) {
        return "Error (exception): " + e;
    }
}

export function getSelectedKeyframeCount() {
    if (
        !app.project ||
        !app.project.activeItem ||
        !(app.project.activeItem instanceof CompItem)
    ) {
        return 0;
    }
    var comp = app.project.activeItem as CompItem;
    if (comp.selectedLayers.length === 0) return 0;
    var layer = comp.selectedLayers[0];
    var selectedProps = layer.selectedProperties;
    if (!selectedProps || selectedProps.length === 0) return 0;
    var prop = selectedProps[0];
    // @ts-ignore
    if (!prop || !prop.selectedKeys || prop.selectedKeys.length === 0) return 0;
    // @ts-ignore
    return prop.selectedKeys.length;
}

export function getSelectedKeyframeValues() {
    if (
        !app.project ||
        !app.project.activeItem ||
        !(app.project.activeItem instanceof CompItem)
    ) {
        return null;
    }
    var comp = app.project.activeItem as CompItem;
    if (comp.selectedLayers.length === 0) return null;
    var layer = comp.selectedLayers[0];
    var selectedProps = layer.selectedProperties;
    if (!selectedProps || selectedProps.length === 0) return null;
    var prop = selectedProps[0];
    // @ts-ignore
    if (!prop || !prop.selectedKeys || prop.selectedKeys.length < 2) return null;

    try {
        // @ts-ignore
        var keys = prop.selectedKeys.sort(function (a, b) { return a - b; });
        // @ts-ignore
        var val1 = prop.keyValue(keys[0]);
        // @ts-ignore
        var val2 = prop.keyValue(keys[1]);

        // Handle both scalar and vector properties
        if (typeof val1 === "number") {
            return { val1: val1, val2: val2 };
        } else if (val1.length > 0) {
            // For vector properties, use the first dimension
            return { val1: val1[0], val2: val2[0] };
        }
    } catch (e) {
        return null;
    }
    return null;
}

/*
Thanks to Grishka for the original implementation:

    https://gist.github.com/grishka/83755b852a1968b8a98e2153eb5c060f
*/

export function applyBezierToSelected(a: number, b: number, c: number, d: number) {
    if (
        !app.project ||
        !app.project.activeItem ||
        !(app.project.activeItem instanceof CompItem)
    ) {
        return "No comp";
    }
    var comp = app.project.activeItem as CompItem;
    if (comp.selectedLayers.length === 0) return "No layer";
    var layer = comp.selectedLayers[0];
    var selectedProps = layer.selectedProperties;
    if (!selectedProps || selectedProps.length === 0) return "No property";
    var prop = selectedProps[0];
    // @ts-ignore
    if (!prop || !prop.selectedKeys || prop.selectedKeys.length < 2) return "Select 2 keyframes";
    // @ts-ignore
    var keys = prop.selectedKeys;
    try {
        for (var i = 0; i < keys.length - 1; i++) {
            // @ts-ignore
            prop.setInterpolationTypeAtKey(keys[i], KeyframeInterpolationType.BEZIER);
            // @ts-ignore
            prop.setInterpolationTypeAtKey(keys[i + 1], KeyframeInterpolationType.BEZIER);
            var outEase = new KeyframeEase(0, b * 100);
            var inEase = new KeyframeEase(0, d * 100);
            // @ts-ignore
            prop.setTemporalEaseAtKey(keys[i], [outEase]);
            // @ts-ignore
            prop.setTemporalEaseAtKey(keys[i + 1], [inEase]);
        }
        return "OK";
    } catch (e) {
        // @ts-ignore
        return "Failed: " + e.toString();
    }
}

export function applyRobustBezierToSelected(a: number, b: number, c: number, d: number) {
    a = Math.max(0.001, Math.min(1, a));
    c = Math.min(0.999, c); // these clamps the values to the range [0.001, 1] for a and [0, 0.999] for c
    // The reason why we clamp a to [0.001, 1] is to avoid division by zero in the speed calculations.
    // If a is 0, it would cause a division by zero when calculating speed1

    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem) {
        var props = comp.selectedProperties;
        if (props.length > 0) {
            app.beginUndoGroup("Apply Dynamic Eases");
            var noSelectedKeyframes = true;

            for (var p = 0; p < props.length; p++) {
                var prop = props[p];
                // @ts-ignore
                if (prop.numKeys > 0 && prop.selectedKeys.length > 1) {
                    noSelectedKeyframes = false;
                    // @ts-ignore
                    var selectedKeys = prop.selectedKeys.sort(function (keyA, keyB) {
                        return keyA - keyB;
                    });

                    for (var i = 0; i < selectedKeys.length - 1; i++) {
                        var keyIndex1 = selectedKeys[i];
                        var keyIndex2 = selectedKeys[i + 1];
                        // @ts-ignore
                        var keyValue1 = prop.keyValue(keyIndex1);
                        // @ts-ignore
                        var keyValue2 = prop.keyValue(keyIndex2);
                        // @ts-ignore
                        var keyTime1 = prop.keyTime(keyIndex1);
                        // @ts-ignore
                        var keyTime2 = prop.keyTime(keyIndex2);
                        var timeDiff = Math.abs(keyTime2 - keyTime1);

                        var dim = typeof keyValue1 === "number" ? 1 : keyValue1.length;
                        var inEase = [];
                        var outEase = [];

                        for (var j = 0; j < dim; j++) {
                            var val1 = dim === 1 ? keyValue1 : keyValue1[j];
                            var val2 = dim === 1 ? keyValue2 : keyValue2[j];
                            var avSpeed = timeDiff !== 0 ? Math.abs(val1 - val2) / timeDiff : 0;

                            // Correct conversion from cubic-bezier to After Effects based on grishka's implementation
                            // For cubic-bezier(a, b, c, d) where a=x1, b=y1, c=x2, d=y2
                            var speed1, speed2, influence1, influence2;

                            if (val1 <= val2) {
                                // Ascending values - use grishka's forward equations
                                influence1 = a * 100;  // x1 * 100
                                speed1 = a !== 0 ? (b * avSpeed) / a : 0;  // (y1 * avSpeed) / x1
                                influence2 = (1 - c) * 100;  // (1 - x2) * 100
                                speed2 = (1 - c) !== 0 ? ((1 - d) * avSpeed) / (1 - c) : 0;  // ((1 - y2) * avSpeed) / (1 - x2)
                            } else {
                                // Descending values - use grishka's reverse equations
                                influence1 = a * 100;  // x1 * 100
                                speed1 = a !== 0 ? (-b * avSpeed) / a : 0;  // (-y1 * avSpeed) / x1
                                influence2 = c * 100;  // x2 * 100 (before the 1-x2 transformation)
                                speed2 = c !== 0 ? ((d - 1) * avSpeed) / c : 0;  // ((y2 - 1) * avSpeed) / x2
                            }

                            // Debug logging (can be removed in production)
                            // $.writeln("Bezier: " + a + "," + b + "," + c + "," + d + 
                            //          " -> Speed1: " + speed1 + ", Influence1: " + influence1 + 
                            //          ", Speed2: " + speed2 + ", Influence2: " + influence2);

                            outEase.push(new KeyframeEase(speed1, influence1));
                            inEase.push(new KeyframeEase(speed2, influence2));
                        }

                        // Apply the easing
                        // @ts-ignore
                        prop.setTemporalEaseAtKey(
                            keyIndex1,
                            // @ts-ignore
                            prop.keyInTemporalEase(keyIndex1),
                            outEase
                        );
                        // @ts-ignore
                        prop.setTemporalEaseAtKey(
                            keyIndex2,
                            inEase,
                            // @ts-ignore
                            prop.keyOutTemporalEase(keyIndex2)
                        );
                    }
                }
            }
            app.endUndoGroup();

            if (noSelectedKeyframes) {
                return "Please select at least two keyframes in the chosen properties.";
            }
        } else {
            return "Please select at least one property.";
        }
    } else {
        return "Please open a composition.";
    }
    return "";
}

export function applyBezier(a: number, b: number, c: number, d: number): string {
    a = Math.max(0.001, Math.min(1, a));
    c = Math.min(0.999, c);

    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem) {
        var props = comp.selectedProperties;
        if (props.length > 0) {
            app.beginUndoGroup("Apply Dynamic Eases");
            var noSelectedKeyframes = true;
            for (var p = 0; p < props.length; p++) {
                var prop = props[p];
                // @ts-ignore
                if (prop.numKeys > 0 && prop.selectedKeys.length > 1) {
                    noSelectedKeyframes = false;
                    // @ts-ignore
                    var selectedKeys = prop.selectedKeys.sort(function (keyA: number, keyB: number) {
                        return keyA - keyB;
                    });
                    for (var i = 0; i < selectedKeys.length - 1; i++) {
                        var keyIndex1 = selectedKeys[i];
                        var keyIndex2 = selectedKeys[i + 1];
                        // @ts-ignore
                        var keyValue1 = prop.keyValue(keyIndex1);
                        // @ts-ignore
                        var keyValue2 = prop.keyValue(keyIndex2);
                        // @ts-ignore
                        var keyTime1 = prop.keyTime(keyIndex1);
                        // @ts-ignore
                        var keyTime2 = prop.keyTime(keyIndex2);
                        var timeDiff = Math.abs(keyTime2 - keyTime1);
                        var dim = typeof keyValue1 === "number" ? 1 : keyValue1.length;
                        var inEase = [];
                        var outEase = [];
                        for (var j = 0; j < dim; j++) {
                            var val1 = dim === 1 ? keyValue1 : keyValue1[j];
                            var val2 = dim === 1 ? keyValue2 : keyValue2[j];
                            var avSpeed = timeDiff !== 0 ? Math.abs(val1 - val2) / timeDiff : 0;
                            var speed1 = (avSpeed * b) / a;
                            var speed2 = (avSpeed * (1 - d)) / (1 - c);
                            var influence1 = a * 100;
                            var influence2 = (1 - c) * 100;
                            outEase.push(new KeyframeEase(speed1, influence1));
                            inEase.push(new KeyframeEase(speed2, influence2));
                        }
                        // @ts-ignore
                        prop.setTemporalEaseAtKey(
                            keyIndex1,
                            // @ts-ignore
                            prop.keyInTemporalEase(keyIndex1),
                            outEase
                        );
                        // @ts-ignore
                        prop.setTemporalEaseAtKey(
                            keyIndex2,
                            inEase,
                            // @ts-ignore
                            prop.keyOutTemporalEase(keyIndex2)
                        );
                    }
                }
            }
            app.endUndoGroup();
            if (noSelectedKeyframes) {
                return "Please select at least two keyframes in the chosen properties.";
            }
        } else {
            return "Please select at least one property.";
        }
    } else {
        return "Please open a composition.";
    }
    return "";
}

export const removeDuplicateFrames = (
    samplingAccuracy: number = 4,
    primaryThreshold: number = 5,
    secondaryThreshold: number = 3,
    maxConsecutiveSkips: number = 2
): boolean => {
    try {
        if (!app.project?.activeItem || !(app.project.activeItem instanceof CompItem)) {
            return false;
        }

        const comp = app.project.activeItem as CompItem;
        if (comp.selectedLayers.length === 0) {
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
            var color = layer.sampleImage([${sampleX}, ${sampleY}], [${sampleWidth / 2}, ${sampleHeight / 2}]);
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

export const getCompDimensions = () => {
    try {
        if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
            return null;
        }

        const comp = app.project.activeItem as CompItem;
        return {
            width: comp.width,
            height: comp.height
        };
    } catch (error: any) {
        return null;
    }
};

export const getCompFPS = () => {
    try {
        if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
            return null;
        }

        const comp = app.project.activeItem as CompItem;
        return comp.frameRate;
    } catch (error: any) {
        return null;
    }
};
