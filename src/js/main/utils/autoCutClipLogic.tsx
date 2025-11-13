import { buildJsonConfig, saveJsonConfig, buildJsonCommand } from "./jsonConfigBuilder";

const autoCutLogic = async (
    pathToTasExe: string,
    mainPyPath: string,
    pathToVideo: string,
    autoCutClipSens: any,
): Promise<{ command: string; configPath: string }> => {
    const config = buildJsonConfig(
        pathToVideo,
        "",
        {},
        "http://127.0.0.1:8080"
    );

    config.autoclip = true;
    config.autoclip_sens = autoCutClipSens * 100;

    const configPath = saveJsonConfig(config);
    const command = buildJsonCommand(pathToTasExe, mainPyPath, configPath);

    return { command, configPath };
};

export default autoCutLogic;
