import { child_process } from "../../lib/cep/node";

// Returns a bool value indicating whether Windows Terminal is available
// W11 comes preinstalled with it and it gives some nice QOL improvements
// Like better ascii, worth checking for.
// Only useful if the terminal is being used in the first place
const checkWindowsTerminalAvailability = (): Promise<boolean> => {
    return new Promise(resolve => {
        child_process.exec("where wt", (error, stdout, stderr) => {
            if (error) {
                console.error(`where wt exec error: ${error}`);
                resolve(false);
            } else {
                console.log(`Windows Terminal found: ${stdout}`);
                resolve(true); // Windows Terminal found
            }
        });
    });
};

export { checkWindowsTerminalAvailability };
