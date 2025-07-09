const offlineModeLogic = (pathToTasExe: string, mainPyPath: string) => {
    // the logic is relatively straight forward
    // expected command is
    // main.exe --offline {variable_here}
    // this will basically tell TAS, hey download all of the models in one go and make the script work offline
    // it also makes the script work faster since it doesn't need to download models on the fly, well at least the first time
    const command = `"${pathToTasExe}" "${mainPyPath}" --offline all`; // this is the command that will be executed
    return command;
};

export { offlineModeLogic };
