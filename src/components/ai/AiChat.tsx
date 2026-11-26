"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SendOutlined } from "@ant-design/icons";
import { Button } from "@/components/ui/Button";
import { api, useApiErrorText } from "@/lib/client/api";

type Message = { id: number; from: "user" | "assistant" | "error"; text: string };

const SUGGESTIONS = ["tasks", "late", "docs", "help"] as const;
const MAX_LENGTH = 500;

/**
 * Chat oynasi. Suhbat brauzer xotirasida (sahifa yangilansa tozalanadi). Yangi xabarlar
 * `role="log"` hududida o'qib beriladi; yuborish paytida tugma band bo'ladi.
 */
export function AiChat() {
  const t = useTranslations("ai");
  const locale = useLocale();
  const apiError = useApiErrorText();
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: 0, from: "assistant", text: t("welcome") },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const seq = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages, busy]);

  const push = (from: Message["from"], text: string) =>
    setMessages((current) => [...current, { id: seq.current++, from, text }]);

  const send = async (raw: string) => {
    const message = raw.trim();
    if (!message || busy) return;
    push("user", message);
    setDraft("");
    setBusy(true);
    try {
      const data = await api<{ reply: string }>("/api/ai/chat", {
        method: "POST",
        body: { message, locale },
      });
      push("assistant", data.reply);
    } catch (error) {
      push("error", apiError(error));
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const label = (from: Message["from"]) => (from === "user" ? t("you") : t("assistant"));

  return (
    <div className="border-border bg-surface flex min-h-0 flex-col rounded-xl border">
      <div
        role="log"
        aria-label={t("log")}
        aria-live="polite"
        tabIndex={0}
        className="focus-visible:outline-accent flex max-h-[55vh] min-h-64 flex-col gap-3 overflow-y-auto p-4 focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex max-w-[85%] flex-col gap-1 ${m.from === "user" ? "items-end self-end" : "items-start self-start"}`}
          >
            <span className="text-muted text-xs font-medium">
              {m.from === "error" ? t("assistant") : label(m.from)}
            </span>
            <p
              className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.from === "user"
                  ? "bg-accent text-white"
                  : m.from === "error"
                    ? "text-danger border border-current"
                    : "bg-surface-2 text-text"
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}
        {busy ? (
          <p role="status" className="text-muted self-start text-xs">
            {t("thinking")}
          </p>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="border-border flex flex-col gap-3 border-t p-4">
        <div
          role="group"
          aria-label={t("suggestionsLabel")}
          className="flex flex-wrap gap-2"
        >
          {SUGGESTIONS.map((key) => (
            <button
              key={key}
              type="button"
              disabled={busy}
              onClick={() => send(t(`suggestionTexts.${key}`))}
              className="border-border hover:bg-surface-2 focus-visible:outline-accent min-h-11 rounded-full border px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
            >
              {t(`suggestions.${key}`)}
            </button>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="ai-input" className="text-sm font-medium">
              {t("inputLabel")}
            </label>
            <textarea
              id="ai-input"
              ref={inputRef}
              rows={2}
              maxLength={MAX_LENGTH}
              value={draft}
              placeholder={t("placeholder")}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send(draft);
                }
              }}
              className="border-border bg-surface text-text placeholder:text-muted focus-visible:outline-accent min-h-12 w-full resize-none rounded-lg border px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-1"
            />
          </div>
          <Button
            type="submit"
            loading={busy}
            disabled={!draft.trim()}
            className="sm:mb-0"
          >
            <SendOutlined aria-hidden="true" />
            {t("send")}
          </Button>
        </form>
      </div>
    </div>
  );
}
