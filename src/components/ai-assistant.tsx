"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Languages, LoaderCircle, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { assistantLanguages, type AssistantLanguage } from "@/lib/assistant-languages";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<AssistantLanguage>("en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endOfMessages = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, sending, open]);

  function handleLanguageChange(value: string) {
    const nextLanguage = assistantLanguages.find((item) => item.code === value);
    if (!nextLanguage) return;
    setLanguage(nextLanguage.code);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setSending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, messages: nextMessages.slice(-12) })
      });
      const result: { reply?: string; error?: string } = await response.json();
      if (!response.ok || !result.reply) {
        throw new Error(result.error || "The assistant is temporarily unavailable. Please try again.");
      }
      setMessages([...nextMessages, { role: "assistant", content: result.reply }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The assistant is temporarily unavailable. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-16 right-4 z-40 sm:bottom-6 sm:right-24 sm:z-50">
      {open ? (
        <section
          aria-label="Multilingual wholesale assistant"
          className="absolute bottom-16 right-0 flex max-h-[min(70vh,600px)] w-[calc(100vw-2.5rem)] max-w-[390px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center justify-between gap-3 bg-primary px-4 py-4 text-primary-foreground">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                <Bot className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">Gayatri Store Assistant</h2>
                <p className="text-xs text-primary-foreground/75">Here to help with bulk orders</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <label className="flex items-center gap-2 border-b border-border bg-background px-4 py-3 text-xs font-semibold text-muted-foreground">
            <Languages className="h-4 w-4 text-fresh" />
            <span>Reply language</span>
            <select
              value={language}
              onChange={(event) => handleLanguageChange(event.target.value)}
              className="ml-auto max-w-[175px] rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring"
              aria-label="Assistant reply language"
            >
              {assistantLanguages.map((item) => (
                <option key={item.code} value={item.code}>{item.nativeName}</option>
              ))}
            </select>
          </label>

          <div className="flex min-h-52 flex-1 flex-col gap-3 overflow-y-auto bg-background px-4 py-4">
            {messages.length === 0 ? (
              <div className="my-auto rounded-2xl border border-fresh/15 bg-fresh/5 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fresh/10 text-fresh">
                  <Sparkles className="h-4 w-4" />
                </span>
                <p className="mt-3 text-sm font-bold text-foreground">Namaste! How can we help?</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Ask about bulk ordering, product categories, or how to request a quote. Replies are available in 22 Indian languages.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <p
                  key={`${index}-${message.role}`}
                  className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "ml-auto rounded-br-md bg-primary text-primary-foreground"
                      : "mr-auto rounded-bl-md border border-border bg-card text-foreground"
                  }`}
                >
                  {message.content}
                </p>
              ))
            )}
            {sending ? (
              <p className="mr-auto inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Preparing a reply…
              </p>
            ) : null}
            <div ref={endOfMessages} />
          </div>

          {error ? (
            <p role="alert" className="border-t border-vermilion/20 bg-vermilion/5 px-4 py-2.5 text-xs leading-relaxed text-vermilion">
              {error}
            </p>
          ) : null}

          <p className="px-4 pt-2 text-[10px] leading-relaxed text-muted-foreground">
            AI-generated guidance only. Please don&apos;t share sensitive information.
          </p>
          <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-border bg-card p-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={1200}
              rows={1}
              placeholder="Type your message…"
              aria-label="Message the wholesale assistant"
              className="max-h-28 min-h-11 flex-1 resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-fresh focus:ring-1 focus:ring-fresh"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-fresh disabled:cursor-not-allowed disabled:opacity-45"
            >
              {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close wholesale assistant" : "Open multilingual wholesale assistant"}
        aria-expanded={open}
        className="group flex h-14 items-center gap-2.5 rounded-full bg-primary px-4 text-primary-foreground shadow-xl ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-1 hover:bg-fresh hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="pr-1 text-sm font-bold">Ask AI</span>
      </button>
    </div>
  );
}
