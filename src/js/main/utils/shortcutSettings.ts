export interface ShortcutBinding {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
    description: string;
    action: string;
}

export interface ShortcutSettings {
    enabled: boolean;
    bindings: Record<string, ShortcutBinding>;
}

const STORAGE_KEY = 'tas-keyboard-shortcuts';

export const DEFAULT_SHORTCUTS: Record<string, ShortcutBinding> = {
    'tab_chain': {
        key: '1',
        ctrlKey: true,
        description: 'Switch to Chain tab',
        action: 'tab:Chain'
    },
    'tab_extra': {
        key: '2',
        ctrlKey: true,
        description: 'Switch to Extra tab',
        action: 'tab:Extra'
    },
    'tab_graph': {
        key: '4',
        ctrlKey: true,
        description: 'Switch to Graph tab',
        action: 'tab:Graph'
    },
    'tab_logs': {
        key: '5',
        ctrlKey: true,
        description: 'Switch to Logs tab',
        action: 'tab:Logs'
    },
    'tab_about': {
        key: '6',
        ctrlKey: true,
        description: 'Switch to About tab',
        action: 'tab:About'
    },
    'nav_prev': {
        key: 'ArrowLeft',
        ctrlKey: true,
        description: 'Previous tab',
        action: 'nav:prev'
    },
    'nav_next': {
        key: 'ArrowRight',
        ctrlKey: true,
        description: 'Next tab',
        action: 'nav:next'
    }
};

export function loadShortcutSettings(): ShortcutSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            
            return {
                enabled: parsed.enabled ?? true,
                bindings: { ...DEFAULT_SHORTCUTS, ...parsed.bindings }
            };
        }
    } catch (error) {
        console.warn('Failed to load shortcut settings:', error);
    }
    
    return {
        enabled: true,
        bindings: DEFAULT_SHORTCUTS
    };
}

export function saveShortcutSettings(settings: ShortcutSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save shortcut settings:', error);
    }
}

export function resetShortcuts(): ShortcutSettings {
    const defaults: ShortcutSettings = {
        enabled: true,
        bindings: DEFAULT_SHORTCUTS
    };
    saveShortcutSettings(defaults);
    return defaults;
}

export function updateShortcutBinding(
    settings: ShortcutSettings,
    bindingId: string,
    newBinding: Partial<ShortcutBinding>
): ShortcutSettings {
    const updated = {
        ...settings,
        bindings: {
            ...settings.bindings,
            [bindingId]: {
                ...settings.bindings[bindingId],
                ...newBinding
            }
        }
    };
    saveShortcutSettings(updated);
    return updated;
}

export function matchesBinding(event: KeyboardEvent, binding: ShortcutBinding): boolean {
    if (event.key.toLowerCase() !== binding.key.toLowerCase()) {
        return false;
    }
    
    if (binding.ctrlKey && !event.ctrlKey) return false;
    if (binding.altKey && !event.altKey) return false;
    if (binding.shiftKey && !event.shiftKey) return false;
    if (binding.metaKey && !event.metaKey) return false;
    
    const expectedCtrl = binding.ctrlKey || binding.metaKey;
    const hasCtrlOrMeta = event.ctrlKey || event.metaKey;
    
    if (expectedCtrl !== hasCtrlOrMeta) return false;
    if ((binding.altKey || false) !== event.altKey) return false;
    if ((binding.shiftKey || false) !== event.shiftKey) return false;
    
    return true;
}

export function formatBinding(binding: ShortcutBinding, platform: string = process.platform): string {
    const parts: string[] = [];
    
    if (binding.ctrlKey || binding.metaKey) {
        parts.push(platform === 'darwin' ? 'Cmd' : 'Ctrl');
    }
    if (binding.altKey) {
        parts.push(platform === 'darwin' ? 'Opt' : 'Alt');
    }
    if (binding.shiftKey) {
        parts.push('Shift');
    }
    
    let keyDisplay = binding.key;
    if (binding.key.startsWith('Arrow')) {
        keyDisplay = binding.key.replace('Arrow', '');
    }
    parts.push(keyDisplay);
    
    return parts.join('+');
}

export function findConflicts(bindings: Record<string, ShortcutBinding>): Array<[string, string]> {
    const conflicts: Array<[string, string]> = [];
    const entries = Object.entries(bindings);
    
    for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
            const [id1, binding1] = entries[i];
            const [id2, binding2] = entries[j];
            
            if (bindingsEqual(binding1, binding2)) {
                conflicts.push([id1, id2]);
            }
        }
    }
    
    return conflicts;
}

function bindingsEqual(a: ShortcutBinding, b: ShortcutBinding): boolean {
    return (
        a.key.toLowerCase() === b.key.toLowerCase() &&
        (a.ctrlKey || false) === (b.ctrlKey || false) &&
        (a.altKey || false) === (b.altKey || false) &&
        (a.shiftKey || false) === (b.shiftKey || false) &&
        (a.metaKey || false) === (b.metaKey || false)
    );
}

export function getKeyEventsInterest(settings: ShortcutSettings): string {
    if (!settings.enabled) {
        return '';
    }
    
    const interests: string[] = [];
    
    Object.values(settings.bindings).forEach(binding => {
        const keyCode = getKeyCode(binding.key);
        if (keyCode) {
            const modifiers = [
                binding.ctrlKey ? 'true' : 'false',
                binding.altKey ? 'true' : 'false',
                binding.shiftKey ? 'true' : 'false'
            ].join(',');
            
            interests.push(`keydown,${keyCode},${modifiers}`);
        }
    });
    
    return JSON.stringify({ keyEventsInterest: interests.join(';') });
}

function getKeyCode(key: string): number | null {
    const keyCodeMap: Record<string, number> = {
        '0': 48, '1': 49, '2': 50, '3': 51, '4': 52,
        '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,
        'ArrowLeft': 37, 'ArrowUp': 38, 'ArrowRight': 39, 'ArrowDown': 40,
        'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69, 'f': 70,
        'g': 71, 'h': 72, 'i': 73, 'j': 74, 'k': 75, 'l': 76,
        'm': 77, 'n': 78, 'o': 79, 'p': 80, 'q': 81, 'r': 82,
        's': 83, 't': 84, 'u': 85, 'v': 86, 'w': 87, 'x': 88,
        'y': 89, 'z': 90,
    };
    
    return keyCodeMap[key.toLowerCase()] || null;
}
