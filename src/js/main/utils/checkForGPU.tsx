import { child_process } from "../../lib/cep/node";

async function checkForGPU(): Promise<"FULL" | "LITE"> {
    return new Promise((resolve, reject) => {
        child_process.exec("nvidia-smi", (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing nvidia-smi: ${error.message}`);
                resolve("LITE");
            } else {
                console.log(`nvidia-smi output: ${stdout}`);
                resolve("FULL");
            }
        });
    });
}

export default checkForGPU;
