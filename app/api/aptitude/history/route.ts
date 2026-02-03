import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required to view history." }, { status: 400 });
    }

    const history = await prisma.aptitudeTest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        uniqueId: true,
        category: true,
        subCategory: true,
        difficulty: true,
        score: true,
        status: true,
        createdAt: true,
        questionCount: true,
      }
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching aptitude history:", error);
    return NextResponse.json({ error: "Unable to fetch test history. Please try again later." }, { status: 500 });
  }
}
