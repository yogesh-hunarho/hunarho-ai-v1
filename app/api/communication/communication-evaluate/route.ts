import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCommunicationEvalSystemPrompt } from "@/prompt/get-communication-eval-prompt";

const RequestBodySchema = z.object({
  commId: z.string(),
});

const EvaluationResultSchema = z.object({
  score: z.number(),
  metrics: z.object({
    grammar: z.number(),
    confidence: z.number(),
    focus: z.number(),
    clarity: z.number(),
    engagement: z.number(),
  }),
  feedback: z.object({
    grammar: z.string(),
    confidence: z.string(),
    focus: z.string(),
    clarity: z.string(),
    engagement: z.string(),
  }),
  areasToFocus: z.array(z.string()),
  detailedFeedback: z.string(),
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

    // 1. Fetch communication session and its messages
    const communication = await prisma.communication.findUnique({
      where: { uniqueId: body.commId },
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!communication) {
      return NextResponse.json(
        { error: "Communication session not found" },
        { status: 404 }
      );
    }

    // Return existing evaluation if available
    if (communication.evaluation !== "Not evaluated") {
      return NextResponse.json(
        { success: true, evaluation: communication.evaluationMessage },
        { status: 200 }
      );
    }

    if (communication.messages.length === 0) {
      return NextResponse.json(
        { error: "No messages found for this session" },
        { status: 400 }
      );
    }

    // 2. Format transcript for AI
    const transcript = communication.messages
      .map((m) => `${m.sender === "USER" ? "User" : "AI Coach"}: ${m.content}`)
      .join("\n");

    // 3. Generate System Prompt
    const systemPrompt = getCommunicationEvalSystemPrompt({
      topic: communication.topic,
      prepType: communication.prepType,
      difficultyLevel: communication.difficultyLevel,
    });

    // 4. Call Qubrid AI
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
                content: `Transcript:\n\n${transcript}`,
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
        { error: "AI evaluation failed" },
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
        { error: "Failed to parse AI evaluation" },
        { status: 502 }
      );
    }

    // 6. Calculate cost and update database
    const totalCost = calculateCost(
      usage.prompt_tokens,
      usage.completion_tokens
    );

    await prisma.$transaction([
      prisma.communication.update({
        where: { id: communication.id },
        data: {
          score: evaluationResult.score,
          evaluationMessage: JSON.stringify(evaluationResult),
          evaluation: "Evaluated",
        },
      }),

      prisma.aIUsage.create({
        data: {
          userId: communication.userId,
          sessionId: communication.id,
          model: "meta-llama/Llama-3.3-70B-Instruct",
          tokensUsed: usage.total_tokens ?? 0,
          cost: totalCost,
          type: "communication",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      evaluation: evaluationResult,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    console.error("EVALUATION_ROUTE_ERROR", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




// import { prisma } from "@/lib/prisma";
// import { NextRequest, NextResponse } from "next/server";
// import { z } from "zod";
// import { getGeminiAPIResponse } from "@/lib/ai-model";
// import { getCommunicationEvalSystemPrompt } from "@/prompt/get-communication-eval-prompt";

// const RequestBodySchema = z.object({
//     commId: z.string(),
// });

// const EvaluationResultSchema = z.object({
//     score: z.number(),
//     metrics: z.object({
//         grammar: z.number(),
//         confidence: z.number(),
//         focus: z.number(),
//         clarity: z.number(),
//         engagement: z.number()
//     }),
//     feedback: z.object({
//         grammar: z.string(),
//         confidence: z.string(),
//         focus: z.string(),
//         clarity: z.string(),
//         engagement: z.string()
//     }),
//     areasToFocus: z.array(z.string()),
//     detailedFeedback: z.string()
// });

// export async function POST(req: NextRequest) {
//     try {
//         const body = await req.json();
//         const { commId } = RequestBodySchema.parse(body);

//         // 1. Fetch communication session and its messages
//         const communication = await prisma.communication.findUnique({
//             where: { uniqueId: commId },
//             include: {
//                 messages: {
//                     orderBy: { timestamp: 'asc' }
//                 }
//             }
//         });

//         if (!communication) {
//             return NextResponse.json({ error: "Communication session not found" }, { status: 404 });
//         }

//         if (communication.messages.length === 0) {
//             return NextResponse.json({ error: "No messages found for this session" }, { status: 400 });
//         }

//         // 2. Format transcript for Gemini
//         const transcript = communication.messages
//             .map(m => `${m.sender === "USER" ? "User" : "AI Coach"}: ${m.content}`)
//             .join("\n");

//         // 3. Generate System Prompt
//         const systemPrompt = getCommunicationEvalSystemPrompt({
//             topic: communication.topic,
//             prepType: communication.prepType,
//             difficultyLevel: communication.difficultyLevel,
//         });

//         // 4. Call Gemini
//         let aiResponseRaw: string;
//         try {
//             aiResponseRaw = await getGeminiAPIResponse({
//                 systemPrompt,
//                 userMessage: `Transcript:\n\n${transcript}`,
//                 maxOutputTokens: 1000
//             }) as string;
//         } catch (err) {
//             console.error("GEMINI_API_ERROR", err);
//             return NextResponse.json({ error: "AI evaluation failed" }, { status: 502 });
//         }

//         // 5. Parse and validate AI response
//         let evaluationResult;
//         try {
//             evaluationResult = EvaluationResultSchema.parse(JSON.parse(aiResponseRaw));
//         } catch (err) {
//             console.error("AI_PARSE_ERROR", aiResponseRaw, err);
//             return NextResponse.json({ error: "Failed to parse AI evaluation" }, { status: 502 });
//         }

//         // 6. Update database
//         await prisma.communication.update({
//             where: { id: communication.id },
//             data: {
//                 score: evaluationResult.score,
//                 evaluationMessage: evaluationResult,
//                 evaluation: evaluationResult.detailedFeedback
//             }
//         });

//         return NextResponse.json({
//             success: true,
//             evaluation: evaluationResult
//         });

//     } catch (error) {
//         if (error instanceof z.ZodError) {
//             return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
//         }
//         console.error("EVALUATION_ROUTE_ERROR", error);
//         return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//     }
// }