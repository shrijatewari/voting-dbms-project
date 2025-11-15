import { GoogleGenAI } from "@google/genai";
import { IAnomaly } from '../types';

let ai: GoogleGenAI | null = null;

// Initialize AI client only if an API key is available.
// This prevents the app from crashing on startup if the key is not configured.
if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

export const summarizeAnomalies = async (anomalies: IAnomaly[]): Promise<string> => {
  // Check if AI client was initialized before using it.
  if (!ai) {
    return "AI features are disabled. Please configure the API_KEY environment variable.";
  }

  const anomalyDescriptions = anomalies.map(a => `- ${a.description} (Severity: ${a.severity})`).join('\n');

  const prompt = `
    As a security analyst for a voter verification system, provide a concise summary of the following detected anomalies. 
    Highlight the most critical threats and suggest a priority for investigation.

    Anomalies:
    ${anomalyDescriptions}

    Summary:
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating summary with Gemini API:", error);
    return "Failed to generate summary. Please check the API configuration and try again.";
  }
};
