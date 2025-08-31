import { generateRandomOutputPath } from "./outputUtils";
import { quotePath, buildCommand } from "./helpers";
import { ensureUtf8String } from "./utf8PathUtils";
import { child_process, fs, path } from "../../lib/cep/node";

const youtubeDownloadLogic = (
    youtubeURL: string,
    mainPyPath: string,
    pathToTasExe: string,
    pathToSave: string
) => {
    const outputPath = generateRandomOutputPath(
        ensureUtf8String(pathToSave), 
        "TAS-Youtube", 
        "TAS", 
        ".mp4"
    );

    const command = buildCommand([
        quotePath(ensureUtf8String(pathToTasExe)),
        quotePath(ensureUtf8String(mainPyPath)),
        "--input",
        ensureUtf8String(youtubeURL),
        "--output",
        quotePath(outputPath),
    ]);

    return { command, outputPath };
};

export { youtubeDownloadLogic };
