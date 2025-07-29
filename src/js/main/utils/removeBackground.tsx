import { generateRandomOutputPath } from "./outputUtils";
import { quotePath, buildCommand } from "./helpers";

const removeBackgroundLogic = async (
    pathToTasExe: string,
    mainPyPath: string,
    pathToVideo: string,
    pathToSave: string,
    backgroundMethod: string,
    aiPrecision: string
) => {
    const outputPath = generateRandomOutputPath(pathToSave, "TAS-RemoveBG", "RmvBackground", ".mov");

    const command = buildCommand([
        quotePath(pathToTasExe),
        quotePath(mainPyPath),
        "--input",
        quotePath(pathToVideo),
        "--output",
        quotePath(outputPath),
        "--segment",
        "--segment_method",
        backgroundMethod,
        "--half",
        aiPrecision,
        "--ae"
    ]);

    return { command, outputPath };
};

export { removeBackgroundLogic };
