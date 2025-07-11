// Generic localStorage helpers

/**
 * Gets an item from localStorage and parses it as a number if possible.
 * @param key - The localStorage key
 * @param defaultValue - The value to return if not found or invalid
 * @returns The stored value or defaultValue
 */
export function getNumberItem(key: string, defaultValue: number): number {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            const num = parseInt(stored, 10);
            if (!isNaN(num)) {
                return num;
            }
        }
    } catch (error) {
        console.warn(`Failed to get item '${key}':`, error);
    }
    return defaultValue;
}

/**
 * Sets a number item in localStorage.
 * @param key - The localStorage key
 * @param value - The number to store
 */
export function setNumberItem(key: string, value: number): void {
    try {
        localStorage.setItem(key, value.toString());
    } catch (error) {
        console.warn(`Failed to set item '${key}':`, error);
    }
}

/**
 * Removes an item from localStorage.
 * @param key - The localStorage key
 */
export function removeItem(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn(`Failed to remove item '${key}':`, error);
    }
}
