import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assistantLanguages } from "@/lib/assistant-languages";

type RateWindow = {
  count: number;
  resetsAt: number;
};

const rateWindows = new Map<string, RateWindow>();
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 20;

function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean).at(-1)
    || request.headers.get("x-real-ip")
    || "unknown";
}

function allowRequest(request: Request, now: number) {
  if (rateWindows.size > 2000) {
    for (const [key, value] of rateWindows) {
      if (value.resetsAt <= now) rateWindows.delete(key);
    }
  }

  const key = clientAddress(request);
  const current = rateWindows.get(key);
  const window = !current || current.resetsAt <= now
    ? { count: 0, resetsAt: now + RATE_WINDOW_MS }
    : current;

  if (window.count >= MAX_REQUESTS) return false;
  window.count += 1;
  rateWindows.set(key, window);
  return true;
}

const requestSchema = z.object({
  language: z.string().refine((value) => assistantLanguages.some(({ code }) => code === value)),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1200)
      })
    )
    .min(1)
    .max(12)
    .refine((messages) => messages.at(-1)?.role === "user")
});

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The AI assistant is not configured yet. Please contact our team for help." },
      { status: 503 }
    );
  }

  if (Number(request.headers.get("content-length") || 0) > 100_000) {
    return NextResponse.json({ error: "Assistant message is too large." }, { status: 413 });
  }

  if (!allowRequest(request, Date.now())) {
    return NextResponse.json(
      { error: "Too many assistant messages from this connection. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please send a valid assistant message." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Choose a language and send a message of up to 1,200 characters." },
      { status: 400 }
    );
  }

  const language = assistantLanguages.find(({ code }) => code === parsed.data.language);
  if (!language) {
    return NextResponse.json({ error: "Please choose a supported language." }, { status: 400 });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      max_completion_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are the multilingual wholesale shopping assistant for The Bulk Supplier, an Indian B2B supplier of spices, edible oils, incense, dhoop, matchsticks, pooja items, and daily FMCG goods. Reply in ${language.label} (${language.nativeName}), using clear, natural language suitable for Indian retailers and distributors. Be warm, concise, and helpful. Explain how to request a bulk quotation at /order and how to contact the team at /contact. Do not invent product availability, prices, delivery promises, discounts, or business contact details; product data is not connected to you. If asked for live stock or pricing, say the team can confirm it in a quotation.`
        },
        ...parsed.data.messages
      ]
    });

    const reply = completion.choices[0]?.message.content?.trim();
    if (!reply) {
      console.error("Wholesale assistant returned an empty response.");
      return NextResponse.json({ error: "The assistant could not reply just now. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Wholesale assistant request failed:", error);
    return NextResponse.json({ error: "The assistant is temporarily unavailable. Please try again shortly." }, { status: 502 });
  }
}
