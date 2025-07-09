const fs = require("fs");
const path = require("path");

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
    // This is the command to extract the depth map
    // main.exe --input path_to_video --output path_to_save --depth --depth_method depthMethod --bit_depth bitDepth --depth_quality depthQuality --inpoint inpoint --outpoint outpoint
    const quotedPathToTasExe = `"${pathToTasExe}"`;
    const quotedMainPyPath = `"${mainPyPath}"`;
    const quotedPathToVideo = `"${pathToVideo}"`;
    var outputPath = generateRandomOutputPath(pathToSave);
    const quotedOutputPath = `"${outputPath}"`;

    // encode method is irrelevant for the most part since the depth map is a grayscale image
    // and TAS does some internal conversions to make it work
    // Construct the command with paths in quotation marks
    const command = `${quotedPathToTasExe} ${mainPyPath} --input ${quotedPathToVideo} --output ${quotedOutputPath} --depth --depth_method ${depthMethod} --bit_depth ${bitDepth} --depth_quality ${depthQuality} --half ${aiPrecision} --ae`;

    // Return the command and outputPath
    return { command, outputPath };
};

const generateRandomOutputPath = (pathToSave: string) => {
    // Create the /TAS-Depth/ folder path
    const tasDepthFolder = path.join(pathToSave, "TAS-Depth");

    // Ensure the folder exists
    if (!fs.existsSync(tasDepthFolder)) {
        fs.mkdirSync(tasDepthFolder, { recursive: true });
    } // This will generate a random string of 4 characters
    // The file name will be Depth_{random_string}.mp4
    var randomCharacters = Math.random().toString(36).substring(2, 6);
    return path.join(tasDepthFolder, `Depth_${randomCharacters}.mp4`);
};

export { depthMapExtractionLogic };
