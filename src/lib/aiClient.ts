import type { AiProvider } from "@/lib/aiSettings";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface SendChatParams {
  provider: AiProvider;
  apiKey: string;
  customEndpoint?: string;
  maxTokens: number;
  messages: ChatMessage[];
}

const SYSTEM_PROMPT =
  "You are a concise, friendly assistant embedded in Relay, an offline Morse code learning app. " +
  "Answer questions about Morse code, timing, WPM, the Koch method, and how to use this app. " +
  "Keep answers short and practical.";

function endpointFor(provider: AiProvider, customEndpoint?: string): string {
  switch (provider) {
    case "openai":
      return "https://api.openai.com/v1/chat/completions";
    case "anthropic":
      return "https://api.anthropic.com/v1/messages";
    case "custom": {
      if (!customEndpoint || !customEndpoint.startsWith("https://")) {
        throw new Error("Custom endpoint must be a valid https:// URL.");
      }
      return customEndpoint;
    }
  }
}

/**
 * Sends one request to one provider and returns one reply. It doesn't
 * retry, stream, or make follow-up calls, so every request traces back
 * to a single Send click. Rate limits and token caps live in
 * aiRateLimiter.ts and aiSettings.ts; callers check those first.
 */
export async function sendChatMessage({
  provider,
  apiKey,
  customEndpoint,
  maxTokens,
  messages,
}: SendChatParams): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error("No API key configured.");
  }

  const url = endpointFor(provider, customEndpoint);

  if (provider === "anthropic") {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        system: SYSTEM_PROMPT,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Provider returned ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    const block = data?.content?.find((c: { type: string }) => c.type === "text");
    return block?.text ?? "";
  }

  // OpenAI and OpenAI-compatible "custom" endpoints share a request shape.
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: maxTokens,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Provider returned ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}
