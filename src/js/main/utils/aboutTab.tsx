import {
    Text,
    Disclosure,
    DisclosureTitle,
    DisclosurePanel,
    Divider,
    Heading,
    View,
    Flex,
    Button,
    Well,
    Accordion,
    ProgressCircle,
    TagGroup,
    StatusLight,
    ActionGroup,
    Item,
    InlineAlert,
    Content,
} from "@adobe/react-spectrum";

import Info from "@spectrum-icons/workflow/Info";
import DeviceDesktop from "@spectrum-icons/workflow/DeviceDesktop";
import Help from "@spectrum-icons/workflow/Help";
import Gauge1 from "@spectrum-icons/workflow/Gauge1";
import Gauge4 from "@spectrum-icons/workflow/Gauge4";
import Gauge5 from "@spectrum-icons/workflow/Gauge5";
import Keyboard from "@spectrum-icons/workflow/Keyboard";

import { socialsPanel, openBuyMeACoffee, openGitHubSponsors, openReportIssue, openParameters } from "./Socials";
import { useSupporterUsernames } from "./supporterUtils";
import ShortcutsSettingsPanel from "./ShortcutsSettingsPanel";
import type { ShortcutSettings } from "./shortcutSettings";

const DisclosureTitleContent = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <Flex alignItems="center" gap="size-100">
        {icon}
        <Text>{text}</Text>
    </Flex>
);

import React from 'react';

const SupportersSection = React.memo(() => {
    const { usernames, loading, error } = useSupporterUsernames();

    if (loading) {
        return (
            <Flex direction="row" alignItems="center" justifyContent="center" gap="size-100">
                <ProgressCircle size="S" isIndeterminate aria-label="Loading supporters" />
                <Text>Loading supporters…</Text>
            </Flex>
        );
    }

    if (error) {
        return (
            <Flex direction="column" alignItems="center" gap="size-100">
                <StatusLight variant="negative">Failed to load supporters (using cached data)</StatusLight>
                <Text>No supporter usernames available.</Text>
            </Flex>
        );
    }

    const items = (usernames && usernames.length > 0)
        ? usernames.map((u) => ({ id: u, name: u }))
        : [];

    return (
        <Flex direction="column" alignItems="center" gap="size-100">
            {items.length > 0 ? (
                <TagGroup aria-label="Supporter usernames">
                    {items.map((item) => (
                        <Item key={item.id} textValue={item.name}>{item.name}</Item>
                    ))}
                </TagGroup>
            ) : (
                <StatusLight variant="neutral">No supporters yet</StatusLight>
            )}
        </Flex>
    );
});

export function aboutTab(tasVersion: string, onShortcutSettingsChange?: (settings: ShortcutSettings) => void) {
    return (
        <View
            borderWidth="thin"
            borderColor="dark"
            borderRadius="medium"
            padding="size-200"
            marginTop={8}
        >
            <Flex direction="column" gap="size-150" marginTop={-8}>
                <Flex direction="column" justifyContent="space-between">
                    <Flex direction="row" alignItems="center" justifyContent="space-between">
                        <Heading level={3} margin={0}>
                            The Anime Scripter v{tasVersion}
                        </Heading>
                        {socialsPanel()}
                    </Flex>
                    <Divider size="S" />
                </Flex>

                <Well>
                    <Flex direction="column" alignItems="center" gap="size-150">
                        <Heading level={4} margin={0}>
                            Thank you to everyone who supports TAS!
                        </Heading>
                        <Flex direction="row" gap="size-150">
                            <Button
                                variant="primary"
                                onPress={openBuyMeACoffee}
                            >
                                <Text>Buy Me a Coffee</Text>
                            </Button>
                            <Button
                                variant="primary"
                                onPress={openGitHubSponsors}
                            >
                                <Text>GitHub Sponsors</Text>
                            </Button>
                        </Flex>
                        <SupportersSection />
                    </Flex>
                </Well>
                <InlineAlert variant="notice" marginY="size-50">
                    <Heading level={4} margin={0}>Setup reminder</Heading>
                    <Content>
                        Please adjust the settings to match your preferences and system before starting.
                    </Content>
                </InlineAlert>
                <Divider size="S" />
                <Accordion isQuiet>
                    <Disclosure id="system-requirements">
                        <DisclosureTitle>
                            <DisclosureTitleContent
                                icon={<DeviceDesktop size="S" />}
                                text="System Requirements"
                            />
                        </DisclosureTitle>
                        <DisclosurePanel>
                            <Flex direction="column" gap="size-75" marginStart="size-250">
                                <Text>
                                    • <strong>CPU:</strong> 4 cores minimum, 8 cores recommended.
                                </Text>
                                <Text>
                                    • <strong>RAM:</strong> 16GB minimum, 32GB recommended.
                                </Text>
                                <Text>
                                    • <strong>GPU VRAM:</strong> 4GB minimum, 8GB recommended.
                                </Text>
                                <Text>
                                    • <strong>Storage:</strong> 5GB minimum free space for NVIDIA users / 1GB for AMD/Intel.
                                </Text>
                            </Flex>
                        </DisclosurePanel>
                    </Disclosure>

                    <Disclosure id="gpu-compatibility">
                        <DisclosureTitle>
                            <DisclosureTitleContent
                                icon={<Gauge4 size="S" />}
                                text="GPU Compatibility"
                            />
                        </DisclosureTitle>
                        <DisclosurePanel>
                            <Flex direction="column" gap="size-75" marginStart="size-250">
                                <Text>
                                    • <strong>CUDA models:</strong> Compatible with NVIDIA Turing GPUS ( incl. 16xx series ) and above
                                </Text>
                                <Text>
                                    • <strong>TensorRT models:</strong> NVIDIA RTX GPUs only.
                                </Text>
                                <Text>
                                    • <strong>NCNN & DirectML models:</strong> All GPU types.
                                </Text>
                            </Flex>
                        </DisclosurePanel>
                    </Disclosure>

                    <Disclosure id="gauge-explanation">
                        <DisclosureTitle>
                            <DisclosureTitleContent
                                icon={<Info size="S" />}
                                text="What do the Gauges Mean?"
                            />
                        </DisclosureTitle>
                        <DisclosurePanel>
                            <Flex direction="column" gap="size-75" marginStart="size-250">
                                <Text>
                                    The gauge icons (such as <Gauge1 size="S" />, <Gauge4 size="S" />, <Gauge5 size="S" />) are used throughout the application to provide a quick, visual reference for relative performance, quality, or suitability of a setting or option.
                                </Text>
                                <Text>
                                    <strong>Note:</strong> These gauges are <u>relative</u> within the context of each setting or workflow. They are not global or absolute ratings, but are meant to help you compare options <i>in that specific context</i> (e.g., codec speed, bit depth, or quality).
                                </Text>
                                <Text>
                                    For example, a <Gauge5 size="S" /> in one dropdown does not necessarily mean the same thing as a <Gauge5 size="S" /> in another dropdown. Always read the contextual help for details.
                                </Text>
                            </Flex>
                        </DisclosurePanel>
                    </Disclosure>

                    {/*
                    <Disclosure id="features">
                        <DisclosureTitle>
                            <DisclosureTitleContent icon={<Star size="S" />} text="Features" />
                        </DisclosureTitle>
                        <DisclosurePanel>
                            <Flex direction="column" gap="size-75" marginStart="size-250">
                                <Text>• <strong>Enhanced Workflows:</strong> AI-powered video processing chain</Text>
                                <Text>• <strong>Resource Optimization:</strong> Efficient GPU utilization</Text>
                                <Text>• <strong>Content Source:</strong> Direct YouTube and anime integration</Text>
                                <Text>• <strong>Advanced Effects:</strong> Depth mapping, background removal, and auto-cutting</Text>
                                <Text>• <strong>Layer Management:</strong> Streamlined layer handling tools</Text>
                            </Flex>
                        </DisclosurePanel>
                    </Disclosure>
                    */}

                    <Disclosure id="quick-tips">
                        <DisclosureTitle>
                            <DisclosureTitleContent icon={<Help size="S" />} text="Quick Tips" />
                        </DisclosureTitle>
                        <DisclosurePanel>
                            <Flex direction="column" gap="size-75" marginStart="size-250">
                                <Text>• Save your project before processing videos.</Text>
                                <Text>
                                    • Disable "Play Sound When Render Finishes" in After Effects
                                    preferences.
                                </Text>
                                <Text>
                                    • TensorRT models provide the fastest processing on compatible
                                    hardware.
                                </Text>
                                <Text>
                                    • TensorRT requires an engine build on first use, which is
                                    automatically cached.
                                </Text>
                                <Text>
                                    • Use deduplicate coupled with interpolation for smoother
                                    results.
                                </Text>
                            </Flex>
                        </DisclosurePanel>
                    </Disclosure>

                </Accordion>
                <Divider size="S" />
                
                {/* Keyboard Shortcuts Settings Panel */}
                <ShortcutsSettingsPanel onSettingsChange={onShortcutSettingsChange} />
                
                <Divider size="S" />
                <Flex direction="column" alignItems="center" gap="size-150">
                    <Text>
                        © 2024-Present | Developed by <strong>Nilas</strong>
                    </Text>
                    <ActionGroup isQuiet onAction={(key) => {
                        if (key === 'docs') openParameters();
                        if (key === 'issue') openReportIssue();
                    }}>
                        <Item key="docs">Documentation</Item>
                        <Item key="issue">Report an Issue</Item>
                    </ActionGroup>
                </Flex>
            </Flex>
        </View>
    );
}
