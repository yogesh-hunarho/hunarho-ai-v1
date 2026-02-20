import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { fetchCommunication } from '@/lib/global-cache';
import { getCommunicationSystemPrompt } from '@/prompt/get-communication-prompt';
import { getCachedPrompt } from '@/lib/debate-prompt-cache';

async function getOptimizedHistory(communicationId: string, limit: number = 5) {
  const messages = await prisma.communicationMessage.findMany({
    where: { communicationId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
  
  // Reverse to get chronological order
  return messages.reverse().map(m => `${m.sender}: ${m.content}`).join('\n');
}

const RequestBodySchema = z.object({
    userMessage: z.string().min(1),
    communicationId: z.string(),
});

export async function POST(req: NextRequest) {
  const body = RequestBodySchema.parse(await req.json());

  const comm = await fetchCommunication(body.communicationId);
  if (!comm) {
    return NextResponse.json({ error: "Communication session not found" }, { status: 404 });
  }

  const systemPrompt = getCachedPrompt(
    `communication:${comm.prepType}:${comm.difficultyLevel}:${comm.focusArea}`,
    () => getCommunicationSystemPrompt({
      prepType: comm.prepType,
      difficultyLevel: comm.difficultyLevel,
      focusArea: comm.focusArea,
    })
  );

  const history = await getOptimizedHistory(body.communicationId);

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
          { 
            role: "user", 
            content: history 
              ? `Recent Conversation History:\n${history}\n\nUser: ${body.userMessage}`
              : body.userMessage 
          },
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
          message: errorBody?.message ?? "AI request failed. Please try again later.",
        },
        { status: res.status === 400 ? 402 : 500 }
      );
    }

    const result = await res.json();
    let aiResponse = result.content;

    try {
      const parsedContent = JSON.parse(result.content);
      aiResponse = parsedContent.text || parsedContent.response || result.content;
    } catch {
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
      prisma.communicationMessage.create({
        data: {
          id: crypto.randomUUID(),
          communicationId: comm.id,
          userId: comm.userId,
          sender: "USER",
          content: body.userMessage,
        },
      }),
      prisma.communicationMessage.create({
        data: {
          id: crypto.randomUUID(),
          communicationId: comm.id,
          userId: comm.userId,
          sender: "AI",
          content: aiResponse?.trim(),
        },
      }),
      prisma.aIUsage.create({
        data: {
          userId: comm.userId,
          sessionId: comm.id,
          model: result.model || "meta-llama/Llama-3.3-70B-Instruct",
          tokensUsed: totalTokens,
          cost: Number(totalCost.toFixed(6)),
          type: "communication",
        },
      }),
    ]);

    return NextResponse.json({ response: aiResponse, success: true });
  } catch (err) {
    console.error("COMM_API_ERROR", err);
    return NextResponse.json({ error: "AI failed to generate response" }, { status: 502 });
  }
}






// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { z } from 'zod';
// import { fetchCommunication } from '@/lib/global-cache';
// import { getCommunicationSystemPrompt } from '@/prompt/get-communication-prompt';
// import { streamGeminiResponse } from '@/lib/contentStreamGemini';

// async function getOptimizedHistory(communicationId: string, limit: number = 5) {
//   const messages = await prisma.communicationMessage.findMany({
//     where: { communicationId },
//     orderBy: { timestamp: 'desc' },
//     take: limit,
//   });
  
//   // Reverse to get chronological order
//   return messages.reverse().map(m => `${m.sender}: ${m.content}`).join('\n');
// }

// const RequestBodySchema = z.object({
//     userMessage: z.string().min(1),
//     communicationId: z.string(),
// });

// function safeParseJSON(raw: string) {
//   try {
//     return JSON.parse(raw);
//   } catch {
//     return null;
//   }
// }

// export async function POST(req: NextRequest) {
//   const body = RequestBodySchema.parse(await req.json());

//   const comm = await fetchCommunication(body.communicationId);
//   if (!comm) {
//     return NextResponse.json({ error: "Communication session not found" }, { status: 404 });
//   }

//   const systemPrompt = getCommunicationSystemPrompt({
//     prepType: comm.prepType,
//     difficultyLevel: comm.difficultyLevel,
//     focusArea: comm.focusArea,
//   });

//   const history = await getOptimizedHistory(body.communicationId);

//   const contextMessage = history
//     ? `Recent Conversation History:\n${history}\n\nUser: ${body.userMessage}`
//     : `User: ${body.userMessage}`;

//   const encoder = new TextEncoder();
//   let fullRawResponse = "";

//   const stream = new ReadableStream({
//     async start(controller) {
//       try {
//         const geminiStream = await streamGeminiResponse({
//           systemPrompt,
//           userMessage: contextMessage,
//           maxOutputTokens: 300,
//         });

//         for await (const chunk of geminiStream) {
//           if (!chunk.text) continue;

//           fullRawResponse += chunk.text;
//           controller.enqueue(encoder.encode(chunk.text));
//         }

//         controller.close();

//         // const finalText = parseAiResponse(fullRawResponse);
//         const finalText = safeParseJSON(fullRawResponse);
//         if (!finalText?.response) {
//           throw new Error("Invalid AI JSON response");
//         }

//         await prisma.$transaction([
//           prisma.communicationMessage.create({
//             data: {
//               communicationId: body.communicationId,
//               userId: comm.userId,
//               sender: "USER",
//               content: body.userMessage,
//             },
//           }),
//           prisma.communicationMessage.create({
//             data: {
//               communicationId: body.communicationId,
//               userId: comm.userId,
//               sender: "AI",
//               content: finalText,
//             },
//           }),
//         ]);
//       } catch (err) {
//         console.error("COMM_STREAM_ERROR", err);
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


// previous one

// const CommunicationAiSchema = z.object({
//   response: z.string().min(1).max(500),
// });

// function parseAiResponse(raw: string) {
//   try {
//     const parsed = JSON.parse(raw);
//     return CommunicationAiSchema.parse(parsed).response;
//   } catch (err) {
//     console.error("AI_PARSE_ERROR", raw, err);
//     throw new Error("Failed to parse AI response");
//   }
// }
// export async function POST(req: NextRequest) {
//   let body;
//   try {
//     const json = await req.json();
//     body = RequestBodySchema.parse(json);
//   } catch {
//     return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
//   }

//   // 1. Fetch Session Metadata (Cached)
//   const comm = await fetchCommunication(body.communicationId);
//   if (!comm) {
//     return NextResponse.json({ error: "Communication session not found" }, { status: 404 });
//   }

//   // 2. Generate System Prompt
//   const systemPrompt = getCommunicationSystemPrompt({
//     prepType: comm.prepType,
//     difficultyLevel: comm.difficultyLevel,
//     focusArea: comm.focusArea,
//   });

//   // 3. Get Truncated History for Token Optimization
//   const history = await getOptimizedHistory(body.communicationId);
  
//   // 4. Construct User Message with context
//   const contextMessage = history 
//     ? `Recent Conversation History:\n${history}\n\nUser: ${body.userMessage}`
//     : `User: ${body.userMessage}`;

//   // 5. Call Gemini
//   let aiResponseText: string;
//   try {
//     const raw = await getGeminiAPIResponse({ 
//       systemPrompt, 
//       userMessage: contextMessage,
//       maxOutputTokens: 300 
//     });
//     aiResponseText = parseAiResponse(raw as string);
//   } catch (err) {
//     console.error("GEMINI_API_ERROR", err);
//     return NextResponse.json(
//       { error: "AI service unavailable" },
//       { status: 502 }
//     );
//   }

//   // 6. Persist in Transaction
//   try {
//     await prisma.$transaction([
//       prisma.communicationMessage.create({
//         data: {
//           communicationId: body.communicationId,
//           userId: comm.userId,
//           sender: "USER",
//           content: body.userMessage,
//         },
//       }),
//       prisma.communicationMessage.create({
//         data: {
//           communicationId: body.communicationId,
//           userId: comm.userId,
//           sender: "AI",
//           content: aiResponseText,
//         },
//       }),
//     ]);
//   } catch (err) {
//     console.error("PRISMA_TRANSACTION_ERROR", err);
//     // Even if DB fail, we return response for better UX, though message isn't logged
//   }

//   return NextResponse.json({ 
//     response: aiResponseText, 
//     success: true 
//   });
// }