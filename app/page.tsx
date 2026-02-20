"use client"


import { useRef, useState } from "react";


type Level = "easy" | "medium" | "hard";
type ArgueType = "support" | "against";

export default function Home() {

  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<Level>("easy");
  const [argueType, setArgueType] = useState<ArgueType>("support");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider,setProvider] =useState("MURF")

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSend = async () => {
    setError(null);
    setResponseTime(null);

    if (!topic || !message) {
      setError("Topic and message are required");
      return;
    }

    try {
      setLoading(true);

      const startTime = performance.now(); // ⏱ start timer

      const res = await fetch("/api/debate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debateId: crypto.randomUUID(),
          topic,
          level,
          argueType,
          provider,
          userMessage: message,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch debate voice");
      }

      const audioBlob = await res.blob();

      const endTime = performance.now(); // ⏱ end timer
      setResponseTime(endTime - startTime);

      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-black font-sans">
      <div className="max-w-xl mx-auto p-6 space-y-4 border rounded-lg">
        <h2 className="text-xl font-semibold">AI Debate Voice</h2>

        <input
          className="w-full border p-2 rounded placeholder:text-gray-500"
          placeholder="Debate Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <select
          className="w-full border p-2 rounded"
          value={level}
          onChange={(e) => setLevel(e.target.value as Level)}
        >
          <option value="easy" className="text-black">Easy</option>
          <option value="medium" className="text-black">Medium</option>
          <option value="hard" className="text-black">Hard</option>
        </select>

        <select
          className="w-full border p-2 rounded text-white"
          value={argueType}
          onChange={(e) => setArgueType(e.target.value as ArgueType)}
        >
          <option value="support" className="text-black">Support</option>
          <option value="against" className="text-black">Against</option>
        </select>

        <textarea
          className="w-full border p-2 rounded"
          rows={4}
          placeholder="Write your debate message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as "MURF" | "INWORLD")}
          className="border p-2 rounded w-full"
        >
          <option value="MURF" className="text-black">Murf</option>
          <option value="INWORLD" className="text-black">Inworld</option>
          <option value="SARVAM" className="text-black">Sarvam</option>
        </select>

        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? "Generating voice..." : "Send"}
        </button>

        {responseTime !== null && (
          <p className="text-sm text-green-600">
            ⏱ Response Time: {responseTime.toFixed(0)} ms (
            {(responseTime / 1000).toFixed(2)}s)
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <audio ref={audioRef} controls className="w-full mt-2" />
      </div>
    </div>
  );
}
