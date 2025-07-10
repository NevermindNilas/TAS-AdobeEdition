import { path, os } from "../../lib/cep/node";
import { evalTS } from "../../lib/utils/bolt";
import { generateToast } from "./generateToast";
import { socketManager } from "./socket";

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
 * Gets the current socket port being used by the socket manager.
 * This port should be passed to the backend when starting processes.
 * @returns The current port number
 */
export function getCurrentSocketPort(): number {
    return socketManager.getCurrentPort();
}

/**
 * Checks if the socket is currently connected.
 * @returns True if connected, false otherwise
 */
export function isSocketConnected(): boolean {
    return socketManager.isConnected();
}

/**
 * Reconnects the socket with dynamic port detection.
 * @returns Promise that resolves when reconnection attempt is complete
 */
export async function reconnectSocket(): Promise<void> {
    return socketManager.reconnect();
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
