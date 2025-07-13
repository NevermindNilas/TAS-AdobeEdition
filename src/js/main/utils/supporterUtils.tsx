import { useState, useEffect } from 'react';

export interface Supporter {
    name: string;
    coffees: number;
    totalAmount: number;
    message: string;
    supportedAt: string | null;
    type: "one-time" | "member";
}

export interface SupporterData {
    supporters: Supporter[];
}

import supportersJson from './supporters.json';

/**
 * Gets the list of supporter usernames from the local supporters.json file (no HTTP, direct import)
 * supporters.json format: { "usernames": [ ... ] }
 */
export const fetchSupporterUsernames = (): string[] => {
    if (!supportersJson || !Array.isArray((supportersJson as any).usernames)) {
        return [];
    }
    return (supportersJson as { usernames: string[] }).usernames;
};

/**
 * React hook to manage supporter usernames with loading state
 */
export const useSupporterUsernames = () => {
    const [usernames, setUsernames] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            setLoading(true);
            setError(null);
            const data = fetchSupporterUsernames();
            setUsernames(data);
        } catch (err) {
            console.error('Error loading supporter usernames:', err);
            setError('Failed to load supporter usernames');
            setUsernames([]);
        } finally {
            setLoading(false);
        }
    }, []);

    return { usernames, loading, error };
};
