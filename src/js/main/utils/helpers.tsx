import { path, os } from "../../lib/cep/node";
import { evalTS } from "../../lib/utils/bolt";
import { generateToast } from "./generateToast";
import { socketManager } from "./socket";

/**
 * Runs an AE command and handles errors/toasts.
 * @param command - The AE command to run.
 * @param args - Arguments for the command.
 * @param errorToast - Error message to show if result is falsy.
 * @returns The result of the command or null.
 */
export async function runAECommand(command: string, args: any[] = [], errorToast?: string): Promise<any | null> {
    try {
        const result = await evalTS(command as any, ...args);
        if (!result || result === "undefined") {
            if (errorToast) generateToast(2, errorToast);
            return null;
        }
        return result;
    } catch (e) {
        if (errorToast) generateToast(2, errorToast);
        return null;
    }
}

/**
 * Generalized layer creation helper.
 * @param type - "adjustment" | "solid" | "null"
 * @param args - Arguments for the layer creation command.
 * @returns True if successful, false otherwise.
 */
export async function createLayer(type: "adjustment" | "solid" | "null", ...args: any[]): Promise<boolean> {
    let commandMap: Record<string, string> = {
        adjustment: "addAdjustmentLayer",
        solid: "addSolidLayer",
        null: "addNullLayer"
    };
    const command = commandMap[type];
    if (!command) return false;
    const result = await evalTS(command as any, ...args);
    if (result) {
        generateToast(3, `Creating a ${type} layer...`);
        return true;
    } else {
        generateToast(2, "Error: Please select a layer first.");
        return false;
    }
}

/**
 * Loads settings from localStorage.
 * @param keys - Array of keys to load.
 * @returns Object with loaded settings.
 */
export function loadSettings(keys: string[]): Record<string, any> {
    const saved = localStorage.getItem("settings");
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    let result: Record<string, any> = {};
    keys.forEach(k => { if (parsed[k] !== undefined) result[k] = parsed[k]; });
    return result;
}

/**
 * Saves settings to localStorage.
 * @param settings - Object with settings to save.
 */
export function saveSettings(settings: Record<string, any>) {
    localStorage.setItem("settings", JSON.stringify(settings));
}

/**
 * Generalized process execution helper.
 * @param execFn - The executeProcess function.
 * @param command - Command to run.
 * @param toastMsg - Toast message.
 * @param onSuccess - Success callback.
 * @param inputFile - Input file (optional).
 * @param outputFile - Output file (optional).
 */
export function runProcess(execFn: any, command: any, toastMsg: string, onSuccess?: any, inputFile?: any, outputFile?: any) {
    return execFn(command, toastMsg, onSuccess, inputFile, outputFile);
}

/**
 * Gets standard TAS application paths.
 * @returns An object containing relevant TAS paths.
 */
export function getTASPaths() {
    const appDataPath = path.join(os.homedir(), "AppData", "Roaming");
    const tasFolder = path.join(appDataPath, "TheAnimeScripter");
    const tasAppDataPath = path.join(appDataPath, "TheAnimeScripter", "TAS-Portable");
    const pythonExePath = path.join(tasAppDataPath, "python.exe");
    const mainPyPath = path.join(tasAppDataPath, "main.py");
    const tasRoamingPath = path.join(appDataPath, "TheAnimeScripter");

    return {
        appDataPath,
        tasFolder,
        tasAppDataPath,
        pythonExePath,
        mainPyPath,
        tasRoamingPath,
    };
}

/**
 * Checks if the After Effects project is saved and retrieves selected layer information.
 * Shows toasts for errors.
 * @returns The layer information object from AE or null if an error occurs.
 */
export async function getAELayerInfo(): Promise<any | null> {
    const projectPath = await evalTS("getPath");
    if (projectPath === "undefined") {
        generateToast(2, "Error: Please save or load a project before proceeding.");
        return null;
    }

    const layerInfo = await evalTS("isAnyLayerSelected"); // Check if any layer is selected
    if (layerInfo === false) {
        generateToast(2, "Error: No layer selected. Please choose a layer and try again.");
        return null;
    }

    return layerInfo;
}

/**
 * Gets the directory path of the current After Effects project.
 * Shows a toast if the project isn't saved.
 * @returns The project directory path or null if not saved.
 */
export async function getAEProjectFolderPath(): Promise<string | null> {
    const projectPath = await evalTS("getPath");
    if (projectPath === "undefined") {
        generateToast(2, "Error: Please save or load a project before proceeding.");
        return null;
    }
    // Use Node.js path module to get the directory name
    return require("path").dirname(projectPath);
}


/**
 * Modifies a TAS backend command to include the WebSocket URL in the --ae flag.
 * Only modifies commands that contain the --ae flag (indicating CEP frontend usage).
 * Changes --ae to --ae ws://localhost:PORT for backend WebSocket communication.
 * @param command - The original command string
 * @returns The modified command with WebSocket URL in --ae flag
 */
export function addPortToCommand(command: string): string {
    // Use the AE comms server URL as expected by the backend
    const aeCommsUrl = "http://127.0.0.1:8080";
    
    // Replace --ae with --ae aeCommsUrl
    if (command.includes('--ae')) {
        return command.replace(/--ae\b/, `--ae ${aeCommsUrl}`);
    } else {
        // If --ae is not present, append it with the AE comms URL
        return `${command} --ae ${aeCommsUrl}`;
    }
}

/**
 * Ensures the After Effects project is saved.
 * Shows a toast if not saved.
 * @returns {Promise<boolean>} True if saved, false otherwise.
 */
export async function ensureProjectIsSaved(): Promise<boolean> {
    const projectPath = await evalTS("getPath");
    if (projectPath === "undefined") {
        generateToast(2, "Error: Please save or load a project before proceeding.");
        return false;
    }
    return true;
}

/**
 * Validates AE project and layer selection, and gets project folder path.
 * Shows toasts for errors.
 * @returns {Promise<{layerInfo: any, projectFolderPath: string} | null>}
 */
export async function getValidatedAEContext(): Promise<{layerInfo: any, projectFolderPath: string} | null> {
    const projectPath = await evalTS("getPath");
    if (projectPath === "undefined") {
        generateToast(2, "Error: Please save or load a project before proceeding.");
        return null;
    }
    const layerInfo = await evalTS("isAnyLayerSelected");
    if (layerInfo === false) {
        generateToast(2, "Error: No layer selected. Please choose a layer and try again.");
        return null;
    }
    const projectFolderPath = require("path").dirname(projectPath);
    return { layerInfo, projectFolderPath };
}

/**
 * Executes a process and handles log polling, progress, and cleanup.
 * @param child_process - Node child_process module
 * @param fs - Node fs module
 * @param path - Node path module
 * @param tasFolder - TAS folder path
 * @param command - Command to execute
 * @param toastMessage - Toast message for UI
 * @param resetProgress - Callback to reset progress
 * @param setFullLogs - Callback to set logs
 * @param setIsProcessCancelled - Callback to set process cancelled state
 * @param processCancelledRef - Ref to process cancelled state
 * @param deletePreRender - Whether to delete pre-rendered file
 * @param onSuccess - Success callback
 * @param inputFile - Input file (optional)
 * @param outputFile - Output file (optional)
 */
export function executeProcessHelper({
    child_process,
    fs,
    path,
    tasFolder,
    command,
    toastMessage,
    resetProgress,
    setFullLogs,
    setIsProcessCancelled,
    processCancelledRef,
    deletePreRender,
    onSuccess,
    inputFile,
    outputFile
}: {
    child_process: any,
    fs: any,
    path: any,
    tasFolder: string,
    command: any,
    toastMessage: string,
    resetProgress: (status?: string) => void,
    setFullLogs: (logs: string[]) => void,
    setIsProcessCancelled: (v: boolean) => void,
    processCancelledRef: { current: boolean },
    deletePreRender: boolean,
    onSuccess?: any,
    inputFile?: any,
    outputFile?: any
}) {
    processCancelledRef.current = false;
    setIsProcessCancelled(false);
    let hasFailed = false;
    setFullLogs([]);
    let localLogs: string[] = [];
    let lastLogSize = 0;
    let logPollingInterval: NodeJS.Timeout | null = null;
    let logWatcher: any = null;
    let exited = false;

    const logTxtPath = path.join(tasFolder, "TAS-Log.log");

    const readNewLogs = () => {
        if (fs.existsSync(logTxtPath)) {
            try {
                const stats = fs.statSync(logTxtPath);
                if (stats.size < lastLogSize) lastLogSize = 0;
                if (stats.size > lastLogSize) {
                    const fd = fs.openSync(logTxtPath, "r");
                    const buffer = Buffer.alloc(stats.size - lastLogSize);
                    fs.readSync(fd, buffer, 0, buffer.length, lastLogSize);
                    fs.closeSync(fd);

                    const newContent = buffer.toString("utf8");
                    if (newContent.trim()) {
                        const newLines = newContent.split("\n").filter(line => line.trim());
                        if (newLines.length > 0) {
                            localLogs.push(...newLines);
                            setFullLogs([...localLogs]);
                        }
                    }
                    lastLogSize = stats.size;
                }
            } catch (error) {
                console.error("Error reading log file:", error);
            }
        }
    };

    logPollingInterval = setInterval(readNewLogs, 1000);

    // Add file watcher for even more realtime updates
    if (fs.existsSync(logTxtPath)) {
        try {
            logWatcher = fs.watch(logTxtPath, (eventType: string) => {
                if (eventType === "change") {
                    readNewLogs();
                }
            });
        } catch (error) {
            console.error("Error watching log file:", error);
        }
    }

    let process: any;
    try {
        process = child_process.exec(command, (error: any) => {
            if (error) {
                hasFailed = true;
                if (logPollingInterval) {
                    clearInterval(logPollingInterval);
                }
                resetProgress("Process failed!");
                generateToast(
                    2,
                    `Error: ${toastMessage} failed to start or crashed. Check the logs & contact Nilas on Discord.`
                );
            }
        });
    } catch (err) {
        hasFailed = true;
        if (logPollingInterval) {
            clearInterval(logPollingInterval);
        }
        resetProgress("Process failed!");
        generateToast(
            2,
            `Error: ${toastMessage} failed to start. Check the logs & contact Nilas on Discord.`
        );
        return;
    }

    generateToast(3, `${toastMessage} initiated...`);

    process.on("error", (err: any) => {
        hasFailed = true;
        if (logPollingInterval) {
            clearInterval(logPollingInterval);
        }
        resetProgress("Process failed!");
        generateToast(
            2,
            `Error: ${toastMessage} failed to start. Check the logs & contact Nilas on Discord.`
        );
    });

    process.on("exit", (code: any) => {
        if (exited) return;
        exited = true;
        if (logPollingInterval) {
            clearInterval(logPollingInterval);
        }
        readNewLogs();

        try {
            if (!processCancelledRef.current) {
                if (outputFile) {
                    if (fs.existsSync(outputFile)) {
                        if (typeof onSuccess === "function") {
                            onSuccess();
                        }
                    } else {
                        hasFailed = true;
                        generateToast(
                            2,
                            `Error: ${toastMessage} failed, check the logs & contact Nilas on Discord.`
                        );
                    }
                } else {
                    if (typeof onSuccess === "function") {
                        onSuccess();
                    }
                }
            }
        } catch (error) {
            console.error(`Error: ${error}`);
        } finally {
            resetProgress("Progress complete!");

            if (!processCancelledRef.current && !hasFailed) {
                generateToast(1, `${toastMessage} completed.`);
            }
            setIsProcessCancelled(false);
            processCancelledRef.current = false;
            if (!deletePreRender) {
                if (inputFile) {
                    try {
                        if (fs.existsSync(inputFile)) {
                            fs.unlinkSync(inputFile);
                        }
                    } catch (error) {
                        generateToast(
                            2,
                            `Error: ${toastMessage} failed, check the logs & contact Nilas on Discord.`
                        );
                    }
                }
            }
        }
    });

    return () => {
        if (logPollingInterval) {
            clearInterval(logPollingInterval);
        }
        if (logWatcher) {
            logWatcher.close();
        }
    };
}
