import { path, os } from "../../lib/cep/node";
import { evalTS } from "../../lib/utils/bolt";
import { generateToast } from "./generateToast";

/**
 * Gets standard TAS application paths.
 * @returns An object containing relevant TAS paths.
 */
export function getTASPaths() {
    const appDataPath = path.join(os.homedir(), "AppData", "Roaming");
    const tasFolder = path.join(appDataPath, "TheAnimeScripter");
    const tasAppDataPath = path.join(tasFolder, "TAS");
    const tasExePath = path.join(tasAppDataPath, "main.exe");
    const logTxtPath = path.join(tasFolder, "TAS-Log.log");
    const progressLogPath = path.join(tasFolder, "progressLog.json");

    return {
        appDataPath,
        tasFolder,
        tasAppDataPath,
        tasExePath,
        logTxtPath,
        progressLogPath,
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
