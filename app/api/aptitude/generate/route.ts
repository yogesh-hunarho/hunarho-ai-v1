import { NextRequest, NextResponse } from "next/server";
import { generateAptitudeQuestion } from "@/lib/aptitude-generator";

export async function POST(req: NextRequest) {
  try {
    const { category, subCategory, currentDifficulty, previousQuestion, previousQuestions, isCorrect } = await req.json();

    // console.log(category, subCategory, currentDifficulty, previousQuestion, isCorrect);

    if (!category || !subCategory || !currentDifficulty) {
      return NextResponse.json({ error: "Missing test context. Unable to generate the next question." }, { status: 400 });
    }

    const question = await generateAptitudeQuestion(
      category,
      subCategory,
      currentDifficulty,
      previousQuestion,
      isCorrect,
      previousQuestions // Pass full history list
    );

    return NextResponse.json(question);

  } catch (error) {
    console.error("Error generating aptitude question:", error);
    return NextResponse.json({ error: "Unable to generate question. Please check your connection or try again." }, { status: 500 });
  }
}
