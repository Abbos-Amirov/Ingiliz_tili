"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useT, useLocale } from "@/hooks/useT";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

export interface SentenceChatContext {
  korean: string;
  englishWords: string[];
  formula: string;
}

export function AiChatWidget({ context }: { context: SentenceChatContext }) {
  const t = useT("chat");
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    const history = messages.filter((m) => !m.isError).map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);
    try {
      const res = await apiFetch<{ reply: string }>("/chat/sentence", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          korean: context.korean,
          englishWords: context.englishWords,
          formula: context.formula,
          locale,
          history,
        }),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch {
      // Always show a friendly, localized message here — never surface raw
      // backend/provider error text in a learner-facing chat bubble.
      setMessages((prev) => [...prev, { role: "assistant", content: t.error, isError: true }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-50 bottom-24 right-4 left-4 sm:left-auto sm:right-6 sm:w-[380px] h-[min(560px,70vh)] flex flex-col rounded-3xl overflow-hidden border border-border bg-surface shadow-2xl shadow-primary/20"
          >
            <div className="gradient-primary px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <p className="text-white font-bold text-base leading-tight">{t.title}</p>
                <p className="text-white/75 text-xs mt-0.5">{t.subtitle}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={t.close}
                className="h-8 w-8 rounded-full flex items-center justify-center text-white/90 hover:bg-white/15 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-surface-muted/40">
              <ChatBubble role="assistant" content={t.greeting} />
              {messages.map((m, i) => (
                <ChatBubble key={i} role={m.role} content={m.content} isError={m.isError} />
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-foreground/40 pl-1">
                  <span className="flex gap-1">
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-foreground/30"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    />
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-foreground/30"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-foreground/30"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    />
                  </span>
                  {t.thinking}
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-border bg-surface flex items-center gap-2 shrink-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.placeholder}
                disabled={sending}
                className="flex-1 rounded-full border border-border bg-surface-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label={t.send}
                className="h-10 w-10 shrink-0 rounded-full gradient-primary text-white flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none hover:brightness-105 transition"
              >
                <SendIcon />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={t.openLabel}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed z-50 bottom-6 right-4 sm:right-6 h-14 w-14 rounded-full gradient-primary text-white flex items-center justify-center shadow-lg shadow-primary/40"
      >
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-full bg-primary"
            animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <span className="relative text-2xl leading-none">{open ? "×" : "✨"}</span>
      </motion.button>
    </>
  );
}

function ChatBubble({ role, content, isError }: { role: "user" | "assistant"; content: string; isError?: boolean }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "gradient-primary text-white rounded-br-md"
            : isError
              ? "bg-danger-soft text-danger rounded-bl-md"
              : "bg-surface border border-border text-foreground rounded-bl-md"
        }`}
      >
        {stripMarkdown(content)}
      </div>
    </div>
  );
}

/** Belt-and-suspenders: the AI is prompted to avoid markdown, but strip common
 * bold/italic markers client-side too in case it slips one in anyway. */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?!\w)/g, "$1");
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12L20 4L14 20L11 13L4 12Z" fill="currentColor" />
    </svg>
  );
}
