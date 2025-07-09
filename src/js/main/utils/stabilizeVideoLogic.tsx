const fs = require("fs");
const path = require("path");

const stabilizeVideoLogic = async (
    pathToTasExe: string,
    pathToVideo: string,
    inputName: string,
    pathToSave: string,
    inpoint: any,
    outpoint: any
) => {
    // This is the command to stabilize the video
    // main.exe --input path_to_video --output path_to_save --stabilize
    const quotedPathToTasExe = `"${pathToTasExe}"`;
    const quotedPathToVideo = `"${pathToVideo}"`;
    var outputPath = generateRandomOutputPath(pathToSave, inputName);
    const quotedOutputPath = `"${outputPath}"`;

    // Construct the command with paths in quotation marks
    const command = `${quotedPathToTasExe} --input ${quotedPathToVideo} --output ${quotedOutputPath} --stabilize --inpoint ${inpoint} --outpoint ${outpoint}`;

    // Return the command and outputPath
    return { command, outputPath };
};

const generateRandomOutputPath = (pathToSave: string, inputName: string) => {
    // Remove the .mp4 extension from the input name
    const baseName = inputName.replace(/\.[^/.]+$/, "");

    // Create the /TAS-Stabilize/ folder path
    const tasStabilizeFolder = path.join(pathToSave, "TAS-Stabilize");

    // Ensure the folder exists
    if (!fs.existsSync(tasStabilizeFolder)) {
        fs.mkdirSync(tasStabilizeFolder, { recursive: true });
    }

    // This will generate a random string of 4 characters
    // The file name will be InputName_Stabilize_{random_string}.mp4
    return path.join(
        tasStabilizeFolder,
        `${baseName}_Stabilize_${Math.random().toString(36).substring(2, 6)}.mp4`
    );
};

export default stabilizeVideoLogic;
