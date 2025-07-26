import { useState, useCallback, useRef } from "react";

export interface LogManager {
    logs: string[];
    addLogs: (newLogs: string[]) => void;
    clearLogs: () => void;
    setLogs: (logs: string[]) => void;
    logCount: number;
}

export function useLogManager(): LogManager {
    const [logs, setLogsState] = useState<string[]>([]);
    const logsRef = useRef<string[]>([]);

    const setLogs = useCallback((newLogs: string[]) => {
        logsRef.current = [...newLogs];
        setLogsState([...newLogs]);
    }, []);

    const addLogs = useCallback((newLogs: string[]) => {
        if (newLogs.length === 0) return;
        
        const updatedLogs = [...logsRef.current, ...newLogs];
        logsRef.current = updatedLogs;
        setLogsState(updatedLogs);
    }, []);

    const clearLogs = useCallback(() => {
        logsRef.current = [];
        setLogsState([]);
    }, []);

    return {
        logs,
        addLogs,
        clearLogs,
        setLogs,
        logCount: logs.length
    };
}