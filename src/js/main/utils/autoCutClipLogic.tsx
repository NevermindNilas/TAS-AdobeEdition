import { quotePath, buildCommand } from "./helpers";

// src/js/main/utils/autoCutClipLogic.tsx
const autoCutLogic = async (
    pathToTasExe: string,
    mainPyPath: string,
    pathToVideo: string,
    autoCutClipSens: any,
): Promise<string> => {
    const command = buildCommand([
        quotePath(pathToTasExe),
        quotePath(mainPyPath),
        "--input",
        quotePath(pathToVideo),
        "--autoclip",
        "--autoclip_sens",
        String(autoCutClipSens * 100),
    ]);

    return command;
};

export default autoCutLogic;
