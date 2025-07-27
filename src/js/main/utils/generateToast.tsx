import { ToastQueue } from "@react-spectrum/toast";
import { openGithubWithLatestRelease } from "./Socials";

const BASETIMEOUT = 2000;

export enum ToastType {
    Positive = 1,
    Negative,
    Info,
    Update
}

export function generateToast(value: ToastType, message: string): void {
    switch (value) {
        case ToastType.Positive:
            ToastQueue.positive(message, { timeout: BASETIMEOUT });
            break;
        case ToastType.Negative:
            ToastQueue.negative(message, { timeout: BASETIMEOUT });
            break;
        case ToastType.Info:
            ToastQueue.info(message, { timeout: BASETIMEOUT });
            break;
        case ToastType.Update:
            ToastQueue.info(message, {
                actionLabel: "Update",
                onAction: () => openGithubWithLatestRelease(),
                shouldCloseOnAction: true,
            });
            break;
        default:
            ToastQueue.info("Unknown operation. Please try again.", { timeout: BASETIMEOUT });
            break;
    }
}
