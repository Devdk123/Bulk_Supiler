"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import en from "@/locales/en/common";
import hi from "@/locales/hi/common";

export type Language = "en" | "hi";
type TranslationTree<T> = T extends string ? string : { [K in keyof T]: TranslationTree<T[K]> };
type EnglishTree = TranslationTree<typeof en>;
type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (path: string) => string;
};

const resources: Record<Language, EnglishTree> = { en, hi };
const LanguageContext = createContext<LanguageContextValue | null>(null);
const LANGUAGE_KEY = "gayatristore-language";
const languageListeners = new Set<() => void>();

function subscribeLanguage(listener: () => void) {
  languageListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    languageListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getLanguageSnapshot(): Language {
  return window.localStorage.getItem(LANGUAGE_KEY) === "hi" ? "hi" : "en";
}

function getServerLanguageSnapshot(): Language {
  return "en";
}

function readPath(resource: EnglishTree, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, resource);
  return typeof value === "string" ? value : undefined;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribeLanguage, getLanguageSnapshot, getServerLanguageSnapshot);

  useEffect(() => {
    document.documentElement.lang = language === "hi" ? "hi" : "en";
    document.documentElement.dataset.language = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    window.localStorage.setItem(LANGUAGE_KEY, next);
    languageListeners.forEach((listener) => listener());
  }, []);
  const t = useCallback((path: string) => readPath(resources[language], path) || readPath(resources.en, path) || path, [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
