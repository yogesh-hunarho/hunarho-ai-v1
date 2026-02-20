import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RequestBodySchema = z.object({
  interviewId: z.string(),
});

const EvaluationResultSchema = z.object({
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  overallScore: z.number(),
  scoreBreakdown: z.object({
    communication: z.number(),
    technicalKnowledge: z.number(),
    relevanceToRole: z.number(),
  }),
  summary: z.string(),
});

function extractJSON<T>(content: string): T {
  if (!content) throw new Error("Empty AI response");

  const cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

  // Try pure JSON
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Try embedded JSON
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No JSON found in AI response");
  }

  return JSON.parse(match[0]);
}

function calculateCost(promptTokens = 0, completionTokens = 0) {
  const INPUT_COST_PER_1K = 0.00005;
  const OUTPUT_COST_PER_1K = 0.00028;

  const inputCost = (promptTokens / 1000) * INPUT_COST_PER_1K;
  const outputCost = (completionTokens / 1000) * OUTPUT_COST_PER_1K;

  return Number((inputCost + outputCost).toFixed(6));
}

export async function POST(req: NextRequest) {
  try {
    const body = RequestBodySchema.parse(await req.json());

    // 1. Fetch interview and messages
    const interview = await prisma.interview.findUnique({
      where: { id: body.interviewId },
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

    if (interview.messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "No interview messages found to evaluate" },
        { status: 400 }
      );
    }

    // 3. Format messages into a transcript
    const transcript = interview.messages
      .map(
        (msg) =>
          `${
            msg.sender === "USER" ? "Candidate" : "Interviewer"
          }: ${msg.content}`
      )
      .join("\n\n");

    // 4. Generate evaluation using AI
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

    let aiContent = "";
    let usage: any = {};

    try {
      const res = await fetch(
        "https://platform.qubrid.com/api/v1/qubridai/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.QUBRID_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "meta-llama/Llama-3.3-70B-Instruct",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: "Please provide the comprehensive evaluation now.",
              },
            ],
            temperature: 0.3,
            max_tokens: 1500,
            stream: false,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        return NextResponse.json(
          {
            success: false,
            error: err?.message || "AI evaluation failed",
          },
          { status: 402 }
        );
      }
      const result = await res.json();
      aiContent = result.content ?? "";
      usage = result.usage ?? {};
    } catch (err) {
      console.error("QUBRID_EVAL_ERROR", err);
      return NextResponse.json(
        { success: false, error: "AI evaluation failed" },
        { status: 502 }
      );
    }

    // 5. Parse and validate AI response
    let evaluationResult;
    try {
      const parsed = extractJSON(aiContent);
      evaluationResult = EvaluationResultSchema.parse(parsed);
    } catch (err) {
      console.error("EVAL_PARSE_ERROR", aiContent, err);
      return NextResponse.json(
        { success: false, error: "Failed to parse AI evaluation" },
        { status: 502 }
      );
    }

    // 6. Calculate cost and update database
    const totalCost = calculateCost(
      usage.prompt_tokens,
      usage.completion_tokens
    );

    await prisma.$transaction([
      prisma.interview.update({
        where: { id: interview.id },
        data: {
          score: evaluationResult.overallScore || 0,
          evaluation: "Evaluated",
          evaluationMessage: JSON.stringify(evaluationResult),
        },
      }),

      prisma.aIUsage.create({
        data: {
          userId: interview.userId,
          sessionId: interview.id,
          model: "meta-llama/Llama-3.3-70B-Instruct",
          tokensUsed: usage.total_tokens ?? 0,
          cost: totalCost,
          type: "interview",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      score: evaluationResult.overallScore,
      evaluationMessage: evaluationResult,
      messages: interview.messages,
      isExisting: false,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }
    console.error("Interview evaluation error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getGeminiAPIResponse } from "@/lib/ai-model";

// export async function POST(req: NextRequest) {
//   try {
//     const { interviewId } = await req.json();

//     if (!interviewId) {
//       return NextResponse.json(
//         { success: false, error: "Interview ID is required" },
//         { status: 400 }
//       );
//     }

//     // 1. Fetch interview and messages
//     const interview = await prisma.interview.findUnique({
//       where: { id: interviewId },
//       include: {
//         messages: {
//           orderBy: { timestamp: "asc" },
//         },
//       },
//     });

//     if (!interview) {
//       return NextResponse.json(
//         { success: false, error: "Interview not found" },
//         { status: 404 }
//       );
//     }

//     // 2. Check if already evaluated
//     if (interview.evaluation !== "Not evaluated") {
//       return NextResponse.json({
//         success: true,
//         score: interview.score,
//         evaluationMessage: interview.evaluationMessage,
//         messages: interview.messages,
//         isExisting: true,
//       });
//     }

//     // 3. Format messages into a transcript
//     const transcript = interview.messages
//       .map(
//         (msg) =>
//           `${msg.sender === "USER" ? "Candidate" : "Interviewer"}: ${msg.content}`
//       )
//       .join("\n\n");

//     if (interview.messages.length === 0) {
//       return NextResponse.json(
//         { success: false, error: "No interview messages found to evaluate" },
//         { status: 400 }
//       );
//     }

//     // 4. Generate evaluation using Gemini
//     const systemPrompt = `
//       You are an experienced hiring manager conducting a detailed analysis of a job interview.
//       JOB DETAILS:
//       - Title: ${interview.jobType}
//       - Role: ${interview.jobRole || "N/A"}
//       - Description: ${interview.jobDescription || "N/A"}
//       - Tech Stack: ${interview.techStack || "N/A"}
//       - Experience Level: ${interview.yearsOfExperience} years
      
//       INTERVIEW TRANSCRIPT:
//       ${transcript}
      
//       TASKS:
//       1. Analyze the candidate's responses and provide a comprehensive evaluation
//       2. Generate a list of strengths (what the candidate did well)
//       3. Generate a list of improvements (areas where the candidate can improve)
//       4. Assign an overall score from 1-10 based on the interview performance
//       5. Provide a detailed summary analysis of the candidate's performance
      
//       GUIDELINES:
//       - For strengths: Be specific and detailed. Reference exact responses when possible.
//       - For improvements: Be constructive and provide actionable advice.
//       - For scoring: Consider communication skills, technical knowledge, relevance to the role, and overall fit.
//       - Return the response in JSON format (ensure valid JSON output) with this structure:
//         {
//           "strengths": ["detailed strength 1", "detailed strength 2", ...],
//           "improvements": ["detailed improvement 1", "detailed improvement 2", ...],
//           "overallScore": number (1-10),
//           "scoreBreakdown": {
//             "communication": number (1-10),
//             "technicalKnowledge": number (1-10),
//             "relevanceToRole": number (1-10)
//           },
//           "summary": "Detailed summary analysis of the candidate's performance..."
//         }
//     `;

//     const responseText = await getGeminiAPIResponse({
//       systemPrompt,
//       userMessage: "Please provide the comprehensive evaluation now.",
//       maxOutputTokens: 1500,
//     });

//     const evaluationData = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;

//     // 5. Update database
//     const updatedInterview = await prisma.interview.update({
//       where: { id: interviewId },
//       data: {
//         score: evaluationData.overallScore || 0,
//         evaluation: "Evaluated",
//         evaluationMessage: evaluationData,
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       score: updatedInterview.score,
//       evaluationMessage: updatedInterview.evaluationMessage,
//       messages: interview.messages,
//       isExisting: false,
//     });
//   } catch (error) {
//     console.error("Interview evaluation error:", error);
//     return NextResponse.json(
//       { success: false, error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
