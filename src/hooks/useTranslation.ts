import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "ht", label: "Kreyòl Ayisyen", flag: "🇭🇹" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ur", label: "اردو", flag: "🇵🇰" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
] as const;

export type SupportedLangCode = typeof SUPPORTED_LANGUAGES[number]["code"];

export function getLangLabel(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.label || code;
}

export function getLangFlag(code: string): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.flag || "🌐";
}

interface TranslateOptions {
  text: string;
  sourceLang?: string;
  targetLang: string;
  mode?: "translate" | "explain" | "detect";
}

export function useTranslation() {
  const [translating, setTranslating] = useState(false);
  const { user } = useAuth();

  const translate = useCallback(
    async ({ text, sourceLang, targetLang, mode = "translate" }: TranslateOptions): Promise<string | null> => {
      if (!text.trim()) return null;
      setTranslating(true);
      try {
        const { data, error } = await supabase.functions.invoke("translate-message", {
          body: { text, sourceLang, targetLang, mode },
        });
        if (error) throw error;
        if (data?.error) {
          toast({ title: "Translation error", description: data.error, variant: "destructive" });
          return null;
        }

        // Log analytics
        if (user) {
          await supabase.from("translation_analytics" as any).insert({
            user_id: user.id,
            event_type: mode === "explain" ? "simple_explanation" : mode === "detect" ? "language_detection" : "translation",
            source_language: sourceLang || "auto",
            target_language: targetLang,
          } as any);
        }

        return data?.result || null;
      } catch (err: any) {
        console.error("Translation failed:", err);
        toast({ title: "Translation failed", description: err.message || "Please try again.", variant: "destructive" });
        return null;
      } finally {
        setTranslating(false);
      }
    },
    [user]
  );

  return { translate, translating };
}
