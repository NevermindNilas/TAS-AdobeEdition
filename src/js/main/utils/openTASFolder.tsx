import { path, os, fs } from "../../lib/cep/node";
import { generateToast } from "./generateToast";
import { SecureCommandExecutor } from "../../../core/security/SecureCommandExecutor";
import { ValidationService } from "../../../core/security/ValidationService";

const getFolderPath = () => {
    const homeDir = os.homedir();
    return path.join(homeDir, "AppData", "Roaming", "TheAnimeScripter");
};

const openTasFolder = async () => {
    generateToast(3, "Opening TAS folder...");
    
    try {
        const folderPath = getFolderPath();
        
        // Validate the path before using it
        const validatedPath = ValidationService.validatePath(folderPath);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(validatedPath)) {
            fs.mkdirSync(validatedPath, { recursive: true });
            console.log("Folder created:", validatedPath);
        }

        // Use secure command executor to open the folder
        await SecureCommandExecutor.openPath(validatedPath);
        
    } catch (error) {
        console.error("Error opening TAS folder:", error);
        generateToast(1, `Failed to open TAS folder: ${error.message}`);
    }
};

export default openTasFolder;
