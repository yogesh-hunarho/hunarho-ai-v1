import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GoogleAPIKey });

export async function streamGeminiResponse({
  systemPrompt,
  userMessage,
  maxOutputTokens = 500,
}) {
  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "user", parts: [{ text: userMessage }] },
    ],
    config: {
      temperature: 0.4,
      topP: 0.9,
      topK: 20,
      maxOutputTokens,
      responseMimeType: "application/json",
    },
  });

  return stream;
}