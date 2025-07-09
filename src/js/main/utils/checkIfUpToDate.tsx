// const githubRepo = "https://github.com/NevermindNilas/TheAnimeScripter";

const CheckIfUpToDate = async (
    tasVersion: string
): Promise<{ latestVersion: string; isUpToDate: boolean }> => {
    try {
        const response = await fetch(
            "https://api.github.com/repos/NevermindNilas/TheAnimeScripter/releases/latest"
        );
        const data = await response.json();
        let latestVersion = data.tag_name;
        latestVersion = latestVersion.replace(/^v/, ""); // remove the "v" from the version number

        // Convert version strings to arrays of numbers for comparison
        const tasVersionNumbers = tasVersion.split(".").map(Number);
        const latestVersionNumbers = latestVersion.split(".").map(Number);

        // Compare versions, if tasVersion > latestVersion, then it's up to date otherwise it's not
        // more safer than comparing strings and also works for versions like 1.10.0 and 1.9.0
        let isUpToDate = true;
        for (let i = 0; i < tasVersionNumbers.length; i++) {
            if (latestVersionNumbers[i] > tasVersionNumbers[i]) {
                isUpToDate = false;
                break;
            } else if (latestVersionNumbers[i] < tasVersionNumbers[i]) {
                break;
            }
        }

        console.log("Fetched latest version:", latestVersion);
        console.log("Is up to date:", isUpToDate);

        return { latestVersion, isUpToDate };
    } catch (error) {
        console.error("Failed to check if up to date:", error);
        return { latestVersion: "unknown", isUpToDate: false };
    }
};

export default CheckIfUpToDate;
