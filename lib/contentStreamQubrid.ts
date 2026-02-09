type QubridArgs = {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
};

export async function getQubridResponse({
  systemPrompt,
  userMessage,
  maxTokens = 500,
}: QubridArgs): Promise<string> {
  const res = await fetch(
    "https://platform.qubrid.com/api/v1/qubridai/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.QUBRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        stream: false,
        temperature: 0.4,
        top_p: 0.9,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Qubrid API error: ${res.status}`);
  }

  const result = await res.json();
  return result?.choices?.[0]?.message?.content || "";
}

