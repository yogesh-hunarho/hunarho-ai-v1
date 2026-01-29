import { getGeminiAPIResponse } from '@/lib/ai-model';
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
        engagement: z.number()
    }),
    feedback: z.object({
        argumentation: z.string(),
        counterArguments: z.string(),
        relevance: z.string(),
        clarity: z.string(),
        engagement: z.string()
    }),
    areasToFocus: z.array(z.string()),
    detailedFeedback: z.string(),
    references: z.array(z.object({
        link: z.string(),
        type: z.enum(["web", "video"]),
        title: z.string()
    }))
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { debateId } = RequestBodySchema.parse(body);

        const debate = await prisma.debate.findUnique({
            where: { uniqueId: debateId },
            include: {
                messages: {
                    orderBy: { timestamp: 'asc' }
                }
            }
        });

        if (!debate) {
            return NextResponse.json({ error: "Debate session not found" }, { status: 404 });
        }

        if (debate.evaluation !== "Not evaluated") {
             return NextResponse.json({ 
                success: true, 
                evaluation: debate.evaluationMessage 
            }, { status: 200 });
        }

        if (debate.messages.length === 0) {
            return NextResponse.json({ error: "No messages found for this debate" }, { status: 400 });
        }

        // 1. Format transcript
        const transcript = debate.messages
            .map(m => `${m.sender === "USER" ? "User" : "Opponent"}: ${m.content}`)
            .join("\n");

        // 2. Generate System Prompt
        const systemPrompt = getDebateEvalSystemPrompt({
            topic: debate.topic,
            level: debate.level,
            argueType: debate.argumentType,
        });

        // 3. Call Gemini
        let aiResponseRaw: string;
        try {
            aiResponseRaw = await getGeminiAPIResponse({
                systemPrompt,
                userMessage: `Transcript:\n\n${transcript}`,
                maxOutputTokens: 1500
            }) as string;
        } catch (err) {
            console.error("GEMINI_API_ERROR", err);
            return NextResponse.json({ error: "AI evaluation failed" }, { status: 502 });
        }

        // 4. Parse and validate AI response
        let evaluationResult;
        try {
            evaluationResult = EvaluationResultSchema.parse(JSON.parse(aiResponseRaw));
        } catch (err) {
            console.error("AI_PARSE_ERROR", aiResponseRaw, err);
            return NextResponse.json({ error: "Failed to parse AI evaluation" }, { status: 502 });
        }

        // 5. Update database
        await prisma.debate.update({
            where: { id: debate.id },
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
            return NextResponse.json({ error: "Invalid request body", details:"" }, { status: 400 });
        }
        console.error("DEBATE_EVALUATION_ROUTE_ERROR", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
