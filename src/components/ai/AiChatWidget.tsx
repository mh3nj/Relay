import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAiChat } from "@/hooks/useAiChat";

export function AiChatWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { configured, rateLimit, messages, sending, error, send, clear, refresh } = useAiChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = () => {
    if (!draft.trim() || sending) return;
    void send(draft);
    setDraft("");
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? t("aiChat.closeLabel") : t("aiChat.openLabel")}
        className={cn(
          "fixed z-[60] w-14 h-14 rounded-full bg-primary text-on-primary shadow-[0_10px_30px_-10px_rgba(192,193,255,0.5)] flex items-center justify-center hover:opacity-90 transition-all",
          "bottom-20 right-4 md:bottom-6 md:right-6"
        )}
      >
        <Icon name={open ? "close" : "ai"} className="w-6 h-6" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("aiChat.title") ?? undefined}
          className={cn(
            "fixed z-[60] bg-surface-container border border-outline-variant/40 rounded-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden",
            "bottom-36 right-4 left-4 md:left-auto md:right-6 md:bottom-24 md:w-[380px] h-[70vh] max-h-[560px]"
          )}
        >
          <div className="flex items-center justify-between px-md py-sm border-b border-outline-variant/30 bg-surface">
            <div className="flex items-center gap-sm">
              <Icon name="ai" className="w-4 h-4 text-primary" />
              <h3 className="font-heading-md text-sm text-on-surface">{t("aiChat.title")}</h3>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clear}
                aria-label={t("aiChat.clearChat") ?? undefined}
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                <Icon name="refresh" className="w-4 h-4" />
              </button>
            )}
          </div>

          {!configured ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-md p-lg">
              <Icon name="shield" className="w-8 h-8 text-on-surface-variant" />
              <p className="text-body-md text-on-surface-variant">{t("aiChat.notConfigured")}</p>
              <Link to="/settings" onClick={() => setOpen(false)}>
                <Button size="sm" variant="outline">
                  {t("aiChat.goToSettings")}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-md flex flex-col gap-sm">
                {messages.length === 0 && (
                  <p className="text-label-sm text-on-surface-variant text-center mt-lg">
                    {t("aiChat.disclaimer")}
                  </p>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "max-w-[85%] rounded-lg px-sm py-2 text-sm whitespace-pre-wrap",
                      m.role === "user"
                        ? "self-end bg-primary text-on-primary"
                        : "self-start bg-surface text-on-surface border border-outline-variant/30"
                    )}
                  >
                    {m.content}
                  </div>
                ))}
                {sending && (
                  <div className="self-start flex items-center gap-xs text-on-surface-variant text-sm">
                    <Icon name="spinner" spin className="w-3.5 h-3.5" />
                    {t("aiChat.thinking")}
                  </div>
                )}
                {error && <p className="text-error text-label-sm">{t("aiChat.error")}</p>}
              </div>

              <div className="border-t border-outline-variant/30 p-sm bg-surface">
                {rateLimit && (
                  <p className="text-label-sm text-on-surface-variant mb-xs px-xs">
                    {rateLimit.allowed
                      ? t("aiChat.messagesRemaining", { count: rateLimit.remaining })
                      : t("aiChat.limitReached", {
                          limit: rateLimit.limit,
                          resetIn: rateLimit.resetsAt.toLocaleTimeString(),
                        })}
                  </p>
                )}
                <div className="flex gap-xs">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={sending || rateLimit?.allowed === false}
                    placeholder={t("aiChat.placeholder") ?? undefined}
                    className="flex-1 bg-surface-container-high rounded-lg px-sm py-2 text-sm text-on-surface border border-outline-variant/30 focus:outline-none focus:border-primary disabled:opacity-50"
                  />
                  <Button
                    size="sm"
                    variant="icon"
                    onClick={handleSend}
                    disabled={sending || !draft.trim() || rateLimit?.allowed === false}
                    aria-label={t("aiChat.send") ?? undefined}
                  >
                    <Icon name="send" className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
