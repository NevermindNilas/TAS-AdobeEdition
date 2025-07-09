import { evalTS } from "../../lib/utils/bolt";
import { generateToast } from "./generateToast";

const execClearCache = async () => {
    generateToast(3, "Clearing cache...");
    evalTS("clear");
};

export default execClearCache;
