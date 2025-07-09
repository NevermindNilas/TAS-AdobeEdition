import { getTASPaths } from "./helpers";

// Simple test to log all TAS paths
export function testGetTASPaths() {
    const paths = getTASPaths();
    console.log("TAS Paths:", paths);
    // Check that all expected keys exist and are strings
    const requiredKeys = [
        "appDataPath",
        "tasFolder",
        "tasAppDataPath",
        "pythonExePath",
        "mainPyPath",
        "tasRoamingPath",
        "logTxtPath",
        "progressLogPath"
    ];
    for (const key of requiredKeys) {
        if (!(key in paths)) {
            throw new Error(`Missing key: ${key}`);
        }
        // Use type assertion to avoid TS error
        if (typeof (paths as Record<string, string>)[key] !== "string") {
            throw new Error(`Key ${key} is not a string`);
        }
    }
    return true;
}

// Run the test if this file is executed directly
if (require.main === module) {
    testGetTASPaths();
    console.log("getTASPaths test passed.");
}
