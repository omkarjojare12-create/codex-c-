
import { useState, useEffect } from 'react';

/**
 * A custom hook that syncs state with localStorage.
 * @param key The key to use in localStorage.
 * @param defaultValue The default value if nothing is in localStorage.
 * @returns A stateful value, and a function to update it.
 */
export function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return defaultValue;
        }
        try {
            const storedValue = window.localStorage.getItem(key);
            // The value in localStorage is a JSON string.
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            console.warn(`Error reading localStorage key “${key}”:`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        
        // Debounce writes to localStorage to avoid performance issues.
        const timer = setTimeout(() => {
            try {
                window.localStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                console.error(`Error setting localStorage key “${key}”:`, error);
            }
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [key, state]);

    return [state, setState];
}
