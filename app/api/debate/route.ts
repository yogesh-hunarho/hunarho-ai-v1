import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { fetchDebate } from '@/lib/global-cache';
import { getDebateSystemPrompt } from '@/prompt/get-debate-prompt';
import { streamGeminiResponse } from '@/lib/contentStreamGemini'
import { getCachedPrompt } from '@/lib/debate-prompt-cache';

function safeParseJSON(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const RequestBodySchema = z.object({
    userMessage: z.string(),
    debateId: z.string(),
});

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
  }));

  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const geminiStream = await streamGeminiResponse({
          systemPrompt,
          userMessage: body.userMessage,
        });

        for await (const chunk of geminiStream) {
          const text = chunk.text
          if (!text) continue;

          fullResponse += text;
          controller.enqueue(encoder.encode(text));
        }

        controller.close();

        // ✅ Store AFTER stream completes
        // const parsed = parseDebateResponse(fullResponse);
        const parsed = safeParseJSON(fullResponse);
        if (!parsed?.response) {
          throw new Error("Invalid AI JSON response");
        }

        await prisma.$transaction([
          prisma.debateMessage.create({
            data: {
              id: crypto.randomUUID(),
              debateId: body.debateId,
              userId: debate.userId,
              sender: "USER",
              content: body.userMessage,
            },
          }),
          prisma.debateMessage.create({
            data: {
              id: crypto.randomUUID(),
              debateId: body.debateId,
              userId: debate.userId,
              sender: "AI",
              content: parsed,
            },
          }),
        ]);
      } catch (err) {
        console.error("STREAM_ERROR", err);
        controller.error(err);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
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