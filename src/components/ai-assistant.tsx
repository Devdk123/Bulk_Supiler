"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, Languages, LoaderCircle, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { assistantLanguages, type AssistantLanguage } from "@/lib/assistant-languages";
import { useLanguage } from "@/context/language-context";

type AssistantProduct = { id: string; name: string; slug: string; brand: string | null; quoteOnly: boolean; price: string | null };
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  products?: AssistantProduct[];
};

export function AiAssistant({ embedded = false, onClose }: { embedded?: boolean; onClose?: () => void }) {
  const { language: appLanguage, t } = useLanguage();
  const [open, setOpen] = useState(embedded);
  const [languageOverride, setLanguageOverride] = useState<AssistantLanguage | null>(null);
  const language: AssistantLanguage = languageOverride ?? (appLanguage === "hi" ? "hi" : "en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [retryMessages, setRetryMessages] = useState<ChatMessage[] | null>(null);
  const endOfMessages = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    endOfMessages.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest" });
  }, [messages, sending, open]);

  function handleLanguageChange(value: string) {
    const nextLanguage = assistantLanguages.find((item) => item.code === value);
    if (!nextLanguage) return;
    setLanguageOverride(nextLanguage.code);
  }

  async function sendMessages(nextMessages: ChatMessage[]) {
    setError("");
    setSending(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, messages: nextMessages.slice(-12) }),
        signal: controller.signal
      });
      const result: { reply?: string; error?: string; products?: AssistantProduct[] } = await response.json();
      if (!response.ok || !result.reply) {
        setRetryMessages(nextMessages);
        const localizedError = language === "hi"
          ? response.status === 503 && /not configured/i.test(result.error || "")
            ? t("assistant.notConfigured")
            : response.status === 429
              ? t("assistant.rateLimited")
              : t("assistant.unavailable")
          : result.error || t("assistant.unavailable");
        throw new Error(localizedError);
      }
      setMessages([...nextMessages, { role: "assistant", content: result.reply, products: result.products }]);
      setRetryMessages(null);
    } catch (requestError) {
      const aborted = requestError instanceof DOMException && requestError.name === "AbortError";
      setRetryMessages(nextMessages);
      setError(aborted
        ? t("assistant.timeout")
        : requestError instanceof Error ? requestError.message : t("assistant.unavailable"));
    } finally {
      window.clearTimeout(timeout);
      setSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setDraft("");
    setRetryMessages(null);
    await sendMessages(nextMessages);
  }

  return (
    <div className={embedded ? "relative" : "fixed bottom-16 right-4 z-40 sm:bottom-6 sm:right-24 sm:z-50"}>
      {open ? (
        <section
          aria-label={t("assistant.name")}
          className="absolute bottom-16 right-0 flex max-h-[min(70dvh,600px)] w-[calc(100vw-2.5rem)] max-w-[390px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center justify-between gap-3 bg-primary px-4 py-4 text-primary-foreground">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                <Bot className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold">{t("assistant.name")}</h2>
                <p className="text-xs text-primary-foreground/75">{t("assistant.subtitle")}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setOpen(false); onClose?.(); }}
              aria-label={t("assistant.close")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <label className="flex items-center gap-2 border-b border-border bg-background px-4 py-3 text-xs font-semibold text-muted-foreground">
            <Languages className="h-4 w-4 text-fresh" />
            <span>{t("assistant.language")}</span>
            <select
              value={language}
              onChange={(event) => handleLanguageChange(event.target.value)}
              className="ml-auto max-w-[175px] rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring"
              aria-label={t("assistant.language")}
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
                <p className="mt-3 text-sm font-bold text-foreground">{t("assistant.greeting")}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t("assistant.suggestions")}
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={`${index}-${message.role}`} className={message.role === "user" ? "ml-auto max-w-[88%]" : "mr-auto max-w-[92%]"}>
                  <p className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${message.role === "user" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border bg-card text-foreground"}`}>
                    {message.content}
                  </p>
                  {message.products?.length ? (
                    <div className="mt-2 grid gap-2">
                      {message.products.map((product) => (
                        <a key={product.id} href={`/products/${encodeURIComponent(product.slug)}`} className="rounded-xl border border-border bg-card p-3 text-xs hover:border-fresh/50">
                          <span className="block font-bold text-primary">{product.name}</span>
                          {product.brand ? <span className="mt-1 block text-muted-foreground">{product.brand}</span> : null}
                          <span className="mt-1 block font-semibold text-fresh">{product.quoteOnly ? t("catalogue.priceOnRequest") : product.price}</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
            {sending ? (
              <p role="status" aria-live="polite" className="mr-auto inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" /> {t("assistant.typing")}
              </p>
            ) : null}
            <div ref={endOfMessages} />
          </div>

          {error ? (
            <div role="alert" className="flex items-center justify-between gap-3 border-t border-vermilion/20 bg-vermilion/5 px-4 py-2.5 text-xs leading-relaxed text-vermilion">
              <span>{error}</span>
              {retryMessages ? <button type="button" disabled={sending} onClick={() => void sendMessages(retryMessages)} className="min-h-9 shrink-0 rounded-lg border border-vermilion/30 px-3 font-bold disabled:opacity-50">{t("assistant.retry")}</button> : null}
            </div>
          ) : null}

          <p className="px-4 pt-2 text-[10px] leading-relaxed text-muted-foreground">
            {t("assistant.disclaimer")}
          </p>
          <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-border bg-card p-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={1200}
              rows={1}
              placeholder={t("assistant.placeholder")}
              aria-label={t("assistant.placeholder")}
              className="max-h-28 min-h-11 flex-1 resize-y rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-fresh focus:ring-1 focus:ring-fresh"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label={t("assistant.send")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-fresh disabled:cursor-not-allowed disabled:opacity-45"
            >
              {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </section>
      ) : null}

      {!embedded ? <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? t("assistant.close") : t("assistant.open")}
        aria-expanded={open}
        className="group flex h-14 items-center gap-2.5 rounded-full bg-primary px-4 text-primary-foreground shadow-xl ring-1 ring-white/15 transition-all duration-300 hover:-translate-y-1 hover:bg-fresh hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="pr-1 text-sm font-bold">{t("assistant.name")}</span>
      </button>
      : null}
    </div>
  );
}
