import { quotePath, buildCommand } from "./helpers";

// src/js/main/utils/autoCutClipLogic.tsx
const autoCutLogic = async (
    pathToTasExe: string,
    mainPyPath: string,
    pathToVideo: string,
    autoCutClipSens: any,
    inpoint: any,
    outpoint: any
): Promise<string> => {
    const command = buildCommand([
        quotePath(pathToTasExe),
        quotePath(mainPyPath),
        "--input",
        quotePath(pathToVideo),
        "--autoclip",
        "--autoclip_sens",
        String(autoCutClipSens * 100),
        "--inpoint",
        String(inpoint),
        "--outpoint",
        String(outpoint)
    ]);

    return command;
};

export default autoCutLogic;
