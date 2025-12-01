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
    ActionButton,
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
import NewItem from "@spectrum-icons/workflow/NewItem";
import LinkOut from "@spectrum-icons/workflow/LinkOut";
import Refresh from "@spectrum-icons/workflow/Refresh";

import { socialsPanel, openBuyMeACoffee, openGitHubSponsors, openReportIssue, openParameters } from "./Socials";
import { useSupporterUsernames } from "./supporterUtils";
import { useChangelog, formatReleaseDate } from "./changelogUtils";

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


const renderMarkdownText = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
        if (boldMatch) {
            parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
            remaining = remaining.slice(boldMatch[0].length);
            continue;
        }

        const codeMatch = remaining.match(/^`([^`]+)`/);
        if (codeMatch) {
            parts.push(
                <code key={key++} style={{ 
                    backgroundColor: 'var(--spectrum-global-color-gray-200)', 
                    padding: '1px 4px', 
                    borderRadius: '3px',
                    fontSize: '12px'
                }}>
                    {codeMatch[1]}
                </code>
            );
            remaining = remaining.slice(codeMatch[0].length);
            continue;
        }

        const italicMatch = remaining.match(/^\*([^*]+)\*/);
        if (italicMatch) {
            parts.push(<em key={key++}>{italicMatch[1]}</em>);
            remaining = remaining.slice(italicMatch[0].length);
            continue;
        }

        const nextSpecial = remaining.search(/[*`]/);
        if (nextSpecial === -1) {
            parts.push(remaining);
            break;
        } else if (nextSpecial === 0) {
            parts.push(remaining[0]);
            remaining = remaining.slice(1);
        } else {
            parts.push(remaining.slice(0, nextSpecial));
            remaining = remaining.slice(nextSpecial);
        }
    }

    return parts;
};


const ChangelogBody: React.FC<{ body: string }> = ({ body }) => {
    const lines = body.split('\n');
    const elements: React.ReactNode[] = [];
    let key = 0;
    let skipSection = false;

    for (const line of lines) {
        const trimmed = line.trim();
        
        if (!trimmed) continue;

        if (trimmed.toLowerCase().includes("what's changed") || 
            trimmed.toLowerCase().includes("whats changed")) {
            skipSection = true;
            continue;
        }

        if (skipSection) continue;
        
        if (trimmed.includes('@dependabot') || 
            trimmed.includes('deps: bump') ||
            trimmed.startsWith('Full Changelog:') ||
            trimmed.startsWith('**Full Changelog**')) {
            continue;
        }

        const headerMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (headerMatch) {
            elements.push(
                <Text key={key++} UNSAFE_style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginTop: '8px', marginBottom: '4px' }}>
                    {renderMarkdownText(headerMatch[2])}
                </Text>
            );
            continue;
        }

        const boldHeaderMatch = trimmed.match(/^\*\*([^*]+)\*\*\s*$/);
        if (boldHeaderMatch) {
            elements.push(
                <Text key={key++} UNSAFE_style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginTop: '8px', marginBottom: '4px' }}>
                    {boldHeaderMatch[1]}
                </Text>
            );
            continue;
        }

        const listMatch = trimmed.match(/^[-*•]\s+(.+)$/) || trimmed.match(/^\d+\.\s+(.+)$/);
        if (listMatch) {
            elements.push(
                <Text key={key++} UNSAFE_style={{ fontSize: '12px', marginLeft: '12px', display: 'block', marginBottom: '2px' }}>
                    • {renderMarkdownText(listMatch[1])}
                </Text>
            );
            continue;
        }

        if (trimmed) {
            elements.push(
                <Text key={key++} UNSAFE_style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>
                    {renderMarkdownText(trimmed)}
                </Text>
            );
        }
    }

    return <>{elements}</>;
};


const WhatsNewSection = React.memo(() => {
    const { releases, loading, error, refresh } = useChangelog(1);
    const latestRelease = releases[0];

    if (loading) {
        return (
            <Flex direction="row" alignItems="center" justifyContent="center" gap="size-100" marginY="size-100">
                <ProgressCircle size="S" isIndeterminate aria-label="Loading changelog" />
                <Text>Loading changelog…</Text>
            </Flex>
        );
    }

    if (error) {
        return (
            <Flex direction="column" alignItems="center" gap="size-100" marginY="size-100">
                <StatusLight variant="negative">Failed to load changelog</StatusLight>
                <ActionButton onPress={refresh} isQuiet>
                    <Refresh size="S" />
                    <Text>Retry</Text>
                </ActionButton>
            </Flex>
        );
    }

    if (!latestRelease) {
        return (
            <Text UNSAFE_style={{ fontStyle: 'italic' }}>No releases found.</Text>
        );
    }

    return (
        <Flex direction="column" gap="size-150" marginStart="size-100">
            <Flex direction="row" justifyContent="space-between" alignItems="center">
                <Flex direction="row" alignItems="baseline" gap="size-100">
                    <Text UNSAFE_style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        v{latestRelease.version}
                    </Text>
                    <Text UNSAFE_style={{ fontSize: '12px', color: 'var(--spectrum-global-color-green-600)', fontWeight: '500' }}>
                        Latest
                    </Text>
                    <Text UNSAFE_style={{ fontSize: '12px', color: 'var(--spectrum-global-color-gray-500)' }}>
                        {formatReleaseDate(latestRelease.publishedAt)}
                    </Text>
                </Flex>
                <ActionButton
                    isQuiet
                    onPress={() => window.cep.util.openURLInDefaultBrowser(latestRelease.htmlUrl)}
                    aria-label="Open release in browser"
                >
                    <LinkOut size="S" />
                </ActionButton>
            </Flex>
            
            {latestRelease.body && (
                <View marginStart="size-100">
                    <ChangelogBody body={latestRelease.body} />
                </View>
            )}
        </Flex>
    );
});

export function aboutTab(tasVersion: string) {
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
                    <Disclosure id="whats-new">
                        <DisclosureTitle>
                            <DisclosureTitleContent
                                icon={<NewItem size="S" />}
                                text="What's New"
                            />
                        </DisclosureTitle>
                        <DisclosurePanel>
                            <WhatsNewSection />
                        </DisclosurePanel>
                    </Disclosure>

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
