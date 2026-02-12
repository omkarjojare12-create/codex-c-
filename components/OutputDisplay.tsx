
import React from 'react';
import { ProgramInput } from './ProgramInput';

export interface OutputSegment {
  type: 'stdout' | 'stderr';
  content: string;
}

interface OutputDisplayProps {
    outputSegments: OutputSegment[];
    isLoading: boolean;
    executionState: 'idle' | 'running' | 'waiting_for_input' | 'error' | 'finished';
    onInputChange: (input: string) => void;
    onRestart: () => void;
}

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ outputSegments, isLoading, executionState, onInputChange, onRestart }) => {
    
    const renderContent = () => {
        if (executionState === 'idle' && outputSegments.length === 0) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <p className="text-lg">Your program's output will appear here.</p>
                        <p>Switch to the Editor tab and click "Run" to start.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex-grow p-4 bg-gray-100 dark:bg-gray-900 rounded-md text-sm font-mono whitespace-pre-wrap break-all overflow-auto">
                <span>
                    {outputSegments.map((segment, index) => (
                        <span key={index} className={segment.type === 'stderr' ? 'text-red-500' : ''}>
                            {segment.content}
                        </span>
                    ))}
                </span>
                {executionState === 'waiting_for_input' && !isLoading && (
                     <ProgramInput onSubmit={onInputChange} isLoading={isLoading} />
                )}
                {isLoading && (
                     <div className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="http://www.w3.org/2000/svg">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Running...</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex-grow flex flex-col gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex-shrink-0 flex justify-end">
                <button
                    onClick={onRestart}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 9a9 9 0 0114.13-5.13M20 15a9 9 0 01-14.13 5.13" />
                    </svg>
                    Restart
                </button>
            </div>
            
            <div className="flex-grow overflow-auto border-t border-gray-200 dark:border-gray-700 pt-4">
                {renderContent()}
            </div>
            
             { (executionState === 'finished' || executionState === 'error') && (
                <div className="flex-shrink-0 text-center p-2 text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 rounded-md mt-4">
                   --- Execution {executionState === 'error' ? 'Failed' : 'Finished'} ---
                </div>
             )}
        </div>
    );
};
