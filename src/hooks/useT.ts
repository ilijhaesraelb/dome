import { useLanguage } from "@/contexts/LanguageContext";
import { getTranslation } from "@/i18n/translations";
import { useCallback } from "react";

/**
 * Hook that returns a `t()` function for translating UI strings.
 * Usage:
 *   const t = useT();
 *   t("common.signIn")               // → "Sign in" or localized equivalent
 *   t("portal.welcomeBack", { name }) // → "Welcome back, John!"
 */
export function useT() {
  const { locale } = useLanguage();

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return getTranslation(locale, key, params);
    },
    [locale]
  );

  return t;
}
