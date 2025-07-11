import { generateRandomOutputPath } from "./outputUtils";

const depthMapExtractionLogic = async (
    pathToTasExe: string,
    mainPyPath: string,
    pathToVideo: string,
    pathToSave: string,
    depthMethod: string,
    bitDepth: string,
    depthQuality: string,
    aiPrecision: string
) => {
    const quotedPathToTasExe = `"${pathToTasExe}"`;
    const quotedMainPyPath = `"${mainPyPath}"`;
    const quotedPathToVideo = `"${pathToVideo}"`;
    const outputPath = generateRandomOutputPath(pathToSave, "TAS-Depth", "Depth", ".mp4");
    const quotedOutputPath = `"${outputPath}"`;

    const command = `${quotedPathToTasExe} ${mainPyPath} --input ${quotedPathToVideo} --output ${quotedOutputPath} --depth --depth_method ${depthMethod} --bit_depth ${bitDepth} --depth_quality ${depthQuality} --half ${aiPrecision} --ae`;

    return { command, outputPath };
};

export { depthMapExtractionLogic };
