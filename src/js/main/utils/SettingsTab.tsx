import React from "react";
import {
    ActionButton,
    AlertDialog,
    Checkbox,
    Content,
    DialogTrigger,
    Divider,
    Flex,
    Heading,
    Item,
    Picker,
    Section,
    Text,
    View,
} from "@adobe/react-spectrum";
import { Key } from "@react-types/shared";

import Settings from "@spectrum-icons/workflow/Settings";
import Download from "@spectrum-icons/workflow/Download";
import Gauge1 from "@spectrum-icons/workflow/Gauge1";
import Gauge2 from "@spectrum-icons/workflow/Gauge2";
import Gauge3 from "@spectrum-icons/workflow/Gauge3";
import Gauge4 from "@spectrum-icons/workflow/Gauge4";
import Gauge5 from "@spectrum-icons/workflow/Gauge5";

import ShortcutsSettingsPanel from "./ShortcutsSettingsPanel";
import type { ShortcutSettings } from "./shortcutSettings";

interface SettingsTabProps {
    startOfflineMode: () => void;
    OpenTASFolder: () => void;
    handleReinstallTAS: () => void;
    createGeneralContextualHelp: (title: string, content: React.ReactNode) => React.ReactNode;

    enablePreview: boolean;
    setEnablePreview: (val: boolean) => void;
    disableProgressBar: boolean;
    setDisableProgressBar: (val: boolean) => void;
    deletePreRender: boolean;
    setDeletePreRender: (val: boolean) => void;
    aiPrecision: string | null;
    setAiPrecision: React.Dispatch<React.SetStateAction<string | null>>;
    encodeAlgorithm: string | null;
    setEncodeAlgorithm: React.Dispatch<React.SetStateAction<string | null>>;
    bitDepth: string | null;
    setBitDepth: React.Dispatch<React.SetStateAction<string | null>>;
    preRenderAlgorithm: string | null;
    setPreRenderAlgorithm: React.Dispatch<React.SetStateAction<string | null>>;
    uiScale: string | null;
    setUIScale: React.Dispatch<React.SetStateAction<string | null>>;
    handleSelectionChange: (setter: React.Dispatch<React.SetStateAction<string | null>>) => (key: Key | null) => void;
    createCheckboxContextualHelp: (title: string, content: React.ReactNode) => React.ReactNode;
    createPickerContextualHelp: (title: string, content: React.ReactNode) => React.ReactNode;

    onShortcutSettingsChange: (settings: ShortcutSettings) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
    startOfflineMode,
    OpenTASFolder,
    handleReinstallTAS,
    createGeneralContextualHelp,
    enablePreview,
    setEnablePreview,
    disableProgressBar,
    setDisableProgressBar,
    deletePreRender,
    setDeletePreRender,
    aiPrecision,
    setAiPrecision,
    encodeAlgorithm,
    setEncodeAlgorithm,
    bitDepth,
    setBitDepth,
    preRenderAlgorithm,
    setPreRenderAlgorithm,
    uiScale,
    setUIScale,
    handleSelectionChange,
    createCheckboxContextualHelp,
    createPickerContextualHelp,
    onShortcutSettingsChange,
}) => {
    return (
        <div style={{ width: '100%' }}>
            <Flex
                direction="column"
                width="100%"
                gap={10}
                justifyContent="space-between"
                marginTop={8}
            >
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
                                            offline use (~8GB)
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
                                        <li>
                                            <strong>Reinstall TAS:</strong>
                                            Completely remove and reinstall
                                            TAS backend (useful for fixing
                                            corrupted installations)
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
                            <DialogTrigger>
                                <ActionButton width="100%">
                                    Reinstall TAS
                                </ActionButton>
                                {(close) => (
                                    <AlertDialog
                                        variant="warning"
                                        title="Confirm Reinstallation"
                                        primaryActionLabel="Reinstall"
                                        cancelLabel="Cancel"
                                        UNSAFE_className="alertDialogBorder"
                                        onPrimaryAction={() => {
                                            close();
                                            setTimeout(() => {
                                                handleReinstallTAS();
                                            }, 100);
                                        }}
                                    >
                                        <Content>
                                            <Text>
                                                This will completely delete and reinstall TAS backend.
                                                All existing files in the TAS folder will be removed.
                                                <br /><br />
                                                <strong>Note:</strong> Your settings and cached models will be preserved.
                                                <br /><br />
                                                Are you sure you want to continue?
                                            </Text>
                                        </Content>
                                    </AlertDialog>
                                )}
                            </DialogTrigger>
                        </Flex>

                    </Flex>
                </View>

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
                            <Flex direction="row" wrap gap={8} width="100%">
                                <Picker
                                    flex="1 1 240px"
                                    minWidth="240px"
                                    label="AI Precision"
                                    selectedKey={aiPrecision}
                                    onSelectionChange={handleSelectionChange(
                                        setAiPrecision
                                    )}
                                    contextualHelp={createPickerContextualHelp(
                                        "AI Precision",
                                        "Choose the precision for AI processing. Higher precision may marginally improve quality ( typically in Depth Maps ) but increase processing time."
                                    )}
                                    width="100%"
                                >
                                    <Item key="true" textValue="FP16 Precision">
                                        <Gauge5 />
                                        <Text>FP16</Text>
                                        <Text slot="description">
                                            Everyone should prefer this.
                                        </Text>
                                    </Item>
                                    <Item key="false" textValue="FP32 Precision">
                                        <Gauge1 />
                                        <Text>FP32</Text>
                                        <Text slot="description">
                                            Fallback in case of black frame
                                            issues / Lower End GPUs / Depth Maps may see a boost in quality with a compatible 10bit encoder
                                        </Text>
                                    </Item>
                                </Picker>
                                <Picker
                                    flex="1 1 240px"
                                    minWidth="240px"
                                    label="Encoding Codec"
                                    selectedKey={encodeAlgorithm}
                                    onSelectionChange={handleSelectionChange(
                                        setEncodeAlgorithm
                                    )}
                                    contextualHelp={createPickerContextualHelp(
                                        "Encoding Codecs",
                                        "Choose the encoding codec for the video output. Different codecs may provide better performance depending on the hardware configuration."
                                    )}
                                    width="100%"
                                >
                                    <Section title="All CPUs">
                                        <Item key="x264" textValue="x264">
                                            <Gauge5 />
                                            <Text>x264</Text>
                                            <Text slot="description">
                                                Universal
                                            </Text>
                                        </Item>
                                        <Item key="x264_10bit" textValue="x264 10 Bit">
                                            <Gauge4 />
                                            <Text>x264 10 Bit</Text>
                                            <Text slot="description">
                                                Universal / Requires 16bpc
                                                Bit Depth
                                            </Text>
                                        </Item>
                                        <Item key="x264_animation" textValue="x264 Animation">
                                            <Gauge5 />
                                            <Text>x264 Animation</Text>
                                            <Text slot="description">
                                                Anime
                                            </Text>
                                        </Item>
                                        <Item key="x264_animation_10bit" textValue="x264 Animation 10 Bit">
                                            <Gauge1 />
                                            <Text>
                                                x264 Animation 10 Bit
                                            </Text>
                                            <Text slot="description">
                                                Anime / Requires 16bpc Bit
                                                Depth
                                            </Text>
                                        </Item>
                                        <Item key="x265" textValue="x265">
                                            <Gauge4 />
                                            <Text>x265</Text>
                                            <Text slot="description">
                                                Universal
                                            </Text>
                                        </Item>
                                        <Item key="x265_10bit" textValue="x265 10 Bit">
                                            <Gauge3 />
                                            <Text>x265 10 Bit</Text>
                                            <Text slot="description">
                                                Universal / Requires 16bpc
                                                Bit Depth
                                            </Text>
                                        </Item>
                                            <Item key="prores" textValue="ProRes 444 HQ">
                                            <Gauge2 />
                                            <Text>ProRes 444 HQ</Text>
                                            <Text slot="description">
                                                Universal / Very Large
                                                Filesizes
                                            </Text>
                                        </Item>
                                        <Item key="slow_x264" textValue="Slow x264">
                                            <Gauge1 />
                                            <Text>Slow x264</Text>
                                            <Text slot="description">
                                                Universal / Very Slow /
                                                Small Filesizes
                                            </Text>
                                        </Item>
                                        <Item key="slow_x265" textValue="Slow x265">
                                            <Gauge1 />
                                            <Text>Slow x265</Text>
                                            <Text slot="description">
                                                Universal / Very Slow /
                                                Small Filesizes
                                            </Text>
                                        </Item>
                                        <Item key="lossless" textValue="Lossless">
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
                                        <Item key="nvenc_h264" textValue="NVENC h264">
                                            <Gauge5 />
                                            <Text>NVENC h264</Text>
                                            <Text slot="description">
                                                Universal
                                            </Text>
                                        </Item>
                                        <Item key="nvenc_h265" textValue="NVENC h265">
                                            <Gauge5 />
                                            <Text>NVENC h265</Text>
                                            <Text slot="description">
                                                Universal
                                            </Text>
                                        </Item>
                                        <Item key="nvenc_h265_10bit" textValue="NVENC h265 10 Bit">
                                            <Gauge4 />
                                            <Text>NVENC h265 10 Bit</Text>
                                            <Text slot="description">
                                                Universal / Requires 16bpc
                                                Bit Depth
                                            </Text>
                                        </Item>
                                        <Item key="slow_nvenc_h264" textValue="Slow NVENC h264">
                                            <Gauge1 />
                                            <Text>Slow NVENC h264</Text>
                                            <Text slot="description">
                                                Universal / Very Slow /
                                                Small Filesizes
                                            </Text>
                                        </Item>
                                        <Item key="slow_nvenc_h265" textValue="Slow NVENC h265">
                                            <Gauge1 />
                                            <Text>Slow NVENC h265</Text>
                                            <Text slot="description">
                                                Universal / Very Slow /
                                                Small Filesizes
                                            </Text>
                                        </Item>
                                    </Section>
                                    <Section title="AMD GPUs">
                                        <Item key="h264_amf" textValue="AMF h264">
                                            <Gauge5 />
                                            <Text>AMF h264</Text>
                                            <Text slot="description">
                                                Universal
                                            </Text>
                                        </Item>
                                        <Item key="hevc_amf" textValue="AMF h265">
                                            <Gauge4 />
                                            <Text>AMF h265</Text>
                                            <Text slot="description">
                                                Universal
                                            </Text>
                                        </Item>
                                        <Item key="hevc_amf_10bit" textValue="AMF h265 10 Bit">
                                            <Gauge4 />
                                            <Text>AMF h265 10 Bit</Text>
                                            <Text slot="description">
                                                Universal / Requires 16bpc
                                                Bit Depth
                                            </Text>
                                        </Item>
                                    </Section>
                                    <Section title="Intel iGPUs">
                                        <Item key="qsv_h264" textValue="QSV h264">
                                            <Gauge5 />
                                            <Text>QSV h264</Text>
                                            <Text slot="description">
                                                Universal
                                            </Text>
                                        </Item>
                                        <Item key="qsv_h265" textValue="QSV h265">
                                            <Gauge4 />
                                            <Text>QSV h265</Text>
                                            <Text slot="description">
                                                Universal
                                            </Text>
                                        </Item>
                                        <Item key="qsv_h265_10bit" textValue="QSV h265 10 Bit">
                                            <Gauge1 />
                                            <Text>QSV h265 10 Bit</Text>
                                            <Text slot="description">
                                                Universal / Requires 16bpc
                                                Bit Depth
                                            </Text>
                                        </Item>
                                    </Section>
                                </Picker>
                            </Flex>
                            <Flex direction="row" wrap gap={8} width="100%">
                                <Picker
                                    flex="1 1 240px"
                                    minWidth="240px"
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
                                    width="100%"
                                >
                                    <Item key="8bit" textValue="8 Bits Per Channel">
                                        <Gauge5 />
                                        <Text>8 Bits Per Channel</Text>
                                        <Text slot="description">
                                            99.9% of users will be happy
                                            with this
                                        </Text>
                                    </Item>
                                    <Item key="16bit" textValue="16 Bits Per Channel">
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
                                    flex="1 1 240px"
                                    minWidth="240px"
                                    label="Pre-Render Codec"
                                    selectedKey={preRenderAlgorithm}
                                    onSelectionChange={handleSelectionChange(
                                        setPreRenderAlgorithm
                                    )}
                                    contextualHelp={createPickerContextualHelp(
                                        "Pre-Render Codec",
                                        "Select the desired encoding codec for the pre-rendered video."
                                    )}
                                    width="100%"
                                >
                                    <Item key="lossless" textValue="Lossless Pre-Render">
                                        <Gauge5 />
                                        <Text>Lossless</Text>
                                        <Text slot="description">
                                            Large File Size | After Effects
                                            2020+
                                        </Text>
                                    </Item>
                                    <Item key="high" textValue="Quicktime Pre-Render">
                                        <Gauge4 />
                                        <Text>Quicktime</Text>
                                        <Text slot="description">
                                            Medium File Size | After Effects
                                            2022+
                                        </Text>
                                    </Item>
                                </Picker>
                            </Flex>
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

                <ShortcutsSettingsPanel onSettingsChange={onShortcutSettingsChange} />
            </Flex>
        </div>
    );
};
