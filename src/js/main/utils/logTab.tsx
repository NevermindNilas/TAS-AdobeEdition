import {
    Text,
    View,
    ActionButton,
    Flex,
    Heading,
    Tooltip,
    TooltipTrigger,
    Divider,
} from "@adobe/react-spectrum";
import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import Delete from "@spectrum-icons/workflow/Delete";
import InfoOutline from "@spectrum-icons/workflow/InfoOutline";
import Copy from "@spectrum-icons/workflow/Copy";
import { createGeneralContextualHelp } from "./ConsistentContextualHelp";
import CheckmarkCircle from "@spectrum-icons/workflow/CheckmarkCircle";
import Inbox from "@spectrum-icons/workflow/Inbox";
import { generateToast } from "./generateToast";
import { openReportIssue } from "./Socials";

const LOG_CONTAINER_STYLE = {
    borderRadius: "4px",
    border: "1px solid var(--spectrum-global-color-gray-300)",
    backgroundColor: "var(--spectrum-global-color-gray-75)",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    overflowY: "auto",
    overflowX: "hidden",
    wordBreak: "break-word",
    fontSize: "13px",
    position: "relative",
    padding: "12px",
} as any;

function LogLine({ line }: { line: string }) {
    // Only highlight as error if line starts with 'error:' or 'error ', case-insensitive
    const isError = /^\s*(error:|error |err:|err )/i.test(line);
    const isWarning = /^\s*(warning:|warn:|warn )/i.test(line);
    const color = isError
        ? "#e34850"
        : isWarning
        ? "#e79c40"
        : "inherit";
    return (
        <Text
            UNSAFE_style={{
                display: "block",
                color: color,
                fontWeight: isError || isWarning ? "500" : "normal",
            }}
        >
            {line}
        </Text>
    );
}

export function logTab(data: string[], setData: React.Dispatch<React.SetStateAction<string[]>>) {
    const logRef = useRef<HTMLDivElement>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    // Auto-scroll to bottom when logs update
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTo({
                top: logRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [data]);

    const clearLogs = useCallback(() => {
        setData([]);
        generateToast(3, "Logs cleared");
    }, [setData]);

    const copyLogs = useCallback(() => {
        const logText = data.join("\n");
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard
                    .writeText(logText)
                    .then(() => {
                        setCopySuccess(true);
                        generateToast(1, "Logs copied to clipboard!");
                        setTimeout(() => setCopySuccess(false), 1000);
                    })
                    .catch(() => {
                        copyWithExecCommand(logText);
                    });
            } else {
                copyWithExecCommand(logText);
            }
        } catch (err) {
            generateToast(2, "Copy failed");
            console.error("Copy failed:", err);
        }
    }, [data]);

    const copyWithExecCommand = useCallback((text: string) => {
        try {
            const el = document.createElement("textarea");
            el.value = text;
            el.style.position = "absolute";
            el.style.left = "-9999px";
            document.body.appendChild(el);
            el.focus();
            el.select();

            const successful = document.execCommand("copy");
            document.body.removeChild(el);

            if (successful) {
                setCopySuccess(true);
                generateToast(1, "Logs copied to clipboard!");
                setTimeout(() => setCopySuccess(false), 1000);
            } else {
                generateToast(2, "Copy failed");
            }
        } catch (err) {
            generateToast(2, "Copy failed");
            console.error("Fallback copy failed:", err);
        }
    }, []);

    const handleReportIssue = useCallback(() => {
        const logText = data.join("\n");
        // Try to copy logs to clipboard
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard
                    .writeText(logText)
                    .then(() => {
                        generateToast(1, "Logs copied to clipboard!");
                        openReportIssue();
                    })
                    .catch(() => {
                        copyWithExecCommand(logText);
                        openReportIssue();
                    });
            } else {
                copyWithExecCommand(logText);
                openReportIssue();
            }
        } catch (err) {
            generateToast(2, "Copy failed");
            openReportIssue();
            console.error("Copy failed:", err);
        }
    }, [data, copyWithExecCommand]);

    const renderedLogs = useMemo(() =>
        data.map((line, index) => <LogLine key={index} line={line} />), [data]);

    return (
        <Flex direction="column" gap={10} width="100%" marginTop={8}>
            <View borderWidth="thin" borderColor="dark" borderRadius="medium" padding="size-200">
                <Flex direction="column" gap={12}>
                    <Flex direction="row" gap={8} alignItems="center">
                        <Inbox size="S" />
                        <Heading level={4} margin={0}>
                            Process Logs
                        </Heading>
                        {createGeneralContextualHelp(
                            "Process Logs",
                            <Text>
                                <p>View detailed processing logs:</p>
                                <ul>
                                    <li>
                                        <strong>Copy:</strong> Copy all logs to clipboard
                                    </li>
                                    <li>
                                        <strong>Clear:</strong> Clear the log display
                                    </li>
                                </ul>
                            </Text>
                        )}
                    </Flex>
                    <Divider size="S" />
                    <View
                        height="calc(75vh - 100px)"
                        UNSAFE_style={LOG_CONTAINER_STYLE}
                        aria-live="polite"
                    >
                        <div ref={logRef} style={{ height: "100%", overflowY: "auto" }}>
                            {renderedLogs}
                        </div>
                        {data.length === 0 && (
                            <Flex
                                direction="column"
                                alignItems="center"
                                justifyContent="center"
                                height="100%"
                                UNSAFE_style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                }}
                            >
                                <InfoOutline size="L" />
                                <Heading level={4} margin={0} marginTop="size-100">
                                    No logs available yet
                                </Heading>
                                <Text
                                    marginTop="size-50"
                                    UNSAFE_style={{
                                        textAlign: "center",
                                        maxWidth: "80%",
                                    }}
                                >
                                    Process logs will appear here as they are generated, run a
                                    processing task from the Chain or Extra tab to generate logs
                                </Text>
                            </Flex>
                        )}
                    </View>
                    <Flex direction="row" alignItems="center" justifyContent="space-between">
                        <Flex gap="size-100">
                            <TooltipTrigger delay={0}>
                                <ActionButton isQuiet onPress={copyLogs} aria-label="Copy logs">
                                    {copySuccess ? <CheckmarkCircle /> : <Copy />}
                                </ActionButton>
                                <Tooltip>Copy logs to clipboard</Tooltip>
                            </TooltipTrigger>
                            <TooltipTrigger delay={0}>
                                <ActionButton isQuiet onPress={clearLogs} aria-label="Clear logs">
                                    <Delete />
                                </ActionButton>
                                <Tooltip>Clear logs</Tooltip>
                            </TooltipTrigger>
                        </Flex>
                        <TooltipTrigger delay={0}>
                            <ActionButton isQuiet onPress={handleReportIssue} aria-label="Report an issue">
                                <Text>Report Issue</Text>
                            </ActionButton>
                            <Tooltip>Report an issue with the logs copied to the clipboard</Tooltip>
                        </TooltipTrigger>
                    </Flex>
                </Flex>
            </View>
        </Flex>
    );
}
