import { generateRandomOutputPath } from "./outputUtils";
import { buildJsonConfig, saveJsonConfig, buildJsonCommand } from "./jsonConfigBuilder";

const removeBackgroundLogic = async (
    pathToTasExe: string,
    mainPyPath: string,
    pathToVideo: string,
    pathToSave: string,
    backgroundMethod: string,
    aiPrecision: string
) => {
    const outputPath = generateRandomOutputPath(
        pathToSave, 
        "TAS-RemoveBG", 
        "RmvBackground", 
        ".mov"
    );

    const config = buildJsonConfig(
        pathToVideo,
        outputPath,
        {
            aiPrecision: aiPrecision === "true"
        },
        "http://127.0.0.1:8080"
    );

    config.segment = true;
    config.segment_method = backgroundMethod;

    const configPath = saveJsonConfig(config);
    const command = buildJsonCommand(pathToTasExe, mainPyPath, configPath);

    return { command, outputPath, configPath };
};

export { removeBackgroundLogic };
