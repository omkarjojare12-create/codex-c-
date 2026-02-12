
import React, { useState, useEffect, useRef } from 'react';

interface ProgramInputProps {
    onSubmit: (input: string) => void;
    isLoading: boolean;
}

export const ProgramInput: React.FC<ProgramInputProps> = ({ onSubmit, isLoading }) => {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Auto-focus the input field when it appears
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Allow empty input submission as it can be a valid input
        onSubmit(inputValue);
        setInputValue('');
    };

    return (
        <form onSubmit={handleSubmit} className="inline-block">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none p-0"
                style={{ width: `${Math.max(10, inputValue.length + 1)}ch` }} // Dynamically size the input field
                disabled={isLoading}
                autoComplete="off"
            />
        </form>
    );
};
