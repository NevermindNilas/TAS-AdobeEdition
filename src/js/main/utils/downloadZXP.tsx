import { path, fs, https, http, child_process } from "../../lib/cep/node";

interface GitHubAsset {
    name: string;
    browser_download_url: string;
}

const MAX_RETRIES = 3;
const PROGRESS_TIMEOUT = 10000; // 10 seconds

// Function to download the latest TAS release and extract it
const copyDirectory = (source: string, destination: string) => {
    const files = fs.readdirSync(source);
    files.forEach(file => {
        // Skip copying .zip or .zxp files
        if (file.endsWith(".zip") || file.endsWith(".zxp")) {
            return;
        }
        const sourcePath = path.join(source, file);
        const destinationPath = path.join(destination, file);
        if (fs.lstatSync(sourcePath).isDirectory()) {
            if (!fs.existsSync(destinationPath)) {
                fs.mkdirSync(destinationPath);
            }
            copyDirectory(sourcePath, destinationPath);
        } else {
            fs.copyFileSync(sourcePath, destinationPath);
        }
    });
};

// Function to download the latest TAS release and extract it
const downloadTasUpdate = async (
    tasFullAppDataPath: string,
    onProgress: (percentage: number, progressBarState: string, isDone: boolean) => void
) => {
    try {
        // alert the base path of where TAS is running from
        console.log("dirname:" + __dirname);
        const tasPath = path.join(tasFullAppDataPath, "Update");
        fs.mkdirSync(tasPath, { recursive: true });

        const latestReleaseUrl =
            "https://api.github.com/repos/NevermindNilas/TheAnimeScripter/releases/latest";

        https
            .get(latestReleaseUrl, { headers: { "User-Agent": "Node.js" } }, response => {
                let data = "";

                response.on("data", chunk => {
                    data += chunk;
                });

                response.on("end", async () => {
                    const release = JSON.parse(data);
                    const toString = JSON.stringify(release);
                    console.log(`Release: ${toString}`);
                    const tasAsset = release.assets.find((asset: GitHubAsset) => {
                        const name = asset.name.toLowerCase();
                        return name.endsWith(".zip");
                    });

                    if (tasAsset) {
                        console.log(`Selected asset: ${tasAsset.name}`);
                        const downloadPath = path.join(tasPath, tasAsset.name);
                        await downloadFileWithRetries(
                            tasAsset.browser_download_url,
                            downloadPath,
                            progress => {
                                console.log(`Download progress: ${progress}%`);
                                onProgress(progress, "Downloading TAS Adobe Edition", false);
                            }
                        );

                        // Verify the downloaded file is a valid zip archive
                        if (fs.existsSync(downloadPath) && fs.statSync(downloadPath).size > 0) {
                            onProgress(100, "Extracting TAS...", false);
                            await extractZipAndOverwrite(downloadPath, tasPath, tasPath);
                            onProgress(100, "Finished", true);

                            fs.unlink(downloadPath, err => {
                                if (err) {
                                    console.error(`Error deleting file: ${err}`);
                                } else {
                                    console.log("File deleted successfully");
                                }
                            });
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

export default downloadTasUpdate;

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

// ...existing code...
const extractZipAndOverwrite = async (
    zipPath: string,
    extractPath: string,
    tasUpdateFolderPath: string
) => {
    return new Promise<void>((resolve, reject) => {
        const command = `powershell.exe -command Expand-Archive -Path "${zipPath}" -DestinationPath "${extractPath}" -Force`;
        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error extracting zip: ${error}`);
                reject(error);
            } else {
                console.log(`Extracted zip successfully: ${zipPath}`);
                try {
                    const files = fs.readdirSync(extractPath);
                    for (const file of files) {
                        if (file !== "TheAnimeScripter.zxp") {
                            const target = path.join(extractPath, file);
                            fs.rmSync(target, { recursive: true, force: true });
                        }
                    }
                    const zxpPath = path.join(extractPath, "TheAnimeScripter.zxp");
                    if (fs.existsSync(zxpPath)) {
                        fs.renameSync(zxpPath, zipPath);

                        const command = `powershell.exe -command Expand-Archive -Path "${zipPath}" -DestinationPath "${extractPath}" -Force`;
                        child_process.exec(command, (error, stdout, stderr) => {
                            if (error) {
                                console.error(`Error extracting renamed zip: ${error}`);
                                reject(error);
                            } else {
                                console.log(`Extracted renamed zip successfully: ${zipPath}`);
                                copyDirectory(tasUpdateFolderPath, __dirname);
                                resolve();
                            }
                        });
                    } else {
                        reject(new Error(`File not found: ${zxpPath}`));
                    }
                } catch (err) {
                    reject(err);
                }
            }
        });
    });
};
// ...existing code...
