import { evalTS } from "../../lib/utils/bolt";
import { generateToast } from "./generateToast";
const execPrecompose = async () => {
    const result = await evalTS("precompose");

    // if result is a string, then it's an error
    if (typeof result === "string") {
        generateToast(2, result);
        return;
    } else if (result === Boolean(false)) {
        generateToast(2, "Precompose failed");
        return;
    } else if (result === Boolean(true)) {
        generateToast(1, "Precompose completed");
        return;
    }
};

export default execPrecompose;
