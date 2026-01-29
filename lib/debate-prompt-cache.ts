import { LRUCache } from "lru-cache";

const promptCache = new LRUCache<string, string>({
  max: 500,
  ttl: 1000 * 60 * 60, // 1 hour
});

export function getCachedPrompt(key: string, builder: () => string) {
  const cached = promptCache.get(key);
  if (cached) return cached;

  const prompt = builder();
  promptCache.set(key, prompt);
  return prompt;
}
