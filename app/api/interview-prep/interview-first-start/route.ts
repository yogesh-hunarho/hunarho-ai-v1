import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { fetchInterview } from '@/lib/global-cache';

const RequestBodySchema = z.object({
  interviewId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = RequestBodySchema.parse(await req.json());

    const interview = await fetchInterview(body.interviewId);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const aiResponse = "Hey, nice to meet you. I am ready to start the interview. Please introduce yourself first.";
    const transactions = [];

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

    await prisma.$transaction(transactions);

    return NextResponse.json({ response: aiResponse, success: true });

  } catch (err) {
    console.error("INTERVIEW_API_ERROR", err);
    return NextResponse.json({ error: "AI failed to generate response" }, { status: 502 });
  }
}