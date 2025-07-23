import {
    ActionButton,
    AlertDialog,
    Checkbox,
    ComboBox,
    Content,
    darkTheme,
    Dialog,
    DialogTrigger,
    Disclosure,
    DisclosurePanel,
    DisclosureTitle,
    Divider,
    Flex,
    Heading,
    Image,
    Item,
    Picker,
    ProgressBar,
    Provider,
    Section,
    Slider,
    TabList,
    TabPanels,
    Tabs,
    Text,
    TextField,
    Link,
    ToggleButton,
    Tooltip,
    TooltipTrigger,
    View,
} from "@adobe/react-spectrum";
import { ToastContainer } from "@react-spectrum/toast";
import { Key } from "@react-types/shared";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import "./style.css";

import { socketManager } from "./utils/socket";

// Icons
import Beaker from "@spectrum-icons/workflow/Beaker";
import Cancel from "@spectrum-icons/workflow/Cancel";
import Download from "@spectrum-icons/workflow/Download";
import Effects from "@spectrum-icons/workflow/Effects";
import Gauge1 from "@spectrum-icons/workflow/Gauge1";
import Gauge2 from "@spectrum-icons/workflow/Gauge2";
import Gauge3 from "@spectrum-icons/workflow/Gauge3";
import Gauge4 from "@spectrum-icons/workflow/Gauge4";
import Gauge5 from "@spectrum-icons/workflow/Gauge5";
import Inbox from "@spectrum-icons/workflow/Inbox";
import Info from "@spectrum-icons/workflow/Info";
import Layers from "@spectrum-icons/workflow/Layers";
import LinkIcon from "@spectrum-icons/workflow/Link";
import Settings from "@spectrum-icons/workflow/Settings";
import SortOrderDown from "@spectrum-icons/workflow/SortOrderDown";
import SortOrderUp from "@spectrum-icons/workflow/SortOrderUp";
import Wrench from "@spectrum-icons/workflow/Wrench";

import { child_process, fs, path } from "../lib/cep/node";
import { evalTS } from "../lib/utils/bolt";
import { animeDownloadLogic } from "./utils/animeDownloadLogic";
import autoCutLogic from "./utils/autoCutClipLogic";
import checkForGPU from "./utils/checkForGPU";
import checkForUpdates from "./utils/checkTASVersionGithub";
import execClearCache from "./utils/clearCache";
import DEFAULT from "./utils/DEFAULTS";
import downloadTASCLI from "./utils/downloadTAS";
import { generateToast } from "./utils/generateToast";
import getCurrentVersion from "./utils/getCurrentVersion";
import { getAELayerInfo, getAEProjectFolderPath, ensureProjectIsSaved, createLayer, runProcess, executeProcessHelper, getValidatedAEContext } from "./utils/helpers";
import { offlineModeLogic } from "./utils/offlineMode";
import OpenTASFolder from "./utils/openTASFolder";
import execPrecompose from "./utils/precompose";
import { openChangelog, openGitHubWiki } from "./utils/Socials";
import execTakeScreenshot from "./utils/takeScreenshot";
import { youtubeDownloadLogic } from "./utils/urlToVideo";
import { useDebounce } from "./utils/useDebounce";
import { getTASPaths, addPortToCommand } from "./utils/helpers";
import { depthMapExtractionLogic } from "./utils/depthMap";
import { removeBackgroundLogic } from "./utils/removeBackground";

// Tab Components
import { aboutTab } from "./utils/aboutTab";
import { logTab } from "./utils/logTab";

// Contextual Help Utilities
import {
    createCheckboxContextualHelp,
    createGeneralContextualHelp,
    createPickerContextualHelp,
    createPlacedContextualHelp,
    createSliderContextualHelp,
} from "./utils/ConsistentContextualHelp";

// Upscale model example images
const UPSCALEMODELEXAMPLES = {
    shufflecugan: "https://files.catbox.moe/7ppoj4.png",
    compact: "https://files.catbox.moe/l9xlz9.png",
    ultracompact: "https://files.catbox.moe/feu7fo.png",
    superultracompact: "https://files.catbox.moe/kv4yh7.png",
    aniscale2: "https://files.catbox.moe/y22vc4.png",
    span: "https://files.catbox.moe/0wiigm.png", // Using ModernSpanimationV2 for span
    "open-proteus": "https://files.catbox.moe/yugo9m.png",
    // Models without specific examples will show fallback text
    "shufflecugan-tensorrt": "https://files.catbox.moe/7ppoj4.png",
    "span-tensorrt": "https://files.catbox.moe/0wiigm.png",
    "aniscale2-directml": "https://files.catbox.moe/y22vc4.png",
    "open-proteus-directml": "https://files.catbox.moe/yugo9m.png",
    "rtmosr-directml": null,
    "rtmosr-tensorrt": null,
    "compact-tensorrt": "https://files.catbox.moe/l9xlz9.png",
    "ultracompact-tensorrt": "https://files.catbox.moe/feu7fo.png",
    "superultracompact-tensorrt": "https://files.catbox.moe/kv4yh7.png",
    "compact-directml": "https://files.catbox.moe/l9xlz9.png",
    "ultracompact-directml": "https://files.catbox.moe/feu7fo.png",
    "superultracompact-directml": "https://files.catbox.moe/kv4yh7.png",
    "aniscale2-tensorrt": "https://files.catbox.moe/y22vc4.png",
    "open-proteus-tensorrt": "https://files.catbox.moe/yugo9m.png",
    default: "https://files.catbox.moe/7ppoj4.png", // Default fallback
};

// Depth model example images
const DEPTHMODELEXAMPLES = {
    distill_base_v2: "https://files.catbox.moe/fmyj1d.png",
    distill_small_v2: "https://files.catbox.moe/pva2vb.png",
    og_base_v2: "https://files.catbox.moe/jjjif0.png",
    og_distill_base_v2: "https://files.catbox.moe/7tugf9.png",
    og_distill_small_v2: "https://files.catbox.moe/kkujv9.png",
    og_large_v2: "https://files.catbox.moe/bitvfy.png",
    og_small_v2: "https://files.catbox.moe/28i39s.png",
    // TensorRT and DirectML variants use the same examples as their base models or null if not available
    "distill_small_v2-tensorrt": null,
    "distill_base_v2-tensorrt": null,
    "distill_large_v2-tensorrt": null,
    "distill_small_v2-directml": null,
    "distill_base_v2-directml": null,
    "distill_large_v2-directml": null,
    "og_small_v2-tensorrt": null,
    "og_base_v2-tensorrt": null,
    "og_large_v2-tensorrt": null,
    "og_distill_small_v2-tensorrt": null,
    "og_distill_base_v2-tensorrt": null,
    "small_v2-tensorrt": null,
    "base_v2-tensorrt": null,
    "large_v2-tensorrt": null,
    default: "https://files.catbox.moe/28i39s.png", // Default fallback
};



// TAS Paths
const {
    tasAppDataPath,
    pythonExePath,
    mainPyPath,
    tasFolder,
    tasRoamingPath,
} = getTASPaths();


const Main = () => {
    const [tasVersion, setVersion] = useState(DEFAULT.tasVersion);


    // Chain
    const [preRenderAlgorithm, setPreRenderAlgorithm] = useState<string | null>("high");
    const [resize, setResize] = useState(false);
    const [resizeFactor, setResizeFactor] = useState<string | null>("2");
    const [deduplicate, setDeduplicate] = useState(false);
    const [restore, setRestore] = useState(false);
    const [upscale, setUpscale] = useState(false);
    const [sharpening, setSharpening] = useState(false);
    const [deduplicateMethod, setDeduplicateMethod] = useState<string | null>("ssim");
    const [encodeAlgorithm, setEncodeAlgorithm] = useState<string | null>("x264");
    const [restoreModel, setRestoreModel] = useState<string | null>("anime1080fixer");
    const [upscaleModel, setUpscaleModel] = useState<string | null>("shufflecugan");
    const [forceStatic, setForceStatic] = useState(false);
    const [disableDonatePopup, setDisableDonatePopup] = useState(false);
    const [depthModel, setDepthModel] = useState<string | null>(DEFAULT.depthModel);
    const [depthQuality, setDepthQuality] = useState<string | null>("low");
    const [segmentMethod, setSegmentMethod] = useState<string | null>("anime");
    const [deduplicateSensitivity, setDeduplicateSensitivity] = useState(0.5);
    const [sharpeningSensitivity, setSharpeningSensitivity] = useState(0.5);
    const [autoCutSensitivity, setAutoCutSensitivity] = useState(0.5);
    const [latestVersion, setLatestVersion] = useState("unknown");
    const [bitDepth, setBitDepth] = useState<string | null>("8bit");
    const handleSelectionChange =
    (setter: React.Dispatch<React.SetStateAction<string | null>>) =>
        (key: Key | null) => {
        setter(key as string | null);
        };

    const [youtubeUrl, setYoutubeUrl] = useState("");

    // Interpolation
    const [interpolate, setInterpolate] = useState(false);
    const [rifeensemble, setRifeEnsemble] = useState(false);
    const [interpolationModel, setInterpolationModel] = useState<string | null>("rife4.22");
    const [interpolateFactor, setInterpolateFactor] = useState("2x");
    const [dynamicScale, setDynamicScale] = useState(false);
    const [slowMotion, setSlowMotion] = useState(false);

    // progress bar related logic
    const [isProcessing, setIsProcessing] = useState(false);
    const [isProcessCancelled, setIsProcessCancelled] = useState(false);
    const processCancelledRef = useRef(false);

    const [isBackendAvailable, setisBackendAvailable] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [progressBarState, setProgressBarState] = useState("indeterminate");
    const [showDownloadDialog, setShowDownloadDialog] = useState(false);
    const [CurrentVersionOfExe, setCurrentVersionOfExe] = useState<string | "Not Available">(
        "Not Available"
    );

    const currentFrameRef = useRef(0);
    const totalFramesRef = useRef(100);
    const processingFpsRef = useRef<number>(0);
    const estimatedTimeRemainingRef = useRef<number>(0);
    const progressBarStatusRef = useRef<string>("Initializing...");
    const isProcessingRef = useRef(false);

    const [isNvidia, setIsNvidia] = useState(DEFAULT.TASFULLORLITE);
    const [isGPUCheckDone, setIsGPUCheckDone] = useState(false);
    const [isTASCheckDone, setIsTASCheckDone] = useState(false);
    const [enablePreview, setEnablePreview] = useState(false);

    const [deletePreRender, setDeletePreRender] = useState(false);

    const [aiPrecision, setAiPrecision] = useState<string | null>(DEFAULT.aiPrecision);
    // Toolbox
    const [adjustmentLayerLength, setAdjustmentLayerLength] = useState<string | null>(
        DEFAULT.adjustmentLayerLength
    );
    const [toolboxLayerLength, setToolboxLayerLength] = useState<string | null>(
        DEFAULT.toolboxLayerLength
    );

    const [solidLayerColor, setSolidLayerColor] = useState<string>(DEFAULT.solidLayerColor);

    const [sortLayerMethod, setSortLayerMethod] = useState<string | null>(DEFAULT.sortLayerMethod);

    const [haveICheckedForUpdates, setHaveICheckedForUpdates] = useState(false);

    const [disableProgressBar, setDisableProgressBar] = useState(false);

    // UI Settings
    const [tabListOrientation, setTabListOrientation] = useState<string>(
        DEFAULT.tabListOrientation
    );
    const [uiScale, setUIScale] = useState<string | null>(DEFAULT.uiScale);
    const [percentangeFree, setPercentageFree] = useState<number | undefined>(0);

    // Tab management for swipe gestures
    const tabKeys = ["Chain", "Extra", "Toolbox", "Logs", "About"];
    const [selectedTab, setSelectedTab] = useState<Key>(tabKeys[0]);

    // Tab selection change (no direction logic)
    const handleTabSelectionChange = (key: Key) => {
        setSelectedTab(key);
    };

    const slideAnimationVariants = {
        initial: {
            opacity: 0,
        },
        animate: {
            opacity: 1,
        },
        exit: {
            opacity: 0,
        },
    };


    const formatETA = (seconds: number): string => {
        if (seconds <= 0) return "";

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m remaining`;
        } else if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s remaining`;
        } else if (remainingSeconds > 0) {
            return `${remainingSeconds}s remaining`;
        } else if (remainingSeconds === 0 && minutes === 0 && hours === 0) {
            return "Almost done!";
        } else {
            return "Processing...";
        }
    };



    // Single state object for UI updates
    const [progressState, setProgressState] = useState({
        currentFrame: 0,
        totalFrames: 100,
        processingFps: 0,
        estimatedTimeRemaining: 0,
        progressBarStatus: "Initializing...",
        isProcessing: false
    });

    // Stable callback functions to avoid race conditions
    const updateProgress = useCallback((data: any) => {
        // Update refs immediately
        currentFrameRef.current = data.currentFrame;
        totalFramesRef.current = data.totalFrames;
        processingFpsRef.current = data.fps;
        estimatedTimeRemainingRef.current = data.eta;
        progressBarStatusRef.current = data.status;
        isProcessingRef.current = true;

        // Batch state update for UI
        setProgressState({
            currentFrame: data.currentFrame,
            totalFrames: data.totalFrames,
            processingFps: data.fps,
            estimatedTimeRemaining: data.eta,
            progressBarStatus: data.status,
            isProcessing: true
        });
        setIsProcessing(true);
    }, []);

    const resetProgress = useCallback((status: string = "Progress complete!") => {
        // Reset refs
        currentFrameRef.current = 0;
        totalFramesRef.current = 100;
        processingFpsRef.current = 0;
        estimatedTimeRemainingRef.current = 0;
        progressBarStatusRef.current = status;
        isProcessingRef.current = false;

        // Reset state
        setProgressState({
            currentFrame: 0,
            totalFrames: 100,
            processingFps: 0,
            estimatedTimeRemaining: 0,
            progressBarStatus: status,
            isProcessing: false
        });
        setIsProcessing(false);
    }, []);

    // Logs
    const [fullLogs, setFullLogs] = useState<string[]>([]);


    useEffect(() => {
        let unsubProgress: (() => void) | null = null;
        let unsubComplete: (() => void) | null = null;
        let cancelled = false;

        const initializeSocket = async () => {
            await socketManager.init();
            if (cancelled) return;
            unsubProgress = socketManager.onProgressUpdate(updateProgress);
            unsubComplete = socketManager.onProcessComplete((success) => {
                resetProgress("Progress complete!");
            });
        };

        initializeSocket();

        return () => {
            cancelled = true;
            if (unsubProgress) unsubProgress();
            if (unsubComplete) unsubComplete();
            resetProgress("Initializing...");
        };
    }, [updateProgress, resetProgress]);

    useEffect(() => {
        const initialize = async () => {
            if (haveICheckedForUpdates === false) {
                const res = await checkForUpdates(tasVersion);
                if (res.isUpdateAvailable && haveICheckedForUpdates === false) {
                    setHaveICheckedForUpdates(true);
                    generateToast(4, `Update ${res.latestVersion} is available!`);
                }
            }
            if (!isGPUCheckDone) {
                const result = await checkForGPU();
                setIsNvidia(result);
                setIsGPUCheckDone(true);
                // TASFULLORLITE is set to: ${result}
            }

            if (!isTASCheckDone) {
                checkIfBackendExists();
            }
        };

        initialize();
    }, []);

    const checkIfBackendExists = async () => {
        let isEmpty = true;

        const tasExists = fs.existsSync(tasAppDataPath);
        if (tasExists) {
            const files = fs.readdirSync(tasAppDataPath);
            isEmpty = files.length === 0;
            const exeExists = fs.existsSync(pythonExePath);
            if (!exeExists) {
                setShowDownloadDialog(true);
            } else {
                const currentVersion = await getCurrentVersion(tasAppDataPath, pythonExePath); // Fetches the version of main.py
                if (currentVersion !== tasVersion) {
                    setCurrentVersionOfExe(currentVersion);
                    setShowDownloadDialog(true);
                }

                setLatestVersion(latestVersion);
            }
        }

        if (!tasExists || isEmpty) {
            fs.mkdirSync(tasAppDataPath, { recursive: true });
            setShowDownloadDialog(true);
        }

        setIsTASCheckDone(true);
    };


    const handleDownloadTAS = () => {
        setisBackendAvailable(true);
        setShowDownloadDialog(false);
        setIsDownloading(true);
        downloadTASCLI(tasAppDataPath, pythonExePath, (progress, progressBarState, isDone) => {
            setDownloadProgress(progress);
            setProgressBarState(progressBarState);
            setIsDownloading(!isDone);
        });
    };

    // Modify the useEffect to only attach the event listener when downloading
    useEffect(() => {
        let handleLogEvent: EventListener | null = null;

        if (isDownloading) {
            // Only create and attach the event listener when downloading
            handleLogEvent = ((event: CustomEvent) => {
                const { logs } = event.detail;
                setFullLogs(currentLogs => [...currentLogs, ...logs]);
            }) as EventListener;

            window.addEventListener("tas-log", handleLogEvent);

            // Clear logs at the start of a new download
            setFullLogs(["Starting TAS dependency download..."]);
        }

        // Cleanup function
        return () => {
            if (handleLogEvent) {
                window.removeEventListener("tas-log", handleLogEvent);
            }
        };
    }, [isDownloading]); // Only re-run when isDownloading changes

    const cancelProcessing = useCallback((toastMessage?: string, toastState?: number) => {
        processCancelledRef.current = true;
        setIsProcessCancelled(true);

        // Group these commands into a single batch script for Windows
        const killCommand =
            "taskkill /f /im python.exe & taskkill /f /im ffmpeg.exe & taskkill /f /im ffprobe.exe";
        child_process.exec(killCommand);

        // Use the resetProgress callback instead of individual setters
        resetProgress("Processing cancelled");

        generateToast(toastState || 2, toastMessage || "Processing cancelled.");
    }, [resetProgress]);

    const handleCloseDialog = () => {
        if (!isBackendAvailable) {
            setisBackendAvailable(true);
        }
        setShowDownloadDialog(false);
    };

    const startAutoCut = async () => {
        try {

            var info: any | null = null;
            info = await evalTS("start"); // gets the inpoint, outpoint, input, and name of the video

            if (!(await ensureProjectIsSaved())) {
                return;
            }

            if (info === "undefined") {
                generateToast(2, "Error: No layer selected. Please choose a layer and try again.");
                return;
            }

            const { inpoint, outpoint, input, name } = info;

            // make
            var command = await autoCutLogic(
                pythonExePath,
                mainPyPath,
                input,
                autoCutSensitivity || DEFAULT.autoCutSensitivity,
                inpoint,
                outpoint
            );
            // Add the current socket port to the command
            command = addPortToCommand(command);

            setIsProcessing(true);
            runProcess(executeProcess, command, "Auto Cutting Clip", () => {
                evalTS("autoClip", tasRoamingPath);
            });
        } catch (error) {
            console.error("Error in startAutoCut:", error);
        }
    };

    const startYoutubeDownload = async () => {
        var isSaved = await ensureProjectIsSaved();
        if (!isSaved) {
            return;
        }

        let projectFolderPath = await getAEProjectFolderPath();
        if (!projectFolderPath) {
            return; // Error toast already shown by helper
        }
        var { command, outputPath } = youtubeDownloadLogic(
            youtubeUrl,
            mainPyPath,
            pythonExePath,
            projectFolderPath
        );

        command = `start /wait cmd /c "${command}"`;

        generateToast(3, "Youtube download initiated...");

        runProcess(executeProcess, command, "Youtube download", () => {
            evalTS("importVideo", outputPath);
        });
    };

    const startExtraTabLogic = async (mode: string) => {
        const aeContext = await getValidatedAEContext();
        if (!aeContext) return;
        const { layerInfo, projectFolderPath } = aeContext;

        if (mode === "depth") {
            var toast = "Depth map extraction";
            var depthMethod = depthModel;
            var workflowBitDepth = bitDepth;
            var depthres = depthQuality;

            // Check if depthMethod is null and provide a default value or handle the case appropriately
            if (depthMethod === null) {
                console.error("Depth method is null. Please select a depth method.");
                return;
            }

            if (workflowBitDepth === null) {
                console.error("Bit depth is null. Please select a bit depth.");
                return;
            }

            if (depthres === null) {
                console.error("Depth quality is null. Please select a depth quality.");
                return;
            }

            var renderAlgo = preRenderAlgorithm || DEFAULT.preRenderAlgorithm;
            generateToast(3, "Initiating the pre-render step...");
            var info: any | null = null;
            // @ts-ignore
            info = await evalTS("render", renderAlgo);
            if (info === "undefined") {
                generateToast(
                    2,
                    "Error: Rendering failed. Consider using an alternative encoding method."
                );
                return;
            }

            //var inpoint = info?.inpoint;
            //var outpoint = info?.outpoint;
            var input = info?.input;
            var name = info?.name;


            const half = aiPrecision || DEFAULT.aiPrecision;

            var { command, outputPath } = await depthMapExtractionLogic(
                pythonExePath,
                mainPyPath,
                input,
                projectFolderPath,
                depthMethod,
                workflowBitDepth,
                depthres,
                half
            );
            // Add the current socket port to the command
            command = addPortToCommand(command);

        } else if (mode === "background") {
            var toast = "Background removal";
            generateToast(3, "Initiating the pre-render step...");

            const renderAlgo = preRenderAlgorithm || DEFAULT.preRenderAlgorithm;
            var info: any | null = null;
            // @ts-ignore
            info = await evalTS("render", renderAlgo);
            if (info === "undefined") {
                generateToast(
                    2,
                    "Error: Rendering failed. Consider using an alternative encoding method."
                );
                return;
            }

            //var inpoint = info?.inpoint;
            //var outpoint = info?.outpoint;
            var input = info?.input;
            var name = info?.name;


            const backgroundMethod = segmentMethod || DEFAULT.segmentMethod;
            const half = aiPrecision || DEFAULT.aiPrecision;
            var { command, outputPath } = await removeBackgroundLogic(
                pythonExePath,
                mainPyPath,
                input,
                projectFolderPath,
                backgroundMethod,
                half
            );

            // Add the current socket port to the command
            command = addPortToCommand(command);
        }

        else {
            generateToast(2, "Invalid mode selected for extraction.");
            return;
        }

        setIsProcessing(true);
        runProcess(
            executeProcess,
            command,
            toast,
            () => {
                evalTS("importVideo", outputPath);
            },
            input,
            outputPath
        );
    }

    const startOfflineMode = async () => {
        var command = offlineModeLogic(pythonExePath, mainPyPath);

        runProcess(executeProcess, command, "Offline mode", () => {
            generateToast(1, "TAS is now fully operational offline.");
        });
    };

    const startChain = async () => {
        const aeContext = await getValidatedAEContext();
        if (!aeContext) return;
        const { layerInfo, projectFolderPath } = aeContext;

        var renderAlgo = preRenderAlgorithm || DEFAULT.preRenderAlgorithm;
        generateToast(3, "Initiating the pre-render step...");
        // @ts-ignore
        var info: any | null = await evalTS("render", renderAlgo);
        if (info === "undefined") {
            generateToast(
                2,
                "Error: Rendering failed. Consider using an alternative encoding method."
            );
            return;
        }

        //var inpoint = info?.inpoint;
        //var outpoint = info?.outpoint;
        var input = info?.input;


        // in case if the user has not selected any processing options other than pre-render
        if (!interpolate && !upscale && !deduplicate && !restore && !sharpening && !resize) {
            evalTS("importVideo", input);
            return;
        }
        var outputFolder = await getAEProjectFolderPath();
        if (!outputFolder) {
            return; // Error toast already shown by helper
        }
        var randomNumbers = Math.floor(Math.random() * 100000);

        var outName = `Chain_${randomNumbers}.mp4`;

        var tasChainFolder = path.join(outputFolder.replace(/\\$/, ""), "/TAS-Chain");
        if (!fs.existsSync(tasChainFolder)) {
            fs.mkdirSync(tasChainFolder, { recursive: true });
        }

        var outFile = outputFolder.replace(/\\$/, "") + "/TAS-Chain/" + outName;
        // Properly quote the output file name
        var outFileQuoted = `"${outFile}"`;
        var inputQuoted = `"${input}"`;
        // Properly quote the output file name
        var attempt = [
            `"${pythonExePath}"`,
            `"${mainPyPath}"`,
            "--input",
            inputQuoted,
            "--output",
            outFileQuoted,
            "--ae",
        ];

        if (enablePreview) {
            attempt.push("--preview");
        }

        if (encodeAlgorithm !== null) {
            attempt.push("--encode_method", encodeAlgorithm);
        }

        if (bitDepth !== null) {
            attempt.push("--bit_depth", bitDepth || DEFAULT.bitDepth);
        }

        if (resize) {
            attempt.push("--resize", "--resize_factor", resizeFactor || DEFAULT.resizeFactor);
        }

        if (interpolate) {
            if (interpolateFactor.endsWith("x")) {
                var newinterpolateFactor = interpolateFactor.slice(0, -1);
            } else {
                var newinterpolateFactor = interpolateFactor;
            }

            if (isNaN(Number(newinterpolateFactor))) {
                generateToast(
                    2,
                    "Error: Interpolation factor is not valid. Please select a valid interpolation factor."
                );
                return;
            }

            attempt.push(
                "--interpolate",
                "--interpolate_factor",
                newinterpolateFactor || DEFAULT.interpolateFactor,
                "--interpolate_method",
                interpolationModel || DEFAULT.interpolationModel
            );

            if (slowMotion) {
                attempt.push("--slowmo");
            }

            if (rifeensemble) {
                attempt.push("--ensemble");
            }

            if (dynamicScale) {
                attempt.push("--dynamic_scale");
            }
        }

        if (upscale) {
            attempt.push("--upscale", "--upscale_method", upscaleModel || DEFAULT.upscaleModel);

            if (forceStatic) {
                attempt.push("--static");
            }
        }

        if (deduplicate) {
            attempt.push(
                "--dedup",
                "--dedup_sens",
                String(deduplicateSensitivity * 100 || DEFAULT.deduplicateSensitivity * 100),
                "--dedup_method",
                deduplicateMethod || DEFAULT.deduplicateMethod
            );
        }

        if (restore) {
            attempt.push("--restore", "--restore_method", restoreModel || DEFAULT.restoreModel);
        }

        if (sharpening) {
            attempt.push(
                "--sharpen",
                "--sharpen_sens",
                String(sharpeningSensitivity * 100 || DEFAULT.sharpeningSensitivity * 100)
            );
        }

        if (aiPrecision) {
            attempt.push("--half", aiPrecision || DEFAULT.aiPrecision);
        }

        var command = attempt.join(" ");

        // Add the current socket port to the command
        command = addPortToCommand(command);

        setIsProcessing(true);
        runProcess(
            executeProcess,
            command,
            "Chained Process",
            () => {
                evalTS("importVideo", outFile);
            },
            input,
            outFile
        );
    };

    const startAddAdjustmentLayerLogic = async () => {
        if (await ensureProjectIsSaved()) {
            await createLayer("adjustment", toolboxLayerLength || DEFAULT.toolboxLayerLength);
        }
    };

    const startAddSolidLayerLogic = async () => {
        if (await ensureProjectIsSaved()) {
            await createLayer("solid", toolboxLayerLength || DEFAULT.toolboxLayerLength, solidLayerColor || DEFAULT.solidLayerColor);
        }
    };

    const startDeduplicateLayerTimemapLogic = async () => {
        if (await ensureProjectIsSaved()) {
            const result = await evalTS("removeDuplicates");
            if (result) {
                generateToast(3, "Removing dead frames...");
            } else {
                generateToast(2, "Error: Please select a layer first.");
            }
        }
    };

    const startAddNullLayerLogic = async () => {
        if (await ensureProjectIsSaved()) {
            await createLayer("null", toolboxLayerLength || DEFAULT.toolboxLayerLength);
        }
    };

    const startSortLayersLogic = async () => {
        const isSaved = await ensureProjectIsSaved();
        if (isSaved) {
            const result = await evalTS("sortLayers", sortLayerMethod || DEFAULT.sortLayerMethod);
            if (result) {
                generateToast(3, "Sorting layers...");
            } else {
                generateToast(2, "Error: Please select at least 2 layers.");
            }
        }
    };

    // Wrapper for process execution using helpers
    const executeProcess = (
        command: any,
        toastMessage: string,
        onSuccess?: any,
        inputFile?: any,
        outputFile?: any
    ) => {
        return executeProcessHelper({
            child_process,
            fs,
            path,
            tasFolder,
            command,
            toastMessage,
            resetProgress,
            setFullLogs,
            setIsProcessCancelled,
            processCancelledRef,
            deletePreRender,
            onSuccess,
            inputFile,
            outputFile
        });
    };

    useEffect(() => {
        const savedSettings = localStorage.getItem("settings");
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            setPreRenderAlgorithm(parsedSettings.preRenderAlgorithm);
            setDeduplicate(parsedSettings.deduplicate);
            setRestore(parsedSettings.restore);
            setUpscale(parsedSettings.upscale);
            setInterpolate(parsedSettings.interpolate);
            setSharpening(parsedSettings.sharpening);
            setRifeEnsemble(parsedSettings.rifeensemble);
            setDeduplicateMethod(parsedSettings.deduplicateMethod);
            setEncodeAlgorithm(parsedSettings.encodeAlgorithm);
            setRestoreModel(parsedSettings.restoreModel);
            setUpscaleModel(parsedSettings.upscaleModel);
            setInterpolationModel(parsedSettings.interpolationModel);
            setDepthModel(parsedSettings.depthModel);
            setDeduplicateSensitivity(parsedSettings.deduplicateSensitivity);
            setSharpeningSensitivity(parsedSettings.sharpeningSensitivity);
            setAutoCutSensitivity(parsedSettings.autoCutSensitivity);
            setInterpolateFactor(parsedSettings.interpolateFactor);
            setYoutubeUrl(parsedSettings.youtubeUrl);
            setBitDepth(parsedSettings.bitDepth);
            setSegmentMethod(parsedSettings.segmentMethod);
            setEnablePreview(parsedSettings.enablePreview);
            setDeletePreRender(parsedSettings.deletePreRender);
            setDepthQuality(parsedSettings.depthQuality);
            setAdjustmentLayerLength(parsedSettings.adjustmentLayerLength);
            setSolidLayerColor(parsedSettings.solidLayerColor);
            setSortLayerMethod(parsedSettings.sortLayerMethod);
            setDynamicScale(parsedSettings.dynamicScale);
            setForceStatic(parsedSettings.forceStatic);
            setDisableDonatePopup(parsedSettings.disableDonatePopup);
            setDisableProgressBar(parsedSettings.disableProgressBar);
            setTabListOrientation(parsedSettings.tabListOrientation);
            setToolboxLayerLength(parsedSettings.toolboxLayerLength);
            setSlowMotion(parsedSettings.slowMotion);
            setResize(parsedSettings.resize);
            setResizeFactor(parsedSettings.resizeFactor);
            setUIScale(parsedSettings.uiScale);
            setAiPrecision(parsedSettings.aiPrecision);
            if (parsedSettings.selectedTab && tabKeys.includes(parsedSettings.selectedTab)) {
                setSelectedTab(parsedSettings.selectedTab);
            }
        }
    }, []);


    // Debounced save settings
    const debouncedSaveSettings = useDebounce((settingsToSave: any) => {
        localStorage.setItem("settings", JSON.stringify(settingsToSave));
        console.log("Settings saved via debounce"); // Optional: for debugging
    }, 1000); // Adjust delay as needed, e.g., 1000ms

    useEffect(() => {
        const settings = {
            deduplicate,
            restore,
            upscale,
            interpolate,
            sharpening,
            rifeensemble,
            deduplicateMethod,
            encodeAlgorithm,
            restoreModel,
            upscaleModel,
            interpolationModel,
            depthModel,
            deduplicateSensitivity,
            sharpeningSensitivity,
            autoCutSensitivity,
            interpolateFactor,
            youtubeUrl,
            bitDepth,
            segmentMethod,
            enablePreview,
            deletePreRender,
            preRenderAlgorithm,
            depthQuality,
            adjustmentLayerLength,
            solidLayerColor,
            sortLayerMethod,
            dynamicScale,
            forceStatic,
            disableDonatePopup,
            disableProgressBar,
            tabListOrientation,
            toolboxLayerLength,
            slowMotion,
            resize,
            resizeFactor,
            uiScale,
            aiPrecision,
            selectedTab,
        };
        debouncedSaveSettings(settings);
    }, [
        preRenderAlgorithm,
        deduplicate,
        restore,
        upscale,
        interpolate,
        sharpening,
        rifeensemble,
        deduplicateMethod,
        enablePreview,
        encodeAlgorithm,
        restoreModel,
        upscaleModel,
        interpolationModel,
        depthModel,
        deduplicateSensitivity,
        sharpeningSensitivity,
        autoCutSensitivity,
        interpolateFactor,
        youtubeUrl,
        bitDepth,
        depthQuality,
        segmentMethod,
        deletePreRender,
        adjustmentLayerLength,
        solidLayerColor,
        sortLayerMethod,
        dynamicScale,
        forceStatic,
        disableDonatePopup,
        disableProgressBar,
        tabListOrientation,
        toolboxLayerLength,
        slowMotion,
        resize,
        resizeFactor,
        uiScale,
        aiPrecision,
        selectedTab,
    ]);

    return (
        <Provider
            scale={uiScale as "medium" | "large"}
            theme={darkTheme}
            colorScheme="dark"
            UNSAFE_style={{
                overflowX: "hidden",
                width: "100%",
                boxSizing: "border-box",
                padding: "2px",
            }}
        >
            <View>
                <ToastContainer />
                <DialogTrigger isOpen={showDownloadDialog}>
                    <ActionButton isHidden>Open Dialog</ActionButton>
                    <AlertDialog
                        title="Download TAS Dependencies"
                        variant="confirmation"
                        primaryActionLabel="Yes"
                        onPrimaryAction={handleDownloadTAS}
                        cancelLabel="No"
                        onCancel={handleCloseDialog}
                        onSecondaryAction={openGitHubWiki}
                        secondaryActionLabel="Manual Method"
                        UNSAFE_className="alertDialogBorder"
                    >
                        The Anime Scripter dependencies were <strong>not found.</strong>
                        <br></br>
                        <br></br>A download of ~35MB is required, (
                        {isNvidia === "LITE" ? "~800MB" : "~8GB"} after full installation).
                        <br></br>
                        <strong>This is a one time download!</strong>
                        <br />
                        <br />
                        Current Version of TAS Dependencies:
                        {CurrentVersionOfExe || "Not Available"}
                        <br />
                        Latest Version of TAS Dependencies: {tasVersion}
                        <br />
                        <br />
                        Download Location: {tasAppDataPath.replace(/^.*[\\/]AppData/, "%appdata%")}
                        <br />
                        <br />
                    </AlertDialog>
                </DialogTrigger>
                <Flex
                    direction="column"
                    UNSAFE_style={{
                        overflowY: 'hidden',
                        overflowX: 'hidden',
                        width: '100%',
                        maxWidth: '100vw'
                    }}
                >
                    <Tabs
                        aria-label="Application Tabs"
                        isEmphasized
                        density="compact"
                        selectedKey={selectedTab}
                        onSelectionChange={handleTabSelectionChange}
                    >
                        <TabList>
                            <Item key="Chain">
                                <LinkIcon />
                                <Text>Chain</Text>
                            </Item>
                            <Item key="Extra">
                                <Effects />
                                <Text>Extra</Text>
                            </Item>
                            <Item key="Toolbox">
                                <Beaker />
                                <Text>Toolbox</Text>
                            </Item>
                            <Item key="Logs">
                                <Inbox />
                                <Text>Logs</Text>
                            </Item>
                            <Item key="About">
                                <Info />
                                <Text>About</Text>
                            </Item>
                        </TabList>
                        <div
                            className="tab-content-container"
                            style={{ touchAction: 'pan-y' }}
                        >
                            <Flex direction="column">

                                <TabPanels>
                                    <Item key="Chain">
                                        <motion.div
                                            key={`chain-${selectedTab}`}
                                            variants={slideAnimationVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"

                                            style={{
                                                width: '100%',
                                            }}
                                        >
                                            <Flex
                                                direction="column"
                                                gap={8}
                                                width={"100%"}
                                                marginTop={8}
                                            >
                                                <View
                                                    borderWidth="thin"
                                                    borderColor="dark"
                                                    borderRadius="medium"
                                                    padding="size-200"
                                                >
                                                    <Flex direction="column" gap={12} width={"100%"}>

                                                        <Flex
                                                            direction="row"
                                                            gap={8}
                                                            alignItems="center"
                                                        >
                                                            <LinkIcon size="S" />
                                                            <Heading level={4} margin={0}>
                                                                Chain AI Models
                                                            </Heading>
                                                            {createGeneralContextualHelp(
                                                                "Chain Models",
                                                                "Chain multiple models together to create a custom processing pipeline. The order of how the models / processes are chained is the same as the order in the UI."
                                                            )}
                                                        </Flex>
                                                        <Divider size="S" />
                                                        <Flex direction="row" gap={8} width={"100%"}>
                                                            <ToggleButton
                                                                isSelected={resize}
                                                                onChange={setResize}
                                                                aria-label="Resize"
                                                                isEmphasized
                                                                width={"100%"}
                                                            >
                                                                <Text>Resize</Text>
                                                            </ToggleButton>
                                                            <DialogTrigger isDismissable>
                                                                <TooltipTrigger delay={0}>
                                                                    <ActionButton>
                                                                        <Settings />
                                                                    </ActionButton>
                                                                    <Tooltip>Resize Settings</Tooltip>
                                                                </TooltipTrigger>
                                                                {close => (
                                                                    <Dialog
                                                                        UNSAFE_className="alertDialogBorder"
                                                                        maxWidth={"100%"}
                                                                    >
                                                                        <Heading>
                                                                            <Flex
                                                                                direction={"row"}
                                                                                gap={8}
                                                                                width={"100%"}
                                                                            >
                                                                                <Text>
                                                                                    Resize Settings
                                                                                </Text>
                                                                                {createGeneralContextualHelp(
                                                                                    "Resize",
                                                                                    "Resize the video to a different resolution. This is useful for upscaling or downscaling the video."
                                                                                )}
                                                                            </Flex>
                                                                        </Heading>
                                                                        <Divider />
                                                                        <Content>
                                                                            <Flex
                                                                                direction="column"
                                                                                gap={10}
                                                                            >

                                                                                <Picker
                                                                                    label="Resize Factor"
                                                                                    selectedKey={
                                                                                        resizeFactor
                                                                                    }
                                                                                    onSelectionChange={handleSelectionChange(
                                                                                        setResizeFactor
                                                                                    )}
                                                                                    contextualHelp={createPickerContextualHelp(
                                                                                        "Choosing the Right Factor",
                                                                                        <>
                                                                                            Select the
                                                                                            resize
                                                                                            factor to
                                                                                            which you
                                                                                            want to
                                                                                            resize the
                                                                                            video. The
                                                                                            formula is
                                                                                            Width x
                                                                                            Height *
                                                                                            Factor.
                                                                                            <br />
                                                                                            <br />
                                                                                            <Text>
                                                                                                Example:
                                                                                                1920x1080
                                                                                                * 2 =
                                                                                                3840x2160
                                                                                                ( 4K )
                                                                                            </Text>
                                                                                        </>
                                                                                    )}
                                                                                    width={"100%"}
                                                                                >
                                                                                    <Section title="Resize Factors">
                                                                                        <Item key="0.25">
                                                                                            <Text>
                                                                                                0.25x
                                                                                            </Text>
                                                                                        </Item>

                                                                                        <Item key="0.5">
                                                                                            <Text>
                                                                                                0.5x
                                                                                            </Text>
                                                                                        </Item>

                                                                                        <Item key="0.75">
                                                                                            <Text>
                                                                                                0.75x
                                                                                            </Text>
                                                                                        </Item>

                                                                                        <Item key="1.25">
                                                                                            <Text>
                                                                                                1.25x
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="1.5">
                                                                                            <Text>
                                                                                                1.5x
                                                                                            </Text>
                                                                                        </Item>

                                                                                        <Item key="1.75">
                                                                                            <Text>
                                                                                                1.75x
                                                                                            </Text>
                                                                                        </Item>

                                                                                        <Item key="2">
                                                                                            <Text>
                                                                                                2x
                                                                                            </Text>
                                                                                        </Item>
                                                                                    </Section>
                                                                                </Picker>
                                                                            </Flex>
                                                                        </Content>
                                                                    </Dialog>
                                                                )}
                                                            </DialogTrigger>
                                                        </Flex>
                                                        <Flex direction="row" gap={8} width={"100%"}>
                                                            <ToggleButton
                                                                isSelected={deduplicate}
                                                                onChange={setDeduplicate}
                                                                aria-label="Deduplicate"
                                                                isEmphasized
                                                                width={"100%"}
                                                            >
                                                                <Text>Deduplicate</Text>
                                                            </ToggleButton>
                                                            <DialogTrigger isDismissable>
                                                                <TooltipTrigger delay={0}>
                                                                    <ActionButton>
                                                                        <Settings />
                                                                    </ActionButton>
                                                                    <Tooltip>
                                                                        Deduplicate Settings
                                                                    </Tooltip>
                                                                </TooltipTrigger>
                                                                {close => (
                                                                    <Dialog
                                                                        UNSAFE_className="alertDialogBorder"
                                                                        maxWidth={"100%"}
                                                                    >
                                                                        <Heading>
                                                                            <Flex
                                                                                direction={"row"}
                                                                                gap={8}
                                                                                width={"100%"}
                                                                            >
                                                                                <Text>
                                                                                    Deduplicate Settings
                                                                                </Text>
                                                                                {createGeneralContextualHelp(
                                                                                    "About Deduplicate",
                                                                                    'Eliminate duplicate frames from the video. This operation is destructive and does not create new frames to replace the duplicates. This process is also commonly referred to as removing "dead frames."'
                                                                                )}
                                                                            </Flex>
                                                                        </Heading>
                                                                        <Divider />
                                                                        <Content>
                                                                            <Flex
                                                                                direction="column"
                                                                                gap={10}
                                                                            >

                                                                                <Picker
                                                                                    label="Deduplicate Algorithm"
                                                                                    selectedKey={
                                                                                        deduplicateMethod
                                                                                    }
                                                                                    onSelectionChange={handleSelectionChange(
                                                                                        setDeduplicateMethod
                                                                                    )}
                                                                                    contextualHelp={createPickerContextualHelp(
                                                                                        "Choosing the Right Algorithm",
                                                                                        "Select the deduplication algorithm based on your hardware configuration and accuracy requirements. SSIM is recommended for general purposes."
                                                                                    )}
                                                                                    width={"100%"}
                                                                                >
                                                                                    <Section title="ALL CPUs">
                                                                                        <Item key="ssim">
                                                                                            <Gauge4 />
                                                                                            <Text>
                                                                                                SSIM
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="mse">
                                                                                            <Gauge4 />
                                                                                            <Text>
                                                                                                MSE
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                    </Section>
                                                                                    <Section title="NVIDIA GPUs">
                                                                                        <Item key="ssim-cuda">
                                                                                            <Gauge5 />
                                                                                            <Text>
                                                                                                SSIM
                                                                                                CUDA
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="flownets">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                FlownetS
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Anime /
                                                                                                Beta
                                                                                            </Text>
                                                                                        </Item>
                                                                                    </Section>
                                                                                </Picker>
                                                                                <Slider
                                                                                    label="Sensitivity"
                                                                                    maxValue={1}
                                                                                    step={0.001}
                                                                                    defaultValue={0.5}
                                                                                    formatOptions={{
                                                                                        style: "percent",
                                                                                        minimumFractionDigits: 1,
                                                                                    }}
                                                                                    value={
                                                                                        deduplicateSensitivity
                                                                                    }
                                                                                    onChange={
                                                                                        setDeduplicateSensitivity
                                                                                    }
                                                                                    width={"100%"}
                                                                                    contextualHelp={createSliderContextualHelp(
                                                                                        "Sensitivity",
                                                                                        "Adjust the sensitivity of the deduplication algorithm. Higher sensitivity may remove more frames."
                                                                                    )}
                                                                                    isFilled
                                                                                />
                                                                            </Flex>
                                                                        </Content>
                                                                    </Dialog>
                                                                )}
                                                            </DialogTrigger>
                                                        </Flex>
                                                        <Flex direction="row" gap={8} width={"100%"}>
                                                            <ToggleButton
                                                                isSelected={restore}
                                                                onChange={setRestore}
                                                                aria-label="Restore"
                                                                isEmphasized
                                                                width={"100%"}
                                                            >
                                                                <Text>Restore</Text>
                                                            </ToggleButton>

                                                            <DialogTrigger isDismissable>
                                                                <TooltipTrigger delay={0}>
                                                                    <ActionButton>
                                                                        <Settings />
                                                                    </ActionButton>
                                                                    <Tooltip>Restore Settings</Tooltip>
                                                                </TooltipTrigger>
                                                                {close => (
                                                                    <Dialog
                                                                        UNSAFE_className="alertDialogBorder"
                                                                        maxWidth={"100%"}
                                                                    >
                                                                        <Heading>
                                                                            <Flex
                                                                                direction="row"
                                                                                gap={8}
                                                                                width={"100%"}
                                                                            >

                                                                                <Text>
                                                                                    Restore Settings
                                                                                </Text>
                                                                                {createGeneralContextualHelp(
                                                                                    "Restore",
                                                                                    "Using AI and different techniques restore the video. This is a pretty heavy operation and may take a while."
                                                                                )}
                                                                            </Flex>
                                                                        </Heading>
                                                                        <Divider />
                                                                        <Content>
                                                                            <Picker
                                                                                label="Restore Model"
                                                                                selectedKey={
                                                                                    restoreModel
                                                                                }
                                                                                onSelectionChange={handleSelectionChange(
                                                                                    setRestoreModel
                                                                                )}
                                                                                contextualHelp={createPickerContextualHelp(
                                                                                    "Model Selection",
                                                                                    "Select the model to use for restoring the video."
                                                                                )}
                                                                                width={"100%"}
                                                                            >
                                                                                <Section title="NVIDIA GPUs">
                                                                                    <Item key="nafnet">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            NAFNET
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            IRL / Video
                                                                                            Games / CGI
                                                                                            / Denoise
                                                                                        </Text>
                                                                                    </Item>

                                                                                    <Item key="scunet">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            SCUNet
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            IRL / Video
                                                                                            Games / CGI
                                                                                            / Denoise
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="real-plksr">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            Real-PLKSR
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            IRL / Video
                                                                                            Games / CGI
                                                                                            / DeJPEG
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="anime1080fixer">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            Anime Fixer
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime /
                                                                                            Sharpen +
                                                                                            DeCompress /
                                                                                            Fixes video
                                                                                            compressions
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="fastlinedarken">
                                                                                        <Gauge4 />
                                                                                        <Text>
                                                                                            Fast Line
                                                                                            Darken
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime /
                                                                                            Darken Lines
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="gater3">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            Gater3
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime /
                                                                                            Fixes Video
                                                                                            Compression
                                                                                            Artifacts
                                                                                        </Text>
                                                                                    </Item>
                                                                                </Section>
                                                                                <Section title="NVIDIA RTX GPUs">
                                                                                    <Item key="scunet-tensorrt">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            SCUNet
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            IRL / Video
                                                                                            Games / CGI
                                                                                            / Denoise /
                                                                                            !VERY VRAM
                                                                                            HUNGRY!
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="anime1080fixer-tensorrt">
                                                                                        <Gauge5 />
                                                                                        <Text>
                                                                                            Anime Fixer
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime /
                                                                                            Sharpen +
                                                                                            DeCompress /
                                                                                            Fixes video
                                                                                            compressions
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="fastlinedarken-tensorrt">
                                                                                        <Gauge5 />
                                                                                        <Text>
                                                                                            Fast Line
                                                                                            Darken
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime /
                                                                                            Darken Lines
                                                                                        </Text>
                                                                                    </Item>
                                                                                </Section>
                                                                                <Section title="ALL GPUS">
                                                                                    <Item key="anime1080fixer-directml">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            Anime Fixer
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime /
                                                                                            Sharpen +
                                                                                            DeCompress /
                                                                                            Fixes video
                                                                                            compressions
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="gater3-directml">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            Gater3
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime /
                                                                                            Fixes Video
                                                                                            Compression
                                                                                            Artifacts
                                                                                        </Text>
                                                                                    </Item>
                                                                                </Section>
                                                                            </Picker>
                                                                        </Content>
                                                                    </Dialog>
                                                                )}
                                                            </DialogTrigger>
                                                        </Flex>
                                                        <Flex direction="row" gap={8} width={"100%"}>
                                                            <ToggleButton
                                                                isSelected={interpolate}
                                                                onChange={setInterpolate}
                                                                aria-label="Interpolate"
                                                                isEmphasized
                                                                width={"100%"}
                                                            >
                                                                <Text>Interpolate</Text>
                                                            </ToggleButton>
                                                            <DialogTrigger isDismissable>
                                                                <TooltipTrigger delay={0}>
                                                                    <ActionButton>
                                                                        <Settings />
                                                                    </ActionButton>
                                                                    <Tooltip>
                                                                        Interpolate Settings
                                                                    </Tooltip>
                                                                </TooltipTrigger>
                                                                {close => (
                                                                    <Dialog
                                                                        UNSAFE_className="alertDialogBorder"
                                                                        maxWidth={"100%"}
                                                                    >
                                                                        <Heading>

                                                                            <Flex gap={"5px"}>
                                                                                <Text>
                                                                                    Interpolate Settings
                                                                                </Text>
                                                                                {createGeneralContextualHelp(
                                                                                    "Interpolate",
                                                                                    <>
                                                                                        Using AI and
                                                                                        different
                                                                                        techniques
                                                                                        interpolate the
                                                                                        video.
                                                                                        <br />
                                                                                        <br />
                                                                                        This will create
                                                                                        new frames
                                                                                        between the
                                                                                        original frames
                                                                                        to increase the
                                                                                        framerate of the
                                                                                        video.
                                                                                    </>
                                                                                )}
                                                                            </Flex>
                                                                        </Heading>

                                                                        <Divider />
                                                                        <Content>
                                                                            <Flex
                                                                                direction="column"
                                                                                gap={8}
                                                                            >
                                                                                <Flex
                                                                                    direction="row"
                                                                                    width={"100%"}
                                                                                    justifyContent={
                                                                                        "space-between"
                                                                                    }
                                                                                >

                                                                                    <Flex direction="row">
                                                                                        <Checkbox
                                                                                            isSelected={
                                                                                                rifeensemble
                                                                                            }
                                                                                            onChange={
                                                                                                setRifeEnsemble
                                                                                            }
                                                                                            aria-label="Enable Rife Ensemble"
                                                                                            isEmphasized
                                                                                        >
                                                                                            Rife
                                                                                            Ensemble
                                                                                        </Checkbox>
                                                                                        {createCheckboxContextualHelp(
                                                                                            "Rife Ensemble",
                                                                                            "Enable Rife Ensemble to enhance the interpolation quality. This only works with models up to Rife 4.21 and has no effect past that version."
                                                                                        )}
                                                                                    </Flex>
                                                                                    <Flex direction="row">
                                                                                        <Checkbox
                                                                                            isSelected={
                                                                                                dynamicScale
                                                                                            }
                                                                                            onChange={
                                                                                                setDynamicScale
                                                                                            }
                                                                                            aria-label="Upscale"
                                                                                            isEmphasized
                                                                                        >
                                                                                            Dynamic Flow
                                                                                            Scale
                                                                                        </Checkbox>
                                                                                        {createCheckboxContextualHelp(
                                                                                            "Dynamic Flow Scale",
                                                                                            <>
                                                                                                Dynamically
                                                                                                adjust
                                                                                                the flow
                                                                                                scale
                                                                                                factor
                                                                                                based on
                                                                                                the
                                                                                                video.
                                                                                                This can
                                                                                                improve
                                                                                                the
                                                                                                quality
                                                                                                of the
                                                                                                output
                                                                                                at a
                                                                                                significant
                                                                                                cost to
                                                                                                processing
                                                                                                time.
                                                                                                <br></br>
                                                                                                <br></br>
                                                                                                This
                                                                                                feature
                                                                                                is only
                                                                                                available
                                                                                                with
                                                                                                Rife
                                                                                                GTX.
                                                                                            </>
                                                                                        )}
                                                                                    </Flex>
                                                                                </Flex>
                                                                                <Flex direction="row">
                                                                                    <Checkbox
                                                                                        isSelected={
                                                                                            slowMotion
                                                                                        }
                                                                                        onChange={
                                                                                            setSlowMotion
                                                                                        }
                                                                                        aria-label="Upscale"
                                                                                        isEmphasized
                                                                                    >
                                                                                        Enable
                                                                                        Slow-motion
                                                                                    </Checkbox>
                                                                                    {createGeneralContextualHelp(
                                                                                        "Enable Slowmotion",
                                                                                        <>
                                                                                            Video lenght
                                                                                            will be
                                                                                            increased by
                                                                                            the
                                                                                            interpolation
                                                                                            factor
                                                                                            instead of
                                                                                            the
                                                                                            framerate of
                                                                                            the clip.
                                                                                            <br />
                                                                                            <br />
                                                                                            This is
                                                                                            still in
                                                                                            testing and
                                                                                            may not work
                                                                                            as expected.
                                                                                        </>
                                                                                    )}
                                                                                </Flex>
                                                                                <ComboBox
                                                                                    width={"100%"}
                                                                                    label="Interpolation Factor"
                                                                                    contextualHelp={createPlacedContextualHelp(
                                                                                        "Interpolation Factor",
                                                                                        <Flex
                                                                                            direction="column"
                                                                                            gap="size-150"
                                                                                        >
                                                                                            <Text>
                                                                                                Controls
                                                                                                how many
                                                                                                new
                                                                                                frames
                                                                                                are
                                                                                                generated
                                                                                                between
                                                                                                existing
                                                                                                frames.
                                                                                            </Text>
                                                                                            <View
                                                                                                backgroundColor="gray-75"
                                                                                                padding="size-100"
                                                                                                borderRadius="medium"
                                                                                            >
                                                                                                <Flex
                                                                                                    direction="column"
                                                                                                    gap="size-25"
                                                                                                >
                                                                                                    <Text>
                                                                                                        Examples:
                                                                                                    </Text>
                                                                                                    <Text>
                                                                                                        •
                                                                                                        2x:
                                                                                                        30fps
                                                                                                        →
                                                                                                        60fps
                                                                                                    </Text>
                                                                                                    <Text>
                                                                                                        •
                                                                                                        2.5x:
                                                                                                        24fps
                                                                                                        →
                                                                                                        60fps
                                                                                                    </Text>
                                                                                                    <Text>
                                                                                                        •
                                                                                                        4x:
                                                                                                        60fps
                                                                                                        →
                                                                                                        240fps
                                                                                                    </Text>
                                                                                                </Flex>
                                                                                            </View>
                                                                                            <Text>
                                                                                                ⚠️
                                                                                                Higher
                                                                                                values
                                                                                                significantly
                                                                                                increase
                                                                                                processing
                                                                                                time
                                                                                            </Text>
                                                                                        </Flex>,
                                                                                        "start"
                                                                                    )}
                                                                                    defaultItems={
                                                                                        DEFAULT.interpolationFactorList
                                                                                    }
                                                                                    inputValue={
                                                                                        interpolateFactor
                                                                                    }
                                                                                    onInputChange={value => {
                                                                                        // Make sure to store just the value without 'x' if needed
                                                                                        setInterpolateFactor(
                                                                                            value
                                                                                        );
                                                                                    }}
                                                                                    onSelectionChange={selected => {
                                                                                        if (selected) {
                                                                                            // When selecting from dropdown, get the value from the selected item
                                                                                            const selectedItem =
                                                                                                DEFAULT.interpolationFactorList.find(
                                                                                                    item =>
                                                                                                        item.name ===
                                                                                                        selected
                                                                                                );
                                                                                            setInterpolateFactor(
                                                                                                selectedItem
                                                                                                    ? selectedItem.name
                                                                                                    : selected.toString()
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                    allowsCustomValue
                                                                                >
                                                                                    {item => (
                                                                                        <Item
                                                                                            key={
                                                                                                item.value
                                                                                            }
                                                                                        >
                                                                                            {item.name}
                                                                                        </Item>
                                                                                    )}
                                                                                </ComboBox>
                                                                                <Picker
                                                                                    label="Interpolation Model"
                                                                                    selectedKey={
                                                                                        interpolationModel
                                                                                    }
                                                                                    onSelectionChange={handleSelectionChange(
                                                                                        setInterpolationModel
                                                                                    )}
                                                                                    contextualHelp={createPickerContextualHelp(
                                                                                        "Model Selection",
                                                                                        "Select the model for interpolating frames in the video. Lite models are recommended for lower-end GPUs."
                                                                                    )}
                                                                                    width={"100%"}
                                                                                >
                                                                                    <Section title="NVIDIA GPUs">
                                                                                        <Item key="rife4.25-heavy">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                Rife
                                                                                                4.25
                                                                                                Heavy
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife4.25">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                Rife
                                                                                                4.25
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife4.25-lite">
                                                                                            <Gauge4 />
                                                                                            <Text>
                                                                                                Rife
                                                                                                4.25
                                                                                                Lite
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife4.22">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                Rife
                                                                                                4.22
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife4.22-lite">
                                                                                            <Gauge4 />
                                                                                            <Text>
                                                                                                Rife
                                                                                                4.22
                                                                                                Lite
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife_elexor">
                                                                                            <Gauge3 />
                                                                                            <Text>
                                                                                                Rife 4.7
                                                                                                Elexor
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Anime
                                                                                                with
                                                                                                large
                                                                                                movements
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife4.6">
                                                                                            <Gauge5 />
                                                                                            <Text>
                                                                                                Rife 4.6
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="gmfss">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                GMFSS
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Anime
                                                                                                with
                                                                                                large
                                                                                                movements
                                                                                                / Very
                                                                                                Slow
                                                                                            </Text>
                                                                                        </Item>
                                                                                    </Section>
                                                                                    <Section title="NVIDIA RTX GPUs">
                                                                                        <Item key="rife4.25-heavy-tensorrt">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                Rife
                                                                                                4.25
                                                                                                Heavy
                                                                                                TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife4.25-tensorrt">
                                                                                            <Gauge3 />
                                                                                            <Text>
                                                                                                Rife
                                                                                                4.25
                                                                                                TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife4.25-lite-tensorrt">
                                                                                            <Gauge5 />
                                                                                            <Text>
                                                                                                Rife
                                                                                                4.25
                                                                                                Lite
                                                                                                TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife4.22-tensorrt">
                                                                                            <Gauge3 />
                                                                                            <Text>
                                                                                                Rife
                                                                                                4.22
                                                                                                TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife4.22-lite-tensorrt">
                                                                                            <Gauge5 />
                                                                                            <Text>
                                                                                                Rife
                                                                                                4.22
                                                                                                Lite
                                                                                                TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife_elexor-tensorrt">
                                                                                            <Gauge4 />
                                                                                            <Text>
                                                                                                Rife 4.7
                                                                                                Elexor
                                                                                                TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Anime
                                                                                                with
                                                                                                large
                                                                                                movements
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife4.6-tensorrt">
                                                                                            <Gauge5 />
                                                                                            <Text>
                                                                                                Rife 4.6
                                                                                                TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                    </Section>
                                                                                    <Section title="ALL GPUS">
                                                                                        <Item key="rife4.22-ncnn">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                Rife
                                                                                                4.22
                                                                                                NCNN
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife4.22-lite-ncnn">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                Rife
                                                                                                4.22
                                                                                                Lite
                                                                                                NCNN
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife4.18-ncnn">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                Rife
                                                                                                4.18
                                                                                                NCNN
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="rife4.6-ncnn">
                                                                                            <Gauge3 />
                                                                                            <Text>
                                                                                                Rife 4.6
                                                                                                NCNN
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                    </Section>
                                                                                </Picker>
                                                                            </Flex>
                                                                        </Content>
                                                                    </Dialog>
                                                                )}
                                                            </DialogTrigger>
                                                        </Flex>
                                                        <Flex direction="row" gap={8} width={"100%"}>
                                                            <ToggleButton
                                                                isSelected={upscale}
                                                                onChange={setUpscale}
                                                                aria-label="Upscale"
                                                                isEmphasized
                                                                width={"100%"}
                                                            >
                                                                <Text>Upscale</Text>
                                                            </ToggleButton>
                                                            <DialogTrigger isDismissable>
                                                                <TooltipTrigger delay={0}>
                                                                    <ActionButton>
                                                                        <Settings />
                                                                    </ActionButton>
                                                                    <Tooltip>Upscale Settings</Tooltip>
                                                                </TooltipTrigger>
                                                                {close => (
                                                                    <Dialog
                                                                        UNSAFE_className="alertDialogBorder"
                                                                        maxWidth={"100%"}
                                                                    >
                                                                        <Heading>
                                                                            <Flex
                                                                                direction={"row"}
                                                                                gap={8}
                                                                                width={"100%"}
                                                                            >
                                                                                <Text>
                                                                                    Upscale Settings
                                                                                </Text>
                                                                                {createGeneralContextualHelp(
                                                                                    "About Upscale",
                                                                                    "Using AI increase the resolution of the video by 2x."
                                                                                )}
                                                                            </Flex>
                                                                        </Heading>
                                                                        <Divider />
                                                                        <Content>

                                                                            <Flex direction="row">
                                                                                <Checkbox
                                                                                    isSelected={
                                                                                        forceStatic
                                                                                    }
                                                                                    onChange={
                                                                                        setForceStatic
                                                                                    }
                                                                                    aria-label="Upscale"
                                                                                    isEmphasized
                                                                                >
                                                                                    TensorRT Static
                                                                                    Engine Generation
                                                                                </Checkbox>
                                                                                {createGeneralContextualHelp(
                                                                                    "Static Engine Generation",
                                                                                    <>
                                                                                        Forces static
                                                                                        engine
                                                                                        generation (
                                                                                        input width and
                                                                                        height ) for
                                                                                        TensorRT models.
                                                                                        <br />
                                                                                        <br />
                                                                                        This can improve
                                                                                        the performance
                                                                                        of the models in
                                                                                        GPU bound
                                                                                        scenarios at the
                                                                                        cost of
                                                                                        flexibility.
                                                                                        <br />
                                                                                        <br />
                                                                                        You will have to
                                                                                        generate a new
                                                                                        engine for each
                                                                                        unique input
                                                                                        resolution.
                                                                                        <br />
                                                                                        <br />
                                                                                        This only works
                                                                                        with upscaling
                                                                                        and has no
                                                                                        effect on other
                                                                                        options.
                                                                                    </>
                                                                                )}
                                                                            </Flex>
                                                                            <Picker
                                                                                label="Upscale Model"
                                                                                selectedKey={
                                                                                    upscaleModel
                                                                                }
                                                                                onSelectionChange={handleSelectionChange(
                                                                                    setUpscaleModel
                                                                                )}
                                                                                contextualHelp={createPickerContextualHelp(
                                                                                    "Model Selection",
                                                                                    "Choose the model for upscaling the video resolution. Different models are optimized for specific GPU architectures."
                                                                                )}
                                                                                width={"100%"}
                                                                            >
                                                                                <Section title="NVIDIA GPUs">
                                                                                    <Item key="shufflecugan">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            ShuffleCugan
                                                                                            Cuda
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="span">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            SPAN Cuda
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="compact">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            Compact Cuda
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="ultracompact">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            UltraCompact
                                                                                            Cuda
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="superultracompact">
                                                                                        <Gauge4 />
                                                                                        <Text>
                                                                                            SuperUltraCompact
                                                                                            Cuda
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="aniscale2">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            AniScale2
                                                                                            Cuda
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="open-proteus">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            Open Proteus
                                                                                            Cuda
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            IRL / Video
                                                                                            Games / CGI
                                                                                        </Text>
                                                                                    </Item>
                                                                                </Section>
                                                                                <Section title="NVIDIA RTX GPUs">
                                                                                    <Item key="shufflecugan-tensorrt">
                                                                                        <Gauge4 />
                                                                                        <Text>
                                                                                            ShuffleCugan
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="span-tensorrt">
                                                                                        <Gauge4 />
                                                                                        <Text>
                                                                                            SPAN
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="compact-tensorrt">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            Compact
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="ultracompact-tensorrt">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            UltraCompact
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="superultracompact-tensorrt">
                                                                                        <Gauge5 />
                                                                                        <Text>
                                                                                            SuperUltraCompact
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="aniscale2-tensorrt">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            AniScale2
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="open-proteus-tensorrt">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            Open Proteus
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            IRL / Video
                                                                                            Games / CGI
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="rtmosr-tensorrt">
                                                                                        <Gauge5 />
                                                                                        <Text>
                                                                                            Rtmosr V2
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                </Section>
                                                                                <Section title="All GPUs">
                                                                                    <Item key="span-directml">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            SPAN
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="compact-directml">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            Compact
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="ultracompact-directml">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            UltraCompact
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="superultracompact-directml">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            SuperUltraCompact
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="span-ncnn">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            SPAN NCNN
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="shufflecugan-ncnn">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            ShuffleCugan
                                                                                            NCNN
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="aniscale2-directml">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            AniScale2
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="open-proteus-directml">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            Open Proteus
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            IRL / Video
                                                                                            Games / CGI
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="rtmosr-directml">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            Rtmosr V2
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                </Section>
                                                                            </Picker>
                                                                            <Disclosure
                                                                                isQuiet
                                                                                marginTop="size-200"
                                                                            >
                                                                                <DisclosureTitle>
                                                                                    Example Output with
                                                                                    "{upscaleModel}"
                                                                                </DisclosureTitle>
                                                                                <DisclosurePanel>
                                                                                    {UPSCALEMODELEXAMPLES[
                                                                                        upscaleModel as keyof typeof UPSCALEMODELEXAMPLES
                                                                                    ] ? (
                                                                                        <>
                                                                                            <Image
                                                                                                src={
                                                                                                    UPSCALEMODELEXAMPLES[
                                                                                                    upscaleModel as keyof typeof UPSCALEMODELEXAMPLES
                                                                                                    ] ||
                                                                                                    UPSCALEMODELEXAMPLES.default
                                                                                                }
                                                                                                alt={`Example output using ${upscaleModel} upscale model`}
                                                                                                UNSAFE_style={{
                                                                                                    borderRadius:
                                                                                                        "8px",
                                                                                                    maxWidth:
                                                                                                        "100%",
                                                                                                }}
                                                                                            />
                                                                                            <Link
                                                                                                onPress={() =>
                                                                                                    window.cep.util.openURLInDefaultBrowser(
                                                                                                        UPSCALEMODELEXAMPLES[
                                                                                                        upscaleModel as keyof typeof UPSCALEMODELEXAMPLES
                                                                                                        ] ||
                                                                                                        UPSCALEMODELEXAMPLES.default
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                View
                                                                                                Example
                                                                                            </Link>
                                                                                        </>
                                                                                    ) : (
                                                                                        <Flex
                                                                                            direction="column"
                                                                                            alignItems="center"
                                                                                            gap="size-200"
                                                                                            marginTop="size-200"
                                                                                            marginBottom="size-200"
                                                                                        >
                                                                                            <Text>
                                                                                                No
                                                                                                example
                                                                                                available
                                                                                                for this
                                                                                                model
                                                                                            </Text>
                                                                                        </Flex>
                                                                                    )}
                                                                                </DisclosurePanel>
                                                                            </Disclosure>
                                                                        </Content>
                                                                    </Dialog>
                                                                )}
                                                            </DialogTrigger>
                                                        </Flex>
                                                        <Flex direction="row" gap={8} width={"100%"}>
                                                            <ToggleButton
                                                                isSelected={sharpening}
                                                                onChange={setSharpening}
                                                                aria-label="Sharpening"
                                                                isEmphasized
                                                                width={"100%"}
                                                            >
                                                                <Text>Sharpen</Text>
                                                            </ToggleButton>
                                                            <DialogTrigger isDismissable>
                                                                <TooltipTrigger delay={0}>
                                                                    <ActionButton>
                                                                        <Settings />
                                                                    </ActionButton>
                                                                    <Tooltip>Sharpen Settings</Tooltip>
                                                                </TooltipTrigger>
                                                                {close => (
                                                                    <Dialog
                                                                        maxWidth={"100%"}
                                                                        UNSAFE_className="alertDialogBorder"
                                                                    >
                                                                        <Heading>

                                                                            <Flex
                                                                                direction="row"
                                                                                gap={8}
                                                                                width={"100%"}
                                                                            >
                                                                                <Text>
                                                                                    Sharpen Settings
                                                                                </Text>
                                                                                {createGeneralContextualHelp(
                                                                                    "Sharpen",
                                                                                    <>
                                                                                        Sharpen the
                                                                                        video to enhance
                                                                                        details using
                                                                                        Contrast Based
                                                                                        Adaptive
                                                                                        Sharpening from
                                                                                        AMD.
                                                                                        <br />
                                                                                        <br />
                                                                                        This process is
                                                                                        handled by
                                                                                        FFMPEG so it may
                                                                                        not reflect the
                                                                                        same visual
                                                                                        fidelity as the
                                                                                        original paper.
                                                                                    </>
                                                                                )}
                                                                            </Flex>
                                                                        </Heading>

                                                                        <Divider />
                                                                        <Content UNSAFE_className="dialog">

                                                                            <Slider
                                                                                label="Sensitivity"
                                                                                maxValue={1}
                                                                                step={0.001}
                                                                                defaultValue={0.5}
                                                                                formatOptions={{
                                                                                    style: "percent",
                                                                                    minimumFractionDigits: 1,
                                                                                }}
                                                                                value={
                                                                                    sharpeningSensitivity
                                                                                }
                                                                                onChange={
                                                                                    setSharpeningSensitivity
                                                                                }
                                                                                contextualHelp={createSliderContextualHelp(
                                                                                    "Sensitivity",
                                                                                    "Adjust the sensitivity of the sharpening effect. Higher sensitivity may introduce artifacts. Mainly recommended for Real Life or Video Game content."
                                                                                )}
                                                                                width={"100%"}
                                                                                isFilled
                                                                            />
                                                                        </Content>
                                                                    </Dialog>
                                                                )}
                                                            </DialogTrigger>
                                                        </Flex>
                                                        <Divider size="S" />
                                                        <Flex direction="row" gap={8} width={"100%"}>
                                                            <ActionButton
                                                                staticColor="white"
                                                                width={"100%"}
                                                                onPress={() => { void startChain(); }}
                                                                isDisabled={
                                                                    isDownloading || isProcessing
                                                                }
                                                            >
                                                                <Text>Run Chain</Text>
                                                            </ActionButton>
                                                        </Flex>
                                                    </Flex>
                                                </View>
                                            </Flex>
                                        </motion.div>
                                    </Item>
                                    <Item key="Extra">
                                        <motion.div
                                            key={`extra-${selectedTab}`}
                                            variants={slideAnimationVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"

                                            style={{
                                                width: '100%',
                                            }}
                                        >
                                            <Flex
                                                direction="column"
                                                width="100%"
                                                gap={10}
                                                justifyContent="space-between"
                                                marginTop={8}
                                            >
                                                {/* YouTube Downloader */}
                                                <View
                                                    borderWidth="thin"
                                                    borderColor="dark"
                                                    borderRadius="medium"
                                                    padding="size-200"
                                                >
                                                    <Flex direction="column" gap={12}>

                                                        <Flex
                                                            direction="row"
                                                            gap={8}
                                                            alignItems="center"
                                                        >
                                                            <Download size="S" />
                                                            <Heading level={4} margin={0}>
                                                                Download a YouTube Video
                                                            </Heading>
                                                            {createGeneralContextualHelp(
                                                                "Download YouTube Video",
                                                                <Text>
                                                                    <p>
                                                                        <strong>Warning:</strong>
                                                                        YouTube has started geoblocking
                                                                        IPs. Restart your router if
                                                                        downloads fail.
                                                                    </p>
                                                                    <p>
                                                                        <em>
                                                                            Powered by yt-dlp. All
                                                                            credits to the yt-dlp team.
                                                                        </em>
                                                                    </p>
                                                                    <p>Instructions:</p>
                                                                    <ul>
                                                                        <li>
                                                                            Paste a YouTube URL below
                                                                        </li>
                                                                        <li>
                                                                            Click the download button to
                                                                            start
                                                                        </li>
                                                                        <li>
                                                                            Use ↑↓ arrow keys to select
                                                                            video resolution
                                                                        </li>
                                                                    </ul>
                                                                    <p>
                                                                        Files save to:
                                                                        <strong>TAS-Youtube/</strong> in
                                                                        your project folder
                                                                    </p>
                                                                </Text>
                                                            )}
                                                        </Flex>
                                                        <Divider size="S" />
                                                        <Flex
                                                            direction="row"
                                                            gap={8}
                                                            alignItems="center"
                                                        >
                                                            <TextField
                                                                defaultValue="https://www.youtube.com/watch?v=VIDEO_ID"
                                                                width="100%"
                                                                onChange={setYoutubeUrl}
                                                                UNSAFE_className="youtubeField"
                                                                validationState={
                                                                    youtubeUrl.length > 0 &&
                                                                        !youtubeUrl.includes(
                                                                            "https://www.youtube.com"
                                                                        ) &&
                                                                        !youtubeUrl.includes(
                                                                            "https://youtu.be"
                                                                        )
                                                                        ? "invalid"
                                                                        : undefined
                                                                }
                                                            />
                                                            <TooltipTrigger delay={0}>
                                                                <ActionButton
                                                                    onPress={() => { void startYoutubeDownload(); }}
                                                                    staticColor="white"
                                                                >
                                                                    <Download />
                                                                </ActionButton>
                                                                <Tooltip>Download Video</Tooltip>
                                                            </TooltipTrigger>
                                                        </Flex>
                                                    </Flex>
                                                </View>

                                                {/* Video Processing Tools */}
                                                <View
                                                    borderWidth="thin"
                                                    borderColor="dark"
                                                    borderRadius="medium"
                                                    padding="size-200"
                                                >
                                                    <Flex direction="column" gap={12}>
                                                        <Flex
                                                            direction="row"
                                                            gap={8}
                                                            alignItems="center"
                                                        >
                                                            <Effects size="S" />
                                                            <Heading level={4} margin={0}>
                                                                AI Video Processing
                                                            </Heading>
                                                            {createGeneralContextualHelp(
                                                                "AI Video Processing",
                                                                <Text>
                                                                    <p>
                                                                        Advanced video processing tools
                                                                        powered by AI:
                                                                    </p>
                                                                    <ul>
                                                                        <li>
                                                                            <strong>
                                                                                Extract Depth Map:
                                                                            </strong>
                                                                            Generate depth information
                                                                            from video
                                                                        </li>
                                                                        <li>
                                                                            <strong>
                                                                                Remove Background:
                                                                            </strong>
                                                                            Create videos with
                                                                            transparent backgrounds
                                                                        </li>
                                                                        <li>
                                                                            <strong>
                                                                                Auto Cut Clip:
                                                                            </strong>
                                                                            Automatically segment video
                                                                            based on scene detection
                                                                        </li>
                                                                    </ul>
                                                                    <p>
                                                                        <em>
                                                                            Select a layer in your
                                                                            composition before using
                                                                            these tools.
                                                                        </em>
                                                                    </p>
                                                                </Text>
                                                            )}
                                                        </Flex>
                                                        <Divider size="S" />

                                                        {/* Depth Map Extraction */}
                                                        <Flex direction="column" gap={8}>
                                                            <Flex
                                                                direction="row"
                                                                gap={8}
                                                                alignItems="center"
                                                            >
                                                                <Text
                                                                    UNSAFE_style={{
                                                                        fontSize: "12px",
                                                                        color: "#d0d0d0",
                                                                    }}
                                                                >
                                                                    Generate 3D depth information from
                                                                    2D video
                                                                </Text>
                                                                {createGeneralContextualHelp(
                                                                    "Extract Depth Map",
                                                                    <Text>
                                                                        <strong>
                                                                            Extract Depth Map:
                                                                        </strong>
                                                                        Generate depth information from
                                                                        video for effects such as 3D
                                                                        parallax, depth of field, and
                                                                        more.
                                                                        <p>
                                                                            <em>
                                                                                Select a layer in your
                                                                                composition before using
                                                                                these tools.
                                                                            </em>
                                                                        </p>
                                                                    </Text>
                                                                )}
                                                            </Flex>
                                                            <Flex direction="row" gap={8}>
                                                                <ActionButton
                                                                    onPress={() => { void startExtraTabLogic("depth"); }}
                                                                    width="100%"
                                                                >
                                                                    Extract Depth Map
                                                                </ActionButton>
                                                                <DialogTrigger isDismissable>
                                                                    <TooltipTrigger delay={0}>
                                                                        <ActionButton>
                                                                            <Settings />
                                                                        </ActionButton>
                                                                        <Tooltip>
                                                                            Depth Map Settings
                                                                        </Tooltip>
                                                                    </TooltipTrigger>
                                                                    {close => (
                                                                        <Dialog UNSAFE_className="alertDialogBorder">
                                                                            <Heading>
                                                                                <Flex
                                                                                    gap={8}
                                                                                    alignItems="center"
                                                                                >

                                                                                    <Text>
                                                                                        Depth Map
                                                                                        Settings
                                                                                    </Text>
                                                                                    {createGeneralContextualHelp(
                                                                                        "Depth Map Settings",
                                                                                        "Extract depth information from video for use in post-processing effects."
                                                                                    )}
                                                                                </Flex>
                                                                            </Heading>
                                                                            <Divider />
                                                                            <Content>

                                                                                <Picker
                                                                                    label="Depth Model"
                                                                                    selectedKey={
                                                                                        depthModel
                                                                                    }
                                                                                    onSelectionChange={handleSelectionChange(
                                                                                        setDepthModel
                                                                                    )}
                                                                                    contextualHelp={createPickerContextualHelp(
                                                                                        "Model Selection",
                                                                                        "Choose the model for depth estimation in the video."
                                                                                    )}
                                                                                    width="100%"
                                                                                >
                                                                                    <Section title="NVIDIA GPUs">
                                                                                        <Item key="og_distill_small_v2">
                                                                                            <Gauge3 />
                                                                                            <Text>
                                                                                                OG
                                                                                                Distilled
                                                                                                Small V2
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original
                                                                                                Paper
                                                                                                implementation
                                                                                                / Better
                                                                                                model
                                                                                                accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_distill_base_v2">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                OG
                                                                                                Distilled
                                                                                                Base V2
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original
                                                                                                Paper
                                                                                                implementation
                                                                                                / Better
                                                                                                model
                                                                                                accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_distill_large_v2">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                OG
                                                                                                Distilled
                                                                                                Large V2
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original
                                                                                                Paper
                                                                                                implementation
                                                                                                / Better
                                                                                                model
                                                                                                accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_small_v2">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                OG Depth
                                                                                                Anything
                                                                                                V2 Small
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original
                                                                                                Paper
                                                                                                implementation
                                                                                                / Better
                                                                                                model
                                                                                                accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_base_v2">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                OG Depth
                                                                                                Anything
                                                                                                V2 Base
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original
                                                                                                Paper
                                                                                                implementation
                                                                                                / Better
                                                                                                model
                                                                                                accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_large_v2">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                ( DEMO )
                                                                                                OG Depth
                                                                                                Anything
                                                                                                V2 Large
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original
                                                                                                Paper
                                                                                                implementation
                                                                                                / Better
                                                                                                model
                                                                                                accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="distill_small_v2">
                                                                                            <Gauge4 />
                                                                                            <Text>
                                                                                                Distilled
                                                                                                Small V2
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Optimized
                                                                                                for
                                                                                                speed /
                                                                                                3-4x
                                                                                                Faster /
                                                                                                Mediocre
                                                                                                Quality
                                                                                                /
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="distill_base_v2">
                                                                                            <Gauge3 />
                                                                                            <Text>
                                                                                                Distilled
                                                                                                Base V2
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Optimized
                                                                                                for
                                                                                                speed /
                                                                                                3-4x
                                                                                                Faster /
                                                                                                Mediocre
                                                                                                Quality
                                                                                                /
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="distill_large_v2">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                ( DEMO )
                                                                                                Distilled
                                                                                                Large V2
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Optimized
                                                                                                for
                                                                                                speed /
                                                                                                3-4x
                                                                                                Faster /
                                                                                                Mediocre
                                                                                                Quality
                                                                                                /
                                                                                            </Text>
                                                                                        </Item>
                                                                                    </Section>
                                                                                    <Section title="NVIDIA RTX GPUs">
                                                                                        <Item key="small_v2-tensorrt">
                                                                                            <Gauge5 />
                                                                                            <Text>
                                                                                                Depth
                                                                                                Anything
                                                                                                V2 Small
                                                                                                TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                                / 5-10x
                                                                                                Faster /
                                                                                                Mediocre
                                                                                                Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="base_v2-tensorrt">
                                                                                            <Gauge3 />
                                                                                            <Text>
                                                                                                Depth
                                                                                                Anything
                                                                                                V2 Base
                                                                                                TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                                / 5-10x
                                                                                                Faster /
                                                                                                Mediocre
                                                                                                Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="large_v2-tensorrt">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                Depth
                                                                                                Anything
                                                                                                V2 Large
                                                                                                TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                                / 5-10x
                                                                                                Faster /
                                                                                                Mediocre
                                                                                                Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="distill_small_v2-tensorrt">
                                                                                            <Gauge4 />
                                                                                            <Text>
                                                                                                Distilled Small V2 TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Optimized for speed / TensorRT / 5-10x Faster / Mediocre Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="distill_base_v2-tensorrt">
                                                                                            <Gauge3 />
                                                                                            <Text>
                                                                                                Distilled Base V2 TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Optimized for speed / TensorRT / 5-10x Faster / Mediocre Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="distill_large_v2-tensorrt">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                Distilled Large V2 TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Optimized for speed / TensorRT / 5-10x Faster / Mediocre Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_small_v2-tensorrt">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                OG Depth Anything V2 Small TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original Paper implementation / TensorRT / Better model accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_base_v2-tensorrt">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                OG Depth Anything V2 Base TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original Paper implementation / TensorRT / Better model accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_large_v2-tensorrt">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                OG Depth Anything V2 Large TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original Paper implementation / TensorRT / Better model accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_distill_small_v2-tensorrt">
                                                                                            <Gauge3 />
                                                                                            <Text>
                                                                                                OG Distilled Small V2 TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original Paper implementation / TensorRT / Better model accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_distill_base_v2-tensorrt">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                OG Distilled Base V2 TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original Paper implementation / TensorRT / Better model accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                    </Section>
                                                                                    <Section title="ALL GPUS">
                                                                                        <Item key="small_v2-directml">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                Depth
                                                                                                Anything
                                                                                                V2 Small
                                                                                                DirectML
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                                /
                                                                                                Mediocre
                                                                                                Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="base_v2-directml">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                Depth
                                                                                                Anything
                                                                                                V2 Base
                                                                                                DirectML
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                                /
                                                                                                Mediocre
                                                                                                Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="large_v2-directml">

                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                Depth
                                                                                                Anything
                                                                                                V2 Large
                                                                                                DirectML
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                                /
                                                                                                Mediocre
                                                                                                Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="distill_small_v2-directml">
                                                                                            <Gauge4 />
                                                                                            <Text>
                                                                                                Distilled Small V2 DirectML
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Optimized for speed / DirectML / Mediocre Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="distill_base_v2-directml">
                                                                                            <Gauge3 />
                                                                                            <Text>
                                                                                                Distilled Base V2 DirectML
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Optimized for speed / DirectML / Mediocre Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="distill_large_v2-directml">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                Distilled Large V2 DirectML
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Optimized for speed / DirectML / Mediocre Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                    </Section>
                                                                                </Picker>
                                                                                <Picker
                                                                                    label="Depth Map Quality"
                                                                                    marginTop="size-200"
                                                                                    selectedKey={
                                                                                        depthQuality
                                                                                    }
                                                                                    onSelectionChange={handleSelectionChange(
                                                                                        setDepthQuality
                                                                                    )}
                                                                                    contextualHelp={createPickerContextualHelp(
                                                                                        "Depth Map Quality",
                                                                                        <>
                                                                                            This only
                                                                                            affects the
                                                                                            <strong>
                                                                                                NVIDIA
                                                                                                GTX
                                                                                                Models!
                                                                                            </strong>
                                                                                            <br />
                                                                                            <br />
                                                                                            Choose the
                                                                                            internal
                                                                                            resolution
                                                                                            at which TAS
                                                                                            calculates
                                                                                            the Depth
                                                                                            Map. <br />
                                                                                            <br />
                                                                                            Higher
                                                                                            quality will
                                                                                            increase the
                                                                                            quality of
                                                                                            the depth
                                                                                            map at a
                                                                                            significant
                                                                                            cost to
                                                                                            processing
                                                                                            time.
                                                                                        </>
                                                                                    )}
                                                                                    width="100%"
                                                                                >
                                                                                    <Item key="low">
                                                                                        <Gauge5 />
                                                                                        <Text>Low</Text>
                                                                                        <Text slot="description">
                                                                                            518x518
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="medium">
                                                                                        <Gauge4 />
                                                                                        <Text>
                                                                                            Medium
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            700x700 /
                                                                                            NVidia
                                                                                            CUDA models only /
                                                                                            recommended
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="high">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            High
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Input Width
                                                                                            x Height /
                                                                                            NVidia
                                                                                            CUDA models only / recommended GPU 3090/4090/5090
                                                                                        </Text>
                                                                                    </Item>
                                                                                </Picker>
                                                                                <Divider
                                                                                    size="M"
                                                                                    marginTop="size-200"
                                                                                />
                                                                                <Disclosure
                                                                                    isQuiet
                                                                                    marginTop="size-200"
                                                                                >
                                                                                    <DisclosureTitle>
                                                                                        Example Output
                                                                                        with "
                                                                                        {depthModel}"
                                                                                    </DisclosureTitle>
                                                                                    <DisclosurePanel>
                                                                                        {DEPTHMODELEXAMPLES[
                                                                                            depthModel as keyof typeof DEPTHMODELEXAMPLES
                                                                                        ] ? (
                                                                                            <>
                                                                                                <Image
                                                                                                    src={
                                                                                                        DEPTHMODELEXAMPLES[
                                                                                                        depthModel as keyof typeof DEPTHMODELEXAMPLES
                                                                                                        ] ||
                                                                                                        DEPTHMODELEXAMPLES.default
                                                                                                    }
                                                                                                    alt={`Example depth map output using ${depthModel} model`}
                                                                                                    UNSAFE_style={{
                                                                                                        borderRadius:
                                                                                                            "8px",
                                                                                                        maxWidth:
                                                                                                            "100%",
                                                                                                    }}
                                                                                                />
                                                                                                <Link
                                                                                                    onPress={() =>
                                                                                                        window.cep.util.openURLInDefaultBrowser(
                                                                                                            DEPTHMODELEXAMPLES[
                                                                                                            depthModel as keyof typeof DEPTHMODELEXAMPLES
                                                                                                            ] ||
                                                                                                            DEPTHMODELEXAMPLES.default
                                                                                                        )
                                                                                                    }
                                                                                                >
                                                                                                    View
                                                                                                    Example
                                                                                                </Link>
                                                                                            </>
                                                                                        ) : (
                                                                                            <Flex
                                                                                                direction="column"
                                                                                                alignItems="center"
                                                                                                gap="size-200"
                                                                                                marginTop="size-200"
                                                                                                marginBottom="size-200"
                                                                                            >
                                                                                                <Text>
                                                                                                    No
                                                                                                    example
                                                                                                    available
                                                                                                    for
                                                                                                    this
                                                                                                    model
                                                                                                </Text>
                                                                                            </Flex>
                                                                                        )}
                                                                                    </DisclosurePanel>
                                                                                </Disclosure>
                                                                            </Content>
                                                                        </Dialog>
                                                                    )}
                                                                </DialogTrigger>
                                                            </Flex>
                                                        </Flex>

                                                        <Divider size="S" />

                                                        {/* Background Removal */}
                                                        <Flex direction="column" gap={8}>
                                                            <Flex
                                                                direction="row"
                                                                gap={8}
                                                                alignItems="center"
                                                            >

                                                                <Text
                                                                    UNSAFE_style={{
                                                                        fontSize: "12px",
                                                                        color: "#d0d0d0",
                                                                    }}
                                                                >
                                                                    Create videos with transparent
                                                                    backgrounds
                                                                </Text>
                                                                {createGeneralContextualHelp(
                                                                    "Remove Background",
                                                                    <Text>
                                                                        <strong>
                                                                            Remove Background:
                                                                        </strong>
                                                                        Create videos with transparent
                                                                        backgrounds for use in After
                                                                        Effects.
                                                                        <p>
                                                                            <em>
                                                                                Select a layer in your
                                                                                composition before using
                                                                                these tools.
                                                                            </em>
                                                                        </p>
                                                                    </Text>
                                                                )}
                                                            </Flex>
                                                            <Flex direction="row" gap={8}>
                                                                <ActionButton
                                                                    onPress={() => { void startExtraTabLogic("background"); }}
                                                                    width="100%"
                                                                >
                                                                    Remove Background
                                                                </ActionButton>
                                                                <DialogTrigger isDismissable>
                                                                    <TooltipTrigger delay={0}>
                                                                        <ActionButton>
                                                                            <Settings />
                                                                        </ActionButton>
                                                                        <Tooltip>
                                                                            Background Removal Settings
                                                                        </Tooltip>
                                                                    </TooltipTrigger>
                                                                    {close => (
                                                                        <Dialog UNSAFE_className="alertDialogBorder">
                                                                            <Heading>
                                                                                <Flex
                                                                                    gap={8}
                                                                                    alignItems="center"
                                                                                >
                                                                                    <Text>
                                                                                        Background
                                                                                        Removal Settings
                                                                                    </Text>
                                                                                    {createGeneralContextualHelp(
                                                                                        "Background Removal",
                                                                                        <>
                                                                                            Choose the
                                                                                            desired
                                                                                            model for
                                                                                            background
                                                                                            removal.
                                                                                            <br />
                                                                                            <br />
                                                                                            Note that
                                                                                            videos are
                                                                                            saved in
                                                                                            original
                                                                                            format with
                                                                                            an alpha
                                                                                            channel for
                                                                                            transparency
                                                                                            in After
                                                                                            Effects.
                                                                                        </>
                                                                                    )}
                                                                                </Flex>
                                                                            </Heading>
                                                                            <Divider />
                                                                            <Content>
                                                                                <Picker
                                                                                    label="Segmentation Model"
                                                                                    selectedKey={
                                                                                        segmentMethod
                                                                                    }
                                                                                    onSelectionChange={handleSelectionChange(
                                                                                        setSegmentMethod
                                                                                    )}
                                                                                    contextualHelp={createPickerContextualHelp(
                                                                                        "Choosing the Right Model",
                                                                                        "Select the appropriate model for background removal based on your GPU capabilities."
                                                                                    )}
                                                                                    width="100%"
                                                                                >
                                                                                    <Section title="NVIDIA GPUs">
                                                                                        <Item key="anime">
                                                                                            <Gauge3 />
                                                                                            <Text>
                                                                                                Anime
                                                                                                Cuda
                                                                                            </Text>
                                                                                        </Item>
                                                                                    </Section>
                                                                                    <Section title="NVIDIA RTX">
                                                                                        <Item key="anime-tensorrt">
                                                                                            <Gauge5 />
                                                                                            <Text>
                                                                                                Anime
                                                                                                TensorRT
                                                                                            </Text>
                                                                                        </Item>
                                                                                    </Section>
                                                                                </Picker>
                                                                                <Divider
                                                                                    size="M"
                                                                                    marginTop="size-200"
                                                                                />
                                                                                {/*
                                                                                <Disclosure
                                                                                isQuiet
                                                                                marginTop="size-200"
                                                                                >
                                                                                <DisclosureTitle>
                                                                                    Example Output
                                                                                </DisclosureTitle>
                                                                                <DisclosurePanel>
                                                                                    <Image
                                                                                        src="https://i.imgur.com/7jIUWy5.png"
                                                                                        alt="Background Removal Example"
                                                                                        UNSAFE_style={{
                                                                                            borderRadius:
                                                                                            "8px",
                                                                                            maxWidth:
                                                                                            "100%",
                                                                                        }}
                                                                                        />
                                                                                </DisclosurePanel>
                                                                            </Disclosure>
                                                                                    */}
                                                                            </Content>
                                                                        </Dialog>
                                                                    )}
                                                                </DialogTrigger>
                                                            </Flex>
                                                        </Flex>

                                                        <Divider size="S" />

                                                        {/* Auto Cut */}
                                                        <Flex direction="column" gap={8}>
                                                            <Flex
                                                                direction="row"
                                                                gap={8}
                                                                alignItems="center"
                                                            >
                                                                <Text
                                                                    UNSAFE_style={{
                                                                        fontSize: "12px",
                                                                        color: "#d0d0d0",
                                                                    }}
                                                                >
                                                                    Automatically cut videos at a scene
                                                                    change
                                                                </Text>
                                                                {createGeneralContextualHelp(
                                                                    "Auto Cut Clip",
                                                                    <Text>
                                                                        <strong>Auto Cut Clip:</strong>
                                                                        Automatically cut and isolate
                                                                        the selected layer based on
                                                                        scene detection sensitivity.
                                                                        <p>
                                                                            <em>
                                                                                Select a layer in your
                                                                                composition before using
                                                                                these tools.
                                                                            </em>
                                                                        </p>
                                                                    </Text>
                                                                )}
                                                            </Flex>
                                                            <Flex direction="row" gap={8}>
                                                                <ActionButton
                                                                    onPress={() => { void startAutoCut(); }}
                                                                    width="100%"
                                                                >
                                                                    Auto Cut Clip
                                                                </ActionButton>
                                                                <DialogTrigger isDismissable>
                                                                    <TooltipTrigger delay={0}>
                                                                        <ActionButton>
                                                                            <Settings />
                                                                        </ActionButton>
                                                                        <Tooltip>
                                                                            Auto Cut Settings
                                                                        </Tooltip>
                                                                    </TooltipTrigger>
                                                                    {close => (
                                                                        <Dialog UNSAFE_className="alertDialogBorder">
                                                                            <Heading>

                                                                                <Flex
                                                                                    direction="row"
                                                                                    gap={8}
                                                                                    alignItems="center"
                                                                                >
                                                                                    Auto Cut Settings
                                                                                    {createGeneralContextualHelp(
                                                                                        "Auto Cut Settings",
                                                                                        "Automatically cut and isolate the selected layer based on scene detection sensitivity."
                                                                                    )}
                                                                                </Flex>
                                                                            </Heading>
                                                                            <Divider />
                                                                            <Content>

                                                                                <Slider
                                                                                    label="Detection Sensitivity"
                                                                                    maxValue={1}
                                                                                    step={0.001}
                                                                                    defaultValue={0.5}
                                                                                    formatOptions={{
                                                                                        style: "percent",
                                                                                        minimumFractionDigits: 1,
                                                                                    }}
                                                                                    value={
                                                                                        autoCutSensitivity
                                                                                    }
                                                                                    onChange={
                                                                                        setAutoCutSensitivity
                                                                                    }
                                                                                    width="100%"
                                                                                    contextualHelp={createSliderContextualHelp(
                                                                                        "Sensitivity",
                                                                                        "Adjust the sensitivity of the scene detection algorithm. Higher sensitivity may result in more scene cuts."
                                                                                    )}
                                                                                    isFilled
                                                                                />
                                                                            </Content>
                                                                        </Dialog>
                                                                    )}
                                                                </DialogTrigger>
                                                            </Flex>
                                                        </Flex>
                                                    </Flex>
                                                </View>

                                                {/* TAS Resources Section */}
                                                <View
                                                    borderWidth="thin"
                                                    borderColor="dark"
                                                    borderRadius="medium"
                                                    padding="size-200"
                                                >
                                                    <Flex direction="column" gap={12}>

                                                        <Flex
                                                            direction="row"
                                                            gap={8}
                                                            alignItems="center"
                                                        >
                                                            <Download size="S" />
                                                            <Heading level={4} margin={0}>
                                                                TAS Resources
                                                            </Heading>
                                                            {createGeneralContextualHelp(
                                                                "TAS Resources",
                                                                <Text>
                                                                    <p>
                                                                        Access additional TAS tools and
                                                                        resources:
                                                                    </p>
                                                                    <ul>
                                                                        <li>
                                                                            <strong>
                                                                                Offline Mode:
                                                                            </strong>
                                                                            Download all models for
                                                                            offline use (~7GB)
                                                                        </li>
                                                                        <li>
                                                                            <strong>TAS Folder:</strong>
                                                                            Access the application
                                                                            directory
                                                                        </li>
                                                                        <li>
                                                                            <strong>Changelogs:</strong>
                                                                            View version history and
                                                                            updates
                                                                        </li>
                                                                    </ul>
                                                                </Text>
                                                            )}
                                                        </Flex>
                                                        <Divider size="S" />
                                                        <Flex
                                                            direction="row"
                                                            gap={8}
                                                            alignItems="center"
                                                        >
                                                            <ActionButton
                                                                onPress={startOfflineMode}
                                                                width="100%"
                                                            >
                                                                Offline Mode
                                                            </ActionButton>
                                                            <ActionButton
                                                                onPress={OpenTASFolder}
                                                                width="100%"
                                                            >
                                                                Open TAS Folder
                                                            </ActionButton>
                                                            <ActionButton
                                                                onPress={openChangelog}
                                                                width="100%"
                                                            >
                                                                Changelogs
                                                            </ActionButton>
                                                        </Flex>

                                                    </Flex>
                                                </View>

                                                {/* Settings Section */}
                                                <View
                                                    borderWidth="thin"
                                                    borderColor="dark"
                                                    borderRadius="medium"
                                                    padding="size-200"
                                                >
                                                    <Flex direction="column" gap={12}>

                                                        <Flex
                                                            direction="row"
                                                            gap={8}
                                                            alignItems="center"
                                                        >
                                                            <Settings size="S" />
                                                            <Heading level={4} margin={0}>
                                                                Advanced Settings
                                                            </Heading>
                                                            {createGeneralContextualHelp(
                                                                "Advanced Settings",
                                                                <Text>
                                                                    <p>
                                                                        Configure Advanced behavior
                                                                        and preferences:
                                                                    </p>
                                                                </Text>
                                                            )}
                                                        </Flex>
                                                        <Divider size="S" />
                                                        <Flex direction="column" gap={8}>
                                                            {/* Preview Window 
                                                    <Flex direction={"row"} gap={8} width={"100%"}>
                                                        <Checkbox
                                                            isSelected={enablePreview}
                                                            onChange={setEnablePreview}
                                                            aria-label="Enable Preview"
                                                            isEmphasized                                                        >
                                                            <Text>
                                                                Enable Preview Window
                                                            </Text>
                                                        </Checkbox>
                                                        {createCheckboxContextualHelp(
                                                            "Enable Preview Window",
                                                            <>
                                                                Enable the preview window to view the video output in real-time.
                                                                <br></br><br></br>
                                                                <strong>This will impact performance!</strong>
                                                            </>
                                                        )}
                                                    </Flex>
                                                    */}
                                                            <Flex direction="row" width={"100%"}>
                                                                <Checkbox
                                                                    isSelected={disableProgressBar}
                                                                    onChange={setDisableProgressBar}
                                                                    isEmphasized
                                                                >
                                                                    <Text>
                                                                        Disable progress bar during
                                                                        processing
                                                                    </Text>
                                                                </Checkbox>
                                                                {createCheckboxContextualHelp(
                                                                    "Disable Progress Bar",
                                                                    <>
                                                                        Disable the progress bar during
                                                                        processing.
                                                                        <br></br>
                                                                        <br></br>
                                                                        <strong>Note:</strong> This will
                                                                        not disable the progress bar for
                                                                        downloading dependencies.
                                                                    </>
                                                                )}
                                                            </Flex>
                                                            <Flex direction="row" width={"100%"}>
                                                                <Checkbox
                                                                    isSelected={deletePreRender}
                                                                    onChange={setDeletePreRender}
                                                                >
                                                                    <Text>
                                                                        Don't delete the Pre-Rendered
                                                                        File
                                                                    </Text>
                                                                </Checkbox>
                                                                {createCheckboxContextualHelp(
                                                                    "Don't delete Pre-Rendered File",
                                                                    <>
                                                                        Don't delete the pre-rendered
                                                                        video after processing.
                                                                        <br></br>
                                                                        <br></br>
                                                                        This only works if any other
                                                                        processing options are selected.
                                                                    </>
                                                                )}
                                                            </Flex>
                                                            <Picker
                                                                label="AI Precision"
                                                                selectedKey={aiPrecision}
                                                                onSelectionChange={handleSelectionChange(
                                                                    setAiPrecision
                                                                )}
                                                                contextualHelp={createPickerContextualHelp(
                                                                    "AI Precision",
                                                                    "Choose the precision for AI processing. Higher precision may marginally improve quality ( typically in Depth Maps ) but increase processing time."
                                                                )}
                                                                width={"100%"}
                                                            >
                                                                <Item key="true">
                                                                    <Gauge5 />
                                                                    <Text>FP16</Text>
                                                                    <Text slot="description">
                                                                        Everyone should prefer this.
                                                                    </Text>
                                                                </Item>
                                                                <Item key="false">
                                                                    <Gauge1 />
                                                                    <Text>FP32</Text>
                                                                    <Text slot="description">
                                                                        Fallback in case of black frame
                                                                        issues / Lower End GPUs / Depth Maps may see a boost in quality with a compatible 10bit encoder
                                                                    </Text>
                                                                </Item>
                                                            </Picker>
                                                            <Picker
                                                                label="Encoding Codec"
                                                                selectedKey={encodeAlgorithm}
                                                                onSelectionChange={handleSelectionChange(
                                                                    setEncodeAlgorithm
                                                                )}
                                                                contextualHelp={createPickerContextualHelp(
                                                                    "Encoding Codecs",
                                                                    "Choose the encoding codec for the video output. Different codecs may provide better performance depending on the hardware configuration."
                                                                )}
                                                                width={"100%"}
                                                            >
                                                                <Section title="All CPUs">
                                                                    <Item key="x264">
                                                                        <Gauge5 />
                                                                        <Text>x264</Text>
                                                                        <Text slot="description">
                                                                            Universal
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="x264_10bit">
                                                                        <Gauge4 />
                                                                        <Text>x264 10 Bit</Text>
                                                                        <Text slot="description">
                                                                            Universal / Requires 16bpc
                                                                            Bit Depth
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="x264_animation">
                                                                        <Gauge5 />
                                                                        <Text>x264 Animation</Text>
                                                                        <Text slot="description">
                                                                            Anime
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="x264_animation_10bit">
                                                                        <Gauge1 />
                                                                        <Text>
                                                                            x264 Animation 10 Bit
                                                                        </Text>
                                                                        <Text slot="description">
                                                                            Anime / Requires 16bpc Bit
                                                                            Depth
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="x265">
                                                                        <Gauge4 />
                                                                        <Text>x265</Text>
                                                                        <Text slot="description">
                                                                            Universal
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="x265_10bit">
                                                                        <Gauge3 />
                                                                        <Text>x265 10 Bit</Text>
                                                                        <Text slot="description">
                                                                            Universal / Requires 16bpc
                                                                            Bit Depth
                                                                        </Text>
                                                                    </Item>
                                                                    {/*

                                                                        <Item key="prores">
                                                                        <Gauge2 />
                                                                        <Text>ProRes 444 HQ</Text>
                                                                        <Text slot="description">
                                                                            Universal / Very Large
                                                                            Filesizes
                                                                        </Text>
                                                                    </Item>
                                                                    */
                                                                    }
                                                                    <Item key="slow_x264">
                                                                        <Gauge1 />
                                                                        <Text>Slow x264</Text>
                                                                        <Text slot="description">
                                                                            Universal / Very Slow /
                                                                            Small Filesizes
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="slow_x265">
                                                                        <Gauge1 />
                                                                        <Text>Slow x265</Text>
                                                                        <Text slot="description">
                                                                            Universal / Very Slow /
                                                                            Small Filesizes
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="lossless">
                                                                        <Gauge5 />
                                                                        <Text>Lossless</Text>
                                                                        <Text slot="description">
                                                                            Universal / Very Fast /
                                                                            Large Filesizes
                                                                        </Text>
                                                                    </Item>
                                                                    {/*
                                                            <Item key="png">
                                                                <Gauge5 />
                                                                <Text>PNG</Text>
                                                                <Text slot="description">Universal / Very Large Filesizes</Text>
                                                            </Item>
                                                            */}
                                                                </Section>
                                                                <Section title="NVIDIA GPUs">
                                                                    <Item key="nvenc_h264">
                                                                        <Gauge5 />
                                                                        <Text>NVENC h264</Text>
                                                                        <Text slot="description">
                                                                            Universal
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="nvenc_h265">
                                                                        <Gauge5 />
                                                                        <Text>NVENC h265</Text>
                                                                        <Text slot="description">
                                                                            Universal
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="nvenc_h265_10bit">
                                                                        <Gauge4 />
                                                                        <Text>NVENC h265 10 Bit</Text>
                                                                        <Text slot="description">
                                                                            Universal / Requires 16bpc
                                                                            Bit Depth
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="slow_nvenc_h264">
                                                                        <Gauge1 />
                                                                        <Text>Slow NVENC h264</Text>
                                                                        <Text slot="description">
                                                                            Universal / Very Slow /
                                                                            Small Filesizes
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="slow_nvenc_h265">
                                                                        <Gauge1 />
                                                                        <Text>Slow NVENC h265</Text>
                                                                        <Text slot="description">
                                                                            Universal / Very Slow /
                                                                            Small Filesizes
                                                                        </Text>
                                                                    </Item>
                                                                </Section>
                                                                <Section title="AMD GPUs">
                                                                    <Item key="h264_amf">
                                                                        <Gauge5 />
                                                                        <Text>AMF h264</Text>
                                                                        <Text slot="description">
                                                                            Universal
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="hevc_amf">
                                                                        <Gauge4 />
                                                                        <Text>AMF h265</Text>
                                                                        <Text slot="description">
                                                                            Universal
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="hevc_amf_10bit">
                                                                        <Gauge4 />
                                                                        <Text>AMF h265 10 Bit</Text>
                                                                        <Text slot="description">
                                                                            Universal / Requires 16bpc
                                                                            Bit Depth
                                                                        </Text>
                                                                    </Item>
                                                                </Section>
                                                                <Section title="Intel iGPUs">
                                                                    <Item key="qsv_h264">
                                                                        <Gauge5 />
                                                                        <Text>QSV h264</Text>
                                                                        <Text slot="description">
                                                                            Universal
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="qsv_h265">
                                                                        <Gauge4 />
                                                                        <Text>QSV h265</Text>
                                                                        <Text slot="description">
                                                                            Universal
                                                                        </Text>
                                                                    </Item>
                                                                    <Item key="qsv_h265_10bit">
                                                                        <Gauge1 />
                                                                        <Text>QSV h265 10 Bit</Text>
                                                                        <Text slot="description">
                                                                            Universal / Requires 16bpc
                                                                            Bit Depth
                                                                        </Text>
                                                                    </Item>
                                                                </Section>
                                                            </Picker>
                                                            <Picker
                                                                label="Bit Depth"
                                                                selectedKey={bitDepth}
                                                                onSelectionChange={handleSelectionChange(
                                                                    setBitDepth
                                                                )}
                                                                defaultSelectedKey={"8bit"}
                                                                contextualHelp={createPickerContextualHelp(
                                                                    "Bit Depth",
                                                                    <>
                                                                        Choose the bit depth for the
                                                                        video output workflow. Higher
                                                                        bit depths may provide better
                                                                        color accuracy at a significant
                                                                        cost in performance.
                                                                        <br />
                                                                        <br />
                                                                        This is recommended for
                                                                        <strong>Depth Maps.</strong>
                                                                    </>
                                                                )}
                                                                width={"100%"}
                                                            >
                                                                <Item key="8bit">
                                                                    <Gauge5 />
                                                                    <Text>8 Bits Per Channel</Text>
                                                                    <Text slot="description">
                                                                        99.9% of users will be happy
                                                                        with this
                                                                    </Text>
                                                                </Item>
                                                                <Item key="16bit">
                                                                    <Gauge1 />
                                                                    <Text>16 Bits Per Channel</Text>
                                                                    <Text slot="description">
                                                                        Very Slow / Must use a matching
                                                                        encoder / Enables HDR
                                                                        compatibility
                                                                    </Text>
                                                                </Item>
                                                            </Picker>
                                                            <Picker
                                                                label="Pre-Render Codec"
                                                                selectedKey={preRenderAlgorithm}
                                                                onSelectionChange={handleSelectionChange(
                                                                    setPreRenderAlgorithm
                                                                )}
                                                                contextualHelp={createPickerContextualHelp(
                                                                    "Pre-Render Codec",
                                                                    "Select the desired encoding codec for the pre-rendered video."
                                                                )}
                                                                width={"100%"}
                                                            >
                                                                <Item key="lossless">
                                                                    <Gauge5 />
                                                                    <Text>Lossless</Text>
                                                                    <Text slot="description">
                                                                        Large File Size | After Effects
                                                                        2020+
                                                                    </Text>
                                                                </Item>
                                                                <Item key="high">
                                                                    <Gauge4 />
                                                                    <Text>Quicktime</Text>
                                                                    <Text slot="description">
                                                                        Medium File Size | After Effects
                                                                        2022+
                                                                    </Text>
                                                                </Item>
                                                            </Picker>
                                                            <Flex direction={"row"} width={"100%"}>

                                                                <Picker
                                                                    width={"100%"}
                                                                    label="UI Scale"
                                                                    selectedKey={uiScale}
                                                                    onSelectionChange={handleSelectionChange(
                                                                        setUIScale
                                                                    )}
                                                                    contextualHelp={createPickerContextualHelp(
                                                                        "UI Scale",
                                                                        <>
                                                                            Choose the scale of the UI
                                                                            elements.
                                                                            <br></br>
                                                                            <br></br>
                                                                            <strong>
                                                                                Work in progress!
                                                                            </strong>
                                                                        </>
                                                                    )}
                                                                >
                                                                    <Item key="medium">Small</Item>
                                                                    <Item key="large">Large</Item>
                                                                </Picker>
                                                            </Flex>
                                                        </Flex>
                                                    </Flex>
                                                </View>
                                            </Flex>
                                        </motion.div>
                                    </Item>
                                    <Item key="Toolbox">
                                        <motion.div
                                            key={`toolbox-${selectedTab}`}
                                            variants={slideAnimationVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"

                                            style={{
                                                width: '100%',
                                            }}
                                        >
                                            <Flex
                                                direction="column"
                                                gap={10}
                                                width="100%"
                                                justifyContent="space-between"
                                                marginTop={8}
                                            >
                                                {/* Layer Creation Tools */}
                                                <View
                                                    borderWidth="thin"
                                                    borderColor="dark"
                                                    borderRadius="medium"
                                                    padding="size-200"
                                                >
                                                    <Flex direction="column" gap={12}>

                                                        <Flex
                                                            direction="row"
                                                            gap={8}
                                                            alignItems="center"
                                                        >
                                                            <Layers size="S" />
                                                            <Heading level={4} margin={0}>
                                                                Layer Creation Tools
                                                            </Heading>
                                                            {createGeneralContextualHelp(
                                                                "Layer Creation Tools",
                                                                <Text>
                                                                    <p>
                                                                        Create different types of layers
                                                                        in After Effects:
                                                                    </p>
                                                                    <ul>
                                                                        <li>
                                                                            <strong>
                                                                                Adjustment Layer:
                                                                            </strong>
                                                                            Non-rendering layer that
                                                                            applies effects to layers
                                                                            below it
                                                                        </li>
                                                                        <li>
                                                                            <strong>
                                                                                Solid Layer:
                                                                            </strong>
                                                                            Colored background layer for
                                                                            masks or effects
                                                                        </li>
                                                                        <li>
                                                                            <strong>Null Layer:</strong>
                                                                            Invisible layer for
                                                                            parenting or expressions
                                                                        </li>
                                                                    </ul>
                                                                    <p>
                                                                        Select a layer first, then
                                                                        choose the duration and layer
                                                                        type.
                                                                    </p>
                                                                </Text>
                                                            )}
                                                        </Flex>
                                                        <Divider size="S" />
                                                        <Flex direction="column" gap={8}>
                                                            <Picker
                                                                label="Layer Duration"
                                                                width="100%"
                                                                selectedKey={toolboxLayerLength}
                                                                onSelectionChange={handleSelectionChange(
                                                                    setToolboxLayerLength
                                                                )}
                                                                contextualHelp={createPickerContextualHelp(
                                                                    "Layer Duration",
                                                                    "Choose how long the created layer should be."
                                                                )}
                                                            >
                                                                <Item key="1">1 Frame</Item>
                                                                <Item key="2">2 Frames</Item>
                                                                <Item key="3">3 Frames</Item>
                                                                <Item key="4">4 Frames</Item>
                                                                <Item key="entire">
                                                                    Entire Selected Layer
                                                                </Item>
                                                            </Picker>

                                                            <Flex direction="row" gap={8}>
                                                                <ActionButton
                                                                    onPress={
                                                                        startAddAdjustmentLayerLogic
                                                                    }
                                                                    width="100%"
                                                                >
                                                                    Adjustment Layer
                                                                </ActionButton>
                                                            </Flex>

                                                            <Flex direction="row" gap={8}>
                                                                <ActionButton
                                                                    onPress={() => { void startAddNullLayerLogic(); }}
                                                                    width="100%"
                                                                >
                                                                    Null Layer
                                                                </ActionButton>
                                                                <ActionButton
                                                                    onPress={() => { void startAddSolidLayerLogic(); }}
                                                                    width="100%"
                                                                >
                                                                    Solid Layer
                                                                </ActionButton>
                                                            </Flex>
                                                        </Flex>
                                                    </Flex>
                                                </View>

                                                {/* Sorting Tools */}
                                                <View
                                                    borderWidth="thin"
                                                    borderColor="dark"
                                                    borderRadius="medium"
                                                    padding="size-200"
                                                >
                                                    <Flex direction="column" gap={12}>

                                                        <Flex
                                                            direction="row"
                                                            gap={8}
                                                            alignItems="center"
                                                        >
                                                            <SortOrderUp size="S" />
                                                            <Heading level={4} margin={0}>
                                                                Sorting
                                                            </Heading>
                                                            {createGeneralContextualHelp(
                                                                "Sorting",
                                                                <Text>
                                                                    <p>
                                                                        Sort selected layers in
                                                                        sequential order:
                                                                    </p>
                                                                    <ul>
                                                                        <li>
                                                                            <strong>
                                                                                Top to Bottom:
                                                                            </strong>
                                                                            Arrange layers from top down
                                                                            in timeline
                                                                        </li>
                                                                        <li>
                                                                            <strong>
                                                                                Bottom to Top:
                                                                            </strong>
                                                                            Arrange layers from bottom
                                                                            up in timeline
                                                                        </li>
                                                                    </ul>
                                                                    <p>
                                                                        Layer start times will be
                                                                        positioned after the previous
                                                                        layer ends.
                                                                    </p>
                                                                </Text>
                                                            )}
                                                        </Flex>
                                                        <Divider size="S" />
                                                        <Flex direction="column" gap={8}>

                                                            <Picker
                                                                width="100%"
                                                                selectedKey={sortLayerMethod}
                                                                onSelectionChange={handleSelectionChange(
                                                                    setSortLayerMethod
                                                                )}
                                                                label="Sort Layers Order"
                                                                contextualHelp={createPickerContextualHelp(
                                                                    "Sort Direction",
                                                                    "Choose the direction to sort selected layers."
                                                                )}
                                                            >
                                                                <Item key="topDown">
                                                                    <SortOrderDown />
                                                                    <Text>Top to Bottom</Text>
                                                                </Item>
                                                                <Item key="bottomUp">
                                                                    <SortOrderUp />
                                                                    <Text>Bottom to Top</Text>
                                                                </Item>
                                                            </Picker>
                                                            <ActionButton
                                                                onPress={() => { void startSortLayersLogic(); }}
                                                                width="100%"
                                                            >
                                                                <Text>Sort Layers</Text>
                                                            </ActionButton>
                                                        </Flex>
                                                    </Flex>
                                                </View>

                                                {/* Utility Tools */}
                                                <View
                                                    borderWidth="thin"
                                                    borderColor="dark"
                                                    borderRadius="medium"
                                                    padding="size-200"
                                                >
                                                    <Flex direction="column" gap={12}>

                                                        <Flex
                                                            direction="row"
                                                            gap={8}
                                                            alignItems="center"
                                                        >
                                                            <Wrench size="S" />
                                                            <Heading level={4} margin={0}>
                                                                Utility Tools
                                                            </Heading>
                                                            {createGeneralContextualHelp(
                                                                "Utility Tools",
                                                                <Text>
                                                                    <p>
                                                                        Additional tools for After
                                                                        Effects workflow:
                                                                    </p>
                                                                    <ul>
                                                                        <li>
                                                                            <strong>
                                                                                Purge Cache:
                                                                            </strong>
                                                                            Clear memory and disk cache
                                                                            to free resources
                                                                        </li>
                                                                        <li>
                                                                            <strong>
                                                                                Take Screenshot:
                                                                            </strong>
                                                                            Capture the current
                                                                            composition view
                                                                        </li>
                                                                        <li>
                                                                            <strong>PreCompose:</strong>
                                                                            Package selected layers into
                                                                            a nested composition
                                                                        </li>
                                                                        <li>
                                                                            <strong>
                                                                                Remove Dead Frames:
                                                                            </strong>
                                                                            Remove dead/duplicate frames
                                                                            using time remapping
                                                                        </li>
                                                                    </ul>
                                                                </Text>
                                                            )}
                                                        </Flex>
                                                        <Divider size="S" />
                                                        <Flex direction="column" gap={8}>
                                                            <Flex direction={"row"} gap={8} width={"100%"}>

                                                                <ActionButton
                                                                    onPress={execTakeScreenshot}
                                                                    width="100%"
                                                                    >
                                                                    <Text>Take Screenshot</Text>
                                                                </ActionButton>

                                                                <ActionButton
                                                                    onPress={execPrecompose}
                                                                    width="100%"
                                                                    >
                                                                    <Text>PreCompose</Text>
                                                                </ActionButton>
                                                            </Flex>
                                                            <Flex direction={"row"} gap={8} width={"100%"}>

                                                                <ActionButton
                                                                    onPress={execClearCache}
                                                                    width="100%"
                                                                >
                                                                    <Text>Purge Cache</Text>
                                                                </ActionButton>

                                                                <ActionButton
                                                                    onPress={
                                                                        startDeduplicateLayerTimemapLogic
                                                                    }
                                                                    width="100%"
                                                                >
                                                                    <Text>Remove Dead Frames</Text>
                                                                </ActionButton>
                                                            </Flex>
                                                        </Flex>
                                                    </Flex>
                                                </View>
                                            </Flex>
                                        </motion.div>
                                    </Item>
                                    <Item key="Logs">
                                        <motion.div
                                            key={`logs-${selectedTab}`}
                                            variants={slideAnimationVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"

                                            style={{
                                                width: '100%',
                                            }}
                                        >
                                            {logTab(fullLogs, setFullLogs)}
                                        </motion.div>
                                    </Item>
                                    <Item key="About">
                                        <motion.div
                                            key={`about-${selectedTab}`}
                                            variants={slideAnimationVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"

                                            style={{
                                                width: '100%',
                                            }}
                                        >
                                            {aboutTab(tasVersion)}
                                        </motion.div>
                                    </Item>
                                </TabPanels>
                            </Flex>
                        </div>
                    </Tabs>

                    {/* Progress bar with tab switching animation */}
                    <AnimatePresence mode="wait">
                        {(isDownloading || (isProcessing && !disableProgressBar)) && (
                            <motion.div
                                key={`progress-${selectedTab}`}
                                variants={slideAnimationVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"

                                style={{
                                    width: '100%',
                                }}
                            >
                                {isDownloading && (
                                    <motion.div
                                        className="progress-container"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}

                                    >
                                        <View
                                            borderWidth="thin"
                                            borderColor="dark"
                                            borderRadius="medium"
                                            padding="size-200"
                                            marginTop={8}
                                            marginStart={2}
                                        >
                                            <Flex direction="column" gap="size-100" marginTop={-8}>
                                                {/* Progress bar */}
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}

                                                >
                                                    <ProgressBar
                                                        value={downloadProgress}
                                                        width={"100%"}
                                                        maxValue={100}
                                                        size="L"
                                                        showValueLabel={true}
                                                        label={
                                                            downloadProgress > 0
                                                                ? progressBarState
                                                                : "Initializing..."
                                                        }
                                                        isIndeterminate={downloadProgress === 0}
                                                    />
                                                </motion.div>
                                                {/* Compact info display */}
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}

                                                >
                                                    <Flex
                                                        direction="row"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                        marginTop="size-75"
                                                    >
                                                        <Text
                                                            UNSAFE_style={{
                                                                fontSize: "11px",
                                                                opacity: 0.7,
                                                            }}
                                                        >
                                                            {downloadProgress > 0
                                                                ? `Check logs for details`
                                                                : "Please wait, this will take a moment..."}
                                                        </Text>
                                                    </Flex>
                                                </motion.div>
                                            </Flex>
                                        </View>
                                    </motion.div>
                                )}
                                {isProcessing && !disableProgressBar && (
                                    <motion.div
                                        className="progress-container"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}

                                    >
                                        <View
                                            borderWidth="thin"
                                            borderColor="dark"
                                            borderRadius="medium"
                                            padding="size-200"
                                            marginTop={8}
                                            marginStart={2}
                                        >
                                            <Flex direction="row" alignItems="center" gap="size-100">
                                                <Flex direction="column" gap="size-100" flex="1">
                                                    {/* Progress bar */}
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}

                                                    >
                                                        <Flex
                                                            direction="row"
                                                            alignItems="center"
                                                        >
                                                            <View flex="1">
                                                                <ProgressBar
                                                                    value={(progressState.currentFrame / progressState.totalFrames) * 100}
                                                                    minValue={0}
                                                                    maxValue={100}
                                                                    size="L"
                                                                    width={"100%"}
                                                                    showValueLabel={true}
                                                                    // label = "Status: + progressBarStatus"
                                                                    label={
                                                                        progressState.progressBarStatus
                                                                            ? `Status: ${progressState.progressBarStatus}`
                                                                            : "Processing..."
                                                                    }
                                                                />
                                                            </View>

                                                        </Flex>
                                                    </motion.div>
                                                    {/* Processing info with fps and eta */}
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}

                                                    >
                                                        <Flex
                                                            direction="row"
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                        >
                                                            <Text
                                                                UNSAFE_style={{
                                                                    fontSize: "11px",
                                                                    opacity: 0.7,
                                                                    fontWeight: "medium",
                                                                }}
                                                            >
                                                                {progressState.currentFrame > 0 && progressState.totalFrames > 0
                                                                    ? `${progressState.currentFrame.toLocaleString()} / ${progressState.totalFrames.toLocaleString()} frames`
                                                                    : "0/0 frames"}
                                                                {" • "}
                                                                {progressState.estimatedTimeRemaining > 0
                                                                    ? formatETA(progressState.estimatedTimeRemaining)
                                                                    : "0s remaining"}
                                                                {" • "}
                                                                {progressState.processingFps > 0
                                                                    ? progressState.processingFps.toFixed(1)
                                                                    : "0.0"}
                                                                fps
                                                            </Text>
                                                            <Text
                                                                UNSAFE_style={{
                                                                    fontSize: "11px",
                                                                    opacity: 0.7,
                                                                }}
                                                            >
                                                                See Logs tab for details
                                                            </Text>
                                                        </Flex>
                                                    </motion.div>
                                                </Flex>
                                                <TooltipTrigger delay={0}>
                                                    <ActionButton
                                                        marginStart={5}
                                                        isQuiet
                                                        onPress={() => cancelProcessing()}
                                                        aria-label="Cancel"
                                                    >
                                                        <Cancel />
                                                    </ActionButton>
                                                    <Tooltip>Cancel Process</Tooltip>
                                                </TooltipTrigger>
                                            </Flex>
                                        </View>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Flex>
            </View>
        </Provider>
    );
};
export default Main;
