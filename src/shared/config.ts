// Safe configuration for both CEP and ExtendScript environments
// This file must not import any Node.js modules to remain compatible with ExtendScript
import { version } from "../../package.json";

export const config = {
  id: "TheAnimeScripter",
  displayName: "The Anime Scripter",
  version: version,
  company: "Company"
};