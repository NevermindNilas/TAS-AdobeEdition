import { generateRandomOutputPath } from "./outputUtils";

const animeDownloadLogic = (pathToTasExe: string, pathToSave: string) => {
    const quotedPathToTasExe = `"${pathToTasExe}"`;
    const outputPath = generateRandomOutputPath(pathToSave, "TAS-Anime", "TAS", ".mp4");
    const quotedOutputPath = `"${outputPath}"`;

    const command = `${quotedPathToTasExe} --input "anime" --output ${quotedOutputPath} --ae`;

    return { command, outputPath };
};

export { animeDownloadLogic };
