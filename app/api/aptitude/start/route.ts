import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Assuming prisma is exported from lib/prisma
import { generateAptitudeQuestion } from "@/lib/aptitude-generator";

export async function POST(req: NextRequest) {
  try {
    const { userId, category, subCategory, difficulty, questionCount } = await req.json();

    if (!userId || !category || !subCategory || !difficulty || !questionCount) {
      return NextResponse.json({ error: "Please fill in all required fields (User ID, Category, Difficulty) to start the test." }, { status: 400 });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { userId }
    });

    if (!userExists) {
      return NextResponse.json({ error: "User ID not found. Please check your ID and try again." }, { status: 404 });
    }

    // Generate a unique ID for the test session
    const uniqueId = `AT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const aptitudeTest = await prisma.aptitudeTest.create({
      data: {
        userId,
        uniqueId,
        category,
        subCategory,
        difficulty,
        questionCount,
        status: "IN_PROGRESS"
      }
    });

    // Generate 3 questions initially (Buffer)
    // All start at the selected difficulty since we have no history yet.
    const [q1, q2, q3] = await Promise.all([
      generateAptitudeQuestion(category, subCategory, difficulty),
      generateAptitudeQuestion(category, subCategory, difficulty),
      generateAptitudeQuestion(category, subCategory, difficulty)
    ]);

    return NextResponse.json({ 
      testId: aptitudeTest.uniqueId, 
      id: aptitudeTest.id,
      questions: [q1, q2, q3]
    });

  } catch (error: any) {
    console.error("Error starting aptitude test:", error);
    
    // Handle Prisma specific errors
    if (error.code === 'P2003') {
        return NextResponse.json({ error: "The provided User ID is invalid or does not exist." }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to start the test. Please try again later." }, { status: 500 });
  }
}
