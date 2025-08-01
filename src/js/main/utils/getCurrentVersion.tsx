import { child_process, path } from "../../lib/cep/node";
import { safePathJoin, ensureUtf8String, quoteUtf8Path } from "./utf8PathUtils";

const getCurrentVersion = (tasAppdataPath: string, pythonExePath: string): Promise<string> => {
    const mainPyPath = safePathJoin(ensureUtf8String(tasAppdataPath), "main.py");
    const command = `${quoteUtf8Path(pythonExePath)} ${quoteUtf8Path(mainPyPath)} --version`;
    return new Promise((resolve, reject) => {
        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("Error fetching current version:", stderr);
                reject(error);
            } else {
                const version = ensureUtf8String(stdout.trim());
                resolve(version);
            }
        });
    });
};

export default getCurrentVersion;
