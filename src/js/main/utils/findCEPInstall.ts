import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

console.log('=== Running findCEPInstall.ts ===');

const EXTENSION_KEYWORD = 'TheAnimeScripter';

const getWindowsCEPPaths = (): string[] => {
  const appData = process.env.APPDATA || '';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';

  return [
    path.join(appData, 'Adobe', 'CEP', 'extensions'),
    path.join(programFilesX86, 'Common Files', 'Adobe', 'CEP', 'extensions'),
    path.join(programFiles, 'Common Files', 'Adobe', 'CEP', 'extensions'),
  ];
};

function findExtensionDirs(baseDirs: string[], keyword: string): string[] {
  const found: string[] = [];
  for (const baseDir of baseDirs) {
    console.log(`Checking: ${baseDir}`);
    if (!fs.existsSync(baseDir)) {
      console.log(`  (Does not exist)`);
      continue;
    }
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    if (entries.length === 0) {
      console.log(`  (Empty directory)`);
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        console.log(`  Found directory: ${entry.name}`);
        if (entry.name.toLowerCase().includes(keyword.toLowerCase())) {
          found.push(path.join(baseDir, entry.name));
        }
      }
    }
  }
  return found;
}

function main() {
  if (os.platform() !== 'win32') {
    console.log('This script currently only supports Windows.');
    process.exit(1);
  }

  const cepPaths = getWindowsCEPPaths();
  const foundDirs = findExtensionDirs(cepPaths, EXTENSION_KEYWORD);

  if (foundDirs.length > 0) {
    console.log('Found "TheAnimeScripter" extension in:');
    foundDirs.forEach(dir => console.log(dir));
  } else {
    console.log('"TheAnimeScripter" extension not found in standard CEP locations.');
  }
}

main();

export { getWindowsCEPPaths, findExtensionDirs };
