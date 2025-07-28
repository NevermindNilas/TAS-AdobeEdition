import { CEP_Config } from "vite-cep-plugin";
import { version } from "./package.json";
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

// Load environment variables
dotenv.config();

// Generate a secure password if none is provided
function generateSecurePassword(): string {
  if (process.env.NODE_ENV === 'development') {
    console.warn('WARNING: Using generated password for ZXP signing. Set ZXP_PASSWORD in .env for production.');
  }
  return crypto.randomBytes(16).toString('base64');
}

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
    { name: "PPRO", version: "[0.0,99.9]" }, 
  ],

  type: "Panel",
  iconDarkNormal: "./src/assets/icon.png",
  iconNormal: "./src/assets/icon.png",
  iconDarkNormalRollOver: "./src/assets/icon.png",
  iconNormalRollOver: "./src/assets/icon.png",
  parameters: ["--enable-nodejs", "--mixed-context"],
  width: 500,
  height: 550,

  panels: [
    {
      mainPath: "./main/index.html",
      name: "main",
      panelDisplayName: "The Anime Scripter", 
      autoVisible: true,
      width: 600,
      height: 650,
    },
  ],
  build: {
    jsxBin: "off",
    sourceMap: true,
  },
  zxp: {
    country: "US",
    province: "CA",
    org: "Company",
    password: process.env.ZXP_PASSWORD || generateSecurePassword(),
    tsa: [
      "http://timestamp.digicert.com/", // Windows Only
      "http://timestamp.apple.com/ts01", // MacOS Only
    ],
    allowSkipTSA: false,
    sourceMap: false,
    jsxBin: "replace",
  },
  installModules: [],
  copyAssets: [],
  copyZipAssets: ["/LICENSE.md", "/README.txt"],
};
export default config;
