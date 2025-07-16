import { CEP_Config } from "vite-cep-plugin";
import { version } from "./package.json";


const config: CEP_Config = {
  version,
  id: "TheAnimeScripter",
  displayName: "The Anime Scripter",
  symlink: "local",
  port: 3000,
  servePort: 5000,
  startingDebugPort: 8860,
  extensionManifestVersion: 6.0,
  requiredRuntimeVersion: 9.0,
  hosts: [
    { name: "AEFT", version: "[0.0,99.9]" },
    { name: "PPRO", version: "[0.0,99.9]" }
  ],
  type: "Panel",
  iconDarkNormal: "./src/assets/light-icon.png",
  iconNormal: "./src/assets/dark-icon.png",
  iconDarkNormalRollOver: "./src/assets/light-icon.png",
  iconNormalRollOver: "./src/assets/dark-icon.png",
  parameters: ["--enable-nodejs", "--mixed-context"],
  width: 500,
  height: 500,

  panels: [
    {
      mainPath: "./main/index.html",
      name: "main",
      panelDisplayName: "The Anime Scripter",
      autoVisible: true,
      width: 500,
      height: 500,
    },

  ],  build: {
    jsxBin: "replace",
    sourceMap: false,
  },
  zxp: {
    country: "US",
    province: "CA",
    org: "MyCompany",
    password: "mypassword",
    tsa: [
      "http://timestamp.digicert.com/", // Windows Only
    ],
    sourceMap: false,
    jsxBin: "replace",
  },
  installModules: [],
  copyAssets: [],
  copyZipAssets: ["/LICENSE.md", "/README.txt"],
};
export default config;
