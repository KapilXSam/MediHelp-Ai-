import { GoogleGenAI, Chat } from "@google/genai";
import { ChatMessage } from '../types';
import { GEMINI_SYSTEM_INSTRUCTION } from "../constants";

// In this no-build environment, env vars are injected into the window object
const apiKey = (window as any).process?.env?.API_KEY;

if (!apiKey) {
    // We can show an alert or a more graceful UI element in the app itself.
    // For now, an error in the console is sufficient for developers.
    console.error("API_KEY environment variable not set. Please check the script tag in index.html");
}

const ai = new GoogleGenAI({ apiKey });

let chat: Chat | null = null;

function getChatInstance(): Chat {
    if (!chat) {
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
            },
        });
    }
    return chat;
}

export async function runChat(message: string): Promise<string> {
    if(!apiKey) {
        return "I'm sorry, the application is not configured with an AI API key. Please contact the administrator.";
    }
    try {
        const chatInstance = getChatInstance();
        const response = await chatInstance.sendMessage({ message });

        if (!response || !response.text) {
             throw new Error("Received an empty response from the AI.");
        }
        return response.text;
    } catch (error) {
        console.error("Gemini API error:", error);
        return "I'm sorry, I encountered an error and can't respond right now. Please try again later. If this is a medical emergency, please contact your local emergency services.";
    }
}

// Function to reset the chat session for a new user/triage
export function startNewChatSession() {
    chat = null;
}