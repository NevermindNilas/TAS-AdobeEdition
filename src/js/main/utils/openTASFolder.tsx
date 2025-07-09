import { child_process, path, os, fs } from "../../lib/cep/node";
import { generateToast } from "./generateToast";

const getFolderPath = () => {
    const homeDir = os.homedir();
    return path.join(homeDir, "AppData", "Roaming", "TheAnimeScripter");
};

const openTasFolder = () => {
    generateToast(3, "Opening TAS folder...");
    const folderPath = getFolderPath();
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log("Folder created:", folderPath);
    }
    child_process.exec(`explorer ${folderPath}`, err => {
        if (err) {
            console.error("Error opening folder:", err);
        }
    });
};

export default openTasFolder;
