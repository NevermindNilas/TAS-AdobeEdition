import { useState, useEffect, useCallback } from 'react';

export interface ReleaseInfo {
    version: string;
    tagName: string;
    name: string;
    body: string;
    publishedAt: string;
    htmlUrl: string;
}

export interface ChangelogState {
    releases: ReleaseInfo[];
    loading: boolean;
    error: string | null;
}

const GITHUB_API_URL = 'https://api.github.com/repos/NevermindNilas/TheAnimeScripter/releases';
const CACHE_KEY = 'tas_changelog_cache';
const CACHE_DURATION_MS = 30 * 60 * 1000;

interface CachedData {
    releases: ReleaseInfo[];
    timestamp: number;
}

const getCachedChangelog = (): ReleaseInfo[] | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const data: CachedData = JSON.parse(cached);
        const now = Date.now();

        if (now - data.timestamp < CACHE_DURATION_MS) {
            return data.releases;
        }
        return null;
    } catch {
        return null;
    }
};

const setCachedChangelog = (releases: ReleaseInfo[]): void => {
    try {
        const data: CachedData = {
            releases,
            timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
    }
};


export const fetchChangelog = async (count: number = 5): Promise<ReleaseInfo[]> => {
    const cached = getCachedChangelog();
    if (cached && cached.length >= count) {
        return cached.slice(0, count);
    }

    const response = await fetch(`${GITHUB_API_URL}?per_page=${count}`, {
        headers: {
            'Accept': 'application/vnd.github.v3+json',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch changelog: ${response.statusText}`);
    }

    const data = await response.json();

    const releases: ReleaseInfo[] = data.map((release: any) => ({
        version: release.tag_name.replace(/^v/, ''),
        tagName: release.tag_name,
        name: release.name || release.tag_name,
        body: release.body || '',
        publishedAt: release.published_at,
        htmlUrl: release.html_url,
    }));

    setCachedChangelog(releases);

    return releases;
};


export const useChangelog = (count: number = 5) => {
    const [state, setState] = useState<ChangelogState>({
        releases: [],
        loading: true,
        error: null,
    });

    const refresh = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
            const releases = await fetchChangelog(count);
            setState({
                releases,
                loading: false,
                error: null,
            });
        } catch (err) {
            console.error('Error fetching changelog:', err);
            setState({
                releases: [],
                loading: false,
                error: err instanceof Error ? err.message : 'Failed to fetch changelog',
            });
        }
    }, [count]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { ...state, refresh };
};


export const formatReleaseDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateString;
    }
};
