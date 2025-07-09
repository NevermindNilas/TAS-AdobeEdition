interface UpdateCheckResult {
    latestVersion: string;
    isUpdateAvailable: boolean;
}

const checkForUpdates = async (tasVersion: string): Promise<UpdateCheckResult> => {
    const apiUrl = `https://api.github.com/repos/NevermindNilas/TheAnimeScripter/releases/latest`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch latest release: ${response.statusText}`);
        }

        const releaseData = await response.json();
        let remoteVersion = releaseData.tag_name;

        // Remove 'v' prefix if present
        if (remoteVersion.startsWith("v")) {
            remoteVersion = remoteVersion.substring(1);
        }

        return {
            latestVersion: remoteVersion,
            isUpdateAvailable: remoteVersion !== tasVersion,
        };
    } catch (error) {
        console.error("Error fetching latest release:", error);
        return {
            latestVersion: "",
            isUpdateAvailable: false,
        };
    }
};

export default checkForUpdates;
