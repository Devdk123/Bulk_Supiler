"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addQuoteCartLine, parseQuoteCart, type QuoteCartLine } from "@/lib/quote-cart";

const STORAGE_KEY = "gayatristore-quote-cart-v1";

type QuoteCartContextValue = {
  items: QuoteCartLine[];
  hydrated: boolean;
  addItem: (item: QuoteCartLine) => void;
  replaceItems: (items: QuoteCartLine[]) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const QuoteCartContext = createContext<QuoteCartContextValue | null>(null);

export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QuoteCartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restore = () => {
      let saved: QuoteCartLine[] = [];
      try {
        saved = parseQuoteCart(window.localStorage.getItem(STORAGE_KEY));
      } catch {
        // Private browsing modes can deny storage; the enquiry flow still works
        // for the current page session in that case.
      }
      // Restore only product identifiers, variants and quantities. Prices and
      // availability always come from the server when an enquiry is submitted.
      setItems(saved);
      setHydrated(true);
    };
    restore();
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setItems(parseQuoteCart(event.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // A full or unavailable local store must not block quote submission.
    }
  }, [hydrated, items]);

  const addItem = useCallback((item: QuoteCartLine) => {
    setItems((current) => addQuoteCartLine(current, item));
  }, []);
  const replaceItems = useCallback((nextItems: QuoteCartLine[]) => setItems(parseQuoteCart(JSON.stringify(nextItems))), []);
  const removeItem = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.product_id !== productId));
  }, []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({ items, hydrated, addItem, replaceItems, removeItem, clear }), [items, hydrated, addItem, replaceItems, removeItem, clear]);
  return <QuoteCartContext.Provider value={value}>{children}</QuoteCartContext.Provider>;
}

export function useQuoteCart() {
  const context = useContext(QuoteCartContext);
  if (!context) throw new Error("useQuoteCart must be used within a QuoteCartProvider");
  return context;
}
