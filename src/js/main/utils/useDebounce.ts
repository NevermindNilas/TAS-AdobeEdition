// Custom debounce hook for async functions
import { useRef } from "react";

export function useDebounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
    return (...args: Parameters<F>): Promise<ReturnType<F>> => {
        return new Promise(resolve => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
            timeoutId.current = setTimeout(() => {
                timeoutId.current = null;
                resolve(func(...args));
            }, waitFor);
        });
    };
}
