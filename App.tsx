
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { OutputDisplay, OutputSegment } from './components/OutputDisplay';
import { runInteractive } from './services/geminiService';
import type { ExecutionResult } from './types';
import { ViewTabs } from './components/ViewTabs';
import { RunButton } from './components/RunButton';

const DEFAULT_CODE = `#include <iostream>
#include <string>

using namespace std;

class Emp {
private:
    int id;
    string name;
    float sal;

public:
    void input() {
        cout << "\\nEnter Employee ID: ";
        cin >> id;

        cout << "Enter Employee Name: ";
        cin.ignore();                 // Clear buffer
        getline(cin, name);           // Allows full name with spaces

        cout << "Enter Employee Salary: ";
        cin >> sal;
    }

    void show() {
        cout << "\\n--- Employee Details ---";
        cout << "\\nEmployee ID: " << id;
        cout << "\\nEmployee Name: " << name;
        cout << "\\nEmployee Salary: " << sal << endl;
    }
};

int main() {
    Emp e1;
    e1.input();
    e1.show();

    return 0;
}`;

export default function App(): React.ReactElement {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedTheme = window.localStorage.getItem('theme');
            return (storedTheme === 'dark' || storedTheme === 'light') ? storedTheme : 'light';
        }
        return 'light';
    });
    
    const [code, setCode] = useState<string>(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage.getItem('cpp-code') || DEFAULT_CODE;
        }
        return DEFAULT_CODE;
    });
    
    const [history, setHistory] = useState<any[]>([]);
    const [outputSegments, setOutputSegments] = useState<OutputSegment[]>([]);
    const [executionState, setExecutionState] = useState<'idle' | 'running' | 'waiting_for_input' | 'error' | 'finished'>('idle');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [activeView, setActiveView] = useState<'editor' | 'output'>('editor');


    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);

        const prismThemeLink = document.getElementById('prism-theme') as HTMLLinkElement | null;
        if (prismThemeLink) {
            if (theme === 'dark') {
                prismThemeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css';
            } else {
                prismThemeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css';
            }
        }
    }, [theme]);

    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem('cpp-code', code);
        }, 500);
        return () => clearTimeout(timer);
    }, [code]);

    const startExecution = async () => {
        setIsLoading(true);
        setExecutionState('running');
        setHistory([]);
        setOutputSegments([]);
        setActiveView('output');
        
        try {
            const result = await runInteractive(code, []);
            processResult(result, []);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const continueExecution = async (input: string) => {
        setIsLoading(true);
        setExecutionState('running');
        setOutputSegments(prev => [...prev, { type: 'stdout', content: input + '\n' }]);

        const newHistory = [...history, { role: 'user', parts: [{ text: `--- USER INPUT ---\n${input}` }] }];
        setHistory(newHistory);
        
        try {
            const result = await runInteractive(code, newHistory);
            processResult(result, newHistory);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const processResult = (result: ExecutionResult, currentHistory: any[]) => {
        const newSegments: OutputSegment[] = [];
        if (result.output) {
            newSegments.push({ type: 'stdout', content: result.output });
        }
        if (result.error) {
            newSegments.push({ type: 'stderr', content: result.error });
        }
        setOutputSegments(prev => [...prev, ...newSegments]);

        const newHistoryWithModel = [...currentHistory, { role: 'model', parts: [{ text: JSON.stringify(result) }] }];
        setHistory(newHistoryWithModel);
        setExecutionState(result.state);
    };
    
    const handleApiError = (error: unknown) => {
        console.error("Failed to run code:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setOutputSegments(prev => [...prev, { type: 'stderr', content: `\nFrontend Error: ${errorMessage}` }]);
        setExecutionState('error');
    };

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <div className="flex flex-col h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Header theme={theme} toggleTheme={toggleTheme} code={code} />
            <main className="flex-grow flex flex-col p-2 sm:p-4 gap-4 overflow-hidden">
                <div className="flex-shrink-0 flex items-center justify-between">
                    <ViewTabs activeView={activeView} setActiveView={setActiveView} />
                    {activeView === 'editor' && (
                        <RunButton handleRunCode={startExecution} isLoading={isLoading} />
                    )}
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    {activeView === 'editor' ? (
                        <CodeEditor
                            code={code}
                            setCode={setCode}
                        />
                    ) : (
                        <OutputDisplay
                            outputSegments={outputSegments}
                            isLoading={isLoading}
                            executionState={executionState}
                            onInputChange={continueExecution}
                            onRestart={startExecution}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}
