import { ToastQueue } from "@react-spectrum/toast";
import { openGithubWithLatestRelease } from "./Socials";

const BASETIMEOUT = 2000;

export function generateToast(value: number, message: string): void {
    switch (value) {
        case 1:
            ToastQueue.positive(message, { timeout: BASETIMEOUT });
            break;
        case 2:
            ToastQueue.negative(message, { timeout: BASETIMEOUT });
            break;
        case 3:
            ToastQueue.info(message, { timeout: BASETIMEOUT });
            break;
        case 4:
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
