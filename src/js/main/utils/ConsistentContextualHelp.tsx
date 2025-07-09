import React from "react";
import { ContextualHelp, Heading, Content } from "@adobe/react-spectrum";

interface ContextualHelpProps {
    title: string;
    content: React.ReactNode;
    variant?: "info" | "help";
    placement?: "start" | "end" | "top" | "bottom";
    className?: string;
    style?: React.CSSProperties;
}

/**
 * A standardized ContextualHelp component with consistent styling and behavior.
 * Provides a uniform way to display contextual help throughout the application.
 *
 * @param title - The heading/title for the contextual help
 * @param content - The main content (can be text, JSX, or complex content)
 * @param variant - The visual variant ('info' by default)
 * @param placement - Position of the help popup relative to trigger
 * @param className - Additional CSS class name
 * @param style - Additional inline styles
 */
export const createContextualHelp = ({
    title,
    content,
    variant = "info",
    placement,
    className = "contextualHelp",
    style,
}: ContextualHelpProps) => {
    return (
        <ContextualHelp
            variant={variant}
            placement={placement}
            UNSAFE_className={className}
            UNSAFE_style={style}
        >
            <Heading>{title}</Heading>
            <Content>{content}</Content>
        </ContextualHelp>
    );
};

/**
 * Creates contextual help specifically for Picker components with standardized styling.
 *
 * @param title - The heading/title for the contextual help.
 * @param content - The main content (can be text, JSX, or complex content).
 * @returns A React element representing the configured ContextualHelp.
 */
export const createPickerContextualHelp = (title: string, content: React.ReactNode) => {
    return createContextualHelp({
        title,
        content,
        variant: "info",
        className: "contextualHelp",
    });
};

/**
 * Creates contextual help for Slider components with standardized styling.
 *
 * @param title - The heading/title for the contextual help.
 * @param content - The main content (can be text, JSX, or complex content).
 * @returns A React element representing the configured ContextualHelp.
 */
export const createSliderContextualHelp = (title: string, content: React.ReactNode) => {
    return createContextualHelp({
        title,
        content,
        variant: "info",
        className: "contextualHelp",
    });
};

/**
 * Creates contextual help for Checkbox components with standardized positioning and styling.
 *
 * @param title - The heading/title for the contextual help.
 * @param content - The main content (can be text, JSX, or complex content).
 * @returns A React element representing the configured ContextualHelp.
 */
export const createCheckboxContextualHelp = (title: string, content: React.ReactNode) => {
    return createContextualHelp({
        title,
        content,
        variant: "info",
        className: "contextualHelp",
        style: { marginTop: "5px", marginLeft: "-10px" },
    });
};

/**
 * Creates contextual help for general use with consistent styling.
 *
 * @param title - The heading/title for the contextual help.
 * @param content - The main content (can be text, JSX, or complex content).
 * @returns A React element representing the configured ContextualHelp.
 */
export const createGeneralContextualHelp = (title: string, content: React.ReactNode) => {
    return createContextualHelp({
        title,
        content,
        variant: "info",
    });
};

/**
 * Creates contextual help with custom placement and standardized styling.
 *
 * @param title - The heading/title for the contextual help.
 * @param content - The main content (can be text, JSX, or complex content).
 * @param placement - Position of the help popup relative to the trigger element.
 * @returns A React element representing the configured ContextualHelp.
 */
export const createPlacedContextualHelp = (
    title: string,
    content: React.ReactNode,
    placement: "start" | "end" | "top" | "bottom"
) => {
    return createContextualHelp({
        title,
        content,
        variant: "info",
        placement,
        className: "contextualHelp",
    });
};

// Export the main function as default
export default createContextualHelp;
