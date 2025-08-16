import { path, fs, https, http, child_process } from "../../lib/cep/node";
import { generateToast } from "./generateToast";
import { safePathJoin, ensureUtf8String, safeExistsSync, quoteUtf8Path } from "./utf8PathUtils";

interface GitHubAsset {
    name: string;
    browser_download_url: string;
}

const MAX_RETRIES = 3;
const PROGRESS_TIMEOUT = 10000;

/**
 * Convert bytes number to readable format like "1.5 MB"
 * @param bytes - number of bytes to convert
 * @returns formatted string with size unit
 */
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Make download speed text from bytes per second
 * @param bytesPerSecond - speed in bytes per second
 * @returns formatted speed like "2.5 MB/s"
 */
const formatSpeed = (bytesPerSecond: number): string => {
    return formatBytes(bytesPerSecond) + '/s';
};

interface DownloadProgressInfo {
    percentage: number;
    status: string;
    isDone: boolean;
    downloadSpeed?: number;
    eta?: number;
    downloadedSize?: number;
    totalSize?: number;
    phase: 'downloading' | 'extracting' | 'installing' | 'complete';
    formattedSpeed?: string;
    formattedSize?: string;
    formattedTotal?: string;
}

/**
 * Main function for download TAS backend from GitHub and install dependencies
 * This function will download archive, extract it, and install Python packages
 * @param tasAppDataPath - where to save TAS files
 * @param tasPythonExecPath - path to python executable
 * @param onProgress - callback function to report progress status
 * @param enableCompression - whether to apply XPRESS 8K compression after installation
 */
const downloadTASCLI = async (
    tasAppDataPath: string,
    tasPythonExecPath: string,
    onProgress: (progressInfo: DownloadProgressInfo) => void,
    enableCompression: boolean = false
) => {
    try {
        const sevenZPath = await download7zExe(tasAppDataPath);
        const tasPath = safePathJoin(ensureUtf8String(tasAppDataPath));
        const latestReleaseUrl =
            "https://api.github.com/repos/NevermindNilas/TheAnimeScripter/releases/latest";

        onProgress({
            percentage: 0,
            status: "Fetching release information...",
            isDone: false,
            phase: 'downloading'
        });

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
                            (progressData) => {
                                const speedText = progressData.downloadSpeed > 0 ? formatSpeed(progressData.downloadSpeed) : '';
                                const sizeText = progressData.totalSize > 0 ? 
                                    `${formatBytes(progressData.downloadedSize)} / ${formatBytes(progressData.totalSize)}` : '';
                                
                                onProgress({
                                    percentage: progressData.percentage,
                                    status: `Downloading ${tasAsset.name}${speedText ? ` • ${speedText}` : ''}`,
                                    isDone: false,
                                    downloadSpeed: progressData.downloadSpeed,
                                    eta: progressData.eta,
                                    downloadedSize: progressData.downloadedSize,
                                    totalSize: progressData.totalSize,
                                    formattedSpeed: speedText,
                                    formattedSize: sizeText,
                                    formattedTotal: formatBytes(progressData.totalSize),
                                    phase: 'downloading'
                                });
                            }
                        );

                        // Check if download file is good before continue
                        if (fs.existsSync(downloadPath) && fs.statSync(downloadPath).size > 0) {
                            let extractProgressDots = 0;
                            const extractProgressInterval = setInterval(() => {
                                extractProgressDots = (extractProgressDots + 1) % 4;
                                const dots = ".".repeat(extractProgressDots);
                                onProgress({
                                    percentage: 100,
                                    status: `Extracting archive${dots}`,
                                    isDone: false,
                                    phase: 'extracting'
                                });
                            }, 300);

                            await extract7z(sevenZPath, downloadPath, tasPath);
                            clearInterval(extractProgressInterval);
                            onProgress({
                                percentage: 100,
                                status: "Archive extracted successfully",
                                isDone: false,
                                phase: 'extracting'
                            });

                            fs.unlink(downloadPath, err => {
                                if (err) {
                                    console.error(`Error deleting file: ${err}`);
                                }
                            });

                            onProgress({
                                percentage: 100,
                                status: "Preparing to install dependencies...",
                                isDone: false,
                                phase: 'installing'
                            });

                            await downloadRequirements(
                                tasAppDataPath, 
                                tasPythonExecPath, 
                                logs => {
                                    // Send logs to main window for showing in UI
                                    if (logs && logs.length > 0) {
                                        try {
                                            window.dispatchEvent(
                                                new CustomEvent("tas-log", {
                                                    detail: { logs },
                                                })
                                            );
                                        } catch (error) {
                                            console.error('Error dispatching log event:', error);
                                        }
                                    }
                                },
                                (status: string) => {
                                    // Update progress bar with current package name
                                    onProgress({
                                        percentage: 100,
                                        status: status,
                                        isDone: false,
                                        phase: 'installing'
                                    });
                                }
                            );
                            // Apply compression if requested
                            if (enableCompression) {
                                onProgress({
                                    percentage: 100,
                                    status: "Applying XPRESS 8K compression...",
                                    isDone: false,
                                    phase: 'complete'
                                });

                                try {
                                    await applyXPRESS8KCompression(tasAppDataPath);
                                    
                                    // Verify compression worked
                                    const compressionStats = await verifyCompression(tasAppDataPath);
                                    
                                    onProgress({
                                        percentage: 100,
                                        status: `Compression applied successfully${compressionStats ? ` (${compressionStats})` : ''}`,
                                        isDone: true,
                                        phase: 'complete'
                                    });
                                    generateToast(1, `Backend downloaded and compressed successfully!${compressionStats ? ` ${compressionStats}` : ''}`);
                                } catch (compressionError) {
                                    console.error("Compression failed:", compressionError);
                                    onProgress({
                                        percentage: 100,
                                        status: "Installation complete (compression failed)",
                                        isDone: true,
                                        phase: 'complete'
                                    });
                                    generateToast(2, "Backend downloaded successfully, but compression failed. Files are still functional.");
                                }
                            } else {
                                onProgress({
                                    percentage: 100,
                                    status: "Installation complete",
                                    isDone: true,
                                    phase: 'complete'
                                });
                                generateToast(1, "Backend successfully downloaded!");
                            }
                        } else {
                            throw new Error(
                                `Downloaded file is not a valid archive: ${downloadPath}`
                            );
                        }
                    } else {
                        console.error(
                            "Appropriate TAS .7z file not found in the latest release assets."
                        );
                        generateToast(2, "Failed to find the appropriate TAS download. Please check for updates or try again later.");
                    }
                });
            })
            .on("error", err => {
                console.error("Error fetching the latest TAS release:", err);
                generateToast(2, "Failed to download TAS. Please try again later.");
            });
    } catch (error) {
        console.error("Error in downloadTAS:", error);
        generateToast(2, "Failed to download and extract TAS. Please try again later.");
    }
};

interface DetailedProgressInfo {
    percentage: number;
    downloadSpeed: number;
    eta: number;
    downloadedSize: number;
    totalSize: number;
}

/**
 * Download file with retry mechanism when fail
 * Will try download again if network problem happen
 * @param url - URL to download from
 * @param savePath - where to save downloaded file
 * @param onProgress - callback for progress updates
 */
const downloadFileWithRetries = async (
    url: string,
    savePath: string,
    onProgress: (progressData: DetailedProgressInfo) => void
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

/**
 * Download single file and show progress information
 * This function handle HTTP redirects and calculate download speed
 * @param url - URL for download
 * @param savePath - path where file will be saved
 * @param onProgress - function to call with progress data
 */
const downloadFile = (url: string, savePath: string, onProgress: (progressData: DetailedProgressInfo) => void) => {
    return new Promise<void>((resolve, reject) => {
        const protocol = url.startsWith("https") ? https : http;
        let lastProgressTime = Date.now();
        const CHUNK_SIZE = 1024 * 1024;

        const request = protocol
            .get(url, response => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    // Follow redirect to new URL
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
                const startTime = Date.now();
                let lastSpeedUpdate = startTime;
                let lastDownloadedSize = 0;
                let currentSpeed = 0;

                const fileStream = fs.createWriteStream(savePath);
                response.on("data", chunk => {
                    buffer = Buffer.concat([buffer, chunk]);

                    if (buffer.length >= CHUNK_SIZE) {
                        fileStream.write(buffer);
                        buffer = Buffer.alloc(0);
                    }

                    downloadedSize += chunk.length;
                    const currentTime = Date.now();
                    
                    // Update speed calculation every 500ms for smooth display
                    if (currentTime - lastSpeedUpdate >= 500) {
                        const timeDiff = (currentTime - lastSpeedUpdate) / 1000;
                        const sizeDiff = downloadedSize - lastDownloadedSize;
                        currentSpeed = sizeDiff / timeDiff;
                        lastSpeedUpdate = currentTime;
                        lastDownloadedSize = downloadedSize;
                    }

                    const progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0;
                    const eta = currentSpeed > 0 ? (totalSize - downloadedSize) / currentSpeed : 0;
                    
                    onProgress({
                        percentage: progress,
                        downloadSpeed: currentSpeed,
                        eta: eta,
                        downloadedSize: downloadedSize,
                        totalSize: totalSize
                    });
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
                    onProgress({
                        percentage: 100,
                        downloadSpeed: currentSpeed,
                        eta: 0,
                        downloadedSize: totalSize,
                        totalSize: totalSize
                    });
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

/**
 * Download 7zip extractor tool if not exist already
 * This tool is needed for extract TAS archive file
 * @param tasAppDataPath - folder where to save 7zr.exe
 * @returns path to 7zr.exe file
 */
const download7zExe = async (tasAppDataPath: string) => {
    const url = "https://www.7-zip.org/a/7zr.exe";
    const savePath = safePathJoin(ensureUtf8String(tasAppDataPath), "7zr.exe");

    if (!safeExistsSync(savePath)) {
        await downloadFileWithRetries(url, savePath, () => {});
    }

    return savePath;
};

/**
 * Extract 7z archive file using 7zr.exe tool
 * Use multi-thread for faster extraction speed
 * @param sevenZPath - path to 7zr.exe extractor
 * @param archivePath - path to .7z file for extract
 * @param outputPath - folder where to extract files
 */
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

/**
 * Install Python dependencies using pip command
 * This function run Python script to download required libraries
 * @param tasAppDataPath - path to TAS installation folder
 * @param tasPythonExecPath - path to Python executable
 * @param onLog - callback for log messages
 * @param onProgress - callback for progress status updates
 */
const downloadRequirements = async (
    tasAppDataPath: string,
    tasPythonExecPath: string,
    onLog?: (logs: string[]) => void,
    onProgress?: (status: string) => void
) => {
    const mainPyPath = safePathJoin(ensureUtf8String(tasAppDataPath), "main.py");

    const command = `${quoteUtf8Path(tasPythonExecPath)} -u ${quoteUtf8Path(mainPyPath)} --download_requirements`;
    return new Promise<void>((resolve, reject) => {
        const childProcess = child_process.exec(command, {
            env: {
                ...process.env,
                PYTHONUNBUFFERED: '1',
                PIP_PROGRESS_BAR: 'off',
                PIP_NO_COLOR: '1'
            }
        });

        // Try to find package name from pip output text
        const extractPackageName = (line: string): string | null => {
            const collectingMatch = line.match(/Collecting\s+([^\s=\(]+)/);
            if (collectingMatch) {
                return collectingMatch[1].replace(/_/g, '-');
            }
            
            const downloadingUrlMatch = line.match(/Downloading\s+.*\/([^\/\-]+)[\-_]/);
            if (downloadingUrlMatch) {
                return downloadingUrlMatch[1].replace(/_/g, '-');
            }
            
            const downloadingFileMatch = line.match(/Downloading\s+([^\s\-]+)/);
            if (downloadingFileMatch && !downloadingFileMatch[1].startsWith('http')) {
                return downloadingFileMatch[1].replace(/_/g, '-');
            }
            
            const installingMatch = line.match(/Installing collected packages:\s*(.+)/);
            if (installingMatch) {
                const packages = installingMatch[1].split(',').map(p => p.trim());
                return packages[0].replace(/_/g, '-');
            }
            
            const successMatch = line.match(/Successfully installed\s+([^\s\-]+)/);
            if (successMatch) {
                return successMatch[1].replace(/_/g, '-');
            }
            
            return null;
        };

        let stdoutBuffer = '';
        
        childProcess.stdout?.on("data", data => {
            stdoutBuffer += data.toString();
            const lines = stdoutBuffer.split('\n');
            
            stdoutBuffer = lines.pop() || '';
            
            const completeLines = lines.filter((line: string) => line.trim() !== "");
            
            if (completeLines.length > 0) {
                for (const line of completeLines) {
                    const packageName = extractPackageName(line);
                    if (packageName && onProgress) {
                        // Make package name look nice for user
                        const formattedName = packageName
                            .split('-')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                        onProgress(`Installing ${formattedName}...`);
                    } else if (onProgress) {
                        // Check for other pip status messages
                        if (line.includes('Installing build dependencies')) {
                            onProgress('Installing build dependencies...');
                        } else if (line.includes('Getting requirements to build')) {
                            onProgress('Getting build requirements...');
                        } else if (line.includes('Preparing metadata')) {
                            onProgress('Preparing package metadata...');
                        } else if (line.includes('Building wheel')) {
                            onProgress('Building package wheel...');
                        } else if (line.includes('Successfully installed')) {
                            onProgress('Installation completed successfully');
                        }
                    }
                }
                
                if (onLog) {
                    setImmediate(() => onLog(completeLines));
                }
            }
        });

        let stderrBuffer = '';
        
        childProcess.stderr?.on("data", data => {
            stderrBuffer += data.toString();
            const lines = stderrBuffer.split('\n');
            
            stderrBuffer = lines.pop() || '';
            
            const completeLines = lines.filter((line: string) => line.trim() !== "");
            
            if (completeLines.length > 0) {
                // Sometimes pip send package info to stderr too
                for (const line of completeLines) {
                    const packageName = extractPackageName(line);
                    if (packageName && onProgress) {
                        const formattedName = packageName
                            .split('-')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                        onProgress(`Installing ${formattedName}...`);
                    }
                }
                
                if (onLog) {
                    // Only mark real errors, not all stderr output
                    const logLines = completeLines.map((line: string) => 
                        line.toLowerCase().includes('error') || line.toLowerCase().includes('failed') 
                            ? `ERROR: ${line}` 
                            : line
                    );
                    setImmediate(() => onLog(logLines));
                }
            }
        });

        childProcess.on("exit", code => {
            // Send any remaining text from buffers
            if (stdoutBuffer.trim() && onLog) {
                setImmediate(() => onLog([stdoutBuffer.trim()]));
            }
            if (stderrBuffer.trim() && onLog) {
                const line = stderrBuffer.trim();
                const logLine = line.toLowerCase().includes('error') || line.toLowerCase().includes('failed') 
                    ? `ERROR: ${line}` 
                    : line;
                setImmediate(() => onLog([logLine]));
            }
            
            if (code === 0) {
                if (onLog) {
                    setImmediate(() => onLog([`Libraries downloaded successfully (exit code: ${code})`]));
                }
                resolve();
            } else {
                if (onLog) {
                    setImmediate(() => onLog([`Error: Python process exited with code ${code}`]));
                }
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
};

/**
 * Apply XPRESS 8K compression to the TAS installation folder
 * Uses Windows Compression API via the compact command
 * @param tasAppDataPath - path to TAS installation folder
 */
const applyXPRESS8KCompression = (tasAppDataPath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const logToUI = (logs: string[]) => {
            try {
                window.dispatchEvent(
                    new CustomEvent("tas-log", {
                        detail: { logs },
                    })
                );
            } catch (error) {
                console.error('Error dispatching compression log event:', error);
            }
        };

        console.log(`Starting compression for: ${tasAppDataPath}`);
        logToUI([`[COMPRESSION] Starting XPRESS 8K compression for: ${tasAppDataPath}`]);
        
        let compactCommand = `compact /C /S /F /I /Q /EXE:XPRESS8K "${tasAppDataPath}\\*"`;
        logToUI([`[COMPRESSION] Executing command: ${compactCommand}`]);
        
        child_process.exec(compactCommand, { 
            timeout: 300000, 
            maxBuffer: 50 * 1024 * 1024
        }, (error, stdout, stderr) => {
            console.log("Compression command output:");
            console.log("stdout:", stdout);
            console.log("stderr:", stderr);
            
            // Log all output to UI
            if (stdout) {
                const stdoutLines = stdout.split('\n').filter(line => line.trim());
                logToUI(stdoutLines.map(line => `[COMPRESSION] ${line}`));
            }
            if (stderr) {
                const stderrLines = stderr.split('\n').filter(line => line.trim());
                logToUI(stderrLines.map(line => `[COMPRESSION ERROR] ${line}`));
            }
            
            if (error) {
                console.error("XPRESS 8K compression failed, trying fallback:", error);
                logToUI([`[COMPRESSION] XPRESS 8K failed: ${error.message}`]);
                logToUI([`[COMPRESSION] Trying fallback to standard NTFS compression...`]);
                
                // Fallback to standard NTFS compression if XPRESS 8K fails
                const fallbackCommand = `compact /C /S /F /I /Q "${tasAppDataPath}\\*"`;
                console.log(`Trying fallback command: ${fallbackCommand}`);
                logToUI([`[COMPRESSION] Fallback command: ${fallbackCommand}`]);
                
                child_process.exec(fallbackCommand, { 
                    timeout: 300000, 
                    maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large output
                }, (fallbackError, fallbackStdout, fallbackStderr) => {
                    console.log("Fallback compression output:");
                    console.log("stdout:", fallbackStdout);
                    console.log("stderr:", fallbackStderr);
                    
                    if (fallbackStdout) {
                        const stdoutLines = fallbackStdout.split('\n').filter(line => line.trim());
                        logToUI(stdoutLines.map(line => `[COMPRESSION FALLBACK] ${line}`));
                    }
                    if (fallbackStderr) {
                        const stderrLines = fallbackStderr.split('\n').filter(line => line.trim());
                        logToUI(stderrLines.map(line => `[COMPRESSION FALLBACK ERROR] ${line}`));
                    }
                    
                    if (fallbackError) {
                        console.error("Fallback compression also failed:", fallbackError);
                        logToUI([`[COMPRESSION] Both XPRESS 8K and standard compression failed: ${fallbackError.message}`]);
                        reject(new Error(`Both XPRESS 8K and standard compression failed: ${fallbackError.message}`));
                    } else {
                        console.log("Standard NTFS compression completed successfully");
                        logToUI([`[COMPRESSION] Standard NTFS compression completed successfully`]);
                        resolve();
                    }
                });
            } else {
                console.log("XPRESS 8K compression completed successfully");
                logToUI([`[COMPRESSION] XPRESS 8K compression completed successfully`]);
                
                if (stdout.includes("files within") || stdout.includes("compressed") || stdout.includes("ratio")) {
                    console.log("Compression appears to have processed files successfully");
                    logToUI([`[COMPRESSION] Compression appears to have processed files successfully`]);
                } else {
                    console.warn("Compression command completed but may not have processed any files");
                    logToUI([`[COMPRESSION WARNING] Command completed but may not have processed any files`]);
                }
                
                resolve();
            }
        });
    });
};

/**
 * Verify that compression was applied by checking compression status
 * @param tasAppDataPath - path to TAS installation folder
 * @returns Promise with compression statistics or null if verification fails
 */
const verifyCompression = (tasAppDataPath: string): Promise<string | null> => {
    return new Promise((resolve) => {
        // Send logs to UI
        const logToUI = (logs: string[]) => {
            try {
                window.dispatchEvent(
                    new CustomEvent("tas-log", {
                        detail: { logs },
                    })
                );
            } catch (error) {
                console.error('Error dispatching verification log event:', error);
            }
        };

        const verifyCommand = `compact /Q "${tasAppDataPath}"`;
        logToUI([`[COMPRESSION VERIFY] Checking compression status: ${verifyCommand}`]);
        
        child_process.exec(verifyCommand, (error, stdout, stderr) => {
            if (error) {
                console.error("Compression verification failed:", error);
                logToUI([`[COMPRESSION VERIFY] Verification failed: ${error.message}`]);
                resolve(null);
                return;
            }
            
            console.log("Compression verification output:", stdout);
            
            if (stdout) {
                const stdoutLines = stdout.split('\n').filter(line => line.trim());
                logToUI(stdoutLines.map(line => `[COMPRESSION VERIFY] ${line}`));
            }
            if (stderr) {
                const stderrLines = stderr.split('\n').filter(line => line.trim());
                logToUI(stderrLines.map(line => `[COMPRESSION VERIFY ERROR] ${line}`));
            }
            
            const lines = stdout.split('\n');
            let compressedFiles = 0;
            let totalFiles = 0;
            let compressionRatio = '';
            
            for (const line of lines) {
                if (line.includes('files within')) {
                    const match = line.match(/(\d+)\s+files\s+within/);
                    if (match) {
                        totalFiles = parseInt(match[1]);
                    }
                }
                if (line.includes('are compressed')) {
                    const match = line.match(/(\d+)\s+are\s+compressed/);
                    if (match) {
                        compressedFiles = parseInt(match[1]);
                    }
                }
                if (line.includes('compression ratio')) {
                    const match = line.match(/compression\s+ratio\s+(\d+\.\d+)\s+to\s+1/);
                    if (match) {
                        compressionRatio = match[1];
                    }
                }
            }
            
            if (compressedFiles > 0) {
                const percentage = totalFiles > 0 ? Math.round((compressedFiles / totalFiles) * 100) : 0;
                const stats = `${compressedFiles}/${totalFiles} files compressed (${percentage}%)${compressionRatio ? `, ratio ${compressionRatio}:1` : ''}`;
                logToUI([`[COMPRESSION VERIFY] Result: ${stats}`]);
                resolve(stats);
            } else {
                logToUI([`[COMPRESSION VERIFY] No compressed files found`]);
                resolve(null);
            }
        });
    });
};

export default downloadTASCLI;
