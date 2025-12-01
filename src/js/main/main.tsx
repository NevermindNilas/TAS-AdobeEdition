import {
    ActionButton,
    AlertDialog,
    Button,
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
    Provider,
    Section,
    Slider,
    TabList,
    TabPanels,
    Meter,
    Tabs,
    TagGroup,
    Text,
    TextField,
    Link,
    ToggleButton,
    Tooltip,
    TooltipTrigger,
    View,
    Breadcrumbs,
} from "@adobe/react-spectrum";
import { ToastContainer } from "@react-spectrum/toast";
import { Key } from "@react-types/shared";
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import "./style.css";

import { socketManager } from "./utils/socket";

// Icons
import Beaker from "@spectrum-icons/workflow/Beaker";
import Download from "@spectrum-icons/workflow/Download";
import Effects from "@spectrum-icons/workflow/Effects";
import Gauge1 from "@spectrum-icons/workflow/Gauge1";
import Gauge2 from "@spectrum-icons/workflow/Gauge2";
import Gauge3 from "@spectrum-icons/workflow/Gauge3";
import Gauge4 from "@spectrum-icons/workflow/Gauge4";
import Gauge5 from "@spectrum-icons/workflow/Gauge5";
import Inbox from "@spectrum-icons/workflow/Inbox";
import Info from "@spectrum-icons/workflow/Info";
import LinkIcon from "@spectrum-icons/workflow/Link";
import Settings from "@spectrum-icons/workflow/Settings";
import Asterisk from "@spectrum-icons/workflow/Asterisk";
import Alert from "@spectrum-icons/workflow/Alert";
import Add from "@spectrum-icons/workflow/Add";
import Delete from "@spectrum-icons/workflow/Delete";
import Edit from "@spectrum-icons/workflow/Edit";
import BookmarkSingle from "@spectrum-icons/workflow/BookmarkSingle";
import Layers from "@spectrum-icons/workflow/Layers";
import ImageProfile from "@spectrum-icons/workflow/ImageProfile";
import Cut from "@spectrum-icons/workflow/Cut";

import { child_process, fs, path } from "../lib/cep/node";
import { evalTS } from "../lib/utils/bolt";
import CSInterface from "../lib/cep/csinterface";
import { animeDownloadLogic } from "./utils/animeDownloadLogic";
import autoCutLogic from "./utils/autoCutClipLogic";
import checkForGPU from "./utils/checkForGPU";
import checkForUpdates from "./utils/checkTASVersionGithub";
import execClearCache from "./utils/clearCache";
import downloadTASCLI from "./utils/downloadTAS";
import { deleteTASBackend } from "./utils/deleteTASBackend";
import { generateToast } from "./utils/generateToast";
import getCurrentVersion from "./utils/getCurrentVersion";
import { getAELayerInfo, getAEProjectFolderPath, ensureProjectIsSaved, createLayer, runProcess, executeProcessHelper, getValidatedAEContext, getTASPaths, addPortToCommand, quotePath, buildCommand, wrapCommandForCmd } from "./utils/helpers";
import { buildJsonConfig, saveJsonConfig, buildJsonCommand, cleanupJsonConfig } from "./utils/jsonConfigBuilder";
import { offlineModeLogic } from "./utils/offlineMode";
import OpenTASFolder from "./utils/openTASFolder";
import execPrecompose from "./utils/precompose";
import { openChangelog, openGitHubWiki } from "./utils/Socials";
import execTakeScreenshot from "./utils/takeScreenshot";
import { youtubeDownloadLogic } from "./utils/urlToVideo";
import { useDebounce } from "./utils/useDebounce";
import { depthMapExtractionLogic } from "./utils/depthMap";
import { removeBackgroundLogic } from "./utils/removeBackground";
import { checkDiskSpace } from "./utils/checkDiskSpace";
import { 
    type ShortcutSettings,
    loadShortcutSettings, 
    matchesBinding, 
    getKeyEventsInterest 
} from "./utils/shortcutSettings";

// Tab Components
import { aboutTab } from "./utils/aboutTab";
import { logTab } from "./utils/logTab";
import { SettingsTab } from "./utils/SettingsTab";
import KeyframeGraphEditor from "./utils/KeyframeGraphEditor";
import ToolboxTab from "./utils/ToolboxTab";
import ProgressDisplay from "./utils/ProgressDisplay";

// Constants
import { 
    DEFAULT,
    UPSCALE_MODEL_EXAMPLES, 
    DEPTH_MODEL_EXAMPLES, 
    type UpscaleModelKey, 
    type DepthModelKey 
} from "./utils/appConstants";


// Contextual Help Utilities
import {
    createCheckboxContextualHelp,
    createGeneralContextualHelp,
    createPickerContextualHelp,
    createPlacedContextualHelp,
    createSliderContextualHelp,
} from "./utils/ConsistentContextualHelp";


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
    const [postResize, setPostResize] = useState(false);
    const [postResizeResolution, setPostResizeResolution] = useState<string | null>("1920x1080");
    const [deduplicateMethod, setDeduplicateMethod] = useState<string | null>("ssim");
    const [encodeAlgorithm, setEncodeAlgorithm] = useState<string | null>("x264");
    const [restoreModels, setRestoreModels] = useState<string[]>(["anime1080fixer"]);
    const [upscaleModel, setUpscaleModel] = useState<string | null>("fallin_soft");
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
    const handleSelectionChange = useCallback(
        (setter: React.Dispatch<React.SetStateAction<string | null>>) =>
            (key: Key | null) => {
                setter(key as string | null);
            },
        []
    );

    // Handler for adding restore models to the chain
    const handleAddRestoreModel = useCallback((key: Key | null) => {
        if (key && typeof key === 'string') {
            setRestoreModels(prev => [...prev, key]);
        }
    }, []);

    // Handler for removing restore models from the chain
    const handleRemoveRestoreModels = useCallback((keys: Set<Key>) => {
        const keysToRemove = Array.from(keys).map(k => String(k));
        setRestoreModels(prev => prev.filter((_, index) => !keysToRemove.includes(`restore-${index}`)));
    }, []);

    const [youtubeUrl, setYoutubeUrl] = useState("");

    // Drive Space
    const [drive, setDrive] = useState<string | null>(null);
    const [freeSpace, setFreeSpace] = useState<number | undefined>(undefined);
    const [totalSpace, setTotalSpace] = useState<number | undefined>(undefined);

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
    const [downloadInfo, setDownloadInfo] = useState<{
        speed?: string;
        size?: string;
        eta?: number;
        phase?: string;
    }>({});
    const [showDownloadDialog, setShowDownloadDialog] = useState(false);
    const [enableCompression, setEnableCompression] = useState(false);
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

    // Viewport Zoom for Toolbox tab
    const [viewportZoom, setViewportZoom] = useState(100);

    // Composition dimensions for upscale preview
    const [compDimensions, setCompDimensions] = useState<{ width: number, height: number } | null>(null);
    const [isDimensionsLoading, setIsDimensionsLoading] = useState(false);

    // Composition FPS for interpolation preview
    const [compFPS, setCompFPS] = useState<number | null>(null);
    const [isFPSLoading, setIsFPSLoading] = useState(false);

    // UI Settings
    const [tabListOrientation, setTabListOrientation] = useState<string>(
        DEFAULT.tabListOrientation
    );
    const [uiScale, setUIScale] = useState<string | null>(DEFAULT.uiScale);

    // Tab management for swipe gestures
    const tabKeys = ["Chain", "Extra", "Graph", "Logs", "Settings", "About"];
    const [selectedTab, setSelectedTab] = useState<Key>(tabKeys[0]);

    const [shortcutSettings, setShortcutSettings] = useState<ShortcutSettings>(() => loadShortcutSettings());

    interface QuickPreset {
        id: string;
        name: string;
        options: {
            preRenderAlgorithm: string | null;
            resize: boolean;
            resizeFactor: string | null;
            deduplicate: boolean;
            deduplicateMethod: string | null;
            deduplicateSensitivity: number;
            restore: boolean;
            restoreModels: string[];
            upscale: boolean;
            upscaleModel: string | null;
            interpolate: boolean;
            interpolationModel: string | null;
            interpolateFactor: string;
            rifeensemble: boolean;
            dynamicScale: boolean;
            slowMotion: boolean;
            sharpening: boolean;
            sharpeningSensitivity: number;
            postResize: boolean;
            postResizeResolution: string | null;
            bitDepth: string | null;
            aiPrecision: string | null;
            deletePreRender: boolean;
            forceStatic: boolean;
        };
    }

    const getDefaultPresets = (): QuickPreset[] => [
        {
            id: "default-nvidia-4k60",
            name: "Instant 4K 60fps NVidia",
            options: {
                preRenderAlgorithm: "high",
                resize: false,
                resizeFactor: "1",
                deduplicate: false,
                deduplicateMethod: "ssim",
                deduplicateSensitivity: 0.5,
                restore: false,
                restoreModels: ["anime1080fixer"],
                upscale: true,
                upscaleModel: "fallin_strong",
                interpolate: true,
                interpolationModel: "rife4.25",
                interpolateFactor: "2.5",
                rifeensemble: false,
                dynamicScale: false,
                slowMotion: false,
                sharpening: false,
                sharpeningSensitivity: 0.5,
                postResize: false,
                postResizeResolution: "3840x2160",
                bitDepth: "8",
                aiPrecision: null,
                deletePreRender: true,
                forceStatic: false,
            },
        },
        {
            id: "default-amd-intel-4k60",
            name: "Instant 4K 60fps AMD/Intel",
            options: {
                preRenderAlgorithm: "high",
                resize: false,
                resizeFactor: "1",
                deduplicate: false,
                deduplicateMethod: "ssim",
                deduplicateSensitivity: 0.5,
                restore: false,
                restoreModels: ["anime1080fixer"],
                upscale: true,
                upscaleModel: "superultracompact",
                interpolate: true,
                interpolationModel: "rife4.22-ncnn",
                interpolateFactor: "2.5",
                rifeensemble: false,
                dynamicScale: false,
                slowMotion: false,
                sharpening: false,
                sharpeningSensitivity: 0.5,
                postResize: false,
                postResizeResolution: "3840x2160",
                bitDepth: "8",
                aiPrecision: null,
                deletePreRender: true,
                forceStatic: false,
            },
        },
    ];

    const [defaultPresets, setDefaultPresets] = useState<QuickPreset[]>(() => {
        const saved = localStorage.getItem("defaultPresets");
        if (saved) {
            return JSON.parse(saved);
        } else {
            const defaults = getDefaultPresets();
            localStorage.setItem("defaultPresets", JSON.stringify(defaults));
            return defaults;
        }
    });

    useEffect(() => {
        localStorage.setItem("defaultPresets", JSON.stringify(defaultPresets));
    }, [defaultPresets]);

    const [quickPresets, setQuickPresets] = useState<QuickPreset[]>(() => {
        const saved = localStorage.getItem("quickPresets");
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem("quickPresets", JSON.stringify(quickPresets));
    }, [quickPresets]);

    const createParserFromOptions = useCallback(() => {
        const timestamp = Date.now();
        const newPreset: QuickPreset = {
            id: `preset-${timestamp}`,
            name: `Preset ${quickPresets.length + 1}`,
            options: {
                preRenderAlgorithm,
                resize,
                resizeFactor,
                deduplicate,
                deduplicateMethod,
                deduplicateSensitivity,
                restore,
                restoreModels,
                upscale,
                upscaleModel,
                interpolate,
                interpolationModel,
                interpolateFactor,
                rifeensemble,
                dynamicScale,
                slowMotion,
                sharpening,
                sharpeningSensitivity,
                postResize,
                postResizeResolution,
                bitDepth,
                aiPrecision,
                deletePreRender,
                forceStatic,
            },
        };
        setQuickPresets(prev => [...prev, newPreset]);
        generateToast(1, `Preset "${newPreset.name}" created`);
    }, [
        quickPresets.length,
        preRenderAlgorithm,
        resize,
        resizeFactor,
        deduplicate,
        deduplicateMethod,
        deduplicateSensitivity,
        restore,
        restoreModels,
        upscale,
        upscaleModel,
        interpolate,
        interpolationModel,
        interpolateFactor,
        rifeensemble,
        dynamicScale,
        slowMotion,
        sharpening,
        sharpeningSensitivity,
        postResize,
        postResizeResolution,
        bitDepth,
        aiPrecision,
        deletePreRender,
        forceStatic,
    ]);

    const applyPreset = useCallback((preset: QuickPreset) => {
        setPreRenderAlgorithm(preset.options.preRenderAlgorithm);
        setResize(preset.options.resize);
        setResizeFactor(preset.options.resizeFactor);
        setDeduplicate(preset.options.deduplicate);
        setDeduplicateMethod(preset.options.deduplicateMethod);
        setDeduplicateSensitivity(preset.options.deduplicateSensitivity);
        setRestore(preset.options.restore);
        setRestoreModels(preset.options.restoreModels);
        setUpscale(preset.options.upscale);
        setUpscaleModel(preset.options.upscaleModel);
        setInterpolate(preset.options.interpolate);
        setInterpolationModel(preset.options.interpolationModel);
        setInterpolateFactor(preset.options.interpolateFactor);
        setRifeEnsemble(preset.options.rifeensemble);
        setDynamicScale(preset.options.dynamicScale);
        setSlowMotion(preset.options.slowMotion);
        setSharpening(preset.options.sharpening);
        setSharpeningSensitivity(preset.options.sharpeningSensitivity);
        setPostResize(preset.options.postResize);
        setPostResizeResolution(preset.options.postResizeResolution);
        setBitDepth(preset.options.bitDepth);
        setAiPrecision(preset.options.aiPrecision);
        setDeletePreRender(preset.options.deletePreRender);
        setForceStatic(preset.options.forceStatic);
        generateToast(1, `Preset "${preset.name}" applied`);
    }, []);

    const deletePreset = useCallback((presetId: string, isDefault: boolean = false) => {
        if (isDefault) {
            setDefaultPresets(prev => prev.filter(p => p.id !== presetId));
        } else {
            setQuickPresets(prev => prev.filter(p => p.id !== presetId));
        }
        generateToast(1, "Preset deleted");
    }, []);

    const renamePreset = useCallback((presetId: string, newName: string, isDefault: boolean = false) => {
        if (isDefault) {
            setDefaultPresets(prev => prev.map(p =>
                p.id === presetId ? { ...p, name: newName } : p
            ));
        } else {
            setQuickPresets(prev => prev.map(p =>
                p.id === presetId ? { ...p, name: newName } : p
            ));
        }
    }, []);

    const formatPresetSettings = useCallback((preset: QuickPreset) => {
        const settings: string[] = [];
        const opts = preset.options;
        
        if (opts.resize) settings.push(`Resize: ${opts.resizeFactor}x`);
        if (opts.deduplicate) settings.push(`Deduplicate: ${opts.deduplicateMethod}`);
        if (opts.restore) settings.push(`Restore: ${opts.restoreModels.join(' → ')}`);
        if (opts.upscale) settings.push(`Upscale: ${opts.upscaleModel}`);
        if (opts.interpolate) {
            const interpDetails = [`Interpolate: ${opts.interpolationModel} ${opts.interpolateFactor}`];
            if (opts.rifeensemble) interpDetails.push("RIFE Ensemble");
            if (opts.dynamicScale) interpDetails.push("Dynamic Scale");
            if (opts.slowMotion) interpDetails.push("Slow Motion");
            settings.push(interpDetails.join(" + "));
        }
        if (opts.sharpening) settings.push(`Sharpening: ${opts.sharpeningSensitivity}`);
        if (opts.postResize) settings.push(`Post-Resize: ${opts.postResizeResolution}`);
        if (opts.forceStatic) settings.push("Force Static");
        
        return settings.length > 0 ? settings.join(", ") : "No options enabled";
    }, []);

    function handleTabSelectionChange(key: Key) {
        setSelectedTab(key);
    }

    const getCompositionDimensions = useCallback(async () => {
        setIsDimensionsLoading(true);
        try {
            const dimensions = await evalTS("getCompDimensions");
            if (dimensions && dimensions.width && dimensions.height) {
                setCompDimensions(dimensions);
            } else {
                setCompDimensions(null);
            }
        } catch (error) {
            console.error("Error getting composition dimensions:", error);
            setCompDimensions(null);
        } finally {
            setIsDimensionsLoading(false);
        }
    }, []);


    const getCompositionFPS = useCallback(async () => {
        setIsFPSLoading(true);
        try {
            const fps = await evalTS("getCompFPS");
            if (fps && typeof fps === 'number' && fps > 0) {
                setCompFPS(fps);
            } else {
                setCompFPS(null);
            }
        } catch (error) {
            console.error("Error getting composition FPS:", error);
            setCompFPS(null);
        } finally {
            setIsFPSLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedTab === "Chain") {
            void getCompositionDimensions();
            if (interpolate) {
                void getCompositionFPS();
            }
        }
    }, [selectedTab, interpolate, getCompositionDimensions, getCompositionFPS]);

    useEffect(() => {
        if (selectedTab === "Chain" && (resize || upscale || postResize)) {
            void getCompositionDimensions();
        }
    }, [selectedTab, resize, upscale, postResize, getCompositionDimensions]);


    const resolutionSteps = useMemo(() => {
        if (!compDimensions) return [] as string[];

        const formatFpsNum = (fps: number) => {
            const fixed = fps.toFixed(3);
            return fixed.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
        };

        let cleaned = "";
        let parsedFactor = NaN;
        let hasValidFactor = false;
        if (interpolate) {
            const rawFactor = (interpolateFactor || DEFAULT.interpolateFactor) as string;
            cleaned = rawFactor.endsWith("x") ? rawFactor.slice(0, -1) : rawFactor;
            parsedFactor = parseFloat(cleaned);
            hasValidFactor = !isNaN(parsedFactor) && parsedFactor > 0;
        }

    const steps: string[] = [];
    const w0 = compDimensions.width;
    const h0 = compDimensions.height;
    let curW = w0;
    let curH = h0;

        const baseFpsLabel = (interpolate && compFPS && compFPS > 0)
            ? ` | ${formatFpsNum(compFPS)} fps`
            : "";
    steps.push(`${w0}x${h0}${baseFpsLabel} ( Input )`);

        if (resize && resizeFactor) {
            const f = parseFloat(resizeFactor);
            if (!isNaN(f) && f > 0) {
                const w1 = Math.round(w0 * f);
                const h1 = Math.round(h0 * f);
                steps.push(`${w1}x${h1}${baseFpsLabel} ( Re ${f}x )`);
                curW = w1; curH = h1;
            }
        }

        let effectiveFps: number | null = null;
        if (interpolate && compFPS && compFPS > 0 && hasValidFactor) {
            effectiveFps = compFPS * parsedFactor;
            const factorDisplay = cleaned || String(parsedFactor);
            steps.push(`${curW}x${curH} | ${formatFpsNum(effectiveFps)} fps ( Int ${factorDisplay}x )`);
        }

        const subsequentFpsLabel = (interpolate && effectiveFps)
            ? ` | ${formatFpsNum(effectiveFps)} fps`
            : "";

        if (upscale) {
            const w2 = curW * 2;
            const h2 = curH * 2;
            steps.push(`${w2}x${h2}${subsequentFpsLabel} ( Up 2x )`);
            curW = w2; curH = h2;
        }

        if (postResize && postResizeResolution) {
            const [tw, th] = postResizeResolution.split('x');
            const tW = parseInt(tw, 10);
            const tH = parseInt(th, 10);
            if (!isNaN(tW) && !isNaN(tH)) {
                steps.push(`${tW}x${tH}${subsequentFpsLabel} ( Output )`);
            }
        }
        return steps;
    }, [
        compDimensions,
        compFPS,
        resize,
        resizeFactor,
        upscale,
        postResize,
        postResizeResolution,
        interpolate,
        interpolateFactor,
    ]);

    useEffect(() => {
        if ((resize || upscale || postResize || interpolate) && !compDimensions) {
            void getCompositionDimensions();
        }
        if (interpolate && (compFPS === null)) {
            void getCompositionFPS();
        }
    }, [resize, upscale, postResize, interpolate, compDimensions, compFPS, getCompositionDimensions, getCompositionFPS]);




    const formatETA = useCallback((seconds: number): string => {
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
    }, []);



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
        // Don't update progress if process was cancelled
        if (processCancelledRef.current) {
            return;
        }

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

        if (isProcessing) {
            socketManager.init();
            unsubProgress = socketManager.onProgressUpdate(updateProgress);
            unsubComplete = socketManager.onProcessComplete((success) => {
                resetProgress("Progress complete!");
                socketManager.close();
            });
        }

        return () => {
            if (unsubProgress) unsubProgress();
            if (unsubComplete) unsubComplete();
            if (!isProcessing) {
                socketManager.close();
            }
        };
    }, [isProcessing, updateProgress, resetProgress]);

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

            getCompositionDimensions();
            getCompositionFPS();
        };

        initialize();
    }, [getCompositionDimensions]);

    const checkIfBackendExists = useCallback(async () => {
        let isEmpty = true;

        const { drive, free, size } = await checkDiskSpace();
        const accurateValue = size - free;
        setDrive(drive);
        setFreeSpace(accurateValue);
        setTotalSpace(size);

        const tasExists = fs.existsSync(tasAppDataPath);
        if (tasExists) {
            const files = fs.readdirSync(tasAppDataPath);
            isEmpty = files.length === 0;
            const exeExists = fs.existsSync(pythonExePath);
            if (!exeExists) {
                setShowDownloadDialog(true);
            } else {
                const currentVersion = await getCurrentVersion(tasAppDataPath, pythonExePath);
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
    }, [tasAppDataPath, pythonExePath, tasVersion, latestVersion]);


    const handleDownloadTAS = useCallback(() => {
        setisBackendAvailable(true);
        setShowDownloadDialog(false);
        setIsDownloading(true);
        downloadTASCLI(tasAppDataPath, pythonExePath, (progressInfo) => {
            setDownloadProgress(progressInfo.percentage);
            setProgressBarState(progressInfo.status);
            setDownloadInfo({
                speed: progressInfo.formattedSpeed,
                size: progressInfo.formattedSize,
                eta: progressInfo.eta,
                phase: progressInfo.phase
            });
            setIsDownloading(!progressInfo.isDone);
        }, enableCompression);
    }, [tasAppDataPath, pythonExePath, enableCompression]);

    const handleReinstallTAS = useCallback(() => {
        try {
            generateToast(3, "Starting TAS reinstallation...");
            
            deleteTASBackend(tasAppDataPath);
            
            if (!fs.existsSync(tasAppDataPath)) {
                fs.mkdirSync(tasAppDataPath, { recursive: true });
            }
            
            setisBackendAvailable(true);
            setIsDownloading(true);
            downloadTASCLI(tasAppDataPath, pythonExePath, (progressInfo) => {
                setDownloadProgress(progressInfo.percentage);
                setProgressBarState(progressInfo.status);
                setDownloadInfo({
                    speed: progressInfo.formattedSpeed,
                    size: progressInfo.formattedSize,
                    eta: progressInfo.eta,
                    phase: progressInfo.phase
                });
                setIsDownloading(!progressInfo.isDone);
            }, enableCompression);
            
            generateToast(1, "TAS reinstallation started successfully");
        } catch (error) {
            generateToast(2, `Failed to reinstall TAS: ${error}`);
        }
    }, [tasAppDataPath, pythonExePath, enableCompression]);

    useEffect(() => {
        let handleLogEvent: EventListener | null = null;

        if (isDownloading) {
            handleLogEvent = ((event: CustomEvent) => {
                const { logs } = event.detail;
                setFullLogs(currentLogs => {
                    const newLogs = [...currentLogs, ...logs];
                    return newLogs.length > 1000 ? newLogs.slice(-1000) : newLogs;
                });
            }) as EventListener;

            window.addEventListener("tas-log", handleLogEvent);

            setFullLogs(["Starting TAS dependency download..."]);
        }

        return () => {
            if (handleLogEvent) {
                window.removeEventListener("tas-log", handleLogEvent);
            }
        };
    }, [isDownloading]);

    useEffect(() => {
        if (shortcutSettings.enabled) {
            try {
                const csInterface = new CSInterface();
                const keyEventsInterest = getKeyEventsInterest(shortcutSettings);
                if (keyEventsInterest) {
                    csInterface.registerKeyEventsInterest(keyEventsInterest);
                    console.log('Registered keyboard shortcuts with CEP');
                }
            } catch (error) {
                console.warn('Failed to register key events interest:', error);
            }
        }
    }, [shortcutSettings.enabled]);

    useEffect(() => {
        if (!shortcutSettings.enabled) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            let matchedAction: string | null = null;
            
            for (const binding of Object.values(shortcutSettings.bindings)) {
                if (matchesBinding(event, binding)) {
                    matchedAction = binding.action;
                    break;
                }
            }

            if (!matchedAction) {
                return;
            }

            event.preventDefault();

            if (matchedAction.startsWith('tab:')) {
                const tabName = matchedAction.substring(4);
                if (tabKeys.includes(tabName)) {
                    setSelectedTab(tabName);
                }
            } else if (matchedAction === 'nav:prev') {
                const currentIndex = tabKeys.indexOf(selectedTab as string);
                const newIndex = currentIndex > 0 ? currentIndex - 1 : tabKeys.length - 1;
                setSelectedTab(tabKeys[newIndex]);
            } else if (matchedAction === 'nav:next') {
                const currentIndex = tabKeys.indexOf(selectedTab as string);
                const newIndex = currentIndex < tabKeys.length - 1 ? currentIndex + 1 : 0;
                setSelectedTab(tabKeys[newIndex]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedTab, shortcutSettings]);

    const cancelProcessing = useCallback((toastMessage?: string, toastState?: number) => {
        processCancelledRef.current = true;
        
        const killCommand = "taskkill /f /im python.exe & taskkill /f /im ffmpeg.exe & taskkill /f /im ffprobe.exe";
        child_process.exec(killCommand, () => {
        });

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                try {
                    setIsProcessCancelled(true);
                    setIsProcessing(false);
                    
                    setProgressState(prev => ({
                        ...prev,
                        isProcessing: false,
                        progressBarStatus: "Processing cancelled"
                    }));
                    
                    socketManager.close();
                    
                    generateToast(toastState || 2, toastMessage || "Processing cancelled.");
                } catch (error) {
                    console.error("Error in deferred cancel processing:", error);
                }
            });
        });
    }, []);

    const executeProcess = useCallback((
        command: any,
        toastMessage: string,
        onSuccess?: any,
        inputFile?: any,
        outputFile?: any,
        configPath?: string
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
            outputFile,
            configPath
        });
    }, [resetProgress, setFullLogs, setIsProcessCancelled, deletePreRender]);

    const startAutoCut = useCallback(async () => {
        try {
            const aeContext = await getValidatedAEContext();
            if (!aeContext) return;
            const { layerInfo, projectFolderPath } = aeContext;

            const renderAlgo = preRenderAlgorithm || DEFAULT.preRenderAlgorithm;
            generateToast(3, "Initiating the pre-render step...");

            //@ts-ignore
            const info: any | null = await evalTS("render", renderAlgo);
            if (info === "undefined") {
                generateToast(2, "Error: Rendering failed. Consider using an alternative encoding method.");
                return;
            }

            const { inpoint, outpoint, input, name } = info;

            var { command, configPath } = await autoCutLogic(
                pythonExePath,
                mainPyPath,
                input,
                autoCutSensitivity || DEFAULT.autoCutSensitivity,
            );
            setIsProcessing(true);
            runProcess(executeProcess, command, "Auto Cutting Clip", () => {
                evalTS("autoClip", tasRoamingPath);
            }, undefined, undefined, configPath);
        } catch (error) {
            console.error("Error in startAutoCut:", error);
        }
    }, [pythonExePath, mainPyPath, autoCutSensitivity, tasRoamingPath, executeProcess]);

    const startYoutubeDownload = useCallback(async () => {
        var isSaved = await ensureProjectIsSaved();
        if (!isSaved) {
            return;
        }

        let projectFolderPath = await getAEProjectFolderPath();
        if (!projectFolderPath) {
            return;
        }
        var { command, outputPath, configPath } = youtubeDownloadLogic(
            youtubeUrl,
            mainPyPath,
            pythonExePath,
            projectFolderPath
        );
        generateToast(3, "Youtube download initiated...");

        runProcess(executeProcess, command, "Youtube download", () => {
            evalTS("importVideo", outputPath);
        }, undefined, outputPath, configPath);
    }, [youtubeUrl, mainPyPath, pythonExePath, executeProcess]);

    const startExtraTabLogic = useCallback(async (mode: string) => {
        try {
            const aeContext = await getValidatedAEContext();
            if (!aeContext) return;
            const { layerInfo, projectFolderPath } = aeContext;

            // Check encoder compatibility with composition dimensions
            const dimensions = await evalTS("getCompDimensions");
            if (dimensions && dimensions.width && dimensions.height) {
                const { width, height } = dimensions;
                if ((width % 2 !== 0 || height % 2 !== 0) && !upscale) {
                    generateToast(2, `Desired Comp res: ${width}x${height} is non divisble by 2. Please update the composition settings.`);
                    return;
                }
            }


            const renderAlgo = preRenderAlgorithm || DEFAULT.preRenderAlgorithm;
            generateToast(3, "Initiating the pre-render step...");

            //@ts-ignore
            const info: any | null = await evalTS("render", renderAlgo);
            if (info === "undefined") {
                generateToast(2, "Error: Rendering failed. Consider using an alternative encoding method.");
                return;
            }

            const input = info?.input;
            const half = aiPrecision || DEFAULT.aiPrecision;
            let command: string;
            let outputPath: string;
            let configPath: string | undefined;
            let toast: string;

            if (mode === "depth") {
                if (!depthModel || !bitDepth || !depthQuality) {
                    console.error("Missing depth parameters");
                    return;
                }

                toast = "Depth map extraction";
                const result = await depthMapExtractionLogic(
                    pythonExePath,
                    mainPyPath,
                    input,
                    projectFolderPath,
                    depthModel,
                    bitDepth,
                    depthQuality,
                    half
                );
                command = result.command;
                outputPath = result.outputPath;
                configPath = result.configPath;

            } else if (mode === "background") {
                toast = "Background removal";
                const backgroundMethod = segmentMethod || DEFAULT.segmentMethod;
                const result = await removeBackgroundLogic(
                    pythonExePath,
                    mainPyPath,
                    input,
                    projectFolderPath,
                    backgroundMethod,
                    half
                );
                command = result.command;
                outputPath = result.outputPath;
                configPath = result.configPath;

            } else {
                generateToast(2, "Invalid mode selected for extraction.");
                return;
            }

            setIsProcessing(true);
            runProcess(executeProcess, command, toast, () => {
                evalTS("importVideo", outputPath);
            }, input, outputPath, configPath);

        } catch (error) {
            console.error("Error in startExtraTabLogic:", error);
            generateToast(2, "An error occurred during processing.");
        }
    }, [
        preRenderAlgorithm, depthModel, bitDepth, depthQuality, aiPrecision,
        segmentMethod, pythonExePath, mainPyPath, executeProcess
    ]);

    const startOfflineMode = useCallback(async () => {
        var command = offlineModeLogic(pythonExePath, mainPyPath);

        runProcess(executeProcess, command, "Offline mode", () => {
            generateToast(1, "TAS is now fully operational offline.");
        });
    }, [pythonExePath, mainPyPath, executeProcess]);

    const buildChainCommand = useCallback((input: string, outFile: string) => {
        const newinterpolateFactor = interpolate && interpolateFactor.endsWith("x")
            ? interpolateFactor.slice(0, -1)
            : interpolateFactor;

        if (interpolate && isNaN(Number(newinterpolateFactor))) {
            throw new Error("Invalid interpolation factor");
        }

        const config = buildJsonConfig(
            input,
            outFile,
            {
                resize: resize,
                resizeFactor: resize ? parseFloat(resizeFactor || DEFAULT.resizeFactor) : undefined,
                interpolate: interpolate,
                interpolationModel: interpolate ? (interpolationModel || DEFAULT.interpolationModel) as any : undefined,
                interpolateFactor: interpolate ? Number(newinterpolateFactor || DEFAULT.interpolateFactor) : undefined,
                interpolateMode: 'normal',
                upscale: upscale,
                upscaleModel: upscale ? (upscaleModel || DEFAULT.upscaleModel) as any : undefined,
                forceStatic: upscale ? forceStatic : undefined,
                deduplicate: deduplicate,
                deduplicateThreshold: deduplicate ? (deduplicateSensitivity * 100 || DEFAULT.deduplicateSensitivity * 100) : undefined,
                deduplicateMethod: deduplicate ? (deduplicateMethod || DEFAULT.deduplicateMethod) as any : undefined,
                restore: restore,
                restoreModels: restore ? (restoreModels.length > 0 ? restoreModels : ["anime1080fixer"]) : undefined,
                bitDepth: bitDepth ? parseInt(bitDepth) : parseInt(DEFAULT.bitDepth),
                aiPrecision: aiPrecision === "true",
            },
            "http://127.0.0.1:8080"
        );

        if (enablePreview) config.preview = true;
        if (encodeAlgorithm !== null) config.encode_method = encodeAlgorithm;
        if (interpolate && slowMotion) config.slowmo = true;
        if (interpolate && rifeensemble) config.ensemble = true;
        if (interpolate && dynamicScale) config.dynamic_scale = true;
        if (sharpening) {
            config.sharpen = true;
            config.sharpen_sens = sharpeningSensitivity * 100 || DEFAULT.sharpeningSensitivity * 100;
        }
        if (postResize && postResizeResolution) {
            const [width, height] = postResizeResolution.split('x');
            config.output_scale = `${width}x${height}`;
        }

        const configPath = saveJsonConfig(config);
        return { command: buildJsonCommand(pythonExePath, mainPyPath, configPath), configPath };
    }, [
        pythonExePath, mainPyPath, enablePreview, encodeAlgorithm, bitDepth, resize, resizeFactor,
        interpolate, interpolateFactor, interpolationModel, slowMotion, rifeensemble, dynamicScale,
        upscale, upscaleModel, forceStatic, deduplicate, deduplicateSensitivity, deduplicateMethod,
        restore, restoreModels, sharpening, sharpeningSensitivity, postResize, postResizeResolution, aiPrecision
    ]);

    const hasProcessingOptions = useMemo(() =>
        interpolate || upscale || deduplicate || restore || sharpening || resize || postResize,
        [interpolate, upscale, deduplicate, restore, sharpening, resize, postResize]
    );

    const startChain = useCallback(async () => {
        try {
            const aeContext = await getValidatedAEContext();
            if (!aeContext) return;

            const dimensions = await evalTS("getCompDimensions");
            if (dimensions && dimensions.width && dimensions.height) {
                const { width, height } = dimensions;
                if ((width % 2 !== 0 || height % 2 !== 0) && !upscale) {
                    generateToast(2, `Desired Comp res: ${width}x${height} is non divisble by 2. Please update the composition settings.`);
                    return;
                }
            }

            const renderAlgo = preRenderAlgorithm || DEFAULT.preRenderAlgorithm;
            generateToast(3, "Initiating the pre-render step...");

            //@ts-ignore
            const info: any | null = await evalTS("render", renderAlgo);
            if (info === "undefined") {
                generateToast(2, "Error: Rendering failed. Consider using an alternative encoding method.");
                return;
            }

            const input = info?.input;

            if (!hasProcessingOptions) {
                evalTS("importVideo", input);
                return;
            }

            const outputFolder = await getAEProjectFolderPath();
            if (!outputFolder) return;

            const randomNumbers = Math.floor(Math.random() * 100000);
            const ext = (encodeAlgorithm?.toLowerCase() === "prores") ? ".mov" : ".mp4";
            const outName = `Chain_${randomNumbers}${ext}`;
            
            const tasChainFolder = outputFolder + "\\TAS-Chain";

            if (!fs.existsSync(tasChainFolder)) {
                fs.mkdirSync(tasChainFolder, { recursive: true });
            }

            const outFile = outputFolder + "\\TAS-Chain\\" + outName;
            const { command, configPath } = buildChainCommand(input, outFile);

            setIsProcessing(true);
            runProcess(executeProcess, command, "Chained Process", () => {
                evalTS("importVideo", outFile);
            }, input, outFile, configPath);
        } catch (error) {
            if (error instanceof Error && error.message === "Invalid interpolation factor") {
                generateToast(2, "Error: Interpolation factor is not valid. Please select a valid interpolation factor.");
            } else {
                console.error("Error in startChain:", error);
            }
        }
    }, [preRenderAlgorithm, hasProcessingOptions, buildChainCommand, executeProcess]);

    const startAddAdjustmentLayerLogic = useCallback(async () => {
        if (await ensureProjectIsSaved()) {
            await createLayer("adjustment", toolboxLayerLength || DEFAULT.toolboxLayerLength);
        }
    }, [toolboxLayerLength]);

    const startAddSolidLayerLogic = useCallback(async () => {
        if (await ensureProjectIsSaved()) {
            await createLayer("solid", toolboxLayerLength || DEFAULT.toolboxLayerLength, solidLayerColor || DEFAULT.solidLayerColor);
        }
    }, [toolboxLayerLength, solidLayerColor]);

    const startDeduplicateLayerTimemapLogic = useCallback(async () => {
        if (await ensureProjectIsSaved()) {
            const result = await evalTS("removeDuplicates");
            if (result) {
                generateToast(3, "Removing dead frames...");
            } else {
                generateToast(2, "Error: Please select a layer first.");
            }
        }
    }, []);

    const startAddNullLayerLogic = useCallback(async () => {
        if (await ensureProjectIsSaved()) {
            await createLayer("null", toolboxLayerLength || DEFAULT.toolboxLayerLength);
        }
    }, [toolboxLayerLength]);

    const startSortLayersLogic = useCallback(async () => {
        const isSaved = await ensureProjectIsSaved();
        if (isSaved) {
            const result = await evalTS("sortLayers", sortLayerMethod || DEFAULT.sortLayerMethod);
            if (result) {
                generateToast(3, "Sorting layers...");
            } else {
                generateToast(2, "Error: Please select at least 2 layers.");
            }
        }
    }, [sortLayerMethod]);

    const startSortLayersLogicWith = useCallback(async (order: 'topDown' | 'bottomUp') => {
        const isSaved = await ensureProjectIsSaved();
        if (isSaved) {
            const result = await evalTS("sortLayers", order);
            if (result) {
                generateToast(3, `Sorting layers (${order === 'topDown' ? 'Top to Bottom' : 'Bottom to Top'})...`);
            } else {
                generateToast(2, "Error: Please select at least 2 layers.");
            }
        }
    }, []);

    const startTrimToWorkAreaLogic = useCallback(async () => {
        if (await ensureProjectIsSaved()) {
            const result = await evalTS("trimToWorkArea");
            if (result === true) {
                generateToast(3, "Trimmed to work area.");
            } else if (typeof result === "string") {
                generateToast(2, result);
            } else {
                generateToast(2, "Error: No active comp found.");
            }
        }
    }, []);

    const startFreezeOnCurrentFrameLogic = useCallback(async () => {
        if (await ensureProjectIsSaved()) {
            const result = await evalTS("freezeOnCurrentFrame");
            if (result === true) {
                generateToast(3, "Freeze-frame created.");
            } else if (typeof result === "string") {
                generateToast(2, result);
            } else {
                generateToast(2, "Error: Please select at least one layer.");
            }
        }
    }, []);



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
            // Handle both old single model and new array format
            if (Array.isArray(parsedSettings.restoreModels)) {
                setRestoreModels(parsedSettings.restoreModels);
            } else if (parsedSettings.restoreModel) {
                setRestoreModels([parsedSettings.restoreModel]);
            }
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
            setPostResize(parsedSettings.postResize);
            setPostResizeResolution(parsedSettings.postResizeResolution);
            setUIScale(parsedSettings.uiScale);
            setAiPrecision(parsedSettings.aiPrecision);
            if (parsedSettings.selectedTab && tabKeys.includes(parsedSettings.selectedTab)) {
                setSelectedTab(parsedSettings.selectedTab);
            }
        }
    }, []);


    const debouncedSaveSettings = useDebounce((settingsToSave: any) => {
        localStorage.setItem("settings", JSON.stringify(settingsToSave));
        console.log("Settings saved via debounce"); // Optional: for debugging
    }, 1000); // Adjust delay as needed, e.g., 1000ms

    const settings = useMemo(() => ({
        deduplicate,
        restore,
        upscale,
        interpolate,
        sharpening,
        rifeensemble,
        deduplicateMethod,
        encodeAlgorithm,
        restoreModels,
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
        postResize,
        postResizeResolution,
        uiScale,
        aiPrecision,
        selectedTab,
    }), [
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
        restoreModels,
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
        postResize,
        postResizeResolution,
        uiScale,
        aiPrecision,
        selectedTab,
    ]);

    useEffect(() => {
        debouncedSaveSettings(settings);
    }, [settings, debouncedSaveSettings]);

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
                        title={CurrentVersionOfExe !== "Not Available" ? "Update TAS Dependencies" : "Download TAS Dependencies"}
                        variant="confirmation"
                        primaryActionLabel={CurrentVersionOfExe !== "Not Available" ? "Update" : "Download"}
                        onPrimaryAction={handleDownloadTAS}
                        onSecondaryAction={openGitHubWiki}
                        secondaryActionLabel="Manual Method"
                        UNSAFE_className="alertDialogBorder"
                    >
                        <Flex direction="column" gap="size-200" width="100%">
                            <Flex direction="row" alignItems="center" gap="size-100">
                                <Info color="notice" size="XS" />
                                <Text UNSAFE_style={{ color: "#FFD700", fontWeight: 600 }}>
                                    Anime Scripter dependencies {CurrentVersionOfExe !== "Not Available" ? (<strong>are outdated</strong>) : (<strong>were not found</strong>)}
                                </Text>
                            </Flex>
                            <View borderRadius="medium"  borderWidth="thin" borderColor="dark" padding="size-150" marginBottom="size-100">
                                <Flex direction={"column"} gap="size-100">
                                <Text UNSAFE_style={{ fontSize: 13 }}>
                                    A download of <strong>~35MB</strong> is required (
                                    <Text UNSAFE_style={{ color: "#4CAF50", fontWeight: 600, display: "inline" }}>
                                        {isNvidia === "LITE" ? "~1GB" : "~5GB"}
                                    </Text>
                                    {" "}after full installation). <strong>This is a one time download!</strong>
                                </Text>
                                <Flex direction="column" gap="size-50">
                                    <Flex direction="row" gap="size-100" alignItems="center">
                                        <Gauge1 color="informative" size="XS" />
                                        <Text UNSAFE_style={{ fontSize: 13 }}>
                                            <strong>Current Version:</strong> {CurrentVersionOfExe || "Not Available"}
                                        </Text>
                                    </Flex>
                                    <Flex direction="row" gap="size-100" alignItems="center">
                                        <Gauge5 color="positive" size="XS" />
                                        <Text UNSAFE_style={{ fontSize: 13 }}>
                                            <strong>Latest Version:</strong> {tasVersion}
                                        </Text>
                                    </Flex>
                                    <Flex direction="row" gap="size-100" alignItems="center">
                                        <Inbox color="informative" size="XS" />
                                        <Text UNSAFE_style={{ fontSize: 13 }}>
                                            <strong>Download Location:</strong> {tasAppDataPath.replace(/^.*[\\/]AppData/, "%appdata%")}
                                        </Text>
                                    </Flex>
                                </Flex>
                                </Flex>
                            </View>
                            <Meter
                                label={"Total Space Occupied on Drive: " + drive}
                                value={freeSpace}
                                minValue={0}
                                maxValue={totalSpace}
                                UNSAFE_style={{ width: "100%" }}
                            />
                            {(freeSpace !== undefined && totalSpace !== undefined) && (
                                <Flex direction="row" justifyContent="space-between" alignItems="center" marginTop={-10}>
                                    <Text UNSAFE_style={{ fontSize: 13 }}>
                                        <span style={{ color: "#5ea9f6" }}>
                                            {(freeSpace / (1024 * 1024 * 1024)).toFixed(2)} GB
                                        </span> of {Math.round(totalSpace / (1024 * 1024 * 1024))} GB used
                                    </Text>
                                </Flex>
                            )}
                            {(freeSpace !== undefined && freeSpace < 6 * 1024 * 1024 * 1024) && (
                                <Flex direction="row" alignItems="center" gap="size-100">
                                    <Alert color="negative" size="XS" />
                                    <Text UNSAFE_style={{ color: "#FF9800", fontWeight: 600 }}>
                                        Warning: Less than 6GB of free space available. The download WILL fail!
                                    </Text>
                                </Flex>
                            )}
                            
                            <Divider size="S" />
                            
                            <Flex direction="row" alignItems="center">
                                <Checkbox
                                    isSelected={enableCompression}
                                    onChange={setEnableCompression}
                                >
                                    Enable XPRESS 8K Compression ( Experimental! )
                                </Checkbox>
                                {createGeneralContextualHelp(
                                    "XPRESS 8K Compression",
                                    <>
                                        <Text>
                                            <strong>What it does:</strong> Applies Windows 10 XPRESS with Huffman encoding compression to the TAS-Portable folder after installation.
                                        </Text>
                                        <br />
                                        <br />
                                        <Text>
                                            <strong>Benefits:</strong>
                                        </Text>
                                        <ul>
                                            <li>Reduces disk space usage by approximately 30-50%</li>
                                            <li>Files remain accessible and executable</li>
                                            <li>Transparent compression - no manual decompression needed</li>
                                            <li>Uses native Windows compression API</li>
                                        </ul>
                                        <Text>
                                            <strong>Potential drawbacks:</strong>
                                        </Text>
                                        <ul>
                                            <li>Slightly slower file access times (usually negligible)</li>
                                            <li>Small CPU overhead during file operations</li>
                                        </ul>
                                        <br />
                                        <Text>
                                            <em>Recommended for users with limited disk space or for users with old HDDs / SSDs.</em>
                                        </Text>
                                    </>
                                )}
                            </Flex>
                                
                        </Flex>
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
                            <Item key="Chain" textValue="Chain">
                                <LinkIcon />
                            </Item>
                            <Item key="Extra" textValue="Extra">
                                <Effects />
                            </Item>
                            <Item key="Graph" textValue="Graph">
                                <Asterisk />
                            </Item>
                            <Item key="Logs" textValue="Logs">
                                <Inbox />
                            </Item>
                            <Item key="Settings" textValue="Settings">
                                <Settings />
                            </Item>
                            <Item key="About" textValue="About">
                                <Info />
                            </Item>
                        </TabList>
                        <div
                            className="tab-content-container"
                            style={{ touchAction: 'pan-y' }}
                        >
                            <Flex direction="column">

                                <TabPanels>
                                    <Item key="Chain">
                                        <div style={{ width: '100%' }}>
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
                                                                <Text>Resize Input</Text>
                                                            </ToggleButton>
                                                            <DialogTrigger
                                                                isDismissable
                                                                onOpenChange={(isOpen) => {
                                                                    if (isOpen) {
                                                                        getCompositionDimensions();
                                                                    }
                                                                }}
                                                            >
                                                                <TooltipTrigger delay={0}>
                                                                    <ActionButton>
                                                                        <Settings />
                                                                    </ActionButton>
                                                                    <Tooltip>Resize Input Settings</Tooltip>
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
                                                                            <View
                                                                                backgroundColor="gray-75"
                                                                                padding="size-150"
                                                                                borderRadius="medium"
                                                                                marginBottom="size-200"
                                                                            >
                                                                                <Flex direction="column" gap="size-100">
                                                                                    {isDimensionsLoading ? (
                                                                                        <Flex direction="row" justifyContent="center" alignItems="center" minHeight="size-600">
                                                                                            <Text UNSAFE_style={{ fontSize: "12px", opacity: 0.7 }}>
                                                                                                Getting composition dimensions...
                                                                                            </Text>
                                                                                        </Flex>
                                                                                    ) : (
                                                                                        <Flex direction="row" justifyContent="space-between" alignItems="center">
                                                                                            <Flex direction="column" gap="size-50">
                                                                                                <Text UNSAFE_style={{ fontSize: "12px", opacity: 0.8 }}>
                                                                                                    Input:
                                                                                                </Text>
                                                                                                <Text UNSAFE_style={{
                                                                                                    fontSize: "14px",
                                                                                                    fontWeight: "medium",
                                                                                                    color: compDimensions ? "#ffffff" : "#ff9800"
                                                                                                }}>
                                                                                                    {compDimensions
                                                                                                        ? `${compDimensions.width}×${compDimensions.height}`
                                                                                                        : "No composition active"
                                                                                                    }
                                                                                                </Text>
                                                                                            </Flex>
                                                                                            <Text UNSAFE_style={{ fontSize: "18px", opacity: 0.6 }}>
                                                                                                →
                                                                                            </Text>
                                                                                            <Flex direction="column" gap="size-50">
                                                                                                <Text UNSAFE_style={{ fontSize: "12px", opacity: 0.8 }}>
                                                                                                    Output ({resizeFactor}x):
                                                                                                </Text>
                                                                                                <Text UNSAFE_style={{
                                                                                                    fontSize: "14px",
                                                                                                    fontWeight: "medium",
                                                                                                    color: compDimensions ? "#4CAF50" : "#ff9800"
                                                                                                }}>
                                                                                                    {compDimensions && resizeFactor
                                                                                                        ? `${Math.round(compDimensions.width * parseFloat(resizeFactor))}×${Math.round(compDimensions.height * parseFloat(resizeFactor))}`
                                                                                                        : "Select a composition"
                                                                                                    }
                                                                                                </Text>
                                                                                            </Flex>
                                                                                        </Flex>
                                                                                    )}
                                                                                </Flex>
                                                                            </View>

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
                                                                                        <Item key="0.25">0.25x</Item>
                                                                                        <Item key="0.5">0.5x</Item>
                                                                                        <Item key="0.75">0.75x</Item>
                                                                                        <Item key="1.25">1.25x</Item>
                                                                                        <Item key="1.5">1.5x</Item>
                                                                                        <Item key="1.75">1.75x</Item>
                                                                                        <Item key="2">2x</Item>
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
                                                                                        <Item key="ssim" textValue="SSIM">
                                                                                            <Gauge4 />
                                                                                            <Text>
                                                                                                SSIM
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="mse" textValue="MSE">
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
                                                                                        <Item key="ssim-cuda" textValue="SSIM CUDA">
                                                                                            <Gauge5 />
                                                                                            <Text>
                                                                                                SSIM
                                                                                                CUDA
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="flownets" textValue="FlownetS">
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
                                                                            <Flex direction="column" gap="size-200" width="100%">
                                                                                {restoreModels.length > 0 && (
                                                                                    <Flex direction="column" gap="size-100">
                                                                                        <Flex direction="row" justifyContent="space-between" alignItems="center">
                                                                                            <Text>Selected Restore Models (applied in order):</Text>
                                                                                            <ActionButton
                                                                                                onPress={() => setRestoreModels([])}
                                                                                                isQuiet
                                                                                            >
                                                                                                <Delete />
                                                                                                <Text>Clear All</Text>
                                                                                            </ActionButton>
                                                                                        </Flex>
                                                                                        <TagGroup
                                                                                            items={restoreModels.map((model, idx) => ({
                                                                                                id: `restore-${idx}`,
                                                                                                name: model
                                                                                            }))}
                                                                                            onRemove={handleRemoveRestoreModels}
                                                                                            maxWidth="100%"
                                                                                        >
                                                                                            {item => <Item key={item.id}>{item.name}</Item>}
                                                                                        </TagGroup>
                                                                                    </Flex>
                                                                                )}
                                                                                
                                                                            <Picker
                                                                                label="Add Restore Model to Chain"
                                                                                onSelectionChange={handleAddRestoreModel}
                                                                                contextualHelp={createPickerContextualHelp(
                                                                                    "Model Selection",
                                                                                    "Select models to add to the restoration chain. Models are applied in the order shown above."
                                                                                )}
                                                                                width={"100%"}
                                                                            >
                                                                                <Section title="NVIDIA GPUs">
                                                                                    <Item key="nafnet" textValue="NAFNET">
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

                                                                                    <Item key="scunet" textValue="SCUNet">
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
                                                                                    <Item key="real-plksr" textValue="Real-PLKSR">
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
                                                                                    <Item key="anime1080fixer" textValue="Anime Fixer">
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
                                                                                    <Item key="fastlinedarken" textValue="Fast Line Darken">
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
                                                                                    <Item key="gater3" textValue="Gater3">
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
                                                                                    <Item key="deh264_real" textValue="DeH264 Real">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            DeH264 Real
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            IRL / Video /
                                                                                            DeH264
                                                                                            Artifacts
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="deh264_span" textValue="DeH264 Span">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            DeH264 Span
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime /
                                                                                            DeH264
                                                                                            Artifacts
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="hurrdeblur" textValue="HurrDeblur">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            HurrDeblur
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime /
                                                                                            Cartoons /
                                                                                            Deblur
                                                                                        </Text>
                                                                                    </Item>
                                                                                </Section>
                                                                                <Section title="NVIDIA RTX GPUs">
                                                                                    <Item key="scunet-tensorrt" textValue="SCUNet TensorRT">
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
                                                                                    <Item key="anime1080fixer-tensorrt" textValue="Anime Fixer TensorRT">
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
                                                                                    <Item key="fastlinedarken-tensorrt" textValue="Fast Line Darken TensorRT">
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
                                                                                    <Item key="deh264_real-tensorrt" textValue="DeH264 Real TensorRT">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            DeH264 Real
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            IRL / Video /
                                                                                            DeH264
                                                                                            Artifacts
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="deh264_span-tensorrt" textValue="DeH264 Span TensorRT">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            DeH264 Span
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime Video /
                                                                                            DeH264
                                                                                            Artifacts
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="hurrdeblur-tensorrt" textValue="HurrDeblur TensorRT">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            HurrDeblur
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime /
                                                                                            Cartoons /
                                                                                            Deblur
                                                                                        </Text>
                                                                                    </Item>
                                                                                </Section>
                                                                                <Section title="ALL GPUS">
                                                                                    <Item key="anime1080fixer-directml" textValue="Anime Fixer DirectML">
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
                                                                                    <Item key="gater3-directml" textValue="Gater3 DirectML">
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
                                                                                    <Item key="deh264_real-directml" textValue="DeH264 Real DirectML">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            DeH264 Real
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            IRL / Video /
                                                                                            DeH264
                                                                                            Artifacts
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="deh264_span-directml" textValue="DeH264 Span DirectML">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            DeH264 Span
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime /
                                                                                            DeH264
                                                                                            Artifacts
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="hurrdeblur-directml" textValue="HurrDeblur DirectML">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            HurrDeblur
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime /
                                                                                            Cartoons /
                                                                                            Deblur
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
                                                                isSelected={interpolate}
                                                                onChange={setInterpolate}
                                                                aria-label="Interpolate"
                                                                isEmphasized
                                                                width={"100%"}
                                                            >
                                                                <Text>Interpolate</Text>
                                                            </ToggleButton>
                                                            <DialogTrigger
                                                                isDismissable
                                                                onOpenChange={(isOpen) => {
                                                                    if (isOpen) {
                                                                        getCompositionFPS();
                                                                    }
                                                                }}
                                                            >
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
                                                                            <View
                                                                                backgroundColor="gray-75"
                                                                                padding="size-150"
                                                                                borderRadius="medium"
                                                                                marginBottom="size-200"
                                                                            >
                                                                                <Flex direction="column" gap="size-100">
                                                                                    {isFPSLoading ? (
                                                                                        <Flex direction="row" justifyContent="center" alignItems="center" minHeight="size-600">
                                                                                            <Text UNSAFE_style={{ fontSize: "12px", opacity: 0.7 }}>
                                                                                                Getting composition FPS...
                                                                                            </Text>
                                                                                        </Flex>
                                                                                    ) : (
                                                                                        <Flex direction="row" justifyContent="space-between" alignItems="center">
                                                                                            <Flex direction="column" gap="size-50">
                                                                                                <Text UNSAFE_style={{ fontSize: "12px", opacity: 0.8 }}>
                                                                                                    Input:
                                                                                                </Text>
                                                                                                <Text UNSAFE_style={{
                                                                                                    fontSize: "14px",
                                                                                                    fontWeight: "medium",
                                                                                                    color: compFPS ? "#ffffff" : "#ff9800"
                                                                                                }}>
                                                                                                    {compFPS
                                                                                                        ? `${compFPS.toFixed(3)} FPS`
                                                                                                        : "No composition active"
                                                                                                    }
                                                                                                </Text>
                                                                                            </Flex>
                                                                                            <Text UNSAFE_style={{ fontSize: "18px", opacity: 0.6 }}>
                                                                                                →
                                                                                            </Text>
                                                                                            <Flex direction="column" gap="size-50">
                                                                                                <Text UNSAFE_style={{ fontSize: "12px", opacity: 0.8 }}>
                                                                                                    Output ({interpolateFactor}):
                                                                                                </Text>
                                                                                                <Text UNSAFE_style={{
                                                                                                    fontSize: "14px",
                                                                                                    fontWeight: "medium",
                                                                                                    color: compFPS ? "#4CAF50" : "#ff9800"
                                                                                                }}>
                                                                                                    {compFPS && interpolateFactor
                                                                                                        ? `${(compFPS * parseFloat(interpolateFactor.replace('x', ''))).toFixed(3)} FPS`
                                                                                                        : "Select a composition"
                                                                                                    }
                                                                                                </Text>
                                                                                            </Flex>
                                                                                        </Flex>
                                                                                    )}
                                                                                </Flex>
                                                                            </View>

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
                                                                                                Cuda.
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
                                                                                        setInterpolateFactor(
                                                                                            value
                                                                                        );
                                                                                    }}
                                                                                    onSelectionChange={selected => {
                                                                                        if (selected) {
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
                                                                                        <Item key="rife4.25-heavy" textValue="Rife 4.25 Heavy CUDA">
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
                                                                                        <Item key="rife4.25" textValue="Rife 4.25 CUDA">
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
                                                                                        <Item key="rife4.25-lite" textValue="Rife 4.25 Lite CUDA">
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
                                                                                        <Item key="rife4.22" textValue="Rife 4.22 CUDA">
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
                                                                                        <Item key="rife4.22-lite" textValue="Rife 4.22 Lite CUDA">
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
                                                                                        <Item key="rife_elexor" textValue="Rife 4.7 Elexor CUDA">
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
                                                                                        <Item key="rife4.6" textValue="Rife 4.6 CUDA">
                                                                                            <Gauge5 />
                                                                                            <Text>
                                                                                                Rife 4.6
                                                                                                Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Universal
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="gmfss" textValue="GMFSS CUDA">
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
                                                                                        <Item key="rife4.25-heavy-tensorrt" textValue="Rife 4.25 Heavy TensorRT">
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
                                                                                        <Item key="rife4.25-tensorrt" textValue="Rife 4.25 TensorRT">
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
                                                                                        <Item key="rife4.25-lite-tensorrt" textValue="Rife 4.25 Lite TensorRT">
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
                                                                                        <Item key="rife4.22-tensorrt" textValue="Rife 4.22 TensorRT">
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
                                                                                        <Item key="rife4.22-lite-tensorrt" textValue="Rife 4.22 Lite TensorRT">
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
                                                                                        <Item key="rife_elexor-tensorrt" textValue="Rife 4.7 Elexor TensorRT">
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
                                                                                        <Item key="rife4.6-tensorrt" textValue="Rife 4.6 TensorRT">
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
                                                                                        <Item key="rife4.22-ncnn" textValue="Rife 4.22 NCNN">
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
                                                                                        <Item key="rife4.22-lite-ncnn" textValue="Rife 4.22 Lite NCNN">
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
                                                                                        <Item key="rife4.18-ncnn" textValue="Rife 4.18 NCNN">
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
                                                                                        <Item key="rife4.6-ncnn" textValue="Rife 4.6 NCNN">
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
                                                            <DialogTrigger
                                                                isDismissable
                                                                onOpenChange={(isOpen) => {
                                                                    if (isOpen) {
                                                                        getCompositionDimensions();
                                                                    }
                                                                }}
                                                            >
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
                                                                            <View
                                                                                backgroundColor="gray-75"
                                                                                padding="size-150"
                                                                                borderRadius="medium"
                                                                                marginBottom="size-200"
                                                                            >
                                                                                <Flex direction="column" gap="size-100">

                                                                                    {isDimensionsLoading ? (
                                                                                        <Flex direction="row" justifyContent="center" alignItems="center" minHeight="size-600">
                                                                                            <Text UNSAFE_style={{ fontSize: "12px", opacity: 0.7 }}>
                                                                                                Getting composition dimensions...
                                                                                            </Text>
                                                                                        </Flex>
                                                                                    ) : (
                                                                                        <Flex direction="row" justifyContent="space-between" alignItems="center">
                                                                                            <Flex direction="column" gap="size-50">
                                                                                                <Text UNSAFE_style={{ fontSize: "12px", opacity: 0.8 }}>
                                                                                                    Input:
                                                                                                </Text>
                                                                                                <Text UNSAFE_style={{
                                                                                                    fontSize: "14px",
                                                                                                    fontWeight: "medium",
                                                                                                    color: compDimensions ? "#ffffff" : "#ff9800"
                                                                                                }}>
                                                                                                    {compDimensions
                                                                                                        ? `${compDimensions.width}×${compDimensions.height}`
                                                                                                        : "No composition active"
                                                                                                    }
                                                                                                </Text>
                                                                                            </Flex>
                                                                                            <Text UNSAFE_style={{ fontSize: "18px", opacity: 0.6 }}>
                                                                                                →
                                                                                            </Text>
                                                                                            <Flex direction="column" gap="size-50">
                                                                                                <Text UNSAFE_style={{ fontSize: "12px", opacity: 0.8 }}>
                                                                                                    Output (2x):
                                                                                                </Text>
                                                                                                <Text UNSAFE_style={{
                                                                                                    fontSize: "14px",
                                                                                                    fontWeight: "medium",
                                                                                                    color: compDimensions ? "#4CAF50" : "#ff9800"
                                                                                                }}>
                                                                                                    {compDimensions
                                                                                                        ? `${compDimensions.width * 2}×${compDimensions.height * 2}`
                                                                                                        : "Select a composition"
                                                                                                    }
                                                                                                </Text>
                                                                                            </Flex>
                                                                                        </Flex>
                                                                                    )}
                                                                                </Flex>
                                                                            </View>

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
                                                                                    <Item key="fallin_soft" textValue="Fallin Soft CUDA">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            Fallin Soft
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime | Denoise + Soft Sharpen
                                                                                        </Text>
                                                                                    </Item>

                                                                                    <Item key="fallin_strong" textValue="Fallin Strong CUDA">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            Fallin
                                                                                            Strong
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime | Denoise + Strong Sharpen
                                                                                        </Text>
                                                                                    </Item>


                                                                                    <Item key="shufflecugan" textValue="ShuffleCugan CUDA">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            ShuffleCugan
                                                                                            Cuda
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="compact" textValue="Compact CUDA">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            Compact Cuda
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="ultracompact" textValue="UltraCompact CUDA">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            UltraCompact
                                                                                            Cuda
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="superultracompact" textValue="SuperUltraCompact CUDA">
                                                                                        <Gauge4 />
                                                                                        <Text>
                                                                                            SuperUltraCompact
                                                                                            Cuda
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="aniscale2" textValue="AniScale2 CUDA">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            AniScale2
                                                                                            Cuda
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="open-proteus" textValue="Open Proteus CUDA">
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
                                                                                    <Item key="animesr" textValue="AnimeSR CUDA">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            AnimeSR
                                                                                            Cuda
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                </Section>
                                                                                <Section title="NVIDIA RTX GPUs">
                                                                                    <Item key="fallin_soft-tensorrt" textValue="Fallin Soft TensorRT">
                                                                                        <Gauge4 />
                                                                                        <Text>
                                                                                            Fallin Soft
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime | Denoise + Soft Sharpen
                                                                                        </Text>
                                                                                    </Item>

                                                                                    <Item key="fallin_strong-tensorrt" textValue="Fallin Strong TensorRT">
                                                                                        <Gauge5 />
                                                                                        <Text>
                                                                                            Fallin
                                                                                            Strong
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime | Denoise + Strong Sharpen
                                                                                        </Text>
                                                                                    </Item>

                                                                                    <Item key="shufflecugan-tensorrt" textValue="ShuffleCugan TensorRT">
                                                                                        <Gauge4 />
                                                                                        <Text>
                                                                                            ShuffleCugan
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="compact-tensorrt" textValue="Compact TensorRT">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            Compact
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="ultracompact-tensorrt" textValue="UltraCompact TensorRT">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            UltraCompact
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="superultracompact-tensorrt" textValue="SuperUltraCompact TensorRT">
                                                                                        <Gauge5 />
                                                                                        <Text>
                                                                                            SuperUltraCompact
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="aniscale2-tensorrt" textValue="AniScale2 TensorRT">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            AniScale2
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="open-proteus-tensorrt" textValue="Open Proteus TensorRT">
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
                                                                                    <Item key="rtmosr-tensorrt" textValue="Rtmosr V2 TensorRT">
                                                                                        <Gauge5 />
                                                                                        <Text>
                                                                                            Rtmosr V2
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="animesr-tensorrt" textValue="AnimeSR TensorRT">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            AnimeSR
                                                                                            TensorRT
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                </Section>
                                                                                <Section title="All GPUs">
                                                                                    <Item key="span-directml" textValue="SPAN DirectML">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            SPAN
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="compact-directml" textValue="Compact DirectML">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            Compact
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="ultracompact-directml" textValue="UltraCompact DirectML">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            UltraCompact
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="superultracompact-directml" textValue="SuperUltraCompact DirectML">
                                                                                        <Gauge3 />
                                                                                        <Text>
                                                                                            SuperUltraCompact
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="span-ncnn" textValue="SPAN NCNN">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            SPAN NCNN
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="shufflecugan-ncnn" textValue="ShuffleCugan NCNN">
                                                                                        <Gauge2 />
                                                                                        <Text>
                                                                                            ShuffleCugan
                                                                                            NCNN
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="aniscale2-directml" textValue="AniScale2 DirectML">
                                                                                        <Gauge1 />
                                                                                        <Text>
                                                                                            AniScale2
                                                                                            DirectML
                                                                                        </Text>
                                                                                        <Text slot="description">
                                                                                            Anime
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="open-proteus-directml" textValue="Open Proteus DirectML">
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
                                                                                    <Item key="rtmosr-directml" textValue="Rtmosr V2 DirectML">
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
                                                                                    {UPSCALE_MODEL_EXAMPLES[
                                                                                        upscaleModel as UpscaleModelKey
                                                                                    ] ? (
                                                                                        <>
                                                                                            <Image
                                                                                                src={
                                                                                                    UPSCALE_MODEL_EXAMPLES[
                                                                                                    upscaleModel as UpscaleModelKey
                                                                                                    ] ||
                                                                                                    UPSCALE_MODEL_EXAMPLES.default
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
                                                                                                        UPSCALE_MODEL_EXAMPLES[
                                                                                                        upscaleModel as UpscaleModelKey
                                                                                                        ] ||
                                                                                                        UPSCALE_MODEL_EXAMPLES.default
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
                                                        <Flex direction="row" gap={8} width={"100%"}>
                                                            <ToggleButton
                                                                isSelected={postResize}
                                                                onChange={setPostResize}
                                                                aria-label="Resize-Output"
                                                                isEmphasized
                                                                width={"100%"}
                                                            >
                                                                <Text>Resize Output</Text>
                                                            </ToggleButton>
                                                            <DialogTrigger
                                                                isDismissable
                                                                onOpenChange={(isOpen) => {
                                                                    if (isOpen) {
                                                                        getCompositionDimensions();
                                                                    }
                                                                }}
                                                            >
                                                                <TooltipTrigger delay={0}>
                                                                    <ActionButton>
                                                                        <Settings />
                                                                    </ActionButton>
                                                                    <Tooltip>Resize Output Settings</Tooltip>
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
                                                                                    Resize Output Settings
                                                                                </Text>
                                                                                {createGeneralContextualHelp(
                                                                                    "Resize Output",
                                                                                    "Resize the video to a specific resolution after all processing is complete. This is useful if your system can't handle 4K Layers at the cost of some of the benefits coming from Upscaling."
                                                                                )}
                                                                            </Flex>
                                                                        </Heading>
                                                                        <Divider />
                                                                        <Content>
                                                                            <View
                                                                                backgroundColor="gray-75"
                                                                                padding="size-150"
                                                                                borderRadius="medium"
                                                                                marginBottom="size-200"
                                                                            >
                                                                                <Flex direction="column" gap="size-100">
                                                                                    {isDimensionsLoading ? (
                                                                                        <Flex direction="row" justifyContent="center" alignItems="center" minHeight="size-600">
                                                                                            <Text UNSAFE_style={{ fontSize: "12px", opacity: 0.7 }}>
                                                                                                Getting composition dimensions...
                                                                                            </Text>
                                                                                        </Flex>
                                                                                    ) : (
                                                                                        <Flex direction="row" justifyContent="space-between" alignItems="center">
                                                                                            <Flex direction="column" gap="size-50">
                                                                                                <Text UNSAFE_style={{ fontSize: "12px", opacity: 0.8 }}>
                                                                                                    Input:
                                                                                                </Text>
                                                                                                <Text UNSAFE_style={{
                                                                                                    fontSize: "14px",
                                                                                                    fontWeight: "medium",
                                                                                                    color: compDimensions ? "#ffffff" : "#ff9800"
                                                                                                }}>
                                                                                                    {compDimensions
                                                                                                        ? `${compDimensions.width}×${compDimensions.height}`
                                                                                                        : "No composition active"
                                                                                                    }
                                                                                                </Text>
                                                                                            </Flex>
                                                                                            <Text UNSAFE_style={{ fontSize: "18px", opacity: 0.6 }}>
                                                                                                →
                                                                                            </Text>
                                                                                            <Flex direction="column" gap="size-50">
                                                                                                <Text UNSAFE_style={{ fontSize: "12px", opacity: 0.8 }}>
                                                                                                    Output:
                                                                                                </Text>
                                                                                                <Text UNSAFE_style={{
                                                                                                    fontSize: "14px",
                                                                                                    fontWeight: "medium",
                                                                                                    color: postResizeResolution ? "#4CAF50" : "#ff9800"
                                                                                                }}>
                                                                                                    {postResizeResolution 
                                                                                                        ? postResizeResolution.replace('x', '×')
                                                                                                        : "Select resolution"}
                                                                                                </Text>
                                                                                            </Flex>
                                                                                        </Flex>
                                                                                    )}
                                                                                </Flex>
                                                                            </View>

                                                                            <Flex
                                                                                direction="column"
                                                                                gap={10}
                                                                            >
                                                                                <Picker
                                                                                    label="Output Resolution"
                                                                                    selectedKey={
                                                                                        postResizeResolution
                                                                                    }
                                                                                    onSelectionChange={handleSelectionChange(
                                                                                        setPostResizeResolution
                                                                                    )}
                                                                                    contextualHelp={createPickerContextualHelp(
                                                                                        "Choosing Output Resolution",
                                                                                        <>
                                                                                            Select the final output resolution for your video.
                                                                                            <br />
                                                                                            <br />
                                                                                            <Text>
                                                                                                16:9 resolutions are ideal for YouTube and most platforms.
                                                                                                21:9 for ultrawide displays, and 4:3 for classic formats.
                                                                                            </Text>
                                                                                        </>
                                                                                    )}
                                                                                    width={"100%"}
                                                                                >
                                                                                    <Section title="16:9 Resolutions">
                                                                                        <Item key="1280x720">1280×720 (HD)</Item>
                                                                                        <Item key="1920x1080">1920×1080 (Full HD)</Item>
                                                                                        <Item key="2560x1440">2560×1440 (2K)</Item>
                                                                                        <Item key="3840x2160">3840×2160 (4K)</Item>
                                                                                    </Section>
                                                                                    <Section title="21:9 Resolutions">
                                                                                        <Item key="1720x720">1720×720 (Ultrawide HD)</Item>
                                                                                        <Item key="2560x1080">2560×1080 (Ultrawide FHD)</Item>
                                                                                        <Item key="3440x1440">3440×1440 (Ultrawide 2K)</Item>
                                                                                        <Item key="5120x2160">5120×2160 (Ultrawide 4K)</Item>
                                                                                    </Section>
                                                                                    <Section title="32:9 Resolutions">
                                                                                        <Item key="2560x720">2560×720 (Super Ultrawide HD)</Item>
                                                                                        <Item key="3840x1080">3840×1080 (Super Ultrawide FHD)</Item>
                                                                                        <Item key="5120x1440">5120×1440 (Super Ultrawide 2K)</Item>
                                                                                        <Item key="7680x2160">7680×2160 (Super Ultrawide 4K)</Item>
                                                                                    </Section>
                                                                                    <Section title="4:3 Resolutions">
                                                                                        <Item key="1024x768">1024×768 (XGA)</Item>
                                                                                        <Item key="1600x1200">1600×1200 (UXGA)</Item>
                                                                                        <Item key="2048x1536">2048×1536 (QXGA)</Item>
                                                                                    </Section>
                                                                                </Picker>
                                                                            </Flex>
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

                                                        {(resize || upscale || postResize || interpolate) && resolutionSteps.length > 1 && (
                                                            <Breadcrumbs size="S" marginStart={-6}>
                                                                {resolutionSteps.map((s, idx) => (
                                                                    <Item key={`step-${idx}`}>{s}</Item>
                                                                ))}
                                                            </Breadcrumbs>
                                                        )}
                                                    </Flex>
                                                </View>

                                                <View
                                                    borderWidth="thin"
                                                    borderColor="dark"
                                                    borderRadius="medium"
                                                    padding="size-200"
                                                >
                                                    <Flex direction="column" gap={12} width={"100%"}>
                                                        <Flex direction="row" gap={8} alignItems="center" justifyContent="space-between">
                                                            <Flex direction="row" gap={8} alignItems="center">
                                                                <BookmarkSingle size="S" />
                                                                <Heading level={4} margin={0}>
                                                                    Quick Presets
                                                                </Heading>
                                                                {createGeneralContextualHelp(
                                                                    "Quick Presets",
                                                                    "Save your current processing options as a preset for quick access later. Click a preset to apply it, or use the edit/delete buttons to manage your presets."
                                                                )}
                                                            </Flex>
                                                            <TooltipTrigger delay={0}>
                                                                <ActionButton
                                                                    isQuiet
                                                                    onPress={createParserFromOptions}
                                                                    isDisabled={isProcessing}
                                                                >
                                                                    <Add size="S" />
                                                                </ActionButton>
                                                                <Tooltip>Save current options as preset</Tooltip>
                                                            </TooltipTrigger>
                                                        </Flex>
                                                        <Divider size="S" />
                                                        
                                                        {/* Default Presets Section */}
                                                        {defaultPresets.length > 0 && (
                                                            <>
                                                                <Text UNSAFE_style={{ fontSize: "12px", fontWeight: "bold", opacity: 0.8 }}>
                                                                    Default Presets
                                                                </Text>
                                                                <Flex direction="row" gap={6} wrap="wrap" UNSAFE_style={{ width: "100%" }}>
                                                                    {defaultPresets.map((preset) => (
                                                                        <div
                                                                            key={preset.id}
                                                                            style={{
                                                                                cursor: "pointer",
                                                                                transition: "all 0.2s",
                                                                                backgroundColor: "transparent",
                                                                                padding: "5px 10px",
                                                                                height: "34px",
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                border: "1px solid rgba(124, 189, 250, 0.5)",
                                                                                borderRadius: "4px",
                                                                                minWidth: "0",
                                                                                flex: "1 1 auto",
                                                                                maxWidth: "100%",
                                                                            }}
                                                                        >
                                                                            <Flex direction="row" alignItems="center" justifyContent="space-between" width="100%" UNSAFE_style={{ minWidth: "0" }}>
                                                                                <TooltipTrigger delay={500}>
                                                                                    <ActionButton
                                                                                        isQuiet
                                                                                        onPress={() => applyPreset(preset)}
                                                                                        isDisabled={isProcessing}
                                                                                        UNSAFE_style={{ 
                                                                                            minWidth: "0",
                                                                                            padding: 0,
                                                                                            margin: 0,
                                                                                            flex: "1 1 auto",
                                                                                            justifyContent: "flex-start",
                                                                                            height: "100%",
                                                                                            backgroundColor: "transparent",
                                                                                            overflow: "hidden",
                                                                                        }}
                                                                                    >
                                                                                        <Text UNSAFE_style={{ 
                                                                                            fontSize: "14px", 
                                                                                            textAlign: "left", 
                                                                                            width: "100%",
                                                                                            overflow: "hidden",
                                                                                            textOverflow: "ellipsis",
                                                                                            whiteSpace: "nowrap",
                                                                                            color: "rgba(124, 189, 250, 1)",
                                                                                        }}>
                                                                                            {preset.name}
                                                                                        </Text>
                                                                                    </ActionButton>
                                                                                    <Tooltip>
                                                                                        <Text UNSAFE_style={{ fontSize: "12px", maxWidth: "400px" }}>
                                                                                            {formatPresetSettings(preset)}
                                                                                        </Text>
                                                                                    </Tooltip>
                                                                                </TooltipTrigger>
                                                                                <Flex direction="row" gap={4} alignItems="center" UNSAFE_style={{ flexShrink: 0 }}>
                                                                                    <DialogTrigger isDismissable>
                                                                                        <TooltipTrigger delay={0}>
                                                                                            <ActionButton
                                                                                                isQuiet
                                                                                                isDisabled={isProcessing}
                                                                                                UNSAFE_style={{ minWidth: "auto", padding: "2px" }}
                                                                                            >
                                                                                                <Edit size="XS" />
                                                                                            </ActionButton>
                                                                                            <Tooltip>Edit preset</Tooltip>
                                                                                        </TooltipTrigger>
                                                                                        {close => (
                                                                                            <Dialog UNSAFE_className="alertDialogBorder">
                                                                                                <Heading>Edit Preset</Heading>
                                                                                                <Divider />
                                                                                                <Content>
                                                                                                    <Flex direction="column" gap={12}>
                                                                                                        <TextField
                                                                                                            width={"100%"}
                                                                                                            label="Preset Name"
                                                                                                            defaultValue={preset.name}
                                                                                                            onChange={(value) => {
                                                                                                                renamePreset(preset.id, value, true);
                                                                                                            }}
                                                                                                        />
                                                                                                        <Flex direction="column" gap={8}>
                                                                                                            <Text UNSAFE_style={{ fontSize: "12px", fontWeight: "bold" }}>
                                                                                                                Preset Settings:
                                                                                                            </Text>
                                                                                                            <Text UNSAFE_style={{ fontSize: "12px", opacity: 0.8 }}>
                                                                                                                {formatPresetSettings(preset)}
                                                                                                            </Text>
                                                                                                        </Flex>
                                                                                                    </Flex>
                                                                                                </Content>
                                                                                            </Dialog>
                                                                                        )}
                                                                                    </DialogTrigger>
                                                                                    <DialogTrigger>
                                                                                        <TooltipTrigger delay={0}>
                                                                                            <ActionButton
                                                                                                isQuiet
                                                                                                isDisabled={isProcessing}
                                                                                            >
                                                                                                <Delete size="XS" />
                                                                                            </ActionButton>
                                                                                            <Tooltip>Delete preset</Tooltip>
                                                                                        </TooltipTrigger>
                                                                                        {(close) => (
                                                                                            <AlertDialog
                                                                                                UNSAFE_className="alertDialogBorder"
                                                                                                variant="destructive"
                                                                                                title="Delete Preset"
                                                                                                primaryActionLabel="Delete"
                                                                                                cancelLabel="Cancel"
                                                                                                onPrimaryAction={() => {
                                                                                                    deletePreset(preset.id, true);
                                                                                                    close();
                                                                                                }}
                                                                                            >
                                                                                                Are you sure you want to delete "{preset.name}"?
                                                                                            </AlertDialog>
                                                                                        )}
                                                                                    </DialogTrigger>
                                                                                </Flex>
                                                                            </Flex>
                                                                        </div>
                                                                    ))}
                                                                </Flex>
                                                            </>
                                                        )}
                                                        
                                                        {/* User Presets Section */}
                                                        {quickPresets.length > 0 && (
                                                            <>
                                                                <Text UNSAFE_style={{ fontSize: "12px", fontWeight: "bold", opacity: 0.8, marginTop: "8px" }}>
                                                                    Your Presets
                                                                </Text>
                                                            </>
                                                        )}
                                                        
                                                        {quickPresets.length > 0 ? (
                                                            <Flex direction="row" gap={6} wrap="wrap" UNSAFE_style={{ width: "100%" }}>
                                                                {quickPresets.map((preset) => (
                                                                        <div
                                                                            key={preset.id}
                                                                            style={{
                                                                                cursor: "pointer",
                                                                                transition: "all 0.2s",
                                                                                backgroundColor: "transparent",
                                                                                padding: "5px 10px",
                                                                                height: "34px",
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                border: "1px solid var(--spectrum-global-color-gray-400)",
                                                                                borderRadius: "4px",
                                                                                minWidth: "0",
                                                                                flex: "1 1 auto",
                                                                                maxWidth: "100%",
                                                                            }}
                                                                        >
                                                                        <Flex direction="row" alignItems="center" justifyContent="space-between" width="100%" UNSAFE_style={{ minWidth: "0" }}>
                                                                            <TooltipTrigger delay={500}>
                                                                                <ActionButton
                                                                                    isQuiet
                                                                                    onPress={() => applyPreset(preset)}
                                                                                    isDisabled={isProcessing}
                                                                                    UNSAFE_style={{ 
                                                                                        minWidth: "0",
                                                                                        padding: 0,
                                                                                        margin: 0,
                                                                                        flex: "1 1 auto",
                                                                                        justifyContent: "flex-start",
                                                                                        height: "100%",
                                                                                        backgroundColor: "transparent",
                                                                                        overflow: "hidden",
                                                                                    }}
                                                                                >
                                                                                    <Text UNSAFE_style={{ 
                                                                                        fontSize: "14px", 
                                                                                        textAlign: "left", 
                                                                                        width: "100%",
                                                                                        overflow: "hidden",
                                                                                        textOverflow: "ellipsis",
                                                                                        whiteSpace: "nowrap",
                                                                                    }}>
                                                                                        {preset.name}
                                                                                    </Text>
                                                                                </ActionButton>
                                                                                <Tooltip>
                                                                                    <Text UNSAFE_style={{ fontSize: "12px", maxWidth: "400px" }}>
                                                                                        {formatPresetSettings(preset)}
                                                                                    </Text>
                                                                                </Tooltip>
                                                                            </TooltipTrigger>
                                                                            <Flex direction="row" gap={4} alignItems="center" UNSAFE_style={{ flexShrink: 0 }}>
                                                                                <DialogTrigger isDismissable>
                                                                                    <TooltipTrigger delay={0}>
                                                                                        <ActionButton
                                                                                            isQuiet
                                                                                            isDisabled={isProcessing}
                                                                                            UNSAFE_style={{ minWidth: "auto", padding: "2px" }}
                                                                                        >
                                                                                            <Edit size="XS" />
                                                                                        </ActionButton>
                                                                                        <Tooltip>Edit preset</Tooltip>
                                                                                    </TooltipTrigger>
                                                                                    {close => (
                                                                                        <Dialog UNSAFE_className="alertDialogBorder">
                                                                                            <Heading>Edit Preset</Heading>
                                                                                            <Divider />
                                                                                            <Content>
                                                                                                <Flex direction="column" gap={12}>
                                                                                                    <TextField
                                                                                                        width={"100%"}
                                                                                                        label="Preset Name"
                                                                                                        defaultValue={preset.name}
                                                                                                        onChange={(value) => {
                                                                                                            renamePreset(preset.id, value);
                                                                                                        }}
                                                                                                    />
                                                                                                    <Flex direction="column" gap={8}>
                                                                                                        <Text UNSAFE_style={{ fontSize: "12px", fontWeight: "bold" }}>
                                                                                                            Preset Settings:
                                                                                                        </Text>
                                                                                                        <Text UNSAFE_style={{ fontSize: "12px", opacity: 0.8 }}>
                                                                                                            {formatPresetSettings(preset)}
                                                                                                        </Text>
                                                                                                    </Flex>
                                                                                                </Flex>
                                                                                            </Content>
                                                                                        </Dialog>
                                                                                    )}
                                                                                </DialogTrigger>
                                                                                <DialogTrigger>
                                                                                    <TooltipTrigger delay={0}>
                                                                                        <ActionButton
                                                                                            isQuiet
                                                                                            isDisabled={isProcessing}
                                                                                        >
                                                                                            <Delete size="XS" />
                                                                                        </ActionButton>
                                                                                        <Tooltip>Delete preset</Tooltip>
                                                                                    </TooltipTrigger>
                                                                                    {(close) => (
                                                                                        <AlertDialog
                                                                                            UNSAFE_className="alertDialogBorder"
                                                                                            variant="destructive"
                                                                                            title="Delete Preset"
                                                                                            primaryActionLabel="Delete"
                                                                                            cancelLabel="Cancel"
                                                                                            onPrimaryAction={() => {
                                                                                                deletePreset(preset.id);
                                                                                                close();
                                                                                            }}
                                                                                        >
                                                                                            Are you sure you want to delete "{preset.name}"?
                                                                                        </AlertDialog>
                                                                                    )}
                                                                                </DialogTrigger>
                                                                            </Flex>
                                                                        </Flex>
                                                                    </div>
                                                                ))}
                                                            </Flex>
                                                        ) : (
                                                            <Text UNSAFE_style={{ fontSize: "11px", fontStyle: "italic", opacity: 0.6 }}>
                                                                No presets saved. Click + to create one.
                                                            </Text>
                                                        )}
                                                    </Flex>
                                                </View>
                                            </Flex>
                                        </div>
                                    </Item>
                                    <Item key="Extra">
                                        <div style={{ width: '100%' }}>
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
                                                                    <Layers />
                                                                    <Text>Extract Depth Map</Text>
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
                                                                                        <Item key="og_distill_small_v2" textValue="OG Distilled Small V2 CUDA">
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
                                                                                        <Item key="og_distill_base_v2" textValue="OG Distilled Base V2 CUDA">
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
                                                                                        <Item key="og_distill_large_v2" textValue="OG Distilled Large V2 CUDA">
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
                                                                                        <Item key="og_small_v2" textValue="OG Depth Anything V2 Small CUDA">
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
                                                                                        <Item key="og_base_v2" textValue="OG Depth Anything V2 Base CUDA">
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
                                                                                        <Item key="og_large_v2" textValue="OG Depth Anything V2 Large CUDA">
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
                                                                                        <Item key="og_giant_v2" textValue="OG Depth Anything V2 Giant CUDA">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                OG Depth Anything V2 Giant Cuda
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original Paper implementation / Best model accuracy / VERY SLOW / Requires 3090/4000/5000
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="distill_small_v2" textValue="Distilled Small V2 CUDA">
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
                                                                                        <Item key="distill_base_v2" textValue="Distilled Base V2 CUDA">
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
                                                                                        <Item key="distill_large_v2" textValue="Distilled Large V2 CUDA">
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
                                                                                        <Item key="small_v2-tensorrt" textValue="Depth Anything V2 Small TensorRT">
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
                                                                                        <Item key="base_v2-tensorrt" textValue="Depth Anything V2 Base TensorRT">
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
                                                                                        <Item key="large_v2-tensorrt" textValue="Depth Anything V2 Large TensorRT">
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
                                                                                        <Item key="distill_small_v2-tensorrt" textValue="Distilled Small V2 TensorRT">
                                                                                            <Gauge4 />
                                                                                            <Text>
                                                                                                Distilled Small V2 TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Optimized for speed / TensorRT / 5-10x Faster / Mediocre Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="distill_base_v2-tensorrt" textValue="Distilled Base V2 TensorRT">
                                                                                            <Gauge3 />
                                                                                            <Text>
                                                                                                Distilled Base V2 TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Optimized for speed / TensorRT / 5-10x Faster / Mediocre Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="distill_large_v2-tensorrt" textValue="Distilled Large V2 TensorRT">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                Distilled Large V2 TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Optimized for speed / TensorRT / 5-10x Faster / Mediocre Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_small_v2-tensorrt" textValue="OG Depth Anything V2 Small TensorRT">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                OG Depth Anything V2 Small TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original Paper implementation / TensorRT / Better model accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_base_v2-tensorrt" textValue="OG Depth Anything V2 Base TensorRT">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                OG Depth Anything V2 Base TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original Paper implementation / TensorRT / Better model accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_large_v2-tensorrt" textValue="OG Depth Anything V2 Large TensorRT">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                OG Depth Anything V2 Large TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original Paper implementation / TensorRT / Better model accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_distill_small_v2-tensorrt" textValue="OG Distilled Small V2 TensorRT">
                                                                                            <Gauge3 />
                                                                                            <Text>
                                                                                                OG Distilled Small V2 TensorRT
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Original Paper implementation / TensorRT / Better model accuracy
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="og_distill_base_v2-tensorrt" textValue="OG Distilled Base V2 TensorRT">
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
                                                                                        <Item key="small_v2-directml" textValue="Depth Anything V2 Small DirectML">
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
                                                                                        <Item key="base_v2-directml" textValue="Depth Anything V2 Base DirectML">
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
                                                                                        <Item key="large_v2-directml" textValue="Depth Anything V2 Large DirectML">

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
                                                                                        <Item key="distill_small_v2-directml" textValue="Distilled Small V2 DirectML">
                                                                                            <Gauge2 />
                                                                                            <Text>
                                                                                                Distilled Small V2 DirectML
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Optimized for speed / DirectML / Mediocre Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="distill_base_v2-directml" textValue="Distilled Base V2 DirectML">
                                                                                            <Gauge1 />
                                                                                            <Text>
                                                                                                Distilled Base V2 DirectML
                                                                                            </Text>
                                                                                            <Text slot="description">
                                                                                                Optimized for speed / DirectML / Mediocre Quality
                                                                                            </Text>
                                                                                        </Item>
                                                                                        <Item key="distill_large_v2-directml" textValue="Distilled Large V2 DirectML">
                                                                                            <Gauge1 />
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
                                                                                                Cuda
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
                                                                                    <Item key="low" textValue="Low Quality">
                                                                                        <Gauge5 />
                                                                                        <Text>Low</Text>
                                                                                        <Text slot="description">
                                                                                            518x518
                                                                                        </Text>
                                                                                    </Item>
                                                                                    <Item key="medium" textValue="Medium Quality">
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
                                                                                    <Item key="high" textValue="High Quality">
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
                                                                                        {DEPTH_MODEL_EXAMPLES[
                                                                                            depthModel as DepthModelKey
                                                                                        ] ? (
                                                                                            <>
                                                                                                <Image
                                                                                                    src={
                                                                                                        DEPTH_MODEL_EXAMPLES[
                                                                                                        depthModel as DepthModelKey
                                                                                                        ] ||
                                                                                                        DEPTH_MODEL_EXAMPLES.default
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
                                                                                                            DEPTH_MODEL_EXAMPLES[
                                                                                                            depthModel as DepthModelKey
                                                                                                            ] ||
                                                                                                            DEPTH_MODEL_EXAMPLES.default
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
                                                                    <ImageProfile />
                                                                    <Text>Remove Background</Text>
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
                                                                                        <Item key="anime" textValue="Anime CUDA">
                                                                                            <Gauge3 />
                                                                                            <Text>
                                                                                                Anime
                                                                                                Cuda
                                                                                            </Text>
                                                                                        </Item>
                                                                                    </Section>
                                                                                    <Section title="NVIDIA RTX">
                                                                                        <Item key="anime-tensorrt" textValue="Anime TensorRT">
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
                                                                    <Cut />
                                                                    <Text>Auto Cut Clip</Text>
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













                                                <ToolboxTab
                                                    viewportZoom={viewportZoom}
                                                    setViewportZoom={setViewportZoom}
                                                    evalTS={evalTS}
                                                    createGeneralContextualHelp={createGeneralContextualHelp}
                                                    createPickerContextualHelp={createPickerContextualHelp}
                                                    toolboxLayerLength={toolboxLayerLength}
                                                    handleSelectionChange={handleSelectionChange}
                                                    setToolboxLayerLength={setToolboxLayerLength}
                                                    startAddAdjustmentLayerLogic={startAddAdjustmentLayerLogic}
                                                    startAddNullLayerLogic={startAddNullLayerLogic}
                                                    startAddSolidLayerLogic={startAddSolidLayerLogic}
                                                    sortLayerMethod={sortLayerMethod}
                                                    setSortLayerMethod={setSortLayerMethod}
                                                    startSortLayersLogic={startSortLayersLogic}
                                                    startSortLayersLogicWith={startSortLayersLogicWith}
                                                    execTakeScreenshot={execTakeScreenshot}
                                                    execPrecompose={execPrecompose}
                                                    execClearCache={execClearCache}
                                                    startDeduplicateLayerTimemapLogic={startDeduplicateLayerTimemapLogic}
                                                    startTrimToWorkAreaLogic={startTrimToWorkAreaLogic}
                                                    startFreezeOnCurrentFrameLogic={startFreezeOnCurrentFrameLogic}
                                                />
                                            </Flex>
                                        </div>
                                    </Item>
                                    <Item key="Logs">
                                        <div style={{ width: '100%' }}>
                                            {logTab(fullLogs, setFullLogs)}
                                        </div>
                                    </Item>
                                    <Item key="Settings">
                                        <SettingsTab
                                            startOfflineMode={startOfflineMode}
                                            OpenTASFolder={OpenTASFolder}
                                            handleReinstallTAS={handleReinstallTAS}
                                            createGeneralContextualHelp={createGeneralContextualHelp}
                                            enablePreview={enablePreview}
                                            setEnablePreview={setEnablePreview}
                                            disableProgressBar={disableProgressBar}
                                            setDisableProgressBar={setDisableProgressBar}
                                            deletePreRender={deletePreRender}
                                            setDeletePreRender={setDeletePreRender}
                                            aiPrecision={aiPrecision}
                                            setAiPrecision={setAiPrecision}
                                            encodeAlgorithm={encodeAlgorithm}
                                            setEncodeAlgorithm={setEncodeAlgorithm}
                                            bitDepth={bitDepth}
                                            setBitDepth={setBitDepth}
                                            preRenderAlgorithm={preRenderAlgorithm}
                                            setPreRenderAlgorithm={setPreRenderAlgorithm}
                                            uiScale={uiScale}
                                            setUIScale={setUIScale}
                                            handleSelectionChange={handleSelectionChange}
                                            createCheckboxContextualHelp={createCheckboxContextualHelp}
                                            createPickerContextualHelp={createPickerContextualHelp}
                                            onShortcutSettingsChange={setShortcutSettings}
                                        />
                                    </Item>
                                    <Item key="About">
                                        <div style={{ width: '100%' }}>
                                            {aboutTab(tasVersion)}
                                        </div>
                                    </Item>
                                    <Item key="Graph">
                                        <div style={{ width: '100%' }}>
                                            <KeyframeGraphEditor />
                                        </div>
                                    </Item>
                                </TabPanels>
                            </Flex>
                        </div>
                    </Tabs>

                    <ProgressDisplay
                        isDownloading={isDownloading}
                        isProcessing={isProcessing}
                        disableProgressBar={disableProgressBar}
                        downloadProgress={downloadProgress}
                        progressBarState={progressBarState}
                        downloadInfo={downloadInfo}
                        progressState={progressState}
                        formatETA={formatETA}
                        onCancel={cancelProcessing}
                    />
                </Flex>
            </View>
        </Provider>
    );
}

Main.displayName = 'Main';

export default Main;


