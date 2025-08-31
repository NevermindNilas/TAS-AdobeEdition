import { https } from "./src/js/lib/cep/node";

// Simple test to check if TAS-2.4.1 pre-release exists
const testCheckPreRelease = async () => {
    console.log("Checking for TAS-2.4.1 pre-release...");

    try {
        const apiUrl = "https://api.github.com/repos/NevermindNilas/TheAnimeScripter/releases";

        https.get(apiUrl, { headers: { "User-Agent": "Node.js" } }, (response) => {
            let data = "";

            response.on("data", (chunk) => {
                data += chunk;
            });

            response.on("end", () => {
                try {
                    const releases = JSON.parse(data);
                    const targetRelease = releases.find((r: any) => r.tag_name === "TAS-2.4.1");

                    if (targetRelease) {
                        console.log("✅ Found TAS-2.4.1 release!");
                        console.log(`📦 Tag: ${targetRelease.tag_name}`);
                        console.log(`🏷️  Name: ${targetRelease.name}`);
                        console.log(`🔖 Type: ${targetRelease.prerelease ? 'Pre-release' : 'Release'}`);
                        console.log(`📅 Published: ${targetRelease.published_at}`);
                        console.log(`📝 Body: ${targetRelease.body?.substring(0, 200)}...`);

                        // Check for Windows .7z asset
                        const windowsAsset = targetRelease.assets.find((asset: any) => {
                            const name = asset.name.toLowerCase();
                            return name.includes("windows") &&
                                   name.endsWith(".7z") &&
                                   !name.includes("linux") &&
                                   !name.includes("adobeedition");
                        });

                        if (windowsAsset) {
                            console.log(`📁 Windows asset found: ${windowsAsset.name}`);
                            console.log(`📊 Size: ${(windowsAsset.size / 1024 / 1024).toFixed(2)} MB`);
                            console.log(`🔗 Download URL: ${windowsAsset.browser_download_url}`);
                        } else {
                            console.log("❌ No suitable Windows .7z asset found");
                        }
                    } else {
                        console.log("❌ TAS-2.4.1 release not found");
                        console.log("Available releases:");
                        releases.slice(0, 5).forEach((r: any) => {
                            console.log(`  - ${r.tag_name} (${r.prerelease ? 'pre-release' : 'release'})`);
                        });
                    }
                } catch (parseError) {
                    console.error("Error parsing response:", parseError);
                }
            });
        }).on("error", (err) => {
            console.error("Error fetching releases:", err);
        });
    } catch (error) {
        console.error("Test failed:", error);
    }
};

// Run the test
testCheckPreRelease();
