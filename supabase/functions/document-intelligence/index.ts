import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    const { documents } = await req.json();

    if (!Array.isArray(documents) || documents.length === 0) {
      return new Response(JSON.stringify({ error: "No documents provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build document summary for AI analysis
    const docSummary = documents.map((d: any) => 
      `- ${d.name} (Category: ${d.category}, Type: ${d.file_type || 'unknown'}, Size: ${d.file_size ? Math.round(d.file_size / 1024) + 'KB' : 'unknown'}, Status: ${d.status || 'pending'})`
    ).join("\n");

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
            content: `You are a document analysis assistant for the D.O.M.E. immigration platform. You analyze uploaded documents for immigration case preparation.

IMPORTANT: You do NOT provide legal advice. You provide informational document analysis only.

When analyzing documents, provide:
1. A quality assessment for each document (Good, Needs Attention, Missing)
2. Identify any missing documents that are commonly required
3. Flag potential issues (low quality scans, missing translations, expired documents)
4. Recommend additional evidence that could strengthen the case

Always respond with a valid JSON object with this structure:
{
  "analyses": [
    { "name": "document name", "status": "good|needs_attention|missing", "notes": "explanation" }
  ],
  "missing_documents": [
    { "name": "document name", "reason": "why it's needed", "priority": "required|recommended" }
  ],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "overall_score": 0-100
}`
          },
          {
            role: "user",
            content: `Analyze these uploaded immigration documents and provide a quality assessment:\n\n${docSummary}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "document_analysis",
              description: "Return structured document analysis results",
              parameters: {
                type: "object",
                properties: {
                  analyses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        status: { type: "string", enum: ["good", "needs_attention", "missing"] },
                        notes: { type: "string" }
                      },
                      required: ["name", "status", "notes"],
                      additionalProperties: false
                    }
                  },
                  missing_documents: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        reason: { type: "string" },
                        priority: { type: "string", enum: ["required", "recommended"] }
                      },
                      required: ["name", "reason", "priority"],
                      additionalProperties: false
                    }
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" }
                  },
                  overall_score: { type: "number" }
                },
                required: ["analyses", "missing_documents", "recommendations", "overall_score"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "document_analysis" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI service error");
    }

    const result = await response.json();
    
    // Extract tool call response
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let analysis;
    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse from content
      analysis = {
        analyses: documents.map((d: any) => ({
          name: d.name,
          status: "needs_attention",
          notes: "Unable to fully analyze. Please ensure the document is clear and complete."
        })),
        missing_documents: [],
        recommendations: ["Consider uploading all required documents for your case type."],
        overall_score: 50
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("document-intelligence error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
