import { generateRandomOutputPath } from "./outputUtils";
import { buildJsonConfig, saveJsonConfig, buildJsonCommand } from "./jsonConfigBuilder";

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

    const config = buildJsonConfig(
        pathToVideo,
        outputPath,
        {
            depthMap: true,
            depthModel: depthMethod,
            bitDepth: parseInt(bitDepth),
            aiPrecision: aiPrecision === "true"
        },
        "http://127.0.0.1:8080"
    );

    config.depth_quality = depthQuality;

    const configPath = saveJsonConfig(config);
    const command = buildJsonCommand(pathToTasExe, mainPyPath, configPath);

    return { command, outputPath, configPath };
};

export { depthMapExtractionLogic };
