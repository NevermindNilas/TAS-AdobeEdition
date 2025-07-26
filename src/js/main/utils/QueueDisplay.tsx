import React from "react";
import {
    View,
    Flex,
    Text,
    ActionButton,
    ProgressBar,
    Divider,
    Heading,
    Badge,
    Tooltip,
    TooltipTrigger,
    StatusLight
} from "@adobe/react-spectrum";
import { motion, AnimatePresence } from "motion/react";

// Icons
import Cancel from "@spectrum-icons/workflow/Cancel";
import Delete from "@spectrum-icons/workflow/Delete";
import Play from "@spectrum-icons/workflow/Play";
import Stop from "@spectrum-icons/workflow/Stop";
import Clear from "@spectrum-icons/workflow/Close";
import Add from "@spectrum-icons/workflow/Add";
import Layers from "@spectrum-icons/workflow/Layers";
import Remove from "@spectrum-icons/workflow/Remove";

import { QueueItem } from "./QueueManager";

interface QueueDisplayProps {
    queue: QueueItem[];
    isProcessing: boolean;
    currentItem: QueueItem | null;
    onAddLayers: () => void;
    onStartQueue: () => void;
    onCancelProcessing: () => void;
    onClearQueue: () => void;
    onRemoveItem: (itemId: string) => void;
}

const QueueDisplay: React.FC<QueueDisplayProps> = ({
    queue,
    isProcessing,
    currentItem,
    onAddLayers,
    onStartQueue,
    onCancelProcessing,
    onClearQueue,
    onRemoveItem
}) => {
    const getStatusColor = (status: QueueItem['status']) => {
        switch (status) {
            case 'pending': return 'neutral';
            case 'pre-rendering': return 'info';
            case 'processing': return 'info';
            case 'completed': return 'positive';
            case 'failed': return 'negative';
            default: return 'neutral';
        }
    };

    const getStatusText = (status: QueueItem['status']) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'pre-rendering': return 'Pre-rendering';
            case 'processing': return 'Processing';
            case 'completed': return 'Completed';
            case 'failed': return 'Failed';
            default: return 'Unknown';
        }
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
        } else {
            return "Almost done!";
        }
    };

    const pendingCount = queue.filter(item => item.status === 'pending').length;
    const preRenderingCount = queue.filter(item => item.status === 'pre-rendering').length;
    const processingCount = queue.filter(item => item.status === 'processing').length;
    const completedCount = queue.filter(item => item.status === 'completed').length;
    const failedCount = queue.filter(item => item.status === 'failed').length;

    return (
        <View
            borderWidth="thin"
            borderColor="dark"
            borderRadius="medium"
            padding="size-150"
        >
            <Flex direction="column" gap={8} width="100%">
                <Flex direction="row" gap={8} alignItems="center" justifyContent="space-between">
                    <Flex direction="row" gap={8} alignItems="center">
                        <Layers size="S" />
                        <Heading level={4} margin={0}>
                            Processing Queue ( EARLY TESTING! )
                        </Heading>
                        {isProcessing && (
                            <StatusLight variant="positive">Processing</StatusLight>
                        )}
                    </Flex>
                    <Flex direction="row" gap={6}>
                        {pendingCount > 0 && (
                            <Badge variant="neutral">
                                {pendingCount} Pending
                            </Badge>
                        )}
                        {preRenderingCount > 0 && (
                            <Badge variant="info">
                                {preRenderingCount} Pre-rendering
                            </Badge>
                        )}
                        {processingCount > 0 && (
                            <Badge variant="info">
                                {processingCount} Processing
                            </Badge>
                        )}
                        {completedCount > 0 && (
                            <Badge variant="positive">
                                {completedCount} Done
                            </Badge>
                        )}
                        {failedCount > 0 && (
                            <Badge variant="negative">
                                {failedCount} Failed
                            </Badge>
                        )}
                        {queue.length > 0 && (
                            <Badge variant="neutral">
                                {queue.length} Total
                            </Badge>
                        )}
                    </Flex>
                </Flex>

                <Divider size="S" />

                <Flex direction="row" gap={8} wrap justifyContent="space-between">
                    <Flex direction="row" gap={8}>
                        <TooltipTrigger delay={0}>
                            <ActionButton
                                onPress={onAddLayers}
                                isDisabled={isProcessing}
                            >
                                <Add />
                                <Text>Add Layers</Text>
                            </ActionButton>
                            <Tooltip>Add currently selected layers to the processing queue</Tooltip>
                        </TooltipTrigger>

                        <TooltipTrigger delay={0}>
                            <ActionButton
                                onPress={onStartQueue}
                                isDisabled={isProcessing || queue.length === 0}
                            >
                                <Play />
                                <Text>Start Queue</Text>
                            </ActionButton>
                            <Tooltip>Start processing all layers in the queue sequentially</Tooltip>
                        </TooltipTrigger>
                    </Flex>

                    <Flex direction="row" gap={8}>
                        {isProcessing && (
                            <TooltipTrigger delay={0}>
                                <ActionButton
                                    onPress={onCancelProcessing}
                                >
                                    <Stop />
                                    <Text>Cancel</Text>
                                </ActionButton>
                                <Tooltip>Cancel the current processing operation</Tooltip>
                            </TooltipTrigger>
                        )}

                        <TooltipTrigger delay={0}>
                            <ActionButton
                                onPress={onClearQueue}
                                isDisabled={isProcessing}
                                isQuiet
                            >
                                <Clear />
                                <Text>Clear</Text>
                            </ActionButton>
                            <Tooltip>Remove all items from the queue</Tooltip>
                        </TooltipTrigger>
                    </Flex>
                </Flex>

                {queue.length > 0 && (
                    <>
                        <Divider size="S" />
                        <View
                            backgroundColor="gray-50"
                            borderRadius="medium"
                            padding="size-100"
                            maxHeight="size-2400"
                            overflow="auto"
                            borderWidth="thin"
                            borderColor="gray-300"
                        >
                            <Flex direction="column" gap={4}>
                                <AnimatePresence>
                                    {queue.map((item, index) => {
                                        const isCurrentlyProcessing = item.status === 'processing' || item.status === 'pre-rendering';
                                        const isCompleted = item.status === 'completed';
                                        const isFailed = item.status === 'failed';
                                        const isPreRendering = item.status === 'pre-rendering';
                                        
                                        // Calculate progress text
                                        const progressText = React.useMemo(() => {
                                            console.log("Progress text calculation for", item.layerName, ":", {
                                                isCurrentlyProcessing,
                                                currentFrame: item.currentFrame,
                                                totalFrames: item.totalFrames,
                                                processingFps: item.processingFps,
                                                estimatedTimeRemaining: item.estimatedTimeRemaining,
                                                status: item.status
                                            });
                                            
                                            if (!isCurrentlyProcessing) return "";
                                            
                                            const parts: string[] = [];
                                            
                                            // Add frames info
                                            if (item.currentFrame > 0 && item.totalFrames > 0) {
                                                parts.push(`${item.currentFrame.toLocaleString()} / ${item.totalFrames.toLocaleString()} frames`);
                                            }
                                            
                                            // Add ETA
                                            if (item.estimatedTimeRemaining > 0) {
                                                parts.push(formatETA(item.estimatedTimeRemaining));
                                            }
                                            
                                            // Add FPS
                                            if (item.processingFps > 0) {
                                                parts.push(`${item.processingFps.toFixed(1)}fps`);
                                            }
                                            
                                            const result = parts.join(" • ");
                                            console.log("Final progress text:", result);
                                            return result;
                                        }, [item, isCurrentlyProcessing]);
                                        
                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <View
                                                    backgroundColor={
                                                        isCurrentlyProcessing ? 'blue-400' : 
                                                        isCompleted ? 'green-400' :
                                                        isFailed ? 'red-400' : 'gray-200'
                                                    }
                                                    borderRadius="medium"
                                                    padding="size-100"
                                                    borderWidth={isCurrentlyProcessing ? 'thick' : 'thin'}
                                                    borderColor={
                                                        isCurrentlyProcessing ? 'blue-600' : 
                                                        isCompleted ? 'green-600' :
                                                        isFailed ? 'red-600' : 'gray-400'
                                                    }
                                                >
                                                    <Flex direction="row" alignItems="center" justifyContent="space-between">
                                                        <Flex direction="row" alignItems="center" gap={8} flex={1}>
                                                            <View
                                                                width="size-150"
                                                                height="size-150"
                                                                borderRadius="medium"
                                                                backgroundColor={
                                                                    isCurrentlyProcessing ? 'blue-600' : 
                                                                    isCompleted ? 'green-600' :
                                                                    isFailed ? 'red-600' : 'gray-500'
                                                                }
                                                                UNSAFE_style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: 'white',
                                                                    fontSize: '10px',
                                                                    fontWeight: 'bold',
                                                                    minWidth: '20px'
                                                                }}
                                                            >
                                                                {index + 1}
                                                            </View>
                                                            
                                                            <Flex direction="column" gap={2} flex={1}>
                                                                <Flex direction="row" alignItems="center" justifyContent="space-between">
                                                                    <Text UNSAFE_style={{ fontWeight: '600', fontSize: '13px' }}>
                                                                        {item.layerName}
                                                                    </Text>
                                                                    <Badge variant={getStatusColor(item.status)}>
                                                                        {getStatusText(item.status)}
                                                                    </Badge>
                                                                </Flex>
                                                                
                                                                {isCurrentlyProcessing && (
                                                                    <Flex direction="column" gap={2}>
                                                                        <ProgressBar
                                                                            label={item.progressBarStatus || (isPreRendering ? "Pre-rendering..." : "Processing...")}
                                                                            value={item.progress || 0}
                                                                            maxValue={100}
                                                                            size="S"
                                                                            isIndeterminate={!item.progress || item.progress === 0}
                                                                        />
                                                                        {(progressText || isCurrentlyProcessing) && (
                                                                            <Text UNSAFE_style={{ fontSize: '10px', opacity: 0.8 }}>
                                                                                {progressText || `${item.progressBarStatus || 'Processing...'}`}
                                                                            </Text>
                                                                        )}
                                                                    </Flex>
                                                                )}
                                                                
                                                                {item.error && (
                                                                    <View
                                                                        backgroundColor="red-400"
                                                                        borderRadius="small"
                                                                        padding="size-75"
                                                                    >
                                                                        <Text UNSAFE_style={{ fontSize: '10px', color: '#d32f2f' }}>
                                                                            ⚠️ {item.error}
                                                                        </Text>
                                                                    </View>
                                                                )}
                                                            </Flex>
                                                        </Flex>

                                                        {!isCurrentlyProcessing && (
                                                            <TooltipTrigger delay={0}>
                                                                <ActionButton
                                                                    onPress={() => onRemoveItem(item.id)}
                                                                    isQuiet
                                                                    isDisabled={isProcessing}
                                                                    UNSAFE_style={{ 
                                                                        opacity: 0.7,
                                                                        minWidth: '24px',
                                                                        minHeight: '24px'
                                                                    }}
                                                                >
                                                                    <Remove UNSAFE_style={{ color: 'white' }} />
                                                                </ActionButton>
                                                                <Tooltip>Remove from queue</Tooltip>
                                                            </TooltipTrigger>
                                                        )}
                                                    </Flex>
                                                </View>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </Flex>
                        </View>
                    </>
                )}

                {queue.length === 0 && (
                    <View 
                        padding="size-300"
                        backgroundColor="gray-50"
                        borderRadius="medium"
                        borderWidth="thin"
                        borderColor="gray-300"
                    >
                        <Flex direction="column" alignItems="center" gap={8}>
                            <Layers size="L" UNSAFE_style={{ opacity: 0.4 }} />
                            <Text UNSAFE_style={{ textAlign: 'center', opacity: 0.7 }}>
                                No layers in queue
                            </Text>
                            <Text UNSAFE_style={{ textAlign: 'center', fontSize: '12px', opacity: 0.6 }}>
                                Select layers in After Effects and click "Add Layers" to get started
                            </Text>
                        </Flex>
                    </View>
                )}
            </Flex>
        </View>
    );
};

export default QueueDisplay;