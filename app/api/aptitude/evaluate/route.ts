import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId, uniqueId, questions } = await req.json();

    if (!userId || !uniqueId || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Invalid submission data. Please ensure the test is valid." }, { status: 400 });
    }

    // Find the test
    const test = await prisma.aptitudeTest.findUnique({
      where: { uniqueId },
    });

    if (!test) {
      return NextResponse.json({ error: "Test session not found or has expired." }, { status: 404 });
    }

    if (test.userId !== userId) {
        return NextResponse.json({ error: "You are not authorized to submit this test." }, { status: 403 });
    }

    // Validate if all questions are attempted
    if (questions.length !== test.questionCount) {
        return NextResponse.json({ 
            error: `Incomplete submission. Expected ${test.questionCount} questions, but received ${questions.length}.` 
        }, { status: 400 });
    }

    // Calculate score
    let correctCount = 0;
    const totalQuestions = questions.length;

    // Prepare questions for bulk insertion
    // Prepare questions for bulk insertion
    const questionsData = questions.map((q: any) => {
      // The generated question object has "answer", but our schema might use "correctAnswer" or we might have mixed usage.
      // We'll normalize it here.
      const correctAnswer = q.answer || q.correctAnswer;
      
      const isCorrect = (q.userAnswer?.trim() === correctAnswer?.trim());
      if (isCorrect) correctCount++;

      return {
        aptitudeTestId: test.id,
        questionText: q.question,
        options: q.options, 
        correctAnswer: correctAnswer,
        // explanation: q.explanation,
        difficulty: q.difficulty,
        // hint: q.hint,
        userAnswer: q.userAnswer,
        isCorrect: isCorrect,
      };
    });

    const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    // Update Test and Insert Questions
    await prisma.$transaction(async (tx) => {
        await tx.aptitudeTest.update({
            where: { id: test.id },
            data: {
                status: "COMPLETED",
                score: scorePercentage
            }
        });

        await tx.aptitudeQuestion.createMany({
            data: questionsData
        });
    });

    return NextResponse.json({ success: true, score: scorePercentage });

  } catch (error) {
    console.error("Error evaluating aptitude test:", error);
    return NextResponse.json({ error: "Failed to submit test results. Please try again." }, { status: 500 });
  }
}
