import React, { memo } from "react";
import { 
    View, 
    Flex, 
    ProgressBar, 
    Text, 
    ActionButton, 
    Tooltip, 
    TooltipTrigger 
} from "@adobe/react-spectrum";
import Cancel from "@spectrum-icons/workflow/Cancel";

interface ProgressDisplayProps {
    isDownloading: boolean;
    isProcessing: boolean;
    disableProgressBar: boolean;
    downloadProgress: number;
    progressBarState: string;
    downloadInfo?: {
        speed?: string;
        size?: string;
        eta?: number;
        phase?: string;
    };
    progressState: {
        currentFrame: number;
        totalFrames: number;
        processingFps: number;
        estimatedTimeRemaining: number;
        progressBarStatus: string;
        isProcessing: boolean;
    };
    formatETA: (seconds: number) => string;
    onCancel?: () => void;
}

const ProgressDisplay = memo(({
    isDownloading,
    isProcessing,
    disableProgressBar,
    downloadProgress,
    progressBarState,
    downloadInfo = {},
    progressState,
    formatETA,
    onCancel
}: ProgressDisplayProps) => {
    if (!isDownloading && (!isProcessing || disableProgressBar)) {
        return null;
    }

    const progressText = React.useMemo(() => {
        if (!isProcessing) return "";
        
        const frames = progressState.currentFrame > 0 && progressState.totalFrames > 0
            ? `${progressState.currentFrame.toLocaleString()} / ${progressState.totalFrames.toLocaleString()} frames`
            : "0/0 frames";
        const eta = progressState.estimatedTimeRemaining > 0
            ? formatETA(progressState.estimatedTimeRemaining)
            : "0s remaining";
        const fps = progressState.processingFps > 0
            ? progressState.processingFps.toFixed(1)
            : "0.0";
        return `${frames} • ${eta} • ${fps}fps`;
    }, [progressState.currentFrame, progressState.totalFrames, progressState.estimatedTimeRemaining, progressState.processingFps, formatETA, isProcessing]);

    return (
        <div style={{ width: '100%' }}>
            <View
                borderWidth="thin"
                borderColor="dark"
                borderRadius="medium"
                padding="size-200"
                marginTop={8}
                marginStart={2}
            >
                {isDownloading ? (
                    <Flex direction="column" gap="size-100" marginTop={-8}>
                        <div>
                            <ProgressBar
                                value={downloadProgress}
                                width="100%"
                                maxValue={100}
                                size="L"
                                showValueLabel={true}
                                label={downloadProgress > 0 ? progressBarState : "Initializing..."}
                                isIndeterminate={downloadProgress === 0}
                            />
                        </div>
                        <div>
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
                                        fontWeight: "medium",
                                    }}
                                >
                                    {(() => {
                                        const parts: string[] = [];
                                        
                                        if (downloadInfo.size && downloadProgress > 0 && downloadProgress < 100) {
                                            parts.push(downloadInfo.size);
                                        }
                                        
                                        if (downloadInfo.speed && downloadProgress > 0 && downloadProgress < 100) {
                                            parts.push(downloadInfo.speed);
                                        }
                                        
                                        if (downloadInfo.eta && downloadInfo.eta > 0 && downloadProgress > 0 && downloadProgress < 100) {
                                            parts.push(formatETA(downloadInfo.eta));
                                        }
                                        
                                        return parts.length > 0 ? parts.join(' • ') : 
                                            downloadProgress === 100 ? "Processing..." : "Initializing...";
                                    })()}
                                </Text>
                                <Text
                                    UNSAFE_style={{
                                        fontSize: "11px",
                                        opacity: 0.7,
                                    }}
                                >
                                    Check Logs tab for details
                                </Text>
                            </Flex>
                        </div>
                    </Flex>
                ) : (
                    <Flex direction="row" alignItems="center" gap="size-100">
                        <Flex direction="column" gap="size-100" flex="1">
                            <div>
                                <Flex direction="row" alignItems="center">
                                    <View flex="1">
                                        <ProgressBar
                                            value={(progressState.currentFrame / progressState.totalFrames) * 100}
                                            minValue={0}
                                            maxValue={100}
                                            size="L"
                                            width="100%"
                                            showValueLabel={true}
                                            label={
                                                progressState.progressBarStatus
                                                    ? `Status: ${progressState.progressBarStatus}`
                                                    : "Processing..."
                                            }
                                        />
                                    </View>
                                </Flex>
                            </div>
                            <div>
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
                                        {progressText}
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
                            </div>
                        </Flex>
                        <TooltipTrigger delay={0}>
                            <ActionButton
                                marginStart={5}
                                isQuiet
                                onPress={() => {
                                    try {
                                        onCancel?.();
                                    } catch (error) {
                                        console.error("Cancel button error:", error);
                                    }
                                }}
                                aria-label="Cancel"
                            >
                                <Cancel />
                            </ActionButton>
                            <Tooltip>Cancel Process</Tooltip>
                        </TooltipTrigger>
                    </Flex>
                )}
            </View>
        </div>
    );
});

ProgressDisplay.displayName = 'ProgressDisplay';

export default ProgressDisplay;