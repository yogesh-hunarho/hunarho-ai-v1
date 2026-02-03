export const getAptitudeQuestionPrompt = (
  category: string,
  subCategory: string,
  difficulty: string,
  previousQuestion: any | null,
  isCorrect: boolean | null,
  previousQuestions: any[] = []
) => {
  let difficultyInstruction = `Generate a ${difficulty} difficulty question.`;
  let hintInstruction = "";
  
  // Repetition Check
  let repetitionInstruction = "";
  if (previousQuestions && previousQuestions.length > 0) {
      const recentQuestions = previousQuestions.slice(-5).map((q: any) => q.question || q.questionText).filter(Boolean);
      if (recentQuestions.length > 0) {
        repetitionInstruction = `
        **Negative Constraint:** 
        Do NOT generate a question similar to the following recent questions:
        ${recentQuestions.map((t, i) => `${i+1}. ${t.substring(0, 100)}...`).join('\n')}
        Ensure the new question is distinct in concept and values.`;
      }
  }

  let contextInstruction = "";
  
  if (category === "Mixed") {
      contextInstruction = `
      - Category: Mixed (Randomly select one from: Quantitative Aptitude, Logical Reasoning, Verbal Ability, Data Interpretation)
      - Sub-Category: Any relevant sub-category for the selected category.
      - Goal: Test general mental ability across different domains.
      `;
  } else if (category === "Quantitative Aptitude" || category === "Math") {
      contextInstruction = `
      - Category: Quantitative Aptitude
      - Sub-Category: ${subCategory}
      - Goal: Test numerical ability, mathematical problem-solving, and formula application. 
      - Requirement: Use clear mathematical notation (KaTeX).
      `;
  } else if (category === "Logical Reasoning") {
      contextInstruction = `
      - Category: Logical Reasoning
      - Sub-Category: ${subCategory}
      - Goal: Test deductive reasoning, pattern recognition, and logical consistency.
      - Requirement: Ensure the logic is sound and there is only one indisputably correct answer.
      `;
  } else if (category === "Verbal Ability") {
      contextInstruction = `
      - Category: Verbal Ability
      - Sub-Category: ${subCategory}
      - Goal: Test English proficiency, grammar, vocabulary, and comprehension.
      - Requirement: Use impeccable grammar in the question text.
      `;
  } else if (category === "Data Interpretation") {
      contextInstruction = `
      - Category: Data Interpretation
      - Sub-Category: ${subCategory}
      - Goal: Test the ability to analyze data presented in text or tabular form (describe the data clearly since image generation is not supported).
      `;
  } else {
      contextInstruction = `
      - Category: ${category}
      - Sub-Category: ${subCategory}
      `;
  }

  // Adaptive Logic
  if (previousQuestion) {
    if (isCorrect) {
      difficultyInstruction = `The user answered the previous ${previousQuestion.difficulty} question CORRECTLY. Generate a new question with the SAME difficulty (${difficulty}).`;
    } else {
      difficultyInstruction = `The user answered the previous ${previousQuestion.difficulty} question INCORRECTLY. Generate a new question with a LOWER difficulty than ${previousQuestion.difficulty}.`;
    }
  }
  // hintInstruction = "Since the user answered incorrectly, include a helpful HINT to guide them for this question.";
  // ${hintInstruction} // This will be empty string now
  
  return `
    You are an expert Aptitude Test Setter and AI Tutor. 
    Your goal is to generate unique, high-quality, and error-free aptitude test questions customized to the student's level.

    **Context:**
    ${contextInstruction}
    
    **Adaptive Instructions:**
    ${difficultyInstruction}
    ${repetitionInstruction}
    
    **Formatting Rules:**
    1. **Mathematics:** Use KaTeX/LaTeX format for ALL mathematical expressions, symbols, and equations. Enclose inline math in single dollar signs (e.g., $x^2$) and block math in double dollar signs (e.g., $$ \\frac{a}{b} $$).
    2. **Clarity:** Ensure the question text is grammatically correct and unambiguous.
    3. **Options:** Provide 4 distinct options.
    4. **Answer:** The key 'answer' must EXACTLY match one of the options strings.

    **Output Format:**
    Provide a STRICT valid JSON output. Do not include markdown code blocks (like \`\`\`json). Just the raw JSON object.

    {
      "question": "The question text with KaTeX: $a^2 + b^2 = c^2$",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The correct option text (must identify the index or the full text, e.g. 'Option A' or 'A) Option A')",
      "difficulty": "The actual difficulty (Easy, Medium, Hard)",
      }
      `;
    };
    
    // "hint": "A conceptual clue without giving away the answer directly",
      // "explanation": "Step-by-step solution using KaTeX for math parts"