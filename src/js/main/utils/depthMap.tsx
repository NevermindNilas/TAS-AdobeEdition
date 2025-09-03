import { generateRandomOutputPath } from "./outputUtils";
import { quotePath, buildCommand } from "./helpers";

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
        pathToSave, 
        "TAS-Depth", 
        "Depth", 
        ".mp4"
    );

    const command = buildCommand([
        quotePath(pathToTasExe),
        quotePath(mainPyPath),
        "--input",
        quotePath(pathToVideo),
        "--output",
        quotePath(outputPath),
        "--depth",
        "--depth_method",
        depthMethod,
        "--bit_depth",
        bitDepth,
        "--depth_quality",
        depthQuality,
        "--half",
        aiPrecision,
        "--ae"
    ]);

    return { command, outputPath };
};

export { depthMapExtractionLogic };
