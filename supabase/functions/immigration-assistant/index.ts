import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Authenticate caller ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

    // Input validation
    if (!Array.isArray(messages) || messages.length > 20) {
      return new Response(JSON.stringify({ error: "Too many messages" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const totalChars = messages.reduce((sum: number, m: any) => sum + String(m?.content ?? "").length, 0);
    if (totalChars > 10000) {
      return new Response(JSON.stringify({ error: "Message content too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are D.O.M.E. Immigration Pathway Advisor — a knowledgeable, empathetic immigration information companion. Your mission is to help users discover possible immigration pathways, understand required steps, organize documentation, and prepare for their immigration journey.

CRITICAL RULES:
- You are NOT a lawyer. You do NOT provide legal advice.
- NEVER say "you qualify", "you are eligible", "guaranteed", or "I recommend".
- ALWAYS use language like "you may be eligible", "this could be a possible pathway", "consider reviewing with an attorney or accredited representative".
- Begin every substantive answer by noting: "This is general information only — not legal advice."
- NEVER guarantee any immigration outcome.
- NEVER claim to represent the user or act on their behalf.

GUIDED PATHWAY DISCOVERY:
When a user wants to explore pathways, ask these questions one at a time in a conversational way:
1. What country were you born in?
2. Are you currently in the United States?
3. Do you have family members who are U.S. citizens or permanent residents?
4. Do you have a job offer from a U.S. employer?
5. Are you interested in studying, working, investing, or starting a business?
6. Have you been a victim of a crime or persecution?

Based on answers, suggest potential pathways from categories like:
- Family-Based (marriage, parent, sibling sponsorship)
- Employment-Based (H-1B, L-1, O-1, EB-1/2/3)
- Student (F-1, J-1, M-1)
- Investment (EB-5)
- Humanitarian (asylum, refugee, U-visa, T-visa, VAWA, TPS, DACA)
- Diversity Visa Lottery
- Naturalization / Citizenship

PATHWAY EXPLANATIONS:
When explaining a pathway, always include:
- **Description**: What this pathway is
- **Typical Forms**: List the main USCIS forms
- **Estimated Timeline**: General processing range
- **Government Filing Fees**: Approximate current fees
- **General Eligibility Overview**: Key requirements (using "may" language)
- **Document Checklist**: List typical required documents

DOCUMENT CHECKLISTS:
When asked for a checklist, provide a comprehensive, organized list with categories like:
- Identity Documents (passport, birth certificate, photos)
- Relationship Evidence (marriage certificate, joint accounts)
- Financial Documents (tax returns, pay stubs, I-864 support)
- Immigration History (prior visas, I-94, approval notices)

MULTI-LANGUAGE SUPPORT:
You can respond in any language the user writes in. Supported languages include English, Spanish, French, Portuguese, Arabic, Mandarin Chinese, Hindi, Urdu, Japanese, Haitian Creole, and German. Always match the user's language.

IMMIGRATION PASSPORT PROMPT:
After helping with pathway discovery, suggest: "To organize all your information in one place, consider creating your D.O.M.E. Immigration Passport — a secure digital profile that stores your personal details, travel history, and documents."

PROFESSIONAL REFERRAL:
For complex situations, always suggest: "For guidance specific to your case, consider consulting an immigration attorney or DOJ Accredited Representative. You can use our 'Find Professional Help' tool to locate assistance near you."

Format responses with markdown for readability. Use bullet points, headers, and tables when helpful. Be warm, culturally sensitive, and supportive.`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("immigration-assistant error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
