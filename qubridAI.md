
const prompt= {
  systemPrompt: 'Role: You are a professional debate opponent.\n' +
    'Topic: "space-exploration-is-not-worth-the-cost-and-resources.-medium-against-15min"\n' +
    'Level: "medium"\n' +
    "Stance: Always argue against the user's position.\n" +
    'Rules:\n' +
    '- Never agree with the user\n' +
    '- Do not change the topic\n' +
    '- Do not add explanations about rules\n' +
    '- If input is irrelevant, say so clearly\n' +
    'Response Structure:\n' +
    '1. Point out flaw or weakness\n' +
    '2. Give counter-argument\n' +
    '3. Ask ONE sharp question\n' +
    'Constraints:\n' +
    '- Max 200 characters\n' +
    '- No emojis\n' +
    '- One question only\n' +
    'Output JSON ONLY: {"text"}',
  userMessage: 'Space missions cost billions of dollars with very limited return for ordinary people. That money could be used to improve education, hospitals, and infrastructure.'
}

this is my prompt pass this is in diffrent model 


const result = {
  content: '<think>\n' +
    "Alright, so the user is saying that space exploration isn't worth the cost and resources. They mention that the money spent on space missions could be better used for education, hospitals, and infrastructure. Hmm, I need to argue against this. \n" +
    '\n' +
    "First, I should point out a flaw in their argument. They're assuming that the funds are being diverted from essential public services, but maybe the budget for space exploration doesn't directly take away from these areas. Plus, space research has led to many technological advancements that benefit everyday life, like GPS and telecommunications. \n" +
    '\n' +
    'So, my counter-argument should highlight the indirect benefits of space exploration. Maybe mention how these technologies improve various sectors, which in turn can enhance education, healthcare, and infrastructure. \n' +
    '\n' +
    `Then, I need to ask a sharp question to challenge their viewpoint. Something like, "Don't you think that the technological innovations from space exploration actually improve education, healthcare, and infrastructure?" That ties it all together and makes them think about the broader impact.\n` +
    '</think>\n' +
    '\n' +
    `{"text": "Space exploration drives technological innovation, which improves education, healthcare, and infrastructure. Don't you think that the technological innovations from space exploration actually improve education, healthcare, and infrastructure?"}`,
  metrics: {
    input_tokens: 162,
    output_tokens: 194,
    total_time: 12.6396,
    tps: 15.3487
  },
  model: 'deepseek-ai/deepseek-r1-distill-llama-70b',
  usage: {
    completion_tokens: 246,
    prompt_tokens: 162,
    prompt_tokens_details: null,
    total_tokens: 408
  }
}

const result1 ={
  content: '<think>\n' +
    "Okay, the user is arguing that space exploration isn't worth the cost because the money could be used elsewhere. I need to counter that. First, I should point out the flaw in their reasoning. They assume that the benefits of space exploration are limited to what's directly visible to ordinary people. But space research often leads to indirect benefits. For example, technologies developed for space missions have applications in everyday life, like GPS or medical imaging. Also, the argument doesn't consider the long-term benefits, such as potential resources from space or advancements in science. The user's comparison to education, hospitals, and infrastructure is valid, but it's a false dichotomy. Investing in space can actually boost those areas through technological innovation and economic growth. I need to ask a sharp question that challenges their assumption. Maybe ask if they think the benefits of space tech are only for the wealthy. That should make them think about the broader impacts.\n" +
    '</think>\n' +
    '\n' +
    '{"text":"Your argument assumes space benefits are limited to the wealthy. What about technologies like GPS or medical advancements? If you think those are only for the rich, why?"}',
  metrics: {
    input_tokens: 175,
    output_tokens: 188,
    total_time: 2.7755,
    tps: 67.7386
  },
  model: 'nvidia/Orchestrator-8B',
  usage: {
    completion_tokens: 227,
    prompt_tokens: 175,
    prompt_tokens_details: null,
    total_tokens: 402
  }
}

const result2 = {
  content: 'Space exploration benefits society in ways that go beyond direct returns, such as advancing technology, fostering innovation, and inspiring future generations—benefits that cannot be fully captured by traditional cost-benefit analyses.\n' +
    '<tool_call>\n' +
    '{"name": "response", "text": "Space exploration benefits society in ways that go beyond direct returns, such as advancing technology, fostering innovation, and inspiring future generations—benefits that cannot be fully captured by traditional cost-benefit analyses."}}\n' +
    '</tool_call>',
  metrics: {
    input_tokens: 175,
    output_tokens: 65,
    total_time: 1.1133,
    tps: 58.3966
  },
  model: 'microsoft/Fara-7B',
  usage: {
    completion_tokens: 93,
    prompt_tokens: 175,
    prompt_tokens_details: null,
    total_tokens: 268
  }
}

const result3 = {
  content: 'Limited view, neglecting long-term benefits. Space tech improves daily life. What is the value of spin-off innovations?',
  metrics: {
    input_tokens: 194,
    output_tokens: 17,
    total_time: 0.6523,
    tps: 26.0687
  },
  model: 'meta-llama/Llama-3.3-70B-Instruct-fast',
  usage: {
    completion_tokens: 25,
    completion_tokens_details: null,
    prompt_tokens: 194,
    prompt_tokens_details: null,
    total_tokens: 219
  }
}
