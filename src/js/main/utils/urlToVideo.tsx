import { generateRandomOutputPath } from "./outputUtils";
import { buildJsonConfig, saveJsonConfig, buildJsonCommand } from "./jsonConfigBuilder";

const youtubeDownloadLogic = (
    youtubeURL: string,
    mainPyPath: string,
    pathToTasExe: string,
    pathToSave: string
) => {
    const outputPath = generateRandomOutputPath(
        pathToSave, 
        "TAS-Youtube", 
        "TAS", 
        ".mp4"
    );

    const config = buildJsonConfig(
        youtubeURL,
        outputPath,
        {},
        "http://127.0.0.1:8080"
    );

    const configPath = saveJsonConfig(config);
    const command = buildJsonCommand(pathToTasExe, mainPyPath, configPath);

    return { command, outputPath, configPath };
};

export { youtubeDownloadLogic };
