import { murfTextToSpeech } from "./murf";
import { inworldTextToSpeech } from "./inworld";
import { sarvamTextToSpeech } from "./sarvam";

export type TTSProvider = "MURF" | "INWORLD" | "SARVAM";

export async function generateSpeech(
  provider: TTSProvider,
  text: string
): Promise<Uint8Array> {
  switch (provider) {
    case "MURF": {
        return await murfTextToSpeech(text);
        // const buffer = await murfTextToSpeech(text); // Buffer
        // return new Uint8Array(buffer); 
    }

    case "INWORLD": {
        //const { audioBuffer } = await inworldTextToSpeech(text);
        //return audioBuffer;
        const { audioBuffer } = await inworldTextToSpeech(text); // Buffer
        return new Uint8Array(audioBuffer); 
    }

    case "SARVAM": {
        return await sarvamTextToSpeech(text)
    }

    default:
       throw new Error("Unsupported TTS provider");
  }
}
