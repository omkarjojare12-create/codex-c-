
import React from 'react';
import { ViewTabs } from './ViewTabs';
import { RunButton } from './RunButton';

interface ControlsProps {
    activeView: 'editor' | 'output';
    setActiveView: (view: 'editor' | 'output') => void;
    handleRunCode: () => void;
    isLoading: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
    activeView,
    setActiveView,
    handleRunCode,
    isLoading,
}) => {
    return (
        <div className="flex-shrink-0 flex items-center justify-between">
            <ViewTabs activeView={activeView} setActiveView={setActiveView} />
            {activeView === 'editor' && (
                <RunButton handleRunCode={handleRunCode} isLoading={isLoading} />
            )}
        </div>
    );
};
