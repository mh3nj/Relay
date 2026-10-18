import { useCallback, useEffect, useState } from "react";
import i18n from "@/i18n";
import { getAiSettings } from "@/lib/aiSettings";
import type { AiSettings } from "@/lib/aiSettings";
import { checkRateLimit, consumeRateLimit } from "@/lib/aiRateLimiter";
import type { RateLimitStatus } from "@/lib/aiRateLimiter";
import { sendChatMessage } from "@/lib/aiClient";
import type { ChatMessage } from "@/lib/aiClient";

// Only the most recent exchanges are sent as context on each turn, so a
// long-running conversation can't silently balloon token usage (and
// therefore cost) turn over turn.
const MAX_CONTEXT_MESSAGES = 6;

export function useAiChat() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const s = await getAiSettings();
    setSettings(s);
    setRateLimit(await checkRateLimit(s.dailyMessageLimit));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const configured = Boolean(settings?.enabled && settings.apiKey.trim());

  const send = useCallback(
    async (text: string) => {
      if (!settings || !configured || sending) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      const currentLimit = await checkRateLimit(settings.dailyMessageLimit);
      if (!currentLimit.allowed) {
        setRateLimit(currentLimit);
        return;
      }

      setError(null);
      setSending(true);
      const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
      setMessages(nextMessages);

      // Consume quota right before the real network call, not
      // speculatively, and not retried on failure.
      const afterConsume = await consumeRateLimit(settings.dailyMessageLimit);
      setRateLimit(afterConsume);

      try {
        const context = nextMessages.slice(-MAX_CONTEXT_MESSAGES);
        const reply = await sendChatMessage({
          provider: settings.provider,
          apiKey: settings.apiKey,
          customEndpoint: settings.customEndpoint,
          maxTokens: settings.maxTokens,
          messages: context,
        });
        setMessages((prev) => [...prev, { role: "assistant", content: reply || "…" }]);
      } catch (err) {
        console.error("AI chat request failed", err);
        setError(err instanceof Error ? err.message : i18n.t("common.requestFailed"));
      } finally {
        setSending(false);
      }
    },
    [settings, configured, sending, messages]
  );

  const clear = useCallback(() => setMessages([]), []);

  return { settings, configured, rateLimit, messages, sending, error, send, clear, refresh };
}
