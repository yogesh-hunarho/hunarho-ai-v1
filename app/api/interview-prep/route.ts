import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { fetchInterview } from '@/lib/global-cache';
import { getInterviewSystemPrompt } from '@/prompt/get-interview-prompt';
import { streamGeminiResponse } from '@/lib/contentStreamGemini';
import { getCachedPrompt } from '@/lib/debate-prompt-cache';

function safeParseJSON(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
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

    const encoder = new TextEncoder();
    let fullResponse = "";
    
    // Determine if this is the start of the interview
    const userMessageContent = body.userMessage || "Hello, I am ready to start the interview.";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const geminiStream = await streamGeminiResponse({
            systemPrompt,
            userMessage: userMessageContent,
          });

          for await (const chunk of geminiStream) {
            const text = chunk.text;
            if (!text) continue;

            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }

          controller.close();

          // Store AFTER stream completes
          const parsed = safeParseJSON(fullResponse);
          if (!parsed?.response) {
            console.error("Invalid AI JSON response:", fullResponse);
            return;
          }

          const transactions = [];
          
          // Only create user message if it's actually provided by the client, 
          // or if we want to record the "start" trigger.
          if (body.userMessage) {
            transactions.push(
              prisma.interviewMessage.create({
                data: {
                  id: crypto.randomUUID(),
                  interviewId: body.interviewId,
                  userId: interview.userId,
                  sender: "USER",
                  content: body.userMessage,
                },
              })
            );
          }

          transactions.push(
            prisma.interviewMessage.create({
              data: {
                id: crypto.randomUUID(),
                interviewId: body.interviewId,
                userId: interview.userId,
                sender: "AI",
                content: parsed.response,
              },
            })
          );

          await prisma.$transaction(transactions);
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
  } catch (err) {
    console.error("API_ERROR", err);
    return NextResponse.json({ error: "Invalid request or server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    return NextResponse.json({ data: "This endpoint is used for interview-prep API" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to get API" }, { status: 500 });
  }
}
