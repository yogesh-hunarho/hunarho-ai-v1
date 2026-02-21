import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { fetchInterview } from '@/lib/global-cache';
import { getInterviewSystemPrompt } from '@/prompt/get-interview-prompt';
import { getCachedPrompt } from '@/lib/debate-prompt-cache';

async function getOptimizedHistory(interviewId: string, limit: number = 5) {
  const messages = await prisma.interviewMessage.findMany({
    where: { interviewId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
  
  // Reverse to get chronological order
  return messages.reverse().map(m => `${m.sender}: ${m.content}`).join('\n');
}

const RequestBodySchema = z.object({
  userMessage: z.string().optional(),
  interviewId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = RequestBodySchema.parse(await req.json());

    const interview = await fetchInterview(body.interviewId);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const systemPrompt = getCachedPrompt(
      `interview:${interview.jobType}:${interview.jobRole}:${interview.interviewType}:${interview.techStack}:${interview.yearsOfExperience}:${interview.jobDescription}`,
      () => getInterviewSystemPrompt({
        jobTitle: interview.jobType,
        jobRole: interview.jobRole || undefined,
        jobDescription: interview.jobDescription || undefined,
        techStack: interview.techStack || undefined,
        yearsOfExperience: interview.yearsOfExperience,
        interviewType: interview.interviewType,
      })
    );

    const history = await getOptimizedHistory(interview.id);
    const userMessageContent = body.userMessage || "Hello, I am ready to start the interview.";

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
              ? `Recent Interview History:\n${history}\n\nCandidate: ${userMessageContent}`
              : userMessageContent 
          },
        ],
        temperature: 0.3,  // 0.7
        max_tokens: 400,
        stream: false,
        top_p: 0.85 // 1
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

    const transactions = [];
    
    // Only create user message if it's explicitly provided
    if (body.userMessage) {
      transactions.push(
        prisma.interviewMessage.create({
          data: {
            id: crypto.randomUUID(),
            interviewId: interview.id,
            userId: interview.userId,
            sender: "USER",
            content: body.userMessage,
          },
        })
      );
    }

    // Always create AI response message
    transactions.push(
      prisma.interviewMessage.create({
        data: {
          id: crypto.randomUUID(),
          interviewId: interview.id,
          userId: interview.userId,
          sender: "AI",
          content: aiResponse?.trim(),
        },
      })
    );

    // Track AI usage
    transactions.push(
      prisma.aIUsage.create({
        data: {
          userId: interview.userId,
          sessionId: interview.id,
          model: result.model || "meta-llama/Llama-3.3-70B-Instruct",
          tokensUsed: totalTokens,
          cost: Number(totalCost.toFixed(6)),
          type: "interview",
        },
      })
    );

    await prisma.$transaction(transactions);

    return NextResponse.json({ response: aiResponse, success: true });

  } catch (err) {
    console.error("INTERVIEW_API_ERROR", err);
    return NextResponse.json({ error: "AI failed to generate response" }, { status: 502 });
  }
}

export async function GET() {
  try {
    return NextResponse.json({ data: "This endpoint is used for interview-prep API" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to get API" }, { status: 500 });
  }
}




// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { z } from 'zod';
// import { fetchInterview } from '@/lib/global-cache';
// import { getInterviewSystemPrompt } from '@/prompt/get-interview-prompt';
// import { streamGeminiResponse } from '@/lib/contentStreamGemini';
// import { getCachedPrompt } from '@/lib/debate-prompt-cache';

// function safeParseJSON(raw: string) {
//   try {
//     return JSON.parse(raw);
//   } catch {
//     return null;
//   }
// }

// const RequestBodySchema = z.object({
//   userMessage: z.string().optional(),
//   interviewId: z.string(),
// });

// export async function POST(req: NextRequest) {
//   try {
//     const body = RequestBodySchema.parse(await req.json());

//     const interview = await fetchInterview(body.interviewId);
//     if (!interview) {
//       return NextResponse.json({ error: "Interview not found" }, { status: 404 });
//     }

//     const systemPrompt = getCachedPrompt(
//       `interview:${interview.jobType}:${interview.jobRole}:${interview.interviewType}:${interview.techStack}:${interview.yearsOfExperience}:${interview.jobDescription}`,
//       () => getInterviewSystemPrompt({
//         jobTitle: interview.jobType,
//         jobRole: interview.jobRole || undefined,
//         jobDescription: interview.jobDescription || undefined,
//         techStack: interview.techStack || undefined,
//         yearsOfExperience: interview.yearsOfExperience,
//         interviewType: interview.interviewType,
//       })
//     );

//     const encoder = new TextEncoder();
//     let fullResponse = "";
    
//     // Determine if this is the start of the interview
//     const userMessageContent = body.userMessage || "Hello, I am ready to start the interview.";

//     const stream = new ReadableStream({
//       async start(controller) {
//         try {
//           const geminiStream = await streamGeminiResponse({
//             systemPrompt,
//             userMessage: userMessageContent,
//           });

//           for await (const chunk of geminiStream) {
//             const text = chunk.text;
//             if (!text) continue;

//             fullResponse += text;
//             controller.enqueue(encoder.encode(text));
//           }

//           controller.close();

//           // Store AFTER stream completes
//           const parsed = safeParseJSON(fullResponse);
//           if (!parsed?.response) {
//             console.error("Invalid AI JSON response:", fullResponse);
//             return;
//           }

//           const transactions = [];
          
//           // Only create user message if it's actually provided by the client, 
//           // or if we want to record the "start" trigger.
//           if (body.userMessage) {
//             transactions.push(
//               prisma.interviewMessage.create({
//                 data: {
//                   id: crypto.randomUUID(),
//                   interviewId: body.interviewId,
//                   userId: interview.userId,
//                   sender: "USER",
//                   content: body.userMessage,
//                 },
//               })
//             );
//           }

//           transactions.push(
//             prisma.interviewMessage.create({
//               data: {
//                 id: crypto.randomUUID(),
//                 interviewId: body.interviewId,
//                 userId: interview.userId,
//                 sender: "AI",
//                 content: parsed.response,
//               },
//             })
//           );

//           await prisma.$transaction(transactions);
//         } catch (err) {
//           console.error("STREAM_ERROR", err);
//           controller.error(err);
//         }
//       },
//     });

//     return new NextResponse(stream, {
//       headers: {
//         "Content-Type": "text/plain; charset=utf-8",
//         "Transfer-Encoding": "chunked",
//       },
//     });
//   } catch (err) {
//     console.error("API_ERROR", err);
//     return NextResponse.json({ error: "Invalid request or server error" }, { status: 500 });
//   }
// }

// export async function GET() {
//   try {
//     return NextResponse.json({ data: "This endpoint is used for interview-prep API" }, { status: 200 });
//   } catch {
//     return NextResponse.json({ error: "Failed to get API" }, { status: 500 });
//   }
// }
