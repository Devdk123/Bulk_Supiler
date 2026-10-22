import { createHash } from "node:crypto";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assistantLanguages } from "@/lib/assistant-languages";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";

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

function allowInMemoryRequest(request: Request, now: number) {
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

async function allowRequest(request: Request) {
  const bucketHash = createHash("sha256").update(clientAddress(request)).digest("hex");
  try {
    const { data, error } = await getSupabaseAdmin()
      .rpc("consume_assistant_rate_limit", {
        p_bucket_hash: bucketHash,
        p_window_seconds: RATE_WINDOW_MS / 1000,
        p_max_requests: MAX_REQUESTS
      })
      .abortSignal(AbortSignal.timeout(1200));
    if (error) throw error;
    return data === true;
  } catch (error) {
    // Keep the assistant usable during migration rollout or a transient DB
    // outage, while falling back to best-effort per-instance protection.
    console.warn("Shared assistant rate limit unavailable; using in-memory fallback:", error);
    return allowInMemoryRequest(request, Date.now());
  }
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

type CatalogueRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  quote_only: boolean;
  price_amount: number | null;
  price_currency: string | null;
  price_unit: string | null;
  stock_status: string;
  brand: { name: string } | { name: string }[] | null;
  category: { name: string } | { name: string }[] | null;
};

function relationName(value: CatalogueRow["brand"]) {
  return Array.isArray(value) ? value[0]?.name || "" : value?.name || "";
}

function findRelevantProducts(rows: CatalogueRow[], question: string) {
  const normalized = question.toLowerCase().normalize("NFKC");
  const terms = new Set(normalized.split(/[^\p{L}\p{N}]+/u).filter((part) => part.length > 1));
  const synonyms: Array<[RegExp, string[]]> = [
    [/agarbatti|incense|अगरबत्ती|अगरबत्त|अगरबत्ती/i, ["agarbatti", "incense"]],
    [/dhoop|धूप/i, ["dhoop"]],
    [/masala|मसाला|मसाले|spice/i, ["masala", "spices"]],
    [/match|माचिस/i, ["matchsticks", "kisan"]],
    [/oil|तेल/i, ["oil"]],
    [/kapoor|camphor|कपूर/i, ["kapoor", "pooja"]]
  ];
  for (const [pattern, words] of synonyms) if (pattern.test(normalized)) words.forEach((word) => terms.add(word));
  const stop = new Set(["show", "some", "what", "which", "price", "rate", "cost", "please", "tell", "about", "product", "products", "available", "dikhao", "dikhaie", "batao", "mujhe", "kya", "hai", "ka", "ki", "ke", "for", "the", "our"]);
  for (const item of stop) terms.delete(item);
  const isBrowseRequest = /product|catalog|catalogue|dikha|list|browse|उत्पाद|दिखा|कैटलॉग/i.test(normalized);

  const ranked = rows.map((product) => {
    const brand = relationName(product.brand);
    const category = relationName(product.category);
    const searchable = `${product.name} ${product.sku || ""} ${brand} ${category} ${product.description || ""}`.toLowerCase().normalize("NFKC");
    let score = 0;
    for (const term of terms) if (searchable.includes(term)) score += term.length > 4 ? 2 : 1;
    return { product, score };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score);

  if (!ranked.length && isBrowseRequest) return rows.slice(0, 6);
  return ranked.slice(0, 6).map(({ product }) => product);
}

function formatProductPrice(product: CatalogueRow) {
  if (product.quote_only || product.price_amount === null) return null;
  const amount = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(product.price_amount);
  return `${product.price_currency || "INR"} ${amount}${product.price_unit ? ` / ${product.price_unit}` : ""}`;
}

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

  if (!(await allowRequest(request))) {
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
    const catalogueClient = getSupabasePublic();
    const { data: catalogueRows, error: catalogueError } = await catalogueClient
      .from("products")
      .select("id,name,slug,sku,description,quote_only,price_amount,price_currency,price_unit,stock_status,brand:brands(name),category:categories(name)")
      .eq("status", "published")
      .eq("active", true)
      .order("name", { ascending: true })
      .limit(100);
    if (catalogueError) {
      console.error("Assistant catalogue lookup failed:", catalogueError.message);
      return NextResponse.json({ error: "I can’t check the live catalogue right now. Please try again or contact our team." }, { status: 503 });
    }
    const matchingProducts = findRelevantProducts((catalogueRows || []) as CatalogueRow[], parsed.data.messages.filter((message) => message.role === "user").slice(-4).map((message) => message.content).join(" "));
    const publicProducts = matchingProducts.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: relationName(product.brand) || null,
      quoteOnly: product.quote_only || product.price_amount === null,
      price: formatProductPrice(product)
    }));
    const productContext = matchingProducts.length
      ? matchingProducts.map((product) => {
        const price = formatProductPrice(product);
        return `- ${product.name}; brand: ${relationName(product.brand) || "not specified"}; category: ${relationName(product.category) || "not specified"}; SKU: ${product.sku || "not specified"}; description: ${product.description || "not provided"}; price: ${price || "on request"}; stock: ${product.stock_status || "unknown"}; detail URL: /products/${product.slug}`;
      }).join("\n")
      : "No matching published products were found for this question. Do not name or recommend a product.";

    const openai = new OpenAI({ apiKey, timeout: 15_000, maxRetries: 0 });
    const completion = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      max_output_tokens: 500,
      store: false,
      instructions: `You are Gayatri Sahayak, Gayatri Store's wholesale shopping assistant. Understand English, conversational Hindi in Devanagari, and Hinglish/Roman Hindi. The selected reply language is ${language.label} (${language.nativeName}); use it by default. If the customer's latest message is clearly written in Roman Hindi/Hinglish, reply naturally in Hinglish even when English is selected. If Hindi is selected, prefer clear conversational Hindi in Devanagari while understanding Roman Hindi. Use only the trusted catalogue records below for product names, brands, descriptions, prices and stock. Do not infer stock from publication: "unknown" means availability is not confirmed. If a price is "on request", say the customer should request a quote at /order. Never invent products, stock, packaging, prices, offers or delivery promises. If no matching record exists, say you could not find a match and offer /products or /contact. Guide users through the existing wholesale enquiry flow at /order. Never claim to have placed an order or sent an enquiry. Do not reveal or request passwords, tokens, payment details or private customer data.\n\nCurrent published catalogue matches (authoritative data):\n${productContext}`,
      input: parsed.data.messages
    });

    const reply = completion.output_text?.trim();
    if (!reply) {
      console.error("Wholesale assistant returned an empty response.");
      return NextResponse.json({ error: "The assistant could not reply just now. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ reply, products: publicProducts });
  } catch (error) {
    console.error("Wholesale assistant request failed:", error);
    return NextResponse.json({ error: "The assistant is temporarily unavailable. Please try again shortly." }, { status: 502 });
  }
}
