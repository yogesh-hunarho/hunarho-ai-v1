export async function inworldTextToSpeech(text: string) {
  const res = await fetch("https://api.inworld.ai/tts/v1/voice", {
    method: "POST",
    headers: {
      Authorization: `Basic ${process.env.INWORLD_BASIC}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voiceId: "Manoj",
      modelId: "inworld-tts-1.5-max",
      temperature: 1.1,
      timestampType: "WORD",
      audio_config: {
        "audio_encoding": "MP3",
        "speaking_rate": 1
    },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Inworld TTS failed: ${err}`);
  }

  const data = await res.json();

  const audioBuffer = Buffer.from(data.audioContent, "base64");

  return {
    audioBuffer,
    timestamps: data.timestampInfo,
    usage: data.usage,
  };
}
