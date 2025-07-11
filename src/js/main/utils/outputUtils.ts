// Utility for generating output paths and ensuring directories exist

const fs = require("fs");
const path = require("path");

/**
 * Generates a random output file path in a specified subfolder with a given filename pattern.
 * Ensures the output directory exists.
 * @param basePath - The base directory where the subfolder will be created
 * @param subfolder - The subfolder name (e.g., "TAS-Depth" or "TAS-RemoveBG")
 * @param filenamePrefix - The prefix for the output file (e.g., "Depth" or "RmvBackground")
 * @param extension - The file extension (e.g., ".mp4" or ".mov")
 * @returns The generated output file path
 */
function generateRandomOutputPath(basePath: string, subfolder: string, filenamePrefix: string, extension: string): string {
    const outputFolder = path.join(basePath, subfolder);

    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
    }

    const randomString = Math.random().toString(36).substring(2, 6);
    return path.join(outputFolder, `${filenamePrefix}_${randomString}${extension}`);
}

export { generateRandomOutputPath };
