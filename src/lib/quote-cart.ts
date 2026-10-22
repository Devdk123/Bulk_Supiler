export type QuoteCartLine = {
  product_id: string;
  variant_id: string;
  quantity: string;
};

const MAX_LINES = 30;

export function parseQuoteCart(raw: string | null): QuoteCartLine[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const lines = new Map<string, QuoteCartLine>();
    for (const entry of value) {
      if (!entry || typeof entry !== "object") continue;
      const line = entry as Record<string, unknown>;
      if (typeof line.product_id !== "string" || !/^[\w-]{1,80}$/.test(line.product_id)) continue;
      const variantId = typeof line.variant_id === "string" && /^[\w-]{0,80}$/.test(line.variant_id)
        ? line.variant_id
        : "";
      const quantity = typeof line.quantity === "string" || typeof line.quantity === "number"
        ? String(line.quantity)
        : "1";
      if (!/^(?:\d{1,7})(?:\.\d{1,3})?$/.test(quantity) || Number(quantity) <= 0) continue;
      if (!lines.has(line.product_id)) {
        lines.set(line.product_id, { product_id: line.product_id, variant_id: variantId, quantity });
      }
      if (lines.size >= MAX_LINES) break;
    }
    return [...lines.values()];
  } catch {
    return [];
  }
}

export function addQuoteCartLine(lines: QuoteCartLine[], item: QuoteCartLine): QuoteCartLine[] {
  const current = lines.find((line) => line.product_id === item.product_id);
  if (current) {
    const sum = Number(current.quantity) + Number(item.quantity);
    return lines.map((line) => line.product_id === item.product_id
      ? { ...line, variant_id: item.variant_id || line.variant_id, quantity: String(Math.min(sum, 9_999_999)) }
      : line);
  }
  if (lines.length >= MAX_LINES) return lines;
  return [...lines, item];
}
