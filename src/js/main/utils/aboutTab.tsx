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
    Link,
    Accordion,
} from "@adobe/react-spectrum";

// Icons
import { BiSolidDonateHeart } from "react-icons/bi";
import Info from "@spectrum-icons/workflow/Info";
import DeviceDesktop from "@spectrum-icons/workflow/DeviceDesktop";
import Help from "@spectrum-icons/workflow/Help";
import { PiGraphicsCardFill } from "react-icons/pi";
import Gauge1 from "@spectrum-icons/workflow/Gauge1";
import Gauge4 from "@spectrum-icons/workflow/Gauge4";
import Gauge5 from "@spectrum-icons/workflow/Gauge5";

// Assuming these functions are available or imported from Socials.tsx
import { socialsPanel, openBuyMeACoffee, openReportIssue, openParameters } from "./Socials";

// Helper component for consistent Disclosure titles
const DisclosureTitleContent = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <Flex alignItems="center" gap="size-100">
        {icon}
        <Text>{text}</Text>
    </Flex>
);

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
                
                {/* Adjusted gap */}
                <Flex direction="column" justifyContent="space-between">
                    
                    {/* Adjusted margin */}
                    <Flex direction="row" alignItems="center" justifyContent="space-between">
                        
                        {/* Adjusted margin */}
                        <Heading level={3} margin={0}>
                            The Anime Scripter v{tasVersion}
                        </Heading>
                        {/* Removed specific margins */}
                        {socialsPanel()}
                    </Flex>
                    <Divider size="S" /> {/* Use smaller divider */}
                </Flex>
                <Well>
                    <Flex direction="column" alignItems="center" gap="size-100">
                        <Text UNSAFE_style={{ fontWeight: "bold", color: "#D83B01", fontSize: "15px", textAlign: "center" }}>
                            ❤️ <strong>Please consider supporting TAS' development!</strong>
                        </Text>
                        <Button
                            variant="primary"
                            onPress={openBuyMeACoffee}
                            UNSAFE_style={{ background: "#D83B01" }}
                        >
                            <Text>Donate</Text>
                        </Button>
                    </Flex>
                </Well>
                <View
                    backgroundColor="gray-75"
                    padding="size-150"
                    borderRadius="medium"
                    marginY="size-50"
                >
                    
                    {/* Adjusted padding/margin */}
                    <Flex direction="row" gap="size-100" alignItems="center">
                        
                        {/* Removed bottom margin */}
                        <Info color="notice" size="S" /> {/* Explicit size */}
                        <Text UNSAFE_style={{ fontWeight: "bold" }}>
                            Please adjust the settings to match your preferences and system before
                            starting.
                        </Text>
                    </Flex>
                </View>
                <Divider size="S" /> {/* Use smaller divider */}
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
                                
                                {/* Adjusted gap/margin */}
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
                                    • <strong>Storage:</strong> 8GB minimum free space for NVIDIA users / 1GB for AMD/Intel.
                                </Text>
                            </Flex>
                        </DisclosurePanel>
                    </Disclosure>

                    <Disclosure id="gpu-compatibility">
                        <DisclosureTitle>
                            <DisclosureTitleContent
                                icon={<PiGraphicsCardFill size={18} />}
                                text="GPU Compatibility"
                            />
                        </DisclosureTitle>
                        <DisclosurePanel>
                            <Flex direction="column" gap="size-75" marginStart="size-250">
                                
                                {/* Adjusted gap/margin */}
                                <Text>
                                    • <strong>TensorRT models:</strong> NVIDIA RTX GPUs only.
                                </Text>
                                <Text>
                                    • <strong>NCNN & DirectML models:</strong> All GPU types.
                                </Text>
                                <Text>
                                    • <strong>CUDA models:</strong> Compatible with Nvidia GTX
                                    1000+ and RTX cards.
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
                                    The gauge icons (such as <Gauge1 size="S" UNSAFE_style={{ verticalAlign: "middle", position: "relative" }} />, <Gauge4 size="S" UNSAFE_style={{ verticalAlign: "middle", position: "relative" }} />, <Gauge5 size="S" UNSAFE_style={{ verticalAlign: "middle", position: "relative" }} />) are used throughout the application to provide a quick, visual reference for relative performance, quality, or suitability of a setting or option.
                                </Text>
                                <Text>
                                    <strong>Note:</strong> These gauges are <u>relative</u> within the context of each setting or workflow. They are not global or absolute ratings, but are meant to help you compare options <i>in that specific context</i> (e.g., codec speed, bit depth, or quality).
                                </Text>
                                <Text>
                                    For example, a <Gauge5 size="S" UNSAFE_style={{ verticalAlign: "middle", position: "relative" }} /> in one dropdown does not necessarily mean the same thing as a <Gauge5 size="S" UNSAFE_style={{ verticalAlign: "middle", position: "relative" }} /> in another dropdown. Always read the contextual help for details.
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
                                
                                {/* Adjusted gap/margin */}
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
                                {/* Rephrased */}
                                <Text>
                                    • Use deduplicate coupled with interpolation for smoother
                                    results.
                                </Text>
                            </Flex>
                        </DisclosurePanel>
                    </Disclosure>
                </Accordion>
                <Divider size="S" /> {/* Use smaller divider */}
                <Flex direction="column" alignItems="center" gap="size-100">
                    <Text>
                        © 2024-Present | Developed by <strong>Nilas</strong>
                    </Text>
                    <Flex direction="row" gap="size-100">
                        <Link onPress={openParameters}>Documentation</Link>
                        <Text>|</Text>
                        <Link onPress={openReportIssue}>Report an Issue</Link>
                    </Flex>
                </Flex>
            </Flex>
            {/* Removed the final Divider as padding handles separation */}
        </View>
    );
}
