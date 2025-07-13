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

import supportersData from './supporters.json';

/**
 * Gets supporter data from the local supporters.json file (no HTTP, direct import)
 */
export const fetchSupporters = (): SupporterData => {
    // Validate the data structure
    if (!supportersData || !supportersData.supporters || !Array.isArray(supportersData.supporters)) {
        return {
            supporters: []
        };
    }
    // Normalize data: convert totalAmount to number, supportedAt to string|null, ensure type is set
    const normalizedSupporters: Supporter[] = supportersData.supporters.map((s: any) => ({
        ...s,
        totalAmount: typeof s.totalAmount === "string" ? parseFloat(s.totalAmount) : s.totalAmount,
        supportedAt: s.supportedAt === undefined ? null : s.supportedAt,
        type: s.type === "member" ? "member" : "one-time"
    }));
    return {
        supporters: normalizedSupporters
    };
};

/**
 * React hook to manage supporter data with loading state
 */
export const useSupporters = () => {
    const [supporters, setSupporters] = useState<SupporterData>({ supporters: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            setLoading(true);
            setError(null);
            const data = fetchSupporters();
            setSupporters(data);
        } catch (err) {
            console.error('Error loading supporters:', err);
            setError('Failed to load supporters');
            setSupporters({ supporters: [] });
        } finally {
            setLoading(false);
        }
    }, []);

    return { supporters, loading, error };
};

/**
 * Formats supporter display text based on supporter type
 */
export const formatSupporterDisplay = (supporter: Supporter): string => {
    if (supporter.type === "member") {
        return `• ${supporter.name} (Member)`;
    } else {
        return `• ${supporter.name}`;
    }
};
