import React, { memo } from "react";
import { motion } from "motion/react";
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
    progressState: {
        currentFrame: number;
        totalFrames: number;
        processingFps: number;
        estimatedTimeRemaining: number;
        progressBarStatus: string;
        isProcessing: boolean;
    };
    formatETA: (seconds: number) => string;
    onCancel: () => void;
    slideAnimationVariants: any;
}

const ProgressDisplay = memo(({
    isDownloading,
    isProcessing,
    disableProgressBar,
    downloadProgress,
    progressBarState,
    progressState,
    formatETA,
    onCancel,
    slideAnimationVariants
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
        <motion.div
            variants={slideAnimationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ width: '100%' }}
        >
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
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <ProgressBar
                                value={downloadProgress}
                                width="100%"
                                maxValue={100}
                                size="L"
                                showValueLabel={true}
                                label={downloadProgress > 0 ? progressBarState : "Initializing..."}
                                isIndeterminate={downloadProgress === 0}
                            />
                        </motion.div>
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
                                        ? "Check logs for details"
                                        : "Please wait, this will take a moment..."}
                                </Text>
                            </Flex>
                        </motion.div>
                    </Flex>
                ) : (
                    <Flex direction="row" alignItems="center" gap="size-100">
                        <Flex direction="column" gap="size-100" flex="1">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
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
                            </motion.div>
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
                            </motion.div>
                        </Flex>
                        <TooltipTrigger delay={0}>
                            <ActionButton
                                marginStart={5}
                                isQuiet
                                onPress={onCancel}
                                aria-label="Cancel"
                            >
                                <Cancel />
                            </ActionButton>
                            <Tooltip>Cancel Process</Tooltip>
                        </TooltipTrigger>
                    </Flex>
                )}
            </View>
        </motion.div>
    );
});

ProgressDisplay.displayName = 'ProgressDisplay';

export default ProgressDisplay;