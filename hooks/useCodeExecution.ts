
import { useState } from 'react';
import type { Content } from '@google/genai';
import { runInteractive } from '../services/geminiService';
import type { ExecutionResult } from '../types';
import type { OutputSegment } from '../components/OutputDisplay';

/**
 * A custom hook to manage the state and logic for C++ code execution.
 */
export function useCodeExecution() {
    const [history, setHistory] = useState<Content[]>([]);
    const [outputSegments, setOutputSegments] = useState<OutputSegment[]>([]);
    const [executionState, setExecutionState] = useState<'idle' | 'running' | 'waiting_for_input' | 'error' | 'finished'>('idle');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleApiError = (error: unknown) => {
        console.error("Failed to run code:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setOutputSegments(prev => [...prev, { type: 'stderr', content: `\nFrontend Error: ${errorMessage}` }]);
        setExecutionState('error');
    };

    const processResult = (result: ExecutionResult, currentHistory: Content[]) => {
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

    const startExecution = async (code: string) => {
        setIsLoading(true);
        setExecutionState('running');
        setHistory([]);
        setOutputSegments([]);
        
        try {
            const result = await runInteractive(code, []);
            processResult(result, []);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const continueExecution = async (code: string, input: string) => {
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

    return {
        outputSegments,
        executionState,
        isLoading,
        startExecution,
        continueExecution,
    };
}
