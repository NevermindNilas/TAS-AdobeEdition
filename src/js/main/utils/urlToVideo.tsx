import { generateRandomOutputPath } from "./outputUtils";

const youtubeDownloadLogic = (
    youtubeURL: string,
    mainPyPath: string,
    pathToTasExe: string,
    pathToSave: string
) => {
    const quotedPathToTasExe = `"${pathToTasExe}"`;
    const quotedMainPyPath = `"${mainPyPath}"`;
    const outputPath = generateRandomOutputPath(pathToSave, "TAS-Youtube", "TAS", ".mp4");
    const quotedOutputPath = `"${outputPath}"`;

    const command = `${quotedPathToTasExe} ${quotedMainPyPath} --input ${youtubeURL} --output ${quotedOutputPath} --ae`;

    return { command, outputPath };
};

export { youtubeDownloadLogic };
