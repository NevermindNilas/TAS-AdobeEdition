import { useState, useEffect } from 'react';

export interface Supporter {
    name: string;
    tier: string;
    coffees: number;
    totalAmount: number;
    message: string;
    supportedAt: string;
}

export interface SupporterData {
    lastUpdated: string;
    supporters: Supporter[];
}

/**
 * Fetches supporter data from the local supporters.json file
 */
export const fetchSupporters = async (): Promise<SupporterData> => {
    try {
        const response = await fetch('./data/supporters.json', {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SupporterData = await response.json();

        
        // Validate the data structure
        if (!data || !data.supporters || !Array.isArray(data.supporters)) {
            throw new Error('Invalid data structure received');
        }

        return data;
    } catch (error) {
        console.warn('Failed to fetch supporters from local file:', error);
        // Return empty data structure on error
        return {
            lastUpdated: new Date().toISOString(),
            supporters: []
        };
    }
};

/**
 * React hook to manage supporter data with loading state
 */
export const useSupporters = () => {
    const [supporters, setSupporters] = useState<SupporterData>({ lastUpdated: '', supporters: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSupporters = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchSupporters();
                setSupporters(data);
            } catch (err) {
                console.error('Error loading supporters:', err);
                setError('Failed to load supporters');
                // Set empty supporters array on error
                setSupporters({ lastUpdated: '', supporters: [] });
            } finally {
                setLoading(false);
            }
        };

        loadSupporters();
    }, []);

    return { supporters, loading, error };
};

/**
 * Formats supporter display text based on tier
 */
export const formatSupporterDisplay = (supporter: Supporter): string => {
    if (supporter.tier === 'Supporter') {
        return `• ${supporter.name}`;
    } else {
        return `• ${supporter.name} - ${supporter.tier} Tier`;
    }
};

/**
 * Gets the last updated timestamp in a readable format
 */
