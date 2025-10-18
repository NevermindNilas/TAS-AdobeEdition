import React, { useState, useCallback, useEffect } from 'react';
import {
    Flex,
    View,
    Text,
    Switch,
    Button,
    TextField,
    Checkbox,
    Divider,
    AlertDialog,
    DialogTrigger,
    ActionButton,
} from '@adobe/react-spectrum';
import Edit from '@spectrum-icons/workflow/Edit';
import Reset from '@spectrum-icons/workflow/Refresh';
import Alert from '@spectrum-icons/workflow/Alert';

import {
    type ShortcutSettings,
    type ShortcutBinding,
    loadShortcutSettings,
    saveShortcutSettings,
    resetShortcuts,
    formatBinding,
    findConflicts,
} from './shortcutSettings';

interface ShortcutEditorProps {
    bindingId: string;
    binding: ShortcutBinding;
    onUpdate: (id: string, binding: ShortcutBinding) => void;
}

const ShortcutEditor: React.FC<ShortcutEditorProps> = ({ bindingId, binding, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempKey, setTempKey] = useState(binding.key);
    const [tempCtrl, setTempCtrl] = useState(binding.ctrlKey || false);
    const [tempAlt, setTempAlt] = useState(binding.altKey || false);
    const [tempShift, setTempShift] = useState(binding.shiftKey || false);

    const handleSave = useCallback(() => {
        onUpdate(bindingId, {
            ...binding,
            key: tempKey,
            ctrlKey: tempCtrl,
            altKey: tempAlt,
            shiftKey: tempShift,
        });
        setIsEditing(false);
    }, [bindingId, binding, tempKey, tempCtrl, tempAlt, tempShift, onUpdate]);

    const handleCancel = useCallback(() => {
        setTempKey(binding.key);
        setTempCtrl(binding.ctrlKey || false);
        setTempAlt(binding.altKey || false);
        setTempShift(binding.shiftKey || false);
        setIsEditing(false);
    }, [binding]);

    if (isEditing) {
        return (
            <View UNSAFE_style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: '10px', borderRadius: '4px' }}>
                <Flex direction="column" gap="size-100">
                    <Text UNSAFE_style={{ fontSize: '12px', fontWeight: 'bold' }}>{binding.description}</Text>
                    
                    <Flex direction="row" gap="size-100" wrap alignItems="center">
                        <Checkbox isSelected={tempCtrl} onChange={setTempCtrl} UNSAFE_style={{ fontSize: '11px' }}>
                            <Text UNSAFE_style={{ fontSize: '11px' }}>Ctrl/Cmd</Text>
                        </Checkbox>
                        <Checkbox isSelected={tempAlt} onChange={setTempAlt}>
                            <Text UNSAFE_style={{ fontSize: '11px' }}>Alt/Opt</Text>
                        </Checkbox>
                        <Checkbox isSelected={tempShift} onChange={setTempShift}>
                            <Text UNSAFE_style={{ fontSize: '11px' }}>Shift</Text>
                        </Checkbox>
                        <TextField
                            label="Key"
                            value={tempKey}
                            onChange={setTempKey}
                            width="size-1000"
                            placeholder="1, a, ArrowLeft..."
                            isQuiet
                            UNSAFE_style={{ fontSize: '11px' }}
                        />
                    </Flex>
                    
                    <Flex direction="row" gap="size-100" justifyContent="end">
                        <Button variant="cta" onPress={handleSave} UNSAFE_style={{ fontSize: '11px', minHeight: '24px' }}>
                            Save
                        </Button>
                        <Button variant="secondary" onPress={handleCancel} UNSAFE_style={{ fontSize: '11px', minHeight: '24px' }}>
                            Cancel
                        </Button>
                    </Flex>
                </Flex>
            </View>
        );
    }

    return (
        <Flex direction="row" justifyContent="space-between" alignItems="center" UNSAFE_style={{ minHeight: '28px' }}>
            <Flex direction="row" gap="size-200" alignItems="center">
                <Text UNSAFE_style={{ fontSize: '12px', minWidth: '140px' }}>{binding.description}</Text>
                <Text UNSAFE_style={{ fontSize: '11px', opacity: 0.6, fontFamily: 'monospace', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: '3px' }}>
                    {formatBinding(binding)}
                </Text>
            </Flex>
            <ActionButton onPress={() => setIsEditing(true)} isQuiet UNSAFE_style={{ minHeight: '24px' }}>
                <Edit size="S" />
            </ActionButton>
        </Flex>
    );
};

interface ShortcutsSettingsPanelProps {
    onSettingsChange?: (settings: ShortcutSettings) => void;
}

export const ShortcutsSettingsPanel: React.FC<ShortcutsSettingsPanelProps> = ({ onSettingsChange }) => {
    const [settings, setSettings] = useState<ShortcutSettings>(() => loadShortcutSettings());
    const [conflicts, setConflicts] = useState<Array<[string, string]>>([]);

    useEffect(() => {
        const found = findConflicts(settings.bindings);
        setConflicts(found);
    }, [settings.bindings]);

    const handleToggleEnabled = useCallback((enabled: boolean) => {
        const updated = { ...settings, enabled };
        setSettings(updated);
        saveShortcutSettings(updated);
        onSettingsChange?.(updated);
    }, [settings, onSettingsChange]);

    const handleUpdateBinding = useCallback((id: string, binding: ShortcutBinding) => {
        const updated = {
            ...settings,
            bindings: {
                ...settings.bindings,
                [id]: binding
            }
        };
        setSettings(updated);
        saveShortcutSettings(updated);
        onSettingsChange?.(updated);
    }, [settings, onSettingsChange]);

    const handleReset = useCallback(() => {
        const defaults = resetShortcuts();
        setSettings(defaults);
        onSettingsChange?.(defaults);
    }, [onSettingsChange]);

    return (
        <View
            borderWidth="thin"
            borderColor="dark"
            borderRadius="medium"
            padding="size-150"
        >
            <Flex direction="column" gap="size-150">
                <Flex direction="row" justifyContent="space-between" alignItems="center">
                    <Flex direction="row" gap="size-100" alignItems="center">
                        <Switch isSelected={settings.enabled} onChange={handleToggleEnabled}>
                            <Text>Keyboard shortcuts</Text>
                        </Switch>
                        <Text UNSAFE_style={{ fontSize: '11px', opacity: 0.6 }}>
                            (panel must be focused)
                        </Text>
                    </Flex>
                    {settings.enabled && (
                        <DialogTrigger>
                            <ActionButton isQuiet>
                                <Reset />
                            </ActionButton>
                            <AlertDialog
                                title="Reset Shortcuts?"
                                variant="confirmation"
                                primaryActionLabel="Reset"
                                cancelLabel="Cancel"
                                onPrimaryAction={handleReset}
                            >
                                This will reset all keyboard shortcuts to their default values. This action cannot be undone.
                            </AlertDialog>
                        </DialogTrigger>
                    )}
                </Flex>

                {settings.enabled && (
                    <>
                        {conflicts.length > 0 && (
                            <>
                                <Divider size="S" />
                                <Flex direction="row" gap="size-100" alignItems="center" UNSAFE_style={{ padding: '8px', backgroundColor: 'rgba(211, 21, 16, 0.1)', borderRadius: '4px' }}>
                                    <Alert color="negative" />
                                    <Text UNSAFE_style={{ fontSize: '12px' }}>
                                        <strong>Conflict:</strong> {conflicts.length} duplicate binding(s)
                                    </Text>
                                </Flex>
                            </>
                        )}

                        <Divider size="S" />

                        <Flex direction="column" gap="size-100">
                            {Object.entries(settings.bindings).map(([id, binding], index) => (
                                <React.Fragment key={id}>
                                    {index > 0 && <Divider size="S" />}
                                    <ShortcutEditor
                                        bindingId={id}
                                        binding={binding}
                                        onUpdate={handleUpdateBinding}
                                    />
                                </React.Fragment>
                            ))}
                        </Flex>

                    </>
                )}
            </Flex>
        </View>
    );
};

export default ShortcutsSettingsPanel;
