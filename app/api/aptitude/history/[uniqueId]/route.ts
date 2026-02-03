import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  try {
    const { uniqueId } = await params;

    if (!uniqueId) {
      return NextResponse.json({ error: "Test ID is missing." }, { status: 400 });
    }

    const test = await prisma.aptitudeTest.findUnique({
      where: { uniqueId },
      include: {
        questions: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!test) {
      return NextResponse.json({ error: "Test details not found." }, { status: 404 });
    }

    return NextResponse.json(test);

  } catch (error) {
    console.error("Error fetching aptitude test details:", error);
    return NextResponse.json({ error: "Unable to load test details. Please try again." }, { status: 500 });
  }
}
