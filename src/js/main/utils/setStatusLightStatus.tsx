/*
import { useEffect, useState } from 'react';

const checkInterval = 500;
type StatusVariant = "notice" | "positive" | "negative" | "info" | "neutral" | "celery" | "chartreuse" | "yellow" | "magenta" | "fuchsia" | "purple" | "indigo" | "seafoam";

const updateLayerStatus = (isProcessing: boolean, isDownloading: boolean, evalTS: any) => {
    const [isAnyLayerSelected, setIsAnyLayerSelected] = useState(false);
    const [selectedLayerNames, setSelectedLayerNames] = useState<string[]>([]);
    const [selectedLayerCount, setSelectedLayerCount] = useState(0);
    const [statusVariant, setStatusVariant] = useState<StatusVariant>('notice');
    const [statusState, setStatusIndicator] = useState('Idle');

    useEffect(() => {
        const checkIfAnyLayerSelected = async () => {
            if (isProcessing || isDownloading) {
                return;
            }
            const result = await evalTS('checkIfAnySelected');
            setIsAnyLayerSelected(result.selected);
            setSelectedLayerNames(result.names);
            setSelectedLayerCount(result.count);
        };

        const intervalId = setInterval(checkIfAnyLayerSelected, checkInterval);

        return () => clearInterval(intervalId);
    }, [isProcessing, isDownloading]);

    useEffect(() => {
        const updateStatusVariant = () => {
            if (isDownloading) {
                setStatusVariant('notice');
                setStatusIndicator('Downloading TAS Backend');
            } else if (isProcessing) {
                setStatusVariant('notice');
                if (selectedLayerCount === 1) {
                    setStatusIndicator('Processing ' + selectedLayerNames);
                } else {
                    setStatusIndicator('Processing ' + selectedLayerCount + ' Videos');
                }
            } else if (!isAnyLayerSelected) {
                setStatusVariant('negative');
                setStatusIndicator('No Layer Selected');
            } else if (isAnyLayerSelected) {
                setStatusVariant('positive');
                const message = selectedLayerCount === 1
                    ? `${selectedLayerNames} is selected`
                    : `${selectedLayerCount} layers are selected`;

                setStatusIndicator(message);
            } else {
                setStatusVariant('notice');
                setStatusIndicator('Idle');
            }
        };
        updateStatusVariant();
    }, [isDownloading, isProcessing, isAnyLayerSelected, selectedLayerCount, selectedLayerNames]);

    return { statusVariant, statusState };
};

export default updateLayerStatus;
*/

export {};
