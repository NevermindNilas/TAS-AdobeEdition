import {
    Flex,
    View,
    ActionButton,
    Text,
    Heading,
    ProgressBar,
    Well,
    Badge,
    TooltipTrigger,
    Tooltip,
    StatusLight,
} from "@adobe/react-spectrum";
import Play from "@spectrum-icons/workflow/Play";
import Pause from "@spectrum-icons/workflow/Pause";
import Delete from "@spectrum-icons/workflow/Delete";
import RemoveCircle from "@spectrum-icons/workflow/RemoveCircle";

export const QueueItem = ({ item, index, onRemove }) => {
    const getStatusColor = status => {
        switch (status) {
            case "completed":
                return "positive";
            case "processing":
                return "notice";
            case "queued":
                return "neutral";
            case "failed":
                return "negative";
            default:
                return "neutral";
        }
    };

    return (
        <Well width="100%" marginY="size-100">
            <Flex direction="row" alignItems="center" justifyContent="space-between">
                <Flex direction="column" gap="size-50" flex={1}>
                    <Flex direction="row" alignItems="center" gap="size-100">
                        <Badge variant="info">{index + 1}</Badge>
                        <Heading level={4} margin={0}>
                            {item.name}
                        </Heading>
                        <StatusLight variant={getStatusColor(item.status)}>
                            {item.status}
                        </StatusLight>
                    </Flex>
                    <Text>{item.description}</Text>
                    {item.status === "processing" && item.progress > 0 && (
                        <ProgressBar value={item.progress} size="S" />
                    )}
                </Flex>
                <Flex direction="row" gap="size-100" alignItems="center">
                    <TooltipTrigger delay={0}>
                        <ActionButton
                            isQuiet
                            isDisabled={item.status === "processing"}
                            onPress={() => onRemove(index)}
                        >
                            <Delete />
                        </ActionButton>
                        <Tooltip>Remove</Tooltip>
                    </TooltipTrigger>
                </Flex>
            </Flex>
        </Well>
    );
};

export const queueTab = props => {
    const { queue, isProcessingQueue, startQueue, pauseQueue, clearQueue, removeFromQueue } = props;

    return (
        <Flex direction="column" gap="size-200" width="100%">
            <Flex direction="row" gap="size-100" alignItems="center">
                <Heading level={3}>Process Queue</Heading>
                <Badge variant="info">{queue.length} items</Badge>
                <View flex />
                <ActionButton
                    isDisabled={queue.length === 0 || isProcessingQueue}
                    onPress={startQueue}
                >
                    <Play />
                    <Text>Start Queue</Text>
                </ActionButton>
                <ActionButton isDisabled={!isProcessingQueue} onPress={pauseQueue}>
                    <Pause />
                    <Text>Pause</Text>
                </ActionButton>
                <ActionButton isDisabled={queue.length === 0} onPress={clearQueue}>
                    <RemoveCircle />
                    <Text>Clear All</Text>
                </ActionButton>
            </Flex>

            <View height="size-3000" overflow="auto">
                {queue.length === 0 ? (
                    <Well>
                        <Text>
                            Queue is empty. Add processes to the queue by clicking "Add to Queue"
                            after configuring a process.
                        </Text>
                    </Well>
                ) : (
                    queue.map((item, index) => (
                        <QueueItem
                            key={item.id}
                            item={item}
                            index={index}
                            onRemove={removeFromQueue}
                        />
                    ))
                )}
            </View>
        </Flex>
    );
};
