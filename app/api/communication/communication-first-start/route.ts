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

    const aiResponse = "Hey, nice to meet you. I am ready to start the communication. Please introduce yourself first.";
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