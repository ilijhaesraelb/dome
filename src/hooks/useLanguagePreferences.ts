import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface LanguagePreferences {
  preferred_language: string;
  secondary_language: string | null;
  translation_enabled: boolean;
  tts_enabled: boolean;
  voice_input_enabled: boolean;
}

const DEFAULT_PREFS: LanguagePreferences = {
  preferred_language: "en",
  secondary_language: null,
  translation_enabled: true,
  tts_enabled: false,
  voice_input_enabled: false,
};

export function useLanguagePreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<LanguagePreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPrefs(DEFAULT_PREFS);
      setLoading(false);
      return;
    }
    supabase
      .from("profiles")
      .select("preferred_language, secondary_language, translation_enabled, tts_enabled, voice_input_enabled")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setPrefs({
            preferred_language: (data as any).preferred_language || "en",
            secondary_language: (data as any).secondary_language || null,
            translation_enabled: (data as any).translation_enabled ?? true,
            tts_enabled: (data as any).tts_enabled ?? false,
            voice_input_enabled: (data as any).voice_input_enabled ?? false,
          });
        }
        setLoading(false);
      });
  }, [user]);

  const updatePrefs = useCallback(
    async (updates: Partial<LanguagePreferences>) => {
      if (!user) return;
      const newPrefs = { ...prefs, ...updates };
      setPrefs(newPrefs);
      const { error } = await supabase
        .from("profiles")
        .update({
          preferred_language: newPrefs.preferred_language,
          secondary_language: newPrefs.secondary_language,
          translation_enabled: newPrefs.translation_enabled,
          tts_enabled: newPrefs.tts_enabled,
          voice_input_enabled: newPrefs.voice_input_enabled,
        } as any)
        .eq("user_id", user.id);
      if (error) {
        toast({ title: "Error saving preferences", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Language preferences saved" });
      }
    },
    [user, prefs]
  );

  return { prefs, loading, updatePrefs };
}
