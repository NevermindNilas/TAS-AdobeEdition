import { generateToast } from "./generateToast";
import { ActionButton, Flex } from "@adobe/react-spectrum";
import { BiSolidDonateHeart } from "react-icons/bi";
import { FaGithub } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FaDiscord } from "react-icons/fa";
import { FaTwitter } from "react-icons/fa";

const openDiscord = () => {
    generateToast(3, "Opening Discord server...");
    const discordServer = "https://discord.gg/GVHrTQRMNq";
    // Open the Discord server
    window.cep.util.openURLInDefaultBrowser(discordServer);
};

const openTwitter = () => {
    generateToast(3, "Opening Twitter...");
    const twitter = "https://X.com/NevermindNilas";
    // Open the Twitter page
    window.cep.util.openURLInDefaultBrowser(twitter);
};

const openGitHub = () => {
    generateToast(3, "Opening GitHub repository...");
    const githubRepo = "https://github.com/NevermindNilas/TheAnimeScripter";
    // Open the GitHub repo
    window.cep.util.openURLInDefaultBrowser(githubRepo);
};

const openGithubWithLatestRelease = () => {
    generateToast(3, "Opening GitHub latest release...");
    const githubRepo = "https://github.com/NevermindNilas/TheAnimeScripter/releases/latest";
    // Open the GitHub repo
    window.cep.util.openURLInDefaultBrowser(githubRepo);
};

const openChangelog = () => {
    generateToast(3, "Opening Changelog...");
    const githubChangelog =
        "https://github.com/NevermindNilas/TheAnimeScripter/blob/main/CHANGELOG.MD";
    // Open the GitHub changelog
    window.cep.util.openURLInDefaultBrowser(githubChangelog);
};

const openYoutube = () => {
    generateToast(3, "Opening YouTube channel...");
    const youtubeChannel = "https://www.youtube.com/channel/UCcUjhu2KtPEFplu6V-_cSew";
    // Open the YouTube channel
    window.cep.util.openURLInDefaultBrowser(youtubeChannel);
};

const openBuyMeACoffee = () => {
    generateToast(3, "Opening BuyMeACoffee page...");
    const buyMeACoffee = "https://buymeacoffee.com/nilas";
    // Open the BuyMeACoffee page
    window.cep.util.openURLInDefaultBrowser(buyMeACoffee);
};

const openGitHubWiki = () => {
    generateToast(3, "Opening GitHub Wiki...");
    const githubWiki =
        "https://github.com/NevermindNilas/TheAnimeScripter/wiki/Installation-Guide-for-TAS%E2%80%90Adobe-Edition-in-case-of-errors";
    // Open the GitHub wiki
    window.cep.util.openURLInDefaultBrowser(githubWiki);
};

const openParameters = () => {
    generateToast(3, "Opening Parameters...");
    const parameters = "https://github.com/NevermindNilas/TheAnimeScripter/blob/main/PARAMETERS.MD";
    // Open the Parameters
    window.cep.util.openURLInDefaultBrowser(parameters);
};

const openReportIssue = () => {
    generateToast(3, "Opening Report Issue...");
    const reportIssue =
        "https://github.com/NevermindNilas/TheAnimeScripter/issues?q=sort:updated-desc+is:issue+is:open";
    // Open the Report Issue
    window.cep.util.openURLInDefaultBrowser(reportIssue);
};

export {
    openDiscord,
    openTwitter,
    openGitHub,
    openYoutube,
    openBuyMeACoffee,
    openGithubWithLatestRelease,
    openGitHubWiki,
    openChangelog,
    openParameters,
    openReportIssue,
};

const WIDTH = 0;
const SIZE = 18;

export function socialsPanel() {
    return (
        <div>
            <Flex direction="row" marginTop={10} width="100%">
                <ActionButton
                    UNSAFE_className="actionButtonSocial"
                    isQuiet
                    onPress={openTwitter}
                    width={WIDTH}
                >
                    <FaTwitter className="socialIcon" size={SIZE} />
                </ActionButton>
                <ActionButton
                    UNSAFE_className="actionButtonSocial"
                    isQuiet
                    onPress={openDiscord}
                    width={WIDTH}
                >
                    <FaDiscord className="socialIcon" size={SIZE} />
                </ActionButton>
                <ActionButton
                    UNSAFE_className="actionButtonSocial"
                    isQuiet
                    onPress={openGitHub}
                    width={WIDTH}
                >
                    <FaGithub className="socialIcon" size={SIZE} />
                </ActionButton>
                <ActionButton
                    UNSAFE_className="actionButtonSocial"
                    isQuiet
                    onPress={openYoutube}
                    width={WIDTH}
                >
                    <FaYoutube className="socialIcon" size={SIZE} />
                </ActionButton>
            </Flex>
        </div>
    );
}
