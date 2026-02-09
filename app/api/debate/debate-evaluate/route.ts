// import { getGeminiAPIResponse } from '@/lib/ai-model';
// import { prisma } from "@/lib/prisma";
// import { NextRequest, NextResponse } from "next/server";
// import { z } from "zod";
// import { getDebateEvalSystemPrompt } from "@/prompt/get-debate-eval-prompt";

// const RequestBodySchema = z.object({
//     debateId: z.string(),
// });

// const EvaluationResultSchema = z.object({
//     score: z.number(),
//     metrics: z.object({
//         argumentation: z.number(),
//         counterArguments: z.number(),
//         relevance: z.number(),
//         clarity: z.number(),
//         engagement: z.number()
//     }),
//     feedback: z.object({
//         argumentation: z.string(),
//         counterArguments: z.string(),
//         relevance: z.string(),
//         clarity: z.string(),
//         engagement: z.string()
//     }),
//     areasToFocus: z.array(z.string()),
//     detailedFeedback: z.string(),
//     references: z.array(z.object({
//         link: z.string(),
//         type: z.enum(["web", "video"]),
//         title: z.string()
//     }))
// });

// export async function POST(req: NextRequest) {
//     try {
//         const body = await req.json();
//         const { debateId } = RequestBodySchema.parse(body);

//         const debate = await prisma.debate.findUnique({
//             where: { uniqueId: debateId },
//             include: {
//                 messages: {
//                     orderBy: { timestamp: 'asc' }
//                 }
//             }
//         });

//         if (!debate) {
//             return NextResponse.json({ error: "Debate session not found" }, { status: 404 });
//         }

//         if (debate.evaluation !== "Not evaluated") {
//              return NextResponse.json({ 
//                 success: true, 
//                 evaluation: debate.evaluationMessage 
//             }, { status: 200 });
//         }

//         if (debate.messages.length === 0) {
//             return NextResponse.json({ error: "No messages found for this debate" }, { status: 400 });
//         }

//         // 1. Format transcript
//         const transcript = debate.messages
//             .map(m => `${m.sender === "USER" ? "User" : "Opponent"}: ${m.content}`)
//             .join("\n");

//         // 2. Generate System Prompt
//         const systemPrompt = getDebateEvalSystemPrompt({
//             topic: debate.topic,
//             level: debate.level,
//             argueType: debate.argumentType,
//         });

//         // 3. Call Gemini
//         let aiResponseRaw: string;
//         try {
//             aiResponseRaw = await getGeminiAPIResponse({
//                 systemPrompt,
//                 userMessage: `Transcript:\n\n${transcript}`,
//                 maxOutputTokens: 1500
//             }) as string;
//         } catch (err) {
//             console.error("GEMINI_API_ERROR", err);
//             return NextResponse.json({ error: "AI evaluation failed" }, { status: 502 });
//         }

//         // 4. Parse and validate AI response
//         let evaluationResult;
//         try {
//             evaluationResult = EvaluationResultSchema.parse(JSON.parse(aiResponseRaw));
//         } catch (err) {
//             console.error("AI_PARSE_ERROR", aiResponseRaw, err);
//             return NextResponse.json({ error: "Failed to parse AI evaluation" }, { status: 502 });
//         }

//         // 5. Update database
//         await prisma.debate.update({
//             where: { id: debate.id },
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
//             return NextResponse.json({ error: "Invalid request body", details:"" }, { status: 400 });
//         }
//         console.error("DEBATE_EVALUATION_ROUTE_ERROR", error);
//         return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//     }
// }





import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDebateEvalSystemPrompt } from "@/prompt/get-debate-eval-prompt";

const RequestBodySchema = z.object({
  debateId: z.string(),
});

const EvaluationResultSchema = z.object({
  score: z.number(),
  metrics: z.object({
    argumentation: z.number(),
    counterArguments: z.number(),
    relevance: z.number(),
    clarity: z.number(),
    engagement: z.number(),
  }),
  feedback: z.object({
    argumentation: z.string(),
    counterArguments: z.string(),
    relevance: z.string(),
    clarity: z.string(),
    engagement: z.string(),
  }),
  areasToFocus: z.array(z.string()),
  detailedFeedback: z.string(),
  references: z
    .array(
      z.object({
        link: z.string(),
        type: z.enum(["web", "video"]),
        title: z.string(),
      })
    )
    .optional(),
});

function extractJSON<T>(content: string): T {
  if (!content) throw new Error("Empty AI response");

  const cleaned = content
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .trim();

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
    const debate = await prisma.debate.findUnique({
      where: { uniqueId: body.debateId },
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
        },
      },
    });
    
    if (!debate) {
      return NextResponse.json({ error: "Debate session not found" }, { status: 404 });
    }

    if (debate.evaluation !== "Not evaluated") {
      return NextResponse.json({success: true, evaluation: debate.evaluationMessage }, { status: 200 })
    }

    if (debate.messages.length === 0) {
      return NextResponse.json({ error: "No messages found for this debate" }, { status: 400 });
    }

    const transcript = debate.messages
      .map(
        (m) =>
          `${m.sender === "USER" ? "User" : "Opponent"}: ${m.content}`
      )
      .join("\n");

    const systemPrompt = getDebateEvalSystemPrompt({
      topic: debate.topic,
      level: debate.level,
      argueType: debate.argumentType,
    });

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

      // const result =  {
      //   content: '```json\n' +
      //     '{\n' +
      //     '  "score": 7,\n' +
      //     '  "metrics": {\n' +
      //     '    "argumentation": 8,\n' +
      //     '    "counterArguments": 6,\n' +
      //     '    "relevance": 9,\n' +
      //     '    "clarity": 8,\n' +
      //     '    "engagement": 7\n' +
      //     '  },\n' +
      //     '  "feedback": {\n' +
      //     '    "argumentation": "You presented strong, logical arguments against space exploration, highlighting the pressing issues on Earth and the potential misallocation of resources. However, some of your points could be further supported with data or examples to enhance their persuasive power.",\n' +
      //     `    "counterArguments": "While you attempted to address the opponent's points, your counterarguments could be more effective. For instance, when the opponent mentioned that space exploration drives innovation, you could have provided specific examples of innovations that do not rely on space exploration or highlighted the cost-benefit analysis of such innovations.",\n` +
      //     '    "relevance": "You stayed focused on the topic and effectively argued against the notion that space exploration is worth the cost and resources, making your arguments highly relevant to the debate.",\n' +
      //     `    "clarity": "Your points were generally clear and easy to follow, but there were moments where your responses seemed a bit repetitive or lacked a direct address to the opponent's previous statement. Working on transitioning between ideas and directly addressing counterpoints will improve clarity.",\n` +
      //     `    "engagement": "You actively participated in the debate, but there were opportunities to delve deeper into the discussion by asking follow-up questions or seeking clarification on the opponent's statements to further challenge their arguments."\n` +
      //     '  },\n' +
      //     '  "areasToFocus": [\n' +
      //     '    "Providing data or examples to support arguments",\n' +
      //     '    "Developing more effective counterarguments",\n' +
      //     '    "Improving clarity through better transitions and direct addresses",\n' +
      //     '    "Enhancing engagement through follow-up questions or seeking clarification"\n' +
      //     '  ],\n' +
      //     `  "detailedFeedback": "Overall, your performance in the debate was strong, with clear and logical arguments against space exploration. To further improve, focus on supporting your arguments with specific examples or data, and work on crafting more effective counterarguments that directly address the opponent's points. Additionally, enhancing the clarity of your responses and actively engaging with the opponent's statements will make your arguments more persuasive. Remember, the goal is not just to present your arguments but to engage in a dialogue that challenges both you and your opponent to think critically about the topic. For future debates, consider researching high-quality references related to space exploration and its impact on society, such as the economic benefits of space technology, the role of space exploration in driving innovation, and the ethical considerations of prioritizing space exploration over terrestrial issues."\n` +       
      //     '}\n' +
      //     '```',
      //   metrics: {
      //     input_tokens: 720,
      //     output_tokens: 381,
      //     total_time: 4.0035,
      //     tps: 95.1693
      //   },
      //   model: 'meta-llama/Llama-3.3-70B-Instruct-fast',
      //   usage: {
      //     completion_tokens: 528,
      //     completion_tokens_details: null,
      //     prompt_tokens: 720,
      //     prompt_tokens_details: null,
      //     total_tokens: 1248
      //   }
      // }
      aiContent = result.content ?? "";
      usage = result.usage ?? {};
    } catch (err) {
      console.error("QUBRID_EVAL_ERROR", err);
      return NextResponse.json({ error: "AI evaluation failed" }, { status: 502 });
    }

    let evaluationResult;
    try {
      const parsed = extractJSON(aiContent);
      evaluationResult = EvaluationResultSchema.parse(parsed);
    } catch (err) {
      console.error("EVAL_PARSE_ERROR", aiContent, err);
      return NextResponse.json({ error: "Failed to parse AI evaluation" }, { status: 502 });
    }

    const totalCost = calculateCost(
      usage.prompt_tokens,
      usage.completion_tokens
    );

    await prisma.$transaction([
      prisma.debate.update({
        where: { id: debate.id },
        data: {
          score: evaluationResult.score,
          evaluationMessage: JSON.stringify(evaluationResult),
          evaluation: "Evaluated",
        },
      }),

      prisma.aIUsage.create({
        data: {
          userId: debate.userId,
          sessionId: debate.id,
          model: "meta-llama/Llama-3.3-70B-Instruct",
          tokensUsed: usage.total_tokens ?? 0,
          cost: totalCost,
          type: "evaluation",
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

    console.error("DEBATE_EVALUATION_ROUTE_ERROR", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
