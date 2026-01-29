import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGeminiAPIResponse } from "@/lib/ai-model";
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
        engagement: z.number()
    }),
    feedback: z.object({
        grammar: z.string(),
        confidence: z.string(),
        focus: z.string(),
        clarity: z.string(),
        engagement: z.string()
    }),
    areasToFocus: z.array(z.string()),
    detailedFeedback: z.string()
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { commId } = RequestBodySchema.parse(body);

        // 1. Fetch communication session and its messages
        const communication = await prisma.communication.findUnique({
            where: { uniqueId: commId },
            include: {
                messages: {
                    orderBy: { timestamp: 'asc' }
                }
            }
        });

        if (!communication) {
            return NextResponse.json({ error: "Communication session not found" }, { status: 404 });
        }

        if (communication.messages.length === 0) {
            return NextResponse.json({ error: "No messages found for this session" }, { status: 400 });
        }

        // 2. Format transcript for Gemini
        const transcript = communication.messages
            .map(m => `${m.sender === "USER" ? "User" : "AI Coach"}: ${m.content}`)
            .join("\n");

        // 3. Generate System Prompt
        const systemPrompt = getCommunicationEvalSystemPrompt({
            topic: communication.topic,
            prepType: communication.prepType,
            difficultyLevel: communication.difficultyLevel,
        });

        // 4. Call Gemini
        let aiResponseRaw: string;
        try {
            aiResponseRaw = await getGeminiAPIResponse({
                systemPrompt,
                userMessage: `Transcript:\n\n${transcript}`,
                maxOutputTokens: 1000
            }) as string;
        } catch (err) {
            console.error("GEMINI_API_ERROR", err);
            return NextResponse.json({ error: "AI evaluation failed" }, { status: 502 });
        }

        // 5. Parse and validate AI response
        let evaluationResult;
        try {
            evaluationResult = EvaluationResultSchema.parse(JSON.parse(aiResponseRaw));
        } catch (err) {
            console.error("AI_PARSE_ERROR", aiResponseRaw, err);
            return NextResponse.json({ error: "Failed to parse AI evaluation" }, { status: 502 });
        }

        // 6. Update database
        await prisma.communication.update({
            where: { id: communication.id },
            data: {
                score: evaluationResult.score,
                evaluationMessage: evaluationResult,
                evaluation: evaluationResult.detailedFeedback
            }
        });

        return NextResponse.json({
            success: true,
            evaluation: evaluationResult
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }
        console.error("EVALUATION_ROUTE_ERROR", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}