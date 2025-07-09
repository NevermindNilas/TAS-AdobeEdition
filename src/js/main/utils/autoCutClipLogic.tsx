// src/js/main/utils/autoCutClipLogic.tsx
const autoCutLogic = async (
    pathToTasExe: string,
    mainPyPath: string,
    pathToVideo: string,
    autoCutClipSens: any,
    inpoint: any,
    outpoint: any
): Promise<string> => {
    const quotedPathToTasExe = `"${pathToTasExe}"`;
    const quotedPathToVideo = `"${pathToVideo}"`;

    const command = `${quotedPathToTasExe} ${mainPyPath} --input ${quotedPathToVideo} --autoclip --autoclip_sens ${autoCutClipSens * 100} --inpoint ${inpoint} --outpoint ${outpoint}`;

    return command;
};

export default autoCutLogic;
