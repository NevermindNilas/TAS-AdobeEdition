import { generateRandomOutputPath } from "./outputUtils";
import { quotePath, buildCommand } from "./helpers";

const youtubeDownloadLogic = (
    youtubeURL: string,
    mainPyPath: string,
    pathToTasExe: string,
    pathToSave: string
) => {
    const outputPath = generateRandomOutputPath(pathToSave, "TAS-Youtube", "TAS", ".mp4");

    const command = buildCommand([
        quotePath(pathToTasExe),
        quotePath(mainPyPath),
        "--input",
        youtubeURL,
        "--output",
        quotePath(outputPath),
        "--ae"
    ]);

    return { command, outputPath };
};

export { youtubeDownloadLogic };
