/**
 * tax-csv-suggest-mapping — Suggests a mapping of CSV/spreadsheet columns
 * onto tax categories (revenue, expense, payroll, contributions, etc.).
 *
 * Input:  { headers: string[], sampleRows: string[][], filingType: string }
 * Output: { columnMap: Record<columnName, taxCategory>, categoryRules: [...], confidence }
 *
 * The frontend then lets the user confirm/edit and saves a csv_mapping_templates row.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORIES_INDIVIDUAL = ["date","payee","description","wages","interest","dividends","self_employment_income","retirement_income","fed_withheld","other_income","ignore"];
const CATEGORIES_BUSINESS = ["date","vendor","description","gross_receipts","returns_allowances","cogs","officer_compensation","salaries_wages","rents","depreciation","advertising","other_deduction","ignore"];
const CATEGORIES_NONPROFIT = ["date","payee","description","contributions","program_revenue","grants","membership_dues","investment_income","officer_compensation","salaries","occupancy","professional_fees","other_expense","ignore"];

function categoriesFor(filingType: string): string[] {
  if (filingType?.startsWith("nonprofit")) return CATEGORIES_NONPROFIT;
  if (filingType === "individual" || filingType === "individual_1040") return CATEGORIES_INDIVIDUAL;
  return CATEGORIES_BUSINESS;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { headers, sampleRows = [], filingType = "individual" } = await req.json();
    if (!Array.isArray(headers) || headers.length === 0) throw new Error("headers[] is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const allowed = categoriesFor(filingType);
    const sample = sampleRows.slice(0, 8).map(r => r.slice(0, headers.length).join(" | ")).join("\n");

    const prompt = `You are mapping spreadsheet columns to tax categories.

Filing type: ${filingType}
Allowed categories (use exactly these): ${allowed.join(", ")}

Column headers:
${headers.map((h: string, i: number) => `  ${i + 1}. ${h}`).join("\n")}

First 8 sample rows:
${sample || "(no sample provided)"}

Return a mapping for each column header to one allowed category. Use "ignore" for columns that aren't tax-relevant. Then provide a brief confidence per column (0-100) and any category rules you'd suggest (e.g. "If description contains 'Stripe payout' then category=program_revenue").`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You map spreadsheet columns to a fixed set of tax categories. Use the suggest_mapping tool." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "suggest_mapping",
            description: "Return column-to-category mapping suggestions.",
            parameters: {
              type: "object",
              properties: {
                column_map: {
                  type: "object",
                  description: "header → allowed category",
                  additionalProperties: { type: "string", enum: allowed },
                },
                column_confidence: {
                  type: "object",
                  description: "header → 0-100",
                  additionalProperties: { type: "number" },
                },
                category_rules: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      if_column: { type: "string" },
                      contains: { type: "string" },
                      then_category: { type: "string", enum: allowed },
                    },
                    required: ["if_column", "contains", "then_category"],
                    additionalProperties: false,
                  },
                },
                overall_confidence: { type: "number" },
              },
              required: ["column_map", "overall_confidence"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_mapping" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway ${aiResp.status}`);
    }

    const aiJson = await aiResp.json();
    const args = aiJson.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { column_map: {}, overall_confidence: 0 };

    return new Response(JSON.stringify({
      column_map: parsed.column_map || {},
      column_confidence: parsed.column_confidence || {},
      category_rules: parsed.category_rules || [],
      overall_confidence: parsed.overall_confidence ?? 0,
      allowed_categories: allowed,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("tax-csv-suggest-mapping error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
