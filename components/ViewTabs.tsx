
import React from 'react';

interface ViewTabsProps {
    activeView: 'editor' | 'output';
    setActiveView: (view: 'editor' | 'output') => void;
}

const Tab: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors ${
            isActive
                ? 'bg-white shadow-sm dark:bg-gray-700 text-blue-600 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50'
        }`}
        aria-current={isActive ? 'page' : undefined}
    >
        {label}
    </button>
);

export const ViewTabs: React.FC<ViewTabsProps> = ({ activeView, setActiveView }) => {
    return (
        <div className="flex items-center p-1 space-x-1 bg-gray-200/75 dark:bg-gray-900/50 rounded-lg">
            <Tab label="Editor" isActive={activeView === 'editor'} onClick={() => setActiveView('editor')} />
            <Tab label="Output" isActive={activeView === 'output'} onClick={() => setActiveView('output')} />
        </div>
    );
};
