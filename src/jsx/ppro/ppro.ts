let currentClip: TrackItem | null = null; // Global variable to store the current clip
let currentSequence: Sequence | null = null; // Global variable to store the current sequence

export const getPath = () => {
    if (app.project.path !== null) {
        return app.project.path;
    } else {
        alert("Please save the project first.");
        return null;
    }
};

export const startChain = () => {
    if (!app.project || !app.project.activeSequence) {
        alert("Please select a sequence.");
        return;
    }

    const sequence = app.project.activeSequence as Sequence;
    currentSequence = sequence;

    const selectedClips = sequence.getSelection();
    if (selectedClips.length < 1) {
        alert("Please select one clip.");
        return;
    }

    const clip = selectedClips[0] as TrackItem;
    currentClip = clip;
    const activeClipPath = clip.projectItem.getMediaPath();

    const sourceInPoint = clip.inPoint.seconds;
    const sourceOutPoint = clip.outPoint.seconds;

    const info = {
        input: activeClipPath,
        inpoint: sourceInPoint,
        outpoint: sourceOutPoint,
        name: clip.name,
    };

    return info;
};

export const autoclip = (autoClipValue: number, theAnimeScripterPath: string) => {
    if (autoClipValue === 1) {
        const autoClipLogPath = `${theAnimeScripterPath}\\autoclipresults.txt`;
        const autoClipLog = new File(autoClipLogPath);
        autoClipLog.open("r");

        if (!currentClip) {
            alert("Please select a clip.");
            return;
        }

        const inPoint = currentClip.inPoint.seconds;
        const outPoint = currentClip.outPoint.seconds;

        while (!autoClipLog.eof) {
            const line = autoClipLog.readln();
            const timestamp = parseFloat(line) + inPoint;
            if (!currentClip) {
                alert("Please select a clip.");
                return;
            }
            // const duplicateClip = currentClip.duplicate();
            currentClip.outPoint.seconds = timestamp;
            // duplicateClip.inPoint.seconds = timestamp;

            // currentClip = duplicateClip;
        }
        autoClipLog.close();
    }
};

export const importOutput = (outPath: string) => {
    try {
        if (!app) {
            alert("This script is not running in a compatible environment.");
            return;
        }
        if (!currentSequence) {
            const activeSequence = app.project.activeSequence;
            if (activeSequence) {
                currentSequence = activeSequence;
            } else {
                alert("No active or existent sequence has been selected.");
                return;
            }
        }

        const importResult = app.project.importFiles([outPath]);
        if (!importResult) {
            alert("Error importing output.");
            return;
        }

        const importedClip =
            app.project.rootItem.children[app.project.rootItem.children.numItems - 1];
        //check that imported clip has the same path as the outPath
        const importedClipPath = importedClip.getMediaPath();
        if (importedClipPath !== outPath) {
            alert("Error importing output.");
            return;
        }

        currentClip = null;
        currentSequence = null;
    } catch (error: any) {
        alert("Error importing output: " + error.toString());
    }
};

/**
 * Exports the active sequence and waits for the export to complete.
 * @returns {Object|null} Information about the exported file or null in case of an error.
 */
export const exportActiveSequence = () => {
    try {
        const projectPath = getPath();
        if (!projectPath) {
            alert("Project path not found.");
            return null;
        }

        // Remove the .prproj extension and add the folder name
        const projectFolder = new Folder(projectPath.replace(/[^\/]+$/, ""));
        const preRendersPath = `${projectFolder.fsName}/TAS-PreRenders/`;
        const preRendersDir = new Folder(preRendersPath);

        if (!preRendersDir.exists) {
            preRendersDir.create();
            alert("Pre-renders directory created.");
        }

        const sequence = app.project.activeSequence;
        if (!sequence) {
            alert("No active sequence selected.");
            return null;
        }

        const randomNumbers = Math.floor(Math.random() * 1000);
        const outputName = `output${randomNumbers}.mp4`;
        const outputPath = `${preRendersPath}${outputName}`;
        const presetPath = "C:\\Users\\tjerf\\Desktop\\test.epr"; // Path to your .epr file

        // Check if AME is installed and running
        const ameStatus = BridgeTalk.getStatus("ame");
        if (ameStatus === "ISNOTINSTALLED") {
            alert("AME is not installed. Using Premiere Pro export instead.");
            const exportResult = sequence.exportAsMediaDirect(
                outputPath,
                presetPath,
                app.encoder.ENCODE_WORKAREA
            );
            if (!exportResult) {
                alert("Error exporting active sequence.");
                return null;
            }
            alert("Export started using Premiere Pro.");
        } else {
            if (ameStatus === "ISNOTRUNNING") {
                app.encoder.launchEncoder(); // This can take a while; let's get the ball rolling.
            }

            const removeCompletedFiles = true; // Set to true if you want AME to remove files from the queue once completed
            const jobID = app.encoder.encodeSequence(
                sequence,
                outputPath,
                presetPath,
                app.encoder.ENCODE_WORKAREA,
                removeCompletedFiles ? 1 : 0
            );

            alert("Export started with Job ID: " + jobID);

            // Bind event listeners for AME
            app.encoder.bind("onEncoderJobComplete", function (jobID: string) {
                alert("Job " + jobID + " is complete.");
            });

            app.encoder.bind("onEncoderJobError", function (jobID: string, error: string) {
                alert("Job " + jobID + " encountered an error: " + error);
            });

            app.encoder.bind("onEncoderJobProgress", function (jobID: string, progress: number) {
                alert("Job " + jobID + " progress: " + (progress * 100).toFixed(2) + "%");
            });
        }

        const info = {
            input: outputPath,
            inpoint: sequence.getInPoint(),
            outpoint: sequence.getOutPoint(),
            name: outputName,
        };

        alert("Export completed successfully.");
        alert("Output info: " + JSON.stringify(info));

        return info;
    } catch (error: any) {
        alert("Error exporting active sequence: " + error.toString());
        return null;
    }
};

export const importVideo = (outPath: string) => {
    return importOutput(outPath);
};

export const start = () => {
    return startChain();
};

export const render = () => {
    return exportActiveSequence();
};
