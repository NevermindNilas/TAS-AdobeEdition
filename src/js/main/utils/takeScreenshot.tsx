import { evalTS } from "../../lib/utils/bolt";
import { generateToast } from "./generateToast";
import { path, fs, https, http, child_process } from "../../lib/cep/node";

const execTakeScreenshot = async () => {
    let path = await evalTS("getPath");


    path = path.split("\\").slice(0, -1).join("\\");

    if (!fs.existsSync(`${path}/TAS-Screenshots`)) {
        fs.mkdirSync(`${path}/TAS-Screenshots`);
    }

    path = `${path}/TAS-Screenshots`;

    let output = `${path}/screenshot-${Math.floor(Math.random() * 100000)}.png`;

    const result = await evalTS("screenshot", output);
    if (result === true) {
        generateToast(1, "Screenshot saved successfully!");
        child_process.exec(`start "" "${path}"`);
    } else {
        generateToast(2, "Failed to take screenshot.");
    }
};

export default execTakeScreenshot;
