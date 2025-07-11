import { generateRandomOutputPath } from "./outputUtils";

const removeBackgroundLogic = async (
    pathToTasExe: string,
    mainPyPath: string,
    pathToVideo: string,
    pathToSave: string,
    backgroundMethod: string,
    aiPrecision: string
) => {
    const quotedPathToTasExe = `"${pathToTasExe}"`;
    const quotedMainPyPath = `"${mainPyPath}"`;
    const quotedPathToVideo = `"${pathToVideo}"`;
    const outputPath = generateRandomOutputPath(pathToSave, "TAS-RemoveBG", "RmvBackground", ".mov");
    const quotedOutputPath = `"${outputPath}"`;

    const command = `${quotedPathToTasExe} ${mainPyPath} --input ${quotedPathToVideo} --output ${quotedOutputPath} --segment --segment_method ${backgroundMethod} --half ${aiPrecision} --ae`;

    return { command, outputPath };
};

export { removeBackgroundLogic };
