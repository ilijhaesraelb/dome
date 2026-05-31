import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { taxFileId, documentIds } = await req.json();
    if (!taxFileId) throw new Error("taxFileId is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Fetch the tax file and documents
    const { data: taxFile } = await sb.from("tax_files").select("*, tax_clients(*)").eq("id", taxFileId).single();
    if (!taxFile) throw new Error("Tax file not found");

    const { data: docs } = await sb.from("tax_file_documents").select("*").eq("tax_file_id", taxFileId);
    if (!docs?.length) throw new Error("No documents found");

    // Build analysis prompt from document metadata
    const docSummary = docs.map(d => `- ${d.name} (category: ${d.category}, type: ${d.file_type || "unknown"})`).join("\n");
    const clientInfo = taxFile.tax_clients
      ? `Client: ${taxFile.tax_clients.legal_first_name || ""} ${taxFile.tax_clients.legal_last_name || ""}, Type: ${taxFile.tax_clients.tax_user_type}, Org: ${taxFile.tax_clients.organization_name || "N/A"}`
      : "No client info";

    const prompt = `Analyze these tax documents and recommend the most likely filing type.

${clientInfo}
Tax Year: ${taxFile.tax_year}
Current Filing Type: ${taxFile.filing_type}

Documents uploaded:
${docSummary}

Based on the document names, categories, and client profile, provide:
1. The most likely filing type (individual, nonprofit_990n, nonprofit_990ez, nonprofit_8868, small_business, corporate_1120, partnership_1065)
2. Confidence score (0-100)
3. Brief explanation of why
4. Any warnings or missing documents
5. For each document, classify its type more specifically

Respond ONLY with valid JSON in this exact format:
{
  "filing_type": "individual",
  "confidence": 85,
  "explanation": "Based on W-2 and prior 1040...",
  "warnings": ["Missing 1099-INT if interest income exists"],
  "document_classifications": [{"doc_name": "filename.pdf", "classification": "w2", "detected_year": 2025}]
}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a tax document analysis AI. Analyze document metadata and recommend filing paths. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI request failed: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response
    let analysis: any;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { filing_type: taxFile.filing_type, confidence: 50, explanation: "Could not fully analyze documents.", warnings: [] };
    } catch {
      analysis = { filing_type: taxFile.filing_type, confidence: 50, explanation: "Analysis parsing failed — using current filing type.", warnings: [] };
    }

    // Save recommendation
    await sb.from("tax_filing_recommendations").upsert({
      tax_file_id: taxFileId,
      detected_filing_type: analysis.filing_type,
      confidence_score: analysis.confidence,
      recommendation_text: analysis.explanation,
      evidence_summary: analysis.warnings || [],
      alternative_paths: [],
      ai_model: "gemini-3-flash-preview",
    }, { onConflict: "tax_file_id" }).select();

    // Update document classifications
    if (analysis.document_classifications?.length) {
      for (const dc of analysis.document_classifications) {
        const matchDoc = docs.find(d => d.name === dc.doc_name);
        if (matchDoc) {
          await sb.from("tax_file_documents").update({
            ai_classification: dc.classification,
            extraction_status: "complete",
            tax_year: dc.detected_year || taxFile.tax_year,
          } as any).eq("id", matchDoc.id);
        }
      }
    }

    // Update tax file with recommendation
    await sb.from("tax_files").update({
      ai_recommended_filing_type: analysis.filing_type,
      source_documents_count: docs.length,
      status: taxFile.status === "new_intake" ? "documents_uploaded" as any : taxFile.status,
    } as any).eq("id", taxFileId);

    return new Response(JSON.stringify({
      recommendation: {
        filing_type: analysis.filing_type,
        confidence: analysis.confidence,
        explanation: analysis.explanation,
      },
      warnings: analysis.warnings || [],
      documents_classified: analysis.document_classifications?.length || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tax-document-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
