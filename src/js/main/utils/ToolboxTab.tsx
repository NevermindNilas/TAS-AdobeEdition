
import {
    Flex,
    View,
    Divider,
    Slider,
    Heading,
    Picker,
    Item,
    ActionButton,
    Text
} from "@adobe/react-spectrum";
import Gauge2 from "@spectrum-icons/workflow/Gauge2";
import Layers from "@spectrum-icons/workflow/Layers";
import SortOrderUp from "@spectrum-icons/workflow/SortOrderUp";
import SortOrderDown from "@spectrum-icons/workflow/SortOrderDown";
import Wrench from "@spectrum-icons/workflow/Wrench";
import Download from "@spectrum-icons/workflow/Download";
import Camera from "@spectrum-icons/workflow/Camera";
import Box from "@spectrum-icons/workflow/Box";
import Delete from "@spectrum-icons/workflow/Delete";
import Crop from "@spectrum-icons/workflow/Crop";
import Pause from "@spectrum-icons/workflow/Pause";
import Image from "@spectrum-icons/workflow/Image";
import Anchor from "@spectrum-icons/workflow/Anchor";
import Remove from "@spectrum-icons/workflow/Remove";


import type { Scripts } from "@esTypes/index";
type ArgTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;
type ReturnType<F extends Function> = F extends (...args: infer A) => infer B ? B : never;

type ToolboxTabProps = {
    viewportZoom: number;
    setViewportZoom: (val: number) => void;
    evalTS: <Key extends string & keyof Scripts, Func extends Function & Scripts[Key]>(functionName: Key, ...args: ArgTypes<Func>) => Promise<ReturnType<Func>>;
    createGeneralContextualHelp: (title: string, content: React.ReactNode) => React.ReactNode;
    createPickerContextualHelp: (title: string, content: string) => React.ReactNode;
    toolboxLayerLength: string | null;
    handleSelectionChange: (setter: React.Dispatch<React.SetStateAction<string | null>>) => (key: string | null) => void;
    setToolboxLayerLength: React.Dispatch<React.SetStateAction<string | null>>;
    startAddAdjustmentLayerLogic: () => void;
    startAddNullLayerLogic: () => void;
    startAddSolidLayerLogic: () => void;
    sortLayerMethod: string | null;
    setSortLayerMethod: React.Dispatch<React.SetStateAction<string | null>>;
    startSortLayersLogic: () => void;
    startSortLayersLogicWith: (order: 'topDown' | 'bottomUp') => void;
    execTakeScreenshot: () => void;
    execPrecompose: () => void;
    execClearCache: () => void;
    startDeduplicateLayerTimemapLogic: () => void;
    startTrimToWorkAreaLogic: () => void;
    startFreezeOnCurrentFrameLogic: () => void;
};

const ToolboxTab: React.FC<ToolboxTabProps> = ({
    viewportZoom,
    setViewportZoom,
    evalTS,
    createGeneralContextualHelp,
    createPickerContextualHelp,
    toolboxLayerLength,
    handleSelectionChange,
    setToolboxLayerLength,
    startAddAdjustmentLayerLogic,
    startAddNullLayerLogic,
    startAddSolidLayerLogic,
    sortLayerMethod,
    setSortLayerMethod,
    startSortLayersLogic,
    startSortLayersLogicWith,
    execTakeScreenshot,
    execPrecompose,
    execClearCache,
    startDeduplicateLayerTimemapLogic,
    startTrimToWorkAreaLogic,
    startFreezeOnCurrentFrameLogic,
}) => {
    return (
        <div style={{ width: '100%' }}>
            <Flex
                direction="column"
                gap={10}
                width="100%"
                justifyContent="space-between"
                marginTop={8}
            >
                {/* Utility Tools (merged Work Area Zoom + Utility Tools) */}
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
                                        Additional tools for After Effects workflow:
                                    </p>
                                    <ul>
                                        <li>
                                            <strong>Purge Cache:</strong> Clear memory and disk cache to free resources
                                        </li>
                                        <li>
                                            <strong>Take Screenshot:</strong> Capture the current composition view
                                        </li>
                                        <li>
                                            <strong>PreCompose:</strong> Package selected layers into a nested composition
                                        </li>
                                        <li>
                                            <strong>Remove Dead Frames:</strong> Remove dead/duplicate frames using time remapping
                                        </li>
                                    </ul>
                                    <p>
                                        Adjust the zoom level of the After Effects viewport. This does not affect the actual video output, only the editor's view. <strong>Note:</strong> Only Tested with After Effects 2025!
                                    </p>
                                </Text>
                            )}
                        </Flex>
                        {/* Divider between zoom and utility controls */}
                        <Divider size="S" />
                        {/* Work Area Zoom Controls (no header/contextual help) */}
                        <Slider
                            label="Viewport Zoom"
                            minValue={0.01}
                            maxValue={3}
                            step={0.01}
                            isFilled
                            value={viewportZoom}
                            formatOptions={{ style: 'percent' }}
                            onChange={async (val) => {
                                setViewportZoom(val);
                                await evalTS("setViewportZoom", val);
                            }}
                            width="100%"
                        />
                        {/* Divider between zoom and utility buttons */}
                        <Divider size="S" />
                        {/* Utility Tool Controls */}
                        <Flex direction="column" gap={8}>
                            <Flex direction={"row"} gap={8} width={"100%"}>
                                <ActionButton
                                    onPress={execTakeScreenshot}
                                    width="100%"
                                >
                                    <Camera />
                                    <Text>Take Screenshot</Text>
                                </ActionButton>
                                <ActionButton
                                    onPress={execPrecompose}
                                    width="100%"
                                >
                                    <Box />
                                    <Text>PreCompose</Text>
                                </ActionButton>
                            </Flex>
                            <Flex direction={"row"} gap={8} width={"100%"}>
                                <ActionButton
                                    onPress={execClearCache}
                                    width="100%"
                                >
                                    <Delete />
                                    <Text>Purge Cache</Text>
                                </ActionButton>
                                <ActionButton
                                    onPress={startDeduplicateLayerTimemapLogic}
                                    width="100%"
                                >
                                    <Remove />
                                    <Text>Remove Dead Frames</Text>
                                </ActionButton>
                            </Flex>
                            <Flex direction={"row"} gap={8} width={"100%"}>
                                <ActionButton
                                    onPress={startTrimToWorkAreaLogic}
                                    width="100%"
                                >
                                    <Crop />
                                    <Text>Trim to Work Area</Text>
                                </ActionButton>
                                <ActionButton
                                    onPress={startFreezeOnCurrentFrameLogic}
                                    width="100%"
                                >
                                    <Pause />
                                    <Text>Freeze on Current Frame</Text>
                                </ActionButton>
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
                            <Layers size="S" />
                            <Heading level={4} margin={0}>
                                Layer Tools
                            </Heading>
                            {createGeneralContextualHelp(
                                "Layer Tools",
                                <Text>
                                    <p>
                                        Create and sort layers in After Effects:
                                    </p>
                                    <ul>
                                        <li>
                                            <strong>Adjustment Layer:</strong> Non-rendering layer that applies effects to layers below it
                                        </li>
                                        <li>
                                            <strong>Solid Layer:</strong> Colored background layer for masks or effects
                                        </li>
                                        <li>
                                            <strong>Null Layer:</strong> Invisible layer for parenting or expressions
                                        </li>
                                    </ul>
                                    <p>
                                        Select a layer first, then choose the duration and layer type. You can also sort selected layers sequentially.
                                    </p>
                                </Text>
                            )}
                        </Flex>
                        <Divider size="S" />
                        {/* Layer Creation Controls */}
                        <Flex direction="column" gap={8}>
                            <Picker
                                label="Layer Lenght"
                                width="100%"
                                selectedKey={toolboxLayerLength}
                                onSelectionChange={handleSelectionChange(setToolboxLayerLength) as (key: import("@react-types/shared").Key | null) => void}
                                contextualHelp={createPickerContextualHelp(
                                    "Layer Duration",
                                    "Choose how long the created layer should be."
                                )}
                            >
                                <Item key="1">1 Frame</Item>
                                <Item key="2">2 Frames</Item>
                                <Item key="3">3 Frames</Item>
                                <Item key="4">4 Frames</Item>
                                <Item key="entire">Entire Selected Layer</Item>
                            </Picker>
                            <Flex direction="row" gap={8}>
                                <ActionButton
                                    onPress={startAddAdjustmentLayerLogic}
                                    width="100%"
                                >
                                    <Layers />
                                    <Text>Adjustment</Text>
                                </ActionButton>
                                <ActionButton
                                    onPress={() => { void startAddNullLayerLogic(); }}
                                    width="100%"
                                >
                                    <Anchor />
                                    <Text>Null</Text>
                                </ActionButton>
                                <ActionButton
                                    onPress={() => { void startAddSolidLayerLogic(); }}
                                    width="100%"
                                >
                                    <Image />
                                    <Text>Solid</Text>
                                </ActionButton>
                            </Flex>
                        </Flex>
                        <Divider size="S" />
                        <Flex direction="row" gap={8}>
                            <ActionButton
                                onPress={() => { void startSortLayersLogicWith('topDown'); }}
                                width="100%"
                            >
                                <SortOrderDown />
                                <Text>Sort Top to Bottom</Text>
                            </ActionButton>
                            <ActionButton
                                onPress={() => { void startSortLayersLogicWith('bottomUp'); }}
                                width="100%"
                            >
                                <SortOrderUp />
                                <Text>Sort Bottom to Top</Text>
                            </ActionButton>
                        </Flex>
                    </Flex>
                </View>
            </Flex>
        </div>
    );
};

export default ToolboxTab;
