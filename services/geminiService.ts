
import { GoogleGenAI, Type, Content } from "@google/genai";
import type { ExecutionResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const systemInstruction = `You are an expert, interactive C++ compiler and execution environment based on g++. You will be given C++ code and a series of user inputs. Your task is to execute the code step-by-step, pausing only when you encounter a "std::cin" statement to ask for user input.

**Your response MUST always be a single, valid JSON object matching this schema:**
{ "output": string, "error": string, "compileTime": string, "state": "'finished' | 'waiting_for_input' | 'error'" }

- "output": The stdout generated ONLY in the current step of execution (since the last pause or from the beginning).
- "error": Any compilation or runtime errors. If an error occurs, the state should be 'error'.
- "compileTime": Only provide this on the very first turn of the execution. Otherwise, return an empty string.
- "state":
  - "waiting_for_input": Use this when you encounter a "std::cin" and need to pause.
  - "finished": Use this when the program completes successfully (e.g., reaches "return 0;").
  - "error": Use this if there's a compilation or runtime error.

**Interaction Flow:**
1.  **First Turn:** The user will provide the code. Compile it. If compilation fails, return the error and 'error' state. If successful, start executing. Run until the first "std::cin" or until the program finishes.
2.  **Subsequent Turns:** The user will provide the input you asked for. Continue execution from where you left off. Run until the next "std::cin" or until the program finishes.`;

const formatSystemInstruction = `You are an expert C++ code formatter. Your sole task is to reformat the given C++ code according to standard style conventions, similar to clang-format.

**RULES:**
- DO NOT add, remove, or change any code logic.
- DO NOT add any comments, explanations, or markdown formatting (like \`\`\`cpp).
- Your output must be ONLY the raw, formatted C++ code.`;

export async function formatCode(code: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: [{ role: 'user', parts: [{ text: code }] }],
            config: {
                systemInstruction: formatSystemInstruction,
            },
        });
        
        return response.text.trim();

    } catch (error) {
        console.error("Gemini API call for formatting failed:", error);
        let errorMessage = "An unknown error occurred while formatting the code.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        throw new Error(errorMessage);
    }
}

export async function runInteractive(code: string, history: Content[]): Promise<ExecutionResult> {
    const isFirstTurn = history.length === 0;

    const initialCodePrompt = {
        role: 'user',
        parts: [{ text: `--- C++ CODE ---\n${code}` }]
    };
    
    const contents = isFirstTurn ? [initialCodePrompt] : [initialCodePrompt, ...history];

    try {
        const response = await ai.models.generateContent({
            // Use the Flash model for faster, more responsive interaction.
            model: "gemini-flash-latest",
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        output: { type: Type.STRING },
                        error: { type: Type.STRING },
                        compileTime: { type: Type.STRING },
                        state: { type: Type.STRING, enum: ['finished', 'waiting_for_input', 'error'] },
                    },
                    required: ["output", "error", "compileTime", "state"],
                },
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ExecutionResult;

    } catch (error) {
        console.error("Gemini API call failed:", error);
        let errorMessage = "An unknown error occurred while communicating with the AI.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        
        const errorDetails = (error as any)?.response?.data?.error?.message;
        if (errorDetails) {
            errorMessage = errorDetails;
        }

        return {
            output: '',
            error: `Error calling AI service: ${errorMessage}`,
            compileTime: '0ms',
            state: 'error'
        };
    }
}
