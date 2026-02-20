import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDebateSystemPrompt } from "@/prompt/get-debate-prompt";
import { getCachedPrompt } from "@/lib/debate-prompt-cache";
import { textToSpeech } from "@/lib/elevenlabs";
import { inworldTextToSpeech } from "@/lib/inworld";
import { generateSpeech } from "@/lib/tts";

const RequestBodySchema = z.object({
  userMessage: z.string(),
  debateId: z.string(),
  topic:z.string(),
  level:z.string(),
  argueType:z.string(),
  provider: z.enum(["INWORLD" , "MURF", "SARVAM"])
});

export async function POST(req: NextRequest) {
  const body = RequestBodySchema.parse(await req.json());

  const systemPrompt = getCachedPrompt(
    `debate:${body.topic}:${body.level}:${body.argueType}`,
    () =>
      getDebateSystemPrompt({
        topic: body.topic,
        level: body.level,
        argueType: body.argueType === "against" ? "argue against" : "support",
      })
  );

  try {
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

    let aiResponse = result.content;

    try {
      const parsedContent = JSON.parse(result.content);
      aiResponse = parsedContent.text;
    } catch{
      aiResponse = result.content;
    }

    // const aiResponse =`India's import diversification is crucial, relying heavily on the US may lead to economic vulnerability, why prioritize US imports over exploring alternative oil sources like Russia that offer more favorable trade terms?`

    // const { audioBuffer } = await inworldTextToSpeech(aiResponse);

    const audioBuffer = await generateSpeech(body.provider,aiResponse);
    const audioUint8 = new Uint8Array(audioBuffer);

    // 3️⃣ Send audio directly
    return new NextResponse(audioUint8, {
      headers: {
        "Content-Type": body.provider === "SARVAM" ? "audio/wav" : "audio/mpeg",
        // "Content-Length": audioBuffer.length.toString(),
        "Content-Length": audioUint8.byteLength.toString(),
        "X-TTS-Provider": body.provider,
      },
    });
  } catch (err) {
    console.error("DEBATE_VOICE_ERROR", err);
    return NextResponse.json(
      { error: "Failed to generate debate voice" },
      { status: 500 }
    );
  }
}
