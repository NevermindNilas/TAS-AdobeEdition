// Utility for generating output paths and ensuring directories exist with UTF-8 support

import { generateUtf8OutputPath } from "./utf8PathUtils";

/**
 * Generates a random output file path in a specified subfolder with a given filename pattern.
 * Ensures the output directory exists and supports UTF-8 paths.
 * @param basePath - The base directory where the subfolder will be created
 * @param subfolder - The subfolder name (e.g., "TAS-Depth" or "TAS-RemoveBG")
 * @param filenamePrefix - The prefix for the output file (e.g., "Depth" or "RmvBackground")
 * @param extension - The file extension (e.g., ".mp4" or ".mov")
 * @returns The generated UTF-8 safe output file path
 */
function generateRandomOutputPath(basePath: string, subfolder: string, filenamePrefix: string, extension: string): string {
    return generateUtf8OutputPath(basePath, subfolder, filenamePrefix, extension);
}

export { generateRandomOutputPath };
