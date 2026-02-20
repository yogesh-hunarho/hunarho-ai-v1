export async function murfTextToSpeech(text: string): Promise<Uint8Array> {
    const res = await fetch("https://in.api.murf.ai/v1/speech/stream", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": process.env.MURF_API_KEY!,
        },
        body: JSON.stringify({
        text,
        voiceId: "en-IN-eashwar",
        model: "FALCON",
        multiNativeLocale: "en-IN",
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Murf TTS failed: ${err}`);
    }

    // Murf returns audio stream
    const audioBuffer = Buffer.from(await res.arrayBuffer());

    return audioBuffer;
}
