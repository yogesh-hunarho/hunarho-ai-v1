import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGeminiAPIResponse } from "@/lib/ai-model";

export async function POST(req: NextRequest) {
  try {
    const { interviewId } = await req.json();

    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: "Interview ID is required" },
        { status: 400 }
      );
    }

    // 1. Fetch interview and messages
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!interview) {
      return NextResponse.json(
        { success: false, error: "Interview not found" },
        { status: 404 }
      );
    }

    // 2. Check if already evaluated
    if (interview.evaluation !== "Not evaluated") {
      return NextResponse.json({
        success: true,
        score: interview.score,
        evaluationMessage: interview.evaluationMessage,
        messages: interview.messages,
        isExisting: true,
      });
    }

    // 3. Format messages into a transcript
    const transcript = interview.messages
      .map(
        (msg) =>
          `${msg.sender === "USER" ? "Candidate" : "Interviewer"}: ${msg.content}`
      )
      .join("\n\n");

    if (interview.messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "No interview messages found to evaluate" },
        { status: 400 }
      );
    }

    // 4. Generate evaluation using Gemini
    const systemPrompt = `
      You are an experienced hiring manager conducting a detailed analysis of a job interview.
      JOB DETAILS:
      - Title: ${interview.jobType}
      - Role: ${interview.jobRole || "N/A"}
      - Description: ${interview.jobDescription || "N/A"}
      - Tech Stack: ${interview.techStack || "N/A"}
      - Experience Level: ${interview.yearsOfExperience} years
      
      INTERVIEW TRANSCRIPT:
      ${transcript}
      
      TASKS:
      1. Analyze the candidate's responses and provide a comprehensive evaluation
      2. Generate a list of strengths (what the candidate did well)
      3. Generate a list of improvements (areas where the candidate can improve)
      4. Assign an overall score from 1-10 based on the interview performance
      5. Provide a detailed summary analysis of the candidate's performance
      
      GUIDELINES:
      - For strengths: Be specific and detailed. Reference exact responses when possible.
      - For improvements: Be constructive and provide actionable advice.
      - For scoring: Consider communication skills, technical knowledge, relevance to the role, and overall fit.
      - Return the response in JSON format (ensure valid JSON output) with this structure:
        {
          "strengths": ["detailed strength 1", "detailed strength 2", ...],
          "improvements": ["detailed improvement 1", "detailed improvement 2", ...],
          "overallScore": number (1-10),
          "scoreBreakdown": {
            "communication": number (1-10),
            "technicalKnowledge": number (1-10),
            "relevanceToRole": number (1-10)
          },
          "summary": "Detailed summary analysis of the candidate's performance..."
        }
    `;

    const responseText = await getGeminiAPIResponse({
      systemPrompt,
      userMessage: "Please provide the comprehensive evaluation now.",
      maxOutputTokens: 1500,
    });

    const evaluationData = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;

    // 5. Update database
    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        score: evaluationData.overallScore || 0,
        evaluation: "Evaluated",
        evaluationMessage: evaluationData,
      },
    });

    return NextResponse.json({
      success: true,
      score: updatedInterview.score,
      evaluationMessage: updatedInterview.evaluationMessage,
      messages: interview.messages,
      isExisting: false,
    });
  } catch (error) {
    console.error("Interview evaluation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
