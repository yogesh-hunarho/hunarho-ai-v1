import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GoogleAPIKey;
const ai = new GoogleGenAI({ apiKey });

const generationConfig = {
    temperature: 0.4,
    topP: 0.9,
    topK: 20,
    responseMimeType: "application/json",
};

export async function getGeminiAPIResponse({ systemPrompt, userMessage, maxOutputTokens= 300 }) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ],
    config: {maxOutputTokens ,...generationConfig},
  });

  return response.text;
}