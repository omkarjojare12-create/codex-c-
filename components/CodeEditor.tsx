
import React, { useState, useEffect, useRef } from 'react';
import { formatCode } from '../services/geminiService';

// Tell TypeScript about the Prism global
declare var Prism: any;

interface CodeEditorProps {
    code: string;
    setCode: (code: string) => void;
}

const addColorSwatches = (html: string): string => {
    // Regex to find hex (#rgb, #rrggbb) and rgb/rgba color codes.
    const colorRegex = /(#([0-9a-f]{3}){1,2}\b|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+\s*)?\))/gi;
    
    return html.replace(colorRegex, (match) => {
        // Wrap the matched color code in a span with a CSS custom property to hold the color value.
        // The CSS in index.html will use this to draw the color swatch.
        return `<span class="color-swatch" style="--color-value:${match}">${match}</span>`;
    });
};


export const CodeEditor: React.FC<CodeEditorProps> = ({ code, setCode }) => {
    const [lineCount, setLineCount] = useState(1);
    const [currentLine, setCurrentLine] = useState(1);
    const [isFormatting, setIsFormatting] = useState(false);
    const lineCounterRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const [highlightedCode, setHighlightedCode] = useState('');

    useEffect(() => {
        const lines = code.split('\n').length;
        setLineCount(lines > 0 ? lines : 1);

        if (typeof Prism !== 'undefined' && Prism.languages.cpp) {
             let html = Prism.highlight(code, Prism.languages.cpp, 'cpp');
             html = addColorSwatches(html); // Apply the color swatch logic
             setHighlightedCode(html);
        } else {
             // Fallback for when Prism is not loaded yet: just escape HTML
             const escapedCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
             setHighlightedCode(addColorSwatches(escapedCode)); // Also apply swatches in fallback
        }
    }, [code]);
    
    const handleCursorActivity = () => {
        if (textAreaRef.current) {
            const line = textAreaRef.current.value.substring(0, textAreaRef.current.selectionStart).split('\n').length;
            setCurrentLine(line);
        }
    };

    const handleFormatCode = async () => {
        setIsFormatting(true);
        try {
            const formattedCode = await formatCode(code);
            setCode(formattedCode);
        } catch (error) {
            console.error("Failed to format code:", error);
            // In a real app, you might show a toast notification here
        } finally {
            setIsFormatting(false);
        }
    };


    const handleScroll = () => {
        if (lineCounterRef.current && textAreaRef.current && preRef.current) {
            const scrollTop = textAreaRef.current.scrollTop;
            lineCounterRef.current.scrollTop = scrollTop;
            preRef.current.scrollTop = scrollTop;

            const scrollLeft = textAreaRef.current.scrollLeft;
            preRef.current.scrollLeft = scrollLeft;
        }
    };
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const { selectionStart, selectionEnd, value } = event.currentTarget;

        if (event.key === 'Tab') {
            event.preventDefault();
            const tabCharacter = '  '; // 2 spaces
            const newCode = `${value.substring(0, selectionStart)}${tabCharacter}${value.substring(selectionEnd)}`;
            setCode(newCode);
            setTimeout(() => {
                if(textAreaRef.current) {
                    textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = selectionStart + tabCharacter.length;
                }
            }, 0);
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            const currentLineNumber = value.substring(0, selectionStart).split('\n').length - 1;
            const allLines = value.split('\n');
            const currentLine = allLines[currentLineNumber];
            const indentMatch = currentLine.match(/^\s*/);
            const indent = indentMatch ? indentMatch[0] : '';
            
            const newCode = `${value.substring(0, selectionStart)}\n${indent}${value.substring(selectionEnd)}`;
            
            setCode(newCode);
            
            setTimeout(() => {
                if(textAreaRef.current) {
                    textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = selectionStart + 1 + indent.length;
                    handleCursorActivity();
                }
            }, 0);
        }
    };

    return (
        <div className="code-editor-container relative flex flex-col w-full h-full bg-editor-bg-light dark:bg-editor-bg-dark rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-end px-3 py-1 bg-gray-100 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <button 
                    onClick={handleFormatCode} 
                    disabled={isFormatting}
                    className="flex items-center gap-2 px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    {isFormatting ? (
                         <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Formatting...</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l4 4m0 0l-4 4m4-4H7m-5 4v2a3 3 0 003 3h9a3 3 0 003-3V9m-4 8h4" />
                            </svg>
                            <span>Format Code</span>
                        </>
                    )}
                </button>
            </div>
            <div className="relative flex flex-grow overflow-hidden">
                <div
                    ref={lineCounterRef}
                    className="flex-shrink-0 text-right p-4 font-mono text-gray-500 dark:text-gray-400 select-none overflow-y-hidden bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
                    aria-hidden="true"
                >
                    {Array.from({ length: lineCount }, (_, i) => (
                        <div key={i} className={ i + 1 === currentLine ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>
                            {i + 1}
                        </div>
                    ))}
                </div>
                <div className="relative flex-grow h-full">
                    <div
                        aria-hidden="true"
                        className="absolute left-0 w-full bg-blue-100 dark:bg-blue-900/30 pointer-events-none transition-all duration-100 ease-out"
                        style={{
                            top: `calc(${(currentLine - 1) * 1.5}rem)`,
                            height: '1.5rem',
                            zIndex: 0,
                        }}
                    />
                    <textarea
                        ref={textAreaRef}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onScroll={handleScroll}
                        onKeyDown={handleKeyDown}
                        onClick={handleCursorActivity}
                        onKeyUp={handleCursorActivity}
                        className="code-editor-textarea absolute inset-0 z-10 resize-none overflow-auto border-none bg-transparent text-transparent caret-black dark:caret-white focus:outline-none"
                        spellCheck="false"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        wrap="off"
                    />
                    <pre
                        ref={preRef}
                        aria-hidden="true"
                        className="code-editor-pre absolute inset-0 z-0 overflow-auto"
                    >
                        <code
                            className="language-cpp"
                            dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }} // Trailing newline to ensure last line is styled correctly and visible when scrolling
                        />
                    </pre>
                </div>
            </div>
        </div>
    );
};
