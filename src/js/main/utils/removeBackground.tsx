const fs = require("fs");
const path = require("path");

const removeBackgroundLogic = async (
    pathToTasExe: string,
    mainPyPath: string,
    pathToVideo: string,
    pathToSave: string,
    backgroundMethod: string,
    aiPrecision: string
) => {
    // This is the command to remove the background
    // main.exe --input path_to_video --output path_to_save --segment
    // there's technically --segment_method with anime / anime-tensorrt / cartoon ( TBA ) / cartoon-tensorrt ( TBA )
    // but for now we'll just use the default method since tensorrt is still under development
    const quotedPathToTasExe = `"${pathToTasExe}"`;
    const quotedMainPyPath = `"${mainPyPath}"`;
    const quotedPathToVideo = `"${pathToVideo}"`;
    var outputPath = generateRandomOutputPath(pathToSave);
    const quotedOutputPath = `"${outputPath}"`;

    // Construct the command with paths in quotation marks
    // Encode Method is irrelevant since TAS internally switches to ProRes regardless
    const command = `${quotedPathToTasExe} ${mainPyPath} --input ${quotedPathToVideo} --output ${quotedOutputPath} --segment --segment_method ${backgroundMethod} --half ${aiPrecision} --ae`;

    // Return the command and outputPath
    return { command, outputPath };
};

const generateRandomOutputPath = (pathToSave: string) => {
    // Create the /TAS-RemoveBG/ folder path
    const tasRemoveBGFolder = path.join(pathToSave, "TAS-RemoveBG");

    // Ensure the folder exists
    if (!fs.existsSync(tasRemoveBGFolder)) {
        fs.mkdirSync(tasRemoveBGFolder, { recursive: true });
    } // This will generate a random string of 4 characters
    // The file name will be RemoveBackground_{random_string}.mov
    return path.join(
        tasRemoveBGFolder,
        `RmvBackground_${Math.random().toString(36).substring(2, 6)}.mov`
    );
};

export { removeBackgroundLogic };
