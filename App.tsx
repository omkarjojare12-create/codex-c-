
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { OutputDisplay } from './components/OutputDisplay';
import { Controls } from './components/Controls';
import { usePersistentState } from './hooks/usePersistentState';
import { useCodeExecution } from './hooks/useCodeExecution';

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
    const [theme, setTheme] = usePersistentState<'light' | 'dark'>('theme', 'light');
    const [code, setCode] = usePersistentState<string>('cpp-code', DEFAULT_CODE);
    const [activeView, setActiveView] = useState<'editor' | 'output'>('editor');
    
    const {
        outputSegments,
        executionState,
        isLoading,
        startExecution,
        continueExecution,
    } = useCodeExecution();

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');

        const prismThemeLink = document.getElementById('prism-theme') as HTMLLinkElement | null;
        if (prismThemeLink) {
            prismThemeLink.href = theme === 'dark'
                ? 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css'
                : 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css';
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleRunCode = () => {
        setActiveView('output');
        startExecution(code);
    };

    const handleContinueExecution = (input: string) => {
        continueExecution(code, input);
    };

    const handleRestart = () => {
        // A restart is effectively the same as starting a new execution.
        handleRunCode();
    };

    return (
        <div className="flex flex-col h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Header theme={theme} toggleTheme={toggleTheme} code={code} />
            <main className="flex-grow flex flex-col p-2 sm:p-4 gap-4 overflow-hidden">
                <Controls
                    activeView={activeView}
                    setActiveView={setActiveView}
                    handleRunCode={handleRunCode}
                    isLoading={isLoading}
                />

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
                            onInputChange={handleContinueExecution}
                            onRestart={handleRestart}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

