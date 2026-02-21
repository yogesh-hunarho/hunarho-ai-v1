import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { fetchCommunication } from '@/lib/global-cache';

const RequestBodySchema = z.object({
  communicationId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = RequestBodySchema.parse(await req.json());

    const communication = await fetchCommunication(body.communicationId);
    if (!communication) {
      return NextResponse.json({ error: "Communication not found" }, { status: 404 });
    }

    // const aiResponse = "Hey, nice to meet you. I am ready to start the communication. Please introduce yourself first.";
    const starterQuestions = [
      "Hi! Let’s start easy. Tell me a little about your day so far.",
      "Nice to meet you! In one or two sentences, tell me who you are and what you’re currently doing.",
      "Relax and speak naturally. Can you tell me about something you enjoy doing in your free time?",
      "Let’s warm up. Tell me about your work or studies in simple words.",
      "Start with this: what is one small thing that made you happy recently?"
    ];

    const aiResponse = starterQuestions[Math.floor(Math.random() * starterQuestions.length)];
    const transactions = [];

    // Always create AI response message
    transactions.push(
      prisma.communicationMessage.create({
        data: {
          id: crypto.randomUUID(),
          communicationId: communication.id,
          userId: communication.userId,
          sender: "AI",
          content: aiResponse?.trim(),
        },
      })
    );

    await prisma.$transaction(transactions);

    return NextResponse.json({ response: aiResponse, success: true });

  } catch (err) {
    console.error("COMMUNICATION_API_ERROR", err);
    return NextResponse.json({ error: "AI failed to generate response" }, { status: 502 });
  }
}