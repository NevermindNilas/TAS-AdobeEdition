import { child_process, path } from "../../lib/cep/node";

const getCurrentVersion = (tasAppdataPath: string, pythonExePath: string): Promise<string> => {
    const mainPyPath = path.join(tasAppdataPath, "main.py");
    const command = `"${pythonExePath}" "${mainPyPath}" --version`;
    return new Promise((resolve, reject) => {
        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("Error fetching current version:", stderr);
                reject(error);
            } else {
                const version = stdout.trim();
                resolve(version);
            }
        });
    });
};

export default getCurrentVersion;
