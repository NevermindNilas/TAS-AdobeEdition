/**
 * UTF-8 Path Utilities
 * Provides proper UTF-8 handling for file paths and I/O operations
 * to support international characters like Hindi, Japanese, Chinese, etc.
 */

import { fs, path } from "../../lib/cep/node";

/**
 * Ensures a string is properly encoded as UTF-8
 * @param str - The string to encode
 * @returns UTF-8 encoded string
 */
export function ensureUtf8String(str: string): string {
    if (!str) return str;
    
    try {
        // Convert to Buffer and back to ensure proper UTF-8 encoding
        // Check if Buffer is available (it might not be in all environments)
        if (typeof Buffer !== 'undefined') {
            const buffer = Buffer.from(str, 'utf8');
            return buffer.toString('utf8');
        } else {
            // Fallback: just return the string as-is
            return str;
        }
    } catch (error) {
        console.warn('UTF-8 encoding warning:', error);
        return str;
    }
}

/**
 * Safely joins path components with UTF-8 support
 * @param paths - Path components to join
 * @returns UTF-8 safe joined path
 */
export function safePathJoin(...paths: string[]): string {
    const utf8Paths = paths.map(p => ensureUtf8String(p));
    // Fallback to basic path joining if path module is not available
    if (!path || !path.join) {
        return utf8Paths.join('/').replace(/\/+/g, '/');
    }
    return path.join(...utf8Paths);
}

/**
 * Safely resolves a path with UTF-8 support
 * @param pathStr - Path to resolve
 * @returns UTF-8 safe resolved path
 */
export function safePathResolve(pathStr: string): string {
    const utf8Path = ensureUtf8String(pathStr);
    // Fallback if path module is not available
    if (!path || !path.resolve) {
        return utf8Path;
    }
    return path.resolve(utf8Path);
}

/**
 * Safely gets the directory name with UTF-8 support
 * @param pathStr - Path to get directory from
 * @returns UTF-8 safe directory path
 */
export function safePathDirname(pathStr: string): string {
    const utf8Path = ensureUtf8String(pathStr);
    // Fallback if path module is not available
    if (!path || !path.dirname) {
        const lastSlash = utf8Path.lastIndexOf('/');
        const lastBackslash = utf8Path.lastIndexOf('\\');
        const lastSeparator = Math.max(lastSlash, lastBackslash);
        return lastSeparator > 0 ? utf8Path.substring(0, lastSeparator) : utf8Path;
    }
    return path.dirname(utf8Path);
}

/**
 * Safely gets the base name with UTF-8 support
 * @param pathStr - Path to get basename from
 * @param ext - Optional extension to remove
 * @returns UTF-8 safe basename
 */
export function safePathBasename(pathStr: string, ext?: string): string {
    const utf8Path = ensureUtf8String(pathStr);
    // Fallback if path module is not available
    if (!path || !path.basename) {
        const lastSlash = utf8Path.lastIndexOf('/');
        const lastBackslash = utf8Path.lastIndexOf('\\');
        const lastSeparator = Math.max(lastSlash, lastBackslash);
        let basename = lastSeparator >= 0 ? utf8Path.substring(lastSeparator + 1) : utf8Path;
        if (ext && basename.endsWith(ext)) {
            basename = basename.substring(0, basename.length - ext.length);
        }
        return basename;
    }
    return path.basename(utf8Path, ext);
}

/**
 * Safely reads a file with UTF-8 encoding
 * @param filePath - Path to the file
 * @returns File contents as UTF-8 string
 */
export function safeReadFileSync(filePath: string): string {
    const utf8Path = ensureUtf8String(filePath);
    if (!fs || !fs.readFileSync) {
        console.warn('File system not available');
        return '';
    }
    return fs.readFileSync(utf8Path, { encoding: 'utf8' });
}

/**
 * Safely writes a file with UTF-8 encoding
 * @param filePath - Path to the file
 * @param data - Data to write
 */
export function safeWriteFileSync(filePath: string, data: string): void {
    const utf8Path = ensureUtf8String(filePath);
    const utf8Data = ensureUtf8String(data);
    if (!fs || !fs.writeFileSync) {
        console.warn('File system not available');
        return;
    }
    fs.writeFileSync(utf8Path, utf8Data, { encoding: 'utf8' });
}

/**
 * Safely checks if a file exists with UTF-8 path support
 * @param filePath - Path to check
 * @returns True if file exists
 */
export function safeExistsSync(filePath: string): boolean {
    const utf8Path = ensureUtf8String(filePath);
    if (!fs || !fs.existsSync) {
        console.warn('File system not available');
        return false;
    }
    return fs.existsSync(utf8Path);
}

/**
 * Safely creates a directory with UTF-8 path support
 * @param dirPath - Directory path to create
 * @param options - Options for directory creation
 */
export function safeMkdirSync(dirPath: string, options?: { recursive?: boolean }): void {
    const utf8Path = ensureUtf8String(dirPath);
    if (!fs || !fs.mkdirSync) {
        console.warn('File system not available');
        return;
    }
    fs.mkdirSync(utf8Path, options);
}

/**
 * Safely reads directory contents with UTF-8 support
 * @param dirPath - Directory path to read
 * @returns Array of UTF-8 safe filenames
 */
export function safeReaddirSync(dirPath: string): string[] {
    const utf8Path = ensureUtf8String(dirPath);
    if (!fs || !fs.readdirSync) {
        console.warn('File system not available');
        return [];
    }
    const files = fs.readdirSync(utf8Path);
    return files.map(file => ensureUtf8String(file));
}

/**
 * Safely deletes a file with UTF-8 path support
 * @param filePath - Path to the file to delete
 */
export function safeUnlinkSync(filePath: string): void {
    const utf8Path = ensureUtf8String(filePath);
    if (!fs || !fs.unlinkSync) {
        console.warn('File system not available');
        return;
    }
    fs.unlinkSync(utf8Path);
}

/**
 * Safely gets file stats with UTF-8 path support
 * @param filePath - Path to the file
 * @returns File stats
 */
export function safeStatSync(filePath: string): any {
    const utf8Path = ensureUtf8String(filePath);
    if (!fs || !fs.statSync) {
        console.warn('File system not available');
        return { size: 0 };
    }
    return fs.statSync(utf8Path);
}

/**
 * Safely opens a file with UTF-8 path support
 * @param filePath - Path to the file
 * @param flags - File system flags
 * @returns File descriptor
 */
export function safeOpenSync(filePath: string, flags: string): number {
    const utf8Path = ensureUtf8String(filePath);
    if (!fs || !fs.openSync) {
        console.warn('File system not available');
        return -1;
    }
    return fs.openSync(utf8Path, flags);
}

/**
 * Safely reads from a file descriptor with UTF-8 support
 * @param fd - File descriptor
 * @param buffer - Buffer to read into
 * @param offset - Offset in buffer
 * @param length - Number of bytes to read
 * @param position - Position in file
 * @returns Number of bytes read
 */
export function safeReadSync(fd: number, buffer: Buffer, offset: number, length: number, position: number): number {
    if (!fs || !fs.readSync) {
        console.warn('File system not available');
        return 0;
    }
    return fs.readSync(fd, buffer, offset, length, position);
}

/**
 * Safely closes a file descriptor
 * @param fd - File descriptor to close
 */
export function safeCloseSync(fd: number): void {
    if (!fs || !fs.closeSync) {
        console.warn('File system not available');
        return;
    }
    fs.closeSync(fd);
}

/**
 * Properly quotes a path for command line usage with UTF-8 support
 * Handles paths with spaces, special characters, and international characters
 * @param pathStr - The path to quote
 * @returns The properly quoted UTF-8 path
 */
export function quoteUtf8Path(pathStr: string): string {
    const utf8Path = ensureUtf8String(pathStr);
    // Remove any existing quotes and add new ones
    return `"${utf8Path.replace(/"/g, '')}"`;
}

/**
 * Builds a command array with proper UTF-8 path quoting
 * @param parts - Array of command parts where paths should be UTF-8 safe
 * @returns The properly constructed command string
 */
export function buildUtf8Command(parts: string[]): string {
    const utf8Parts = parts.map(part => ensureUtf8String(part));
    return utf8Parts.join(" ");
}

/**
 * Normalizes a path to use forward slashes and ensures UTF-8 encoding
 * Useful for cross-platform compatibility
 * @param pathStr - Path to normalize
 * @returns Normalized UTF-8 path
 */
export function normalizeUtf8Path(pathStr: string): string {
    const utf8Path = ensureUtf8String(pathStr);
    return utf8Path.replace(/\\/g, '/');
}

/**
 * Converts a Windows path to use backslashes with UTF-8 support
 * @param pathStr - Path to convert
 * @returns Windows-style UTF-8 path
 */
export function toWindowsUtf8Path(pathStr: string): string {
    const utf8Path = ensureUtf8String(pathStr);
    return utf8Path.replace(/\//g, '\\');
}

/**
 * Safely creates a random output path with UTF-8 support
 * @param basePath - Base directory path
 * @param subfolder - Subfolder name
 * @param filenamePrefix - Filename prefix
 * @param extension - File extension
 * @returns UTF-8 safe random output path
 */
export function generateUtf8OutputPath(basePath: string, subfolder: string, filenamePrefix: string, extension: string): string {
    const utf8BasePath = ensureUtf8String(basePath);
    const utf8Subfolder = ensureUtf8String(subfolder);
    const utf8Prefix = ensureUtf8String(filenamePrefix);
    const utf8Extension = ensureUtf8String(extension);
    
    const outputFolder = safePathJoin(utf8BasePath, utf8Subfolder);

    // Only try to create directory if file system is available
    try {
        if (!safeExistsSync(outputFolder)) {
            safeMkdirSync(outputFolder, { recursive: true });
        }
    } catch (error) {
        console.warn('Could not create output directory:', error);
    }

    const randomString = Math.random().toString(36).substring(2, 6);
    return safePathJoin(outputFolder, `${utf8Prefix}_${randomString}${utf8Extension}`);
}

/**
 * Sanitizes a filename to be UTF-8 safe while preserving international characters
 * Removes only problematic characters for file systems
 * @param filename - Original filename
 * @returns Sanitized UTF-8 filename
 */
export function sanitizeUtf8Filename(filename: string): string {
    const utf8Name = ensureUtf8String(filename);
    // Remove only characters that are problematic for file systems
    // Keep international characters but remove file system reserved characters
    return utf8Name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
}