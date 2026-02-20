import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"

export const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY!,
});

export async function textToSpeech(text: string) {
  const audio = await elevenlabs.textToSpeech.convert(
    process.env.ELEVENLABS_VOICE_ID!,
    {
      modelId: "eleven_multilingual_v2",
      text,
      outputFormat: 'mp3_44100_128',
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
      },
    }
  );

  // Convert ReadableStream → Buffer
  const chunks: Uint8Array[] = [];
  const reader = audio.getReader();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}
