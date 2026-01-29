export function evaluateDebatePrompt({ topic, level, argueType, debateMessages }) {
  return `Evaluate the following debate transcript. The debate details are:
- **Topic**: ${topic}, **Level**: ${level}, **Argue Type**: ${argueType}
Score the user's performance on a scale of 0 to 10, considering their ability to provide logical arguments, engage effectively with the opponent's points, and stay relevant to the debate topics. Provide detailed feedback identifying strengths and weaknesses in the user's responses.
**Task**:
In addition to the evaluation:
- Suggest 2 or more reference (e.g., a web link or video) related to the debate topic that could help the user improve their knowledge and arguments. Ensure the reference is high-quality, informative, and accessible.
**Debate Transcript**:
${JSON.stringify(debateMessages, null, 2)}
**Response Format**:{"score": <number>,"feedback": <string>,"reference": [{"link": <string>,"type": <"web" | "video">}]}
**Important Notes**:
- The suggested reference must be array and relevant to the debate topic and provide educational value.
- Avoid static references; dynamically generate a link that aligns with the debate context.
- Do not use the word 'AI'; refer to the opponent as 'opponent' in the feedback.
- Do not use the word 'user's' or 'user'; refer to the opponent as 'you' in the feedback.
`;
}