import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { fetchDebate } from '@/lib/global-cache';
import { getDebateSystemPrompt } from '@/prompt/get-debate-prompt';
import { getCachedPrompt } from '@/lib/debate-prompt-cache';

const RequestBodySchema = z.object({
    userMessage: z.string(),
    debateId: z.string(),
});

// function extractText(content: string): string {
//   if (!content) return "";

//   const cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

//   const jsonMatch = cleaned.match(/\{[\s\S]*?\}/);
//   if (jsonMatch) {
//     try {
//       const parsed = JSON.parse(jsonMatch[0]);
//       if (typeof parsed.text === "string") {
//         return parsed.text.trim();
//       }
//     } catch {
//     }
//   }

//   return cleaned;
// }

export async function POST(req: NextRequest) {
  const body = RequestBodySchema.parse(await req.json());

  const debate = await fetchDebate(body.debateId);
  if (!debate) {
    return NextResponse.json({ error: "debate not found" }, { status: 404 });
  }

  const systemPrompt = getCachedPrompt(
    `debate:${debate.topic}:${debate.level}:${debate.argueType}`,
    () => getDebateSystemPrompt({
      topic: debate.topic,
      level: debate.level,
      argueType: debate.argueType === "against" ? "argue against" : "support",
    })
  );

  try {
    // Non-streaming Qubrid API call
    const res = await fetch("https://platform.qubrid.com/api/v1/qubridai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.QUBRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.3-70B-Instruct",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: body.userMessage },
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: false,
        top_p: 1
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json();

      return NextResponse.json(
        {
          success: false,
          provider: "QUBRID",
          status: res.status,
          code: errorBody?.status ?? "AI_REQUEST_FAILED",
          message:errorBody?.message ?? "AI request failed. Please try again later.",
        },
        { status: res.status === 400 ? 402 : 500 }
    )}
    const result = await res.json();
    console.log("result",result)

    let aiResponse = result.content;

    try {
      const parsedContent = JSON.parse(result.content);
      aiResponse = parsedContent.text;
    } catch{
      aiResponse = result.content;
    }


    const promptTokens = result.usage?.prompt_tokens ?? 0;
    const completionTokens = result.usage?.completion_tokens ?? 0;
    const totalTokens = result.usage?.total_tokens ?? 0;
    const INPUT_COST_PER_1K = 0.00027;
    const OUTPUT_COST_PER_1K = 0.00085;

    const inputCost = (promptTokens / 1000) * INPUT_COST_PER_1K;
    const outputCost = (completionTokens / 1000) * OUTPUT_COST_PER_1K;
    const totalCost = inputCost + outputCost;

    // Save messages to database
    await prisma.$transaction([
      prisma.debateMessage.create({
        data: {
          id: crypto.randomUUID(),
          debateId: debate.id,
          userId: debate.userId,
          sender: "USER",
          content: body.userMessage,
        },
      }),
      prisma.debateMessage.create({
        data: {
          id: crypto.randomUUID(),
          debateId: debate.id,
          userId: debate.userId,
          sender: "AI",
          content: aiResponse?.trim(),
        },
      }),
      prisma.aIUsage.create({
        data: {
          userId: debate.userId,
          sessionId: debate.id,
          model: result.model,
          tokensUsed: totalTokens,
          cost: Number(totalCost.toFixed(6)),
          type: "debate",
        },
      }),
    ]);

    return NextResponse.json({ response: aiResponse, success: true });
  } catch (err) {
    console.error("QUBRID_API_ERROR", err);
    return NextResponse.json({ error: "AI failed to generate response" }, { status: 502 });
  }
}

// const DebateAiSchema = z.object({
//   response: z.string().min(1).max(200),
// });

// function parseDebateResponse(raw: string) {
//   const parsed = JSON.parse(raw);
//   return DebateAiSchema.parse(parsed).response;
// }

// async function safeGetGeminiResponse(systemPrompt: string, userMessage: string) {
//   const raw = await getGeminiAPIResponse({ systemPrompt, userMessage });
//   return parseDebateResponse(raw as string);
// }

// export async function POST(req: NextRequest) {
//   let body;
//   try {
//     body = RequestBodySchema.parse(await req.json());
//   } catch {
//     return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
//   }

//   const debate = await fetchDebate(body.debateId);
//   if (!debate) {
//     return NextResponse.json({ error: "debate not found" }, { status: 404 });
//   }

//   const systemPrompt = getDebateSystemPrompt({
//     topic: debate.topic,
//     level: debate.level,
//     argueType: debate.argueType === "against" ? "argue against" : "support",
//   });

//   let aiResponse: string;
//   try {
//     aiResponse = await safeGetGeminiResponse(systemPrompt, body.userMessage);
//   } catch (err) {
//     console.error("AI_ERROR", err);
//     return NextResponse.json({ error: "AI failed to generate response" }, { status: 502 });
//   }

//   await prisma.$transaction([
//     prisma.debateMessage.create({
//       data: {
//         id: crypto.randomUUID(),
//         debateId: body.debateId,
//         userId: debate.userId,
//         sender: "USER",
//         content: body.userMessage,
//       },
//     }),
//     prisma.debateMessage.create({
//       data: {
//         id: crypto.randomUUID(),
//         debateId: body.debateId,
//         userId: debate.userId,
//         sender: "AI",
//         content: aiResponse,
//       },
//     }),
//   ]);

//   return NextResponse.json({ response: aiResponse, success: true });
// }



// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { z } from 'zod';
// import { fetchDebate } from '@/lib/global-cache';
// import { getDebateSystemPrompt } from '@/prompt/get-debate-prompt';
// import { streamGeminiResponse } from '@/lib/contentStreamGemini'
// import { getCachedPrompt } from '@/lib/debate-prompt-cache';

// function safeParseJSON(raw: string) {
//   try {
//     return JSON.parse(raw);
//   } catch {
//     return null;
//   }
// }

// const RequestBodySchema = z.object({
//     userMessage: z.string(),
//     debateId: z.string(),
// });

// export async function POST(req: NextRequest) {
//   const body = RequestBodySchema.parse(await req.json());

//   const debate = await fetchDebate(body.debateId);
//   if (!debate) {
//     return NextResponse.json({ error: "debate not found" }, { status: 404 });
//   }

//   const systemPrompt = getCachedPrompt(
//     `debate:${debate.topic}:${debate.level}:${debate.argueType}`,
//     () => getDebateSystemPrompt({
//     topic: debate.topic,
//     level: debate.level,
//     argueType: debate.argueType === "against" ? "argue against" : "support",
//   }));

//   const encoder = new TextEncoder();
//   let fullResponse = "";

//   const stream = new ReadableStream({
//     async start(controller) {
//       try {
//         const geminiStream = await streamGeminiResponse({
//           systemPrompt,
//           userMessage: body.userMessage,
//         });

//         for await (const chunk of geminiStream) {
//           const text = chunk.text
//           if (!text) continue;

//           fullResponse += text;
//           controller.enqueue(encoder.encode(text));
//         }

//         controller.close();

//         // ✅ Store AFTER stream completes
//         // const parsed = parseDebateResponse(fullResponse);
//         const parsed = safeParseJSON(fullResponse);
//         if (!parsed?.response) {
//           throw new Error("Invalid AI JSON response");
//         }

//         await prisma.$transaction([
//           prisma.debateMessage.create({
//             data: {
//               id: crypto.randomUUID(),
//               debateId: body.debateId,
//               userId: debate.userId,
//               sender: "USER",
//               content: body.userMessage,
//             },
//           }),
//           prisma.debateMessage.create({
//             data: {
//               id: crypto.randomUUID(),
//               debateId: body.debateId,
//               userId: debate.userId,
//               sender: "AI",
//               content: parsed,
//             },
//           }),
//         ]);
//       } catch (err) {
//         console.error("STREAM_ERROR", err);
//         controller.error(err);
//       }
//     },
//   });

//   return new NextResponse(stream, {
//     headers: {
//       "Content-Type": "text/plain; charset=utf-8",
//       "Transfer-Encoding": "chunked",
//     },
//   });
// }

// // const DebateAiSchema = z.object({
// //   response: z.string().min(1).max(200),
// // });

// // function parseDebateResponse(raw: string) {
// //   const parsed = JSON.parse(raw);
// //   return DebateAiSchema.parse(parsed).response;
// // }

// // async function safeGetGeminiResponse(systemPrompt: string, userMessage: string) {
// //   const raw = await getGeminiAPIResponse({ systemPrompt, userMessage });
// //   return parseDebateResponse(raw as string);
// // }

// // export async function POST(req: NextRequest) {
// //   let body;
// //   try {
// //     body = RequestBodySchema.parse(await req.json());
// //   } catch {
// //     return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
// //   }

// //   const debate = await fetchDebate(body.debateId);
// //   if (!debate) {
// //     return NextResponse.json({ error: "debate not found" }, { status: 404 });
// //   }

// //   const systemPrompt = getDebateSystemPrompt({
// //     topic: debate.topic,
// //     level: debate.level,
// //     argueType: debate.argueType === "against" ? "argue against" : "support",
// //   });

// //   let aiResponse: string;
// //   try {
// //     aiResponse = await safeGetGeminiResponse(systemPrompt, body.userMessage);
// //   } catch (err) {
// //     console.error("AI_ERROR", err);
// //     return NextResponse.json({ error: "AI failed to generate response" }, { status: 502 });
// //   }

// //   await prisma.$transaction([
// //     prisma.debateMessage.create({
// //       data: {
// //         id: crypto.randomUUID(),
// //         debateId: body.debateId,
// //         userId: debate.userId,
// //         sender: "USER",
// //         content: body.userMessage,
// //       },
// //     }),
// //     prisma.debateMessage.create({
// //       data: {
// //         id: crypto.randomUUID(),
// //         debateId: body.debateId,
// //         userId: debate.userId,
// //         sender: "AI",
// //         content: aiResponse,
// //       },
// //     }),
// //   ]);

// //   return NextResponse.json({ response: aiResponse, success: true });
// // }