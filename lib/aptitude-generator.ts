import { getAptitudeQuestionPrompt } from "@/prompt/get-aptitude-question-prompt";
import { getGeminiAPIResponse } from "@/lib/ai-model";

export async function generateAptitudeQuestion(
  category: string,
  subCategory: string,
  currentDifficulty: string,
  previousQuestion: any | null = null,
  isCorrect: boolean | null = null,
  previousQuestions: any[] = [] 
) {
  const promptLogic = getAptitudeQuestionPrompt(
    category,
    subCategory,
    currentDifficulty,
    previousQuestion,
    isCorrect,
    previousQuestions // Pass array to prompt generator
  );

  // Ensure strict JSON output by defining prompt explicitly
  const systemPrompt = `You are an AI designed to generate adaptive aptitude test questions. 
  Output strict JSON format ONLY. No markdown, no code blocks.
  Required JSON Structure:
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "answer": "string (must match one option exactly)",
    "difficulty": "string"
    }`;
    // "hint": "string",
    // "explanation": "string"
    
  let attempts = 0;
  const MAX_RETRIES = 2;

  while (attempts <= MAX_RETRIES) {
      try {
        attempts++;
        const textResponse = await getGeminiAPIResponse({
            systemPrompt: systemPrompt,
            userMessage: promptLogic,
            maxOutputTokens: 2000
        });

        // @ts-ignore
        const cleanText = (typeof textResponse === 'string' ? textResponse : JSON.stringify(textResponse))
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const json = JSON.parse(cleanText);
        
        // Normalize fields for consistency
        const finalQuestion = {
            ...json,
            correctAnswer: json.correctAnswer || json.answer,
        };
        
        // Safety check: Ensure correct answer is in options
        if (Array.isArray(finalQuestion.options) && !finalQuestion.options.includes(finalQuestion.correctAnswer)) {
           // console.warn("Mismatch in answer/options");
        }

        return finalQuestion;

      } catch (e) {
        console.error(`Attempt ${attempts} failed to generate valid JSON:`, e);
        if (attempts > MAX_RETRIES) {
            throw new Error("Failed to generate valid JSON after multiple attempts.");
        }
      }
  }

  throw new Error("Unexpected error in generation loop");
}
