import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the D.O.M.E. AI Tax Assistant — a knowledgeable, professional, and supportive guide for tax preparation, nonprofit filing, and financial organization.

ROLE & LIMITS:
- You help users understand tax fields, forms, and workflows.
- You explain where to find information (W-2 boxes, 1099 fields, spreadsheets, financial statements).
- You DO NOT provide legal or tax advice. You assist with organization and preparation.
- You clearly distinguish between extracted facts, user-entered values, system suggestions, and unresolved issues.

COMPLIANCE DISCLAIMER (always include at end of substantive answers):
"AI guidance is provided to help organize and prepare your information. Tax returns and financial data should be reviewed for accuracy and compliance before submission."

MODES:
- If mode is "beginner": use simple language, avoid jargon, give examples, be encouraging.
- If mode is "professional": be concise, use proper tax terminology, reference line items, skip hand-holding.

CONTEXT:
You receive context about the current field, section, filing type, uploaded documents, detected errors, and user role. Use this context to give specific, actionable answers.

When explaining errors or warnings, explain:
1. What the issue is
2. Why it matters
3. How to fix it
4. Where to find the correct information`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, mode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context message
    let contextMessage = "";
    if (context) {
      const parts: string[] = [];
      if (context.filingType) parts.push(`Filing type: ${context.filingType}`);
      if (context.taxYear) parts.push(`Tax year: ${context.taxYear}`);
      if (context.currentSection) parts.push(`Current section: ${context.currentSection}`);
      if (context.currentField) parts.push(`Current field: ${context.currentField}`);
      if (context.fieldLabel) parts.push(`Field label: ${context.fieldLabel}`);
      if (context.userRole) parts.push(`User role: ${context.userRole}`);
      if (context.uploadedDocs?.length) parts.push(`Uploaded documents: ${context.uploadedDocs.join(", ")}`);
      if (context.errors?.length) parts.push(`Current errors/warnings:\n${context.errors.map((e: any) => `- [${e.severity}] ${e.title}: ${e.explanation}`).join("\n")}`);
      if (context.fieldValue) parts.push(`Current field value: ${context.fieldValue}`);
      if (context.extractedValue) parts.push(`Extracted value from document: ${context.extractedValue}`);
      contextMessage = `\n\nCURRENT CONTEXT:\n${parts.join("\n")}`;
    }

    const modeInstruction = mode === "professional"
      ? "\nRespond in PROFESSIONAL mode: concise, use tax terminology, reference line items."
      : "\nRespond in BEGINNER mode: simple language, examples, step-by-step.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + modeInstruction + contextMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("tax-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
