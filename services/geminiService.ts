import { GoogleGenAI } from "@google/genai";
import type { GroundingSource } from '../types';

interface BriefingResult {
    text: string;
    sources: GroundingSource[];
}

function processGeminiError(error: unknown, context: string): Error {
    console.error(`Error during ${context}:`, error);

    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        // Check for specific, user-actionable errors first
        if (message.includes('api key not valid')) {
            return new Error(`Your Google Gemini API Key is invalid or missing. Please check your environment configuration.`);
        }
        if (message.includes('quota')) {
            return new Error(`You have exceeded your API quota. Please check your Google AI account settings.`);
        }
        if (message.includes('fetch') || message.includes('network')) {
            return new Error(`Failed to connect to the Gemini API due to a network issue. Please check your internet connection.`);
        }
        // Fallback for other Gemini API errors
        return new Error(`An error occurred while generating the ${context}: ${error.message}`);
    }

    // Fallback for non-Error exceptions
    return new Error(`An unknown error occurred while generating the ${context}: ${String(error)}`);
}

// This function now relies on the API_KEY being set as an environment variable.
export async function generateSportsBriefing(sports: string[], searchQuery?: string): Promise<BriefingResult> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key is missing. Please set it in your environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });

    let prompt = '';
    if (searchQuery && searchQuery.trim().length > 0) {
        prompt = `Generate a detailed and engaging sports news briefing for the topic: "${searchQuery}". Structure your response clearly using Markdown. You MUST use headings (##), subheadings (###), and bullet points (*) to organize the information. Do not just use bold text for headings. Make it look like a professional sports report with clear sections.`;
    } else {
        prompt = `Generate an exciting, up-to-date sports news briefing for these sports: ${sports.join(', ')}. Structure your response clearly using Markdown. You MUST use a main heading '##' for each sport. Under each sport, use subheadings '###' for different news items and bullet points '*' for details. Do not use bold text as a substitute for headings. Ensure the output is well-structured and easy to read, like a professional sports article.`;
    }

    try {
        // Using 'gemini-2.5-flash', the recommended model for general text tasks.
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: GroundingSource[] = [];
        if (groundingChunks) {
            for (const chunk of groundingChunks) {
                if(chunk.web) {
                    sources.push({
                        uri: chunk.web.uri,
                        title: chunk.web.title || 'Untitled Source',
                    });
                }
            }
        }
        
        return {
            text: response.text,
            sources: sources
        };

    } catch (error) {
        throw processGeminiError(error, "sports briefing");
    }
}

// FIX: This function now uses the Gemini API for image generation.
export async function generateBriefingImage(briefingText: string): Promise<string> {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key is missing. Please set it in your environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Epic, cinematic, vibrant, dynamic digital painting representing the following sports news: "${briefingText.substring(0, 250)}...". Abstract and energetic style, capturing the motion and emotion of sports. A masterpiece, hyper-detailed, trending on ArtStation. No text or words in the image. Focus on dynamic shapes, dramatic lighting, and evocative team colors.`;

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("Image generation failed, no images were returned.");
        }

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;

    } catch (error) {
        throw processGeminiError(error, "briefing image");
    }
}