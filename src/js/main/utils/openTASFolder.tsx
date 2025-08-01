import { path, os, fs, child_process } from "../../lib/cep/node";
import { generateToast } from "./generateToast";
import { safePathJoin, ensureUtf8String, safeExistsSync, safeMkdirSync } from "./utf8PathUtils";

const getFolderPath = () => {
    const homeDir = ensureUtf8String(os.homedir());
    return safePathJoin(homeDir, "AppData", "Roaming", "TheAnimeScripter");
};

const openTasFolder = async () => {
    generateToast(3, "Opening TAS folder...");
    
    try {
        const folderPath = getFolderPath();
        
        // Create directory if it doesn't exist
        if (!safeExistsSync(folderPath)) {
            safeMkdirSync(folderPath, { recursive: true });
            console.log("Folder created:", folderPath);
        }

        // Open folder using appropriate command for the platform
        const platform = os.platform();
        let command: string;
        let args: string[];

        switch (platform) {
            case 'darwin':
                command = 'open';
                args = [folderPath];
                break;
            case 'win32':
                command = 'explorer';
                args = [folderPath];
                break;
            case 'linux':
                command = 'xdg-open';
                args = [folderPath];
                break;
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }

        // Execute command to open folder
        child_process.spawn(command, args, { shell: false });
        
    } catch (error) {
        console.error("Error opening TAS folder:", error);
        generateToast(1, `Failed to open TAS folder: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export default openTasFolder;
