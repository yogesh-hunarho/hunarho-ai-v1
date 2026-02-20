export async function sarvamTextToSpeech(text: string):Promise<Uint8Array>  {
  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": process.env.SARVAM_API_KEY!,
    },
    body: JSON.stringify({
      text,
      target_language_code: "en-IN",
      model: "bulbul:v3",
      speaker: "shubh",
      pace: 1,
      temperature: 0.6,
      output_audio_codec: "wav", // or "mp3"
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sarvam TTS failed: ${err}`);
  }

  const data = await res.json();

  // Sarvam returns array of base64 audio strings
  const base64Audio = data.audios[0];
  
   return Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
}
