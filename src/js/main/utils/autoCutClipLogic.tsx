import { quotePath, buildCommand } from "./helpers";
import { ensureUtf8String } from "./utf8PathUtils";

// src/js/main/utils/autoCutClipLogic.tsx
const autoCutLogic = async (
    pathToTasExe: string,
    mainPyPath: string,
    pathToVideo: string,
    autoCutClipSens: any,
): Promise<string> => {
    const command = buildCommand([
        quotePath(ensureUtf8String(pathToTasExe)),
        quotePath(ensureUtf8String(mainPyPath)),
        "--input",
        quotePath(ensureUtf8String(pathToVideo)),
        "--autoclip",
        "--autoclip_sens",
        String(autoCutClipSens * 100),
    ]);

    return command;
};

export default autoCutLogic;
