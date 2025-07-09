const animeDownloadLogic = (pathToTasExe: string, pathToSave: string) => {
    // This needs the command to be with /c since the Terminal requires you to select
    // a desired resoltuion for the input video
    // the --ae flag in the command will determine if the video will need to be re-encoded for
    // resolutions past 1080p since 1440p+ is encoded using I believe vp9 / av1 + .webm
    // and After Effects does not support .webm files by default

    // This is the command to download the video
    // main.exe --input url_here --output path_here --ae
    const quotedPathToTasExe = `"${pathToTasExe}"`;
    var outputPath = generateRandomOutputPath(pathToSave);
    const quotedOutputPath = `"${outputPath}"`;

    // Construct the command with paths in quotation marks
    const command = `${quotedPathToTasExe} --input "anime" --output ${quotedOutputPath} --ae`;

    // Return the command and outputPath
    return { command, outputPath };
};

const generateRandomOutputPath = (pathToSave: string) => {
    // pathToSave is the default location where to save the video,
    // so we need to generate a random name for the output file
    // Prefixing the file name with TAS_YT_ and defaulting it to .mp4

    // This will generate a random string of 4 characters
    // The file name will be TAS_YT_{random_string}.mp4
    return `${pathToSave}/TAS-Anime/TAS_${Math.random().toString(36).substring(2, 6)}.mp4`;
};

export { animeDownloadLogic };
