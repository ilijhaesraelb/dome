import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  ht: "Haitian Creole",
  ar: "Arabic",
  zh: "Mandarin Chinese",
  ja: "Japanese",
  ur: "Urdu",
  hi: "Hindi",
  de: "German",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, sourceLang, targetLang, mode } = await req.json();

    if (!text || !targetLang) {
      return new Response(
        JSON.stringify({ error: "text and targetLang are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const sourceName = LANGUAGE_NAMES[sourceLang] || sourceLang || "the original language";
    const targetName = LANGUAGE_NAMES[targetLang] || targetLang;

    let systemPrompt: string;
    let userPrompt: string;

    if (mode === "explain") {
      systemPrompt = `You are a plain-language translator for an immigration assistance platform called D.O.M.E. Your job is to rewrite complex legal or technical text into simple everyday language that someone with limited English or legal knowledge can understand. Keep the meaning accurate but use short sentences and common words. Output ONLY the simplified text, nothing else.`;
      userPrompt = `Rewrite this into simple ${targetName} that a beginner can understand:\n\n"${text}"`;
    } else if (mode === "detect") {
      systemPrompt = `You are a language detection service. Respond with ONLY the ISO 639-1 language code (e.g., en, es, fr, zh, ar, ht, pt, ja, ur, hi, de). Nothing else.`;
      userPrompt = `Detect the language of this text:\n\n"${text}"`;
    } else {
      // Default: translate
      systemPrompt = `You are a professional translator for an immigration assistance platform called D.O.M.E. Translate text accurately while maintaining the original meaning and tone. For legal/immigration terminology, use the standard terms in the target language. Output ONLY the translated text, nothing else.`;
      userPrompt = `Translate the following from ${sourceName} to ${targetName}:\n\n"${text}"`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Translation service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(
      JSON.stringify({ result, sourceLang: sourceLang || "auto", targetLang, mode: mode || "translate" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("translate-message error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
