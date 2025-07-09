import { fs } from "../../lib/cep/node";
import { generateToast } from "./generateToast";

export function deleteTASBackend(dirPath: string): void {
    try {
        // Check if directory exists
        if (!fs.existsSync(dirPath)) {
            const message = `Directory does not exist: ${dirPath}`;
            generateToast(2, message);
        }

        fs.rmSync(dirPath, { recursive: true, force: true });
    } catch (error) {
        const message = `Error deleting directory: ${error}`;
        generateToast(2, message);
    }
}
