import { generateRandomOutputPath } from "./outputUtils";
import { quotePath, buildCommand } from "./helpers";
import { ensureUtf8String } from "./utf8PathUtils";

const depthMapExtractionLogic = async (
    pathToTasExe: string,
    mainPyPath: string,
    pathToVideo: string,
    pathToSave: string,
    depthMethod: string,
    bitDepth: string,
    depthQuality: string,
    aiPrecision: string
) => {
    const outputPath = generateRandomOutputPath(
        ensureUtf8String(pathToSave), 
        "TAS-Depth", 
        "Depth", 
        ".mp4"
    );

    const command = buildCommand([
        quotePath(ensureUtf8String(pathToTasExe)),
        quotePath(ensureUtf8String(mainPyPath)),
        "--input",
        quotePath(ensureUtf8String(pathToVideo)),
        "--output",
        quotePath(outputPath),
        "--depth",
        "--depth_method",
        ensureUtf8String(depthMethod),
        "--bit_depth",
        ensureUtf8String(bitDepth),
        "--depth_quality",
        ensureUtf8String(depthQuality),
        "--half",
        ensureUtf8String(aiPrecision),
        "--ae"
    ]);

    return { command, outputPath };
};

export { depthMapExtractionLogic };
