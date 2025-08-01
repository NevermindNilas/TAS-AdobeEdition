import { generateRandomOutputPath } from "./outputUtils";
import { quotePath, buildCommand } from "./helpers";
import { ensureUtf8String } from "./utf8PathUtils";

const removeBackgroundLogic = async (
    pathToTasExe: string,
    mainPyPath: string,
    pathToVideo: string,
    pathToSave: string,
    backgroundMethod: string,
    aiPrecision: string
) => {
    const outputPath = generateRandomOutputPath(
        ensureUtf8String(pathToSave), 
        "TAS-RemoveBG", 
        "RmvBackground", 
        ".mov"
    );

    const command = buildCommand([
        quotePath(ensureUtf8String(pathToTasExe)),
        quotePath(ensureUtf8String(mainPyPath)),
        "--input",
        quotePath(ensureUtf8String(pathToVideo)),
        "--output",
        quotePath(outputPath),
        "--segment",
        "--segment_method",
        ensureUtf8String(backgroundMethod),
        "--half",
        ensureUtf8String(aiPrecision),
        "--ae"
    ]);

    return { command, outputPath };
};

export { removeBackgroundLogic };
