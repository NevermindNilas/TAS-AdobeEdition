import { path, fs, https, http, child_process } from "../../lib/cep/node";
import { generateToast } from "./generateToast";
import { safePathJoin, ensureUtf8String, safeExistsSync, quoteUtf8Path } from "./utf8PathUtils";

interface GitHubAsset {
    name: string;
    browser_download_url: string;
}

const MAX_RETRIES = 3;
const PROGRESS_TIMEOUT = 10000; // 10 seconds

// Function to download the latest TAS release and extract it
const downloadTASCLI = async (
    tasAppDataPath: string,
    tasPythonExecPath: string,
    onProgress: (percentage: number, progressBarState: string, isDone: boolean) => void
) => {
    try {
        const sevenZPath = await download7zExe(tasAppDataPath);
        const tasPath = safePathJoin(ensureUtf8String(tasAppDataPath));
        const latestReleaseUrl =
            "https://api.github.com/repos/NevermindNilas/TheAnimeScripter/releases/latest";

        let progressMessage = "Downloading TAS...";
        onProgress(0, progressMessage, false);

        https
            .get(latestReleaseUrl, { headers: { "User-Agent": "Node.js" } }, response => {
                let data = "";

                response.on("data", chunk => {
                    data += chunk;
                });

                response.on("end", async () => {
                    const release = JSON.parse(data);
                    const tasAsset = release.assets.find((asset: GitHubAsset) => {
                        const name = asset.name.toLowerCase();
                        return (
                            name.includes("windows") &&
                            name.endsWith(".7z") &&
                            !name.includes("linux") &&
                            !name.includes("adobeedition")
                        );
                    });

                    if (tasAsset) {
                        console.log(`Selected asset: ${tasAsset.name}`);
                        const downloadPath = safePathJoin(tasPath, ensureUtf8String(tasAsset.name));

                        await downloadFileWithRetries(
                            tasAsset.browser_download_url,
                            downloadPath,
                            progress => {
                                onProgress(progress, progressMessage, false);
                            }
                        );

                        // Verify the downloaded file is a valid 7z archive
                        if (fs.existsSync(downloadPath) && fs.statSync(downloadPath).size > 0) {
                            let extractProgressDots = 0;
                            const extractProgressInterval = setInterval(() => {
                                extractProgressDots = (extractProgressDots + 1) % 4;
                                const dots = ".".repeat(extractProgressDots);
                                onProgress(100, `Extracting TAS${dots}`, false);
                            }, 300);

                            await extract7z(sevenZPath, downloadPath, tasPath);
                            clearInterval(extractProgressInterval);
                            onProgress(100, "Finished extracting", false);

                            fs.unlink(downloadPath, err => {
                                if (err) {
                                    console.error(`Error deleting file: ${err}`);
                                } else {
                                    console.log("File deleted successfully");
                                }
                            });

                            // Download requirements after extraction with dots in progress message
                            // pytorch, trt and more
                            let downloadProgressDots = 0;
                            const downloadProgressInterval = setInterval(() => {
                                downloadProgressDots = (downloadProgressDots + 1) % 4;
                                const dots = ".".repeat(downloadProgressDots);
                                onProgress(100, `Downloading required libraries${dots}`, false);
                            }, 300);

                            // Inside downloadTASCLI function where downloadRequirements is called:
                            await downloadRequirements(tasAppDataPath, tasPythonExecPath, logs => {
                                // Access the setFullLogs function to update logs in real-time
                                if (logs && logs.length > 0) {
                                    // Use a custom event to communicate with the main component
                                    window.dispatchEvent(
                                        new CustomEvent("tas-log", {
                                            detail: { logs },
                                        })
                                    );
                                }
                            });
                            clearInterval(downloadProgressInterval);
                            onProgress(100, "Finished", true);

                            generateToast(1, "Backend successfully downloaded!");
                        } else {
                            throw new Error(
                                `Downloaded file is not a valid archive: ${downloadPath}`
                            );
                        }
                    } else {
                        console.error(
                            "Appropriate TAS .7z file not found in the latest release assets."
                        );
                        alert(
                            "Failed to find the appropriate TAS download. Please check for updates or try again later."
                        );
                    }
                });
            })
            .on("error", err => {
                console.error("Error fetching the latest TAS release:", err);
                alert("Failed to download TAS. Please try again later.");
            });
    } catch (error) {
        console.error("Error in downloadTAS:", error);
        alert("Failed to download and extract TAS. Please try again later.");
    }
};

// Function to download a file with progress reporting and retry logic
const downloadFileWithRetries = async (
    url: string,
    savePath: string,
    onProgress: (percentage: number) => void
) => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await downloadFile(url, savePath, onProgress);
            return;
        } catch (error) {
            if (error instanceof Error) {
                console.error(`Attempt ${attempt} failed: ${error.message}`);
            } else {
                console.error(`Attempt ${attempt} failed: ${error}`);
            }
            if (attempt === MAX_RETRIES) {
                throw new Error(`Failed to download file after ${MAX_RETRIES} attempts`);
            }
        }
    }
};

// Function to download a file with progress reporting and restart logic
const downloadFile = (url: string, savePath: string, onProgress: (percentage: number) => void) => {
    return new Promise<void>((resolve, reject) => {
        const protocol = url.startsWith("https") ? https : http;
        let lastProgressTime = Date.now();
        const CHUNK_SIZE = 1024 * 1024;

        const request = protocol
            .get(url, response => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    // Handle redirect
                    return downloadFile(response.headers.location || "", savePath, onProgress)
                        .then(resolve)
                        .catch(reject);
                }

                if (response.statusCode !== 200) {
                    return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                }

                const totalSize = parseInt(response.headers["content-length"] || "0", 10);
                let downloadedSize = 0;
                let buffer = Buffer.alloc(0);

                const fileStream = fs.createWriteStream(savePath);
                response.on("data", chunk => {
                    buffer = Buffer.concat([buffer, chunk]);

                    if (buffer.length >= CHUNK_SIZE) {
                        fileStream.write(buffer);
                        buffer = Buffer.alloc(0);
                    }

                    downloadedSize += chunk.length;
                    const progress = (downloadedSize / totalSize) * 100;
                    onProgress(progress);
                    lastProgressTime = Date.now();
                });

                response.on("end", () => {
                    if (buffer.length > 0) {
                        fileStream.write(buffer);
                    }
                    fileStream.end();
                });

                fileStream.on("finish", () => {
                    console.log(`Downloaded file successfully: ${savePath}`);
                    onProgress(100); // Ensure progress is set to 100% on finish
                    resolve();
                });

                fileStream.on("error", err => {
                    console.error(`Error downloading file: ${savePath}`, err);
                    reject(err);
                });

                const checkProgress = () => {
                    if (Date.now() - lastProgressTime > PROGRESS_TIMEOUT) {
                        request.abort();
                        reject(new Error(`Download stalled, restarting...`));
                    } else {
                        setTimeout(checkProgress, PROGRESS_TIMEOUT);
                    }
                };

                setTimeout(checkProgress, PROGRESS_TIMEOUT);
            })
            .on("error", err => {
                console.error(`Error downloading file: ${url}`, err);
                reject(err);
            });
    });
};

// Function to download 7zr.exe if it doesn't already exist
const download7zExe = async (tasAppDataPath: string) => {
    const url = "https://www.7-zip.org/a/7zr.exe";
    const savePath = safePathJoin(ensureUtf8String(tasAppDataPath), "7zr.exe");

    if (!safeExistsSync(savePath)) {
        await downloadFileWithRetries(url, savePath, () => {});
    }

    return savePath;
};

// Function to extract .7z file using 7zr.exe with multi-threading enabled
const extract7z = (sevenZPath: string, archivePath: string, outputPath: string) => {
    return new Promise<void>((resolve, reject) => {
        const command = `${quoteUtf8Path(sevenZPath)} x ${quoteUtf8Path(archivePath)} -o${quoteUtf8Path(outputPath)} -y -mmt`;
        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("Error extracting .7z file:", stderr);
                reject(error);
            } else {
                console.log("Extraction complete:", stdout);
                resolve();
            }
        });
    });
};

const downloadRequirements = async (
    tasAppDataPath: string,
    tasPythonExecPath: string,
    onLog?: (logs: string[]) => void
) => {
    const mainPyPath = safePathJoin(ensureUtf8String(tasAppDataPath), "main.py");

    // run python.exe with main.py and --download_requirements argument
    const command = `${quoteUtf8Path(tasPythonExecPath)} ${quoteUtf8Path(mainPyPath)} --download_requirements`;
    return new Promise<void>((resolve, reject) => {
        const process = child_process.exec(command);

        // Capture stdout
        process.stdout?.on("data", data => {
            const lines = data
                .toString()
                .split("\n")
                .filter((line: string) => line.trim() !== "");
            if (lines.length > 0 && onLog) {
                onLog(lines);
            }
        });

        // Capture stderr
        process.stderr?.on("data", data => {
            const lines = data
                .toString()
                .split("\n")
                .filter((line: string) => line.trim() !== "");
            if (lines.length > 0 && onLog) {
                // Mark errors to make them stand out in the log
                const errorLines = lines.map((line: string) => `ERROR: ${line}`);
                onLog(errorLines);
            }
        });

        // Handle process completion
        process.on("exit", code => {
            if (code === 0) {
                if (onLog) {
                    onLog([`Libraries downloaded successfully (exit code: ${code})`]);
                }
                console.log("Libraries downloaded successfully");
                resolve();
            } else {
                if (onLog) {
                    onLog([`Error: Python process exited with code ${code}`]);
                }
                console.error(`Error downloading libraries: Process exited with code ${code}`);
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
};
export default downloadTASCLI;
