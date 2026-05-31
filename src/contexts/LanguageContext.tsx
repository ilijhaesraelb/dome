import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Locale, LOCALE_LABELS } from "@/i18n/pathwayTranslations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  localeLabel: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "dome-locale";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored && stored in LOCALE_LABELS) ? stored as Locale : "en";
  });

  const setLocale = (l: Locale) => {
    if (l === locale) return;
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch (e) {
      console.error("Failed to persist locale", e);
    }
    setLocaleState(l);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, localeLabel: LOCALE_LABELS[locale] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
