/**
 * tax-extract-document — Layer 2 single-document extraction
 *
 * Given a tax_file_documents.id, this function:
 *   1. Loads the document + tax file context
 *   2. Asks Lovable AI Gateway to extract structured fields based on the
 *      document type's expected schema
 *   3. Writes a tax_document_extractions row
 *   4. Maps each extracted source value to internal field_keys (via the
 *      same catalog the frontend uses) and inserts/updates tax_field_values
 *      rows with `review_status='ai_needs_review'` so the user must verify.
 *
 * The user verifies in the UI — this function never marks anything verified.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* --------------------------- field-mapping catalog (mirror of src/lib/tax-extraction/field-maps.ts) --------------------------- */
type DocType = string;
type FormCode = "1040" | "1120" | "990ez" | "990" | "990n" | "990_schedule_a";
interface FieldMapDef { sourceKey: string; targetField: string; section: string; form: FormCode; label: string; type?: string; }

const M_1040: Record<string, FieldMapDef[]> = {
  w2: [
    { sourceKey: "wages", targetField: "1040.income.wages_w2", section: "income", form: "1040", label: "Wages (W-2 Box 1)", type: "money" },
    { sourceKey: "fed_withheld", targetField: "1040.payments.fed_withheld", section: "payments", form: "1040", label: "Federal tax withheld", type: "money" },
    { sourceKey: "ss_wages", targetField: "1040.income.ss_wages", section: "income", form: "1040", label: "Social Security wages", type: "money" },
    { sourceKey: "medicare_wages", targetField: "1040.income.medicare_wages", section: "income", form: "1040", label: "Medicare wages", type: "money" },
    { sourceKey: "employer_name", targetField: "1040.income.employer_name", section: "income", form: "1040", label: "Employer name" },
    { sourceKey: "employer_ein", targetField: "1040.income.employer_ein", section: "income", form: "1040", label: "Employer EIN" },
  ],
  "1099_int": [
    { sourceKey: "interest_income", targetField: "1040.income.taxable_interest", section: "income", form: "1040", label: "Taxable interest", type: "money" },
    { sourceKey: "fed_withheld", targetField: "1040.payments.fed_withheld_1099", section: "payments", form: "1040", label: "Federal tax withheld (1099)", type: "money" },
    { sourceKey: "payer_name", targetField: "1040.income.interest_payer", section: "income", form: "1040", label: "Payer" },
  ],
  "1099_div": [
    { sourceKey: "ordinary_dividends", targetField: "1040.income.ordinary_dividends", section: "income", form: "1040", label: "Ordinary dividends", type: "money" },
    { sourceKey: "qualified_dividends", targetField: "1040.income.qualified_dividends", section: "income", form: "1040", label: "Qualified dividends", type: "money" },
  ],
  "1099_nec": [
    { sourceKey: "nonemployee_comp", targetField: "1040.income.self_employment_income", section: "income", form: "1040", label: "Self-employment income", type: "money" },
    { sourceKey: "payer_name", targetField: "1040.income.se_payer_name", section: "income", form: "1040", label: "Payer" },
    { sourceKey: "fed_withheld", targetField: "1040.payments.fed_withheld_1099", section: "payments", form: "1040", label: "Federal tax withheld (1099)", type: "money" },
  ],
  "1099_misc": [
    { sourceKey: "rents", targetField: "1040.income.rents", section: "income", form: "1040", label: "Rents", type: "money" },
    { sourceKey: "royalties", targetField: "1040.income.royalties", section: "income", form: "1040", label: "Royalties", type: "money" },
    { sourceKey: "other_income", targetField: "1040.income.other_misc_income", section: "income", form: "1040", label: "Other income", type: "money" },
  ],
  "1099_r": [
    { sourceKey: "gross_distribution", targetField: "1040.income.pension_distributions", section: "income", form: "1040", label: "Pension/IRA distributions", type: "money" },
    { sourceKey: "taxable_amount", targetField: "1040.income.pension_taxable", section: "income", form: "1040", label: "Taxable retirement amount", type: "money" },
    { sourceKey: "fed_withheld", targetField: "1040.payments.fed_withheld_1099", section: "payments", form: "1040", label: "Federal tax withheld (1099)", type: "money" },
  ],
  prior_1040: [
    { sourceKey: "filing_status", targetField: "1040.identity.filing_status", section: "identity", form: "1040", label: "Filing status" },
    { sourceKey: "dependents_count", targetField: "1040.identity.dependents_count", section: "identity", form: "1040", label: "Dependents", type: "number" },
    { sourceKey: "primary_ssn", targetField: "1040.identity.primary_ssn", section: "identity", form: "1040", label: "Taxpayer SSN" },
    { sourceKey: "spouse_ssn", targetField: "1040.identity.spouse_ssn", section: "identity", form: "1040", label: "Spouse SSN" },
    { sourceKey: "address_line", targetField: "1040.identity.address", section: "identity", form: "1040", label: "Address" },
    { sourceKey: "city", targetField: "1040.identity.city", section: "identity", form: "1040", label: "City" },
    { sourceKey: "state", targetField: "1040.identity.state", section: "identity", form: "1040", label: "State" },
    { sourceKey: "zip", targetField: "1040.identity.zip", section: "identity", form: "1040", label: "ZIP" },
    { sourceKey: "agi", targetField: "1040.carryforward.prior_agi", section: "carryforward", form: "1040", label: "Prior year AGI", type: "money" },
  ],
};

const M_1120: Record<string, FieldMapDef[]> = {
  prior_1120: [
    { sourceKey: "ein", targetField: "1120.identity.ein", section: "identity", form: "1120", label: "EIN" },
    { sourceKey: "corporation_name", targetField: "1120.identity.corporation_name", section: "identity", form: "1120", label: "Corporation name" },
    { sourceKey: "incorporation_date", targetField: "1120.identity.incorporation_date", section: "identity", form: "1120", label: "Date incorporated" },
    { sourceKey: "total_assets", targetField: "1120.balance.total_assets", section: "balance", form: "1120", label: "Total assets", type: "money" },
  ],
  profit_and_loss: [
    { sourceKey: "gross_receipts", targetField: "1120.income.gross_receipts", section: "income", form: "1120", label: "Gross receipts", type: "money" },
    { sourceKey: "returns_allowances", targetField: "1120.income.returns_allowances", section: "income", form: "1120", label: "Returns & allowances", type: "money" },
    { sourceKey: "cost_of_goods_sold", targetField: "1120.income.cogs", section: "income", form: "1120", label: "Cost of goods sold", type: "money" },
    { sourceKey: "total_deductions", targetField: "1120.deductions.total_deductions", section: "deductions", form: "1120", label: "Total deductions", type: "money" },
    { sourceKey: "officer_compensation", targetField: "1120.deductions.officer_comp", section: "deductions", form: "1120", label: "Compensation of officers", type: "money" },
    { sourceKey: "salaries_wages", targetField: "1120.deductions.salaries_wages", section: "deductions", form: "1120", label: "Salaries & wages", type: "money" },
    { sourceKey: "rents", targetField: "1120.deductions.rents", section: "deductions", form: "1120", label: "Rents", type: "money" },
    { sourceKey: "depreciation", targetField: "1120.deductions.depreciation", section: "deductions", form: "1120", label: "Depreciation", type: "money" },
    { sourceKey: "advertising", targetField: "1120.deductions.advertising", section: "deductions", form: "1120", label: "Advertising", type: "money" },
  ],
  balance_sheet: [
    { sourceKey: "total_assets", targetField: "1120.balance.total_assets", section: "balance", form: "1120", label: "Total assets", type: "money" },
    { sourceKey: "total_liabilities", targetField: "1120.balance.total_liabilities", section: "balance", form: "1120", label: "Total liabilities", type: "money" },
    { sourceKey: "retained_earnings", targetField: "1120.balance.retained_earnings", section: "balance", form: "1120", label: "Retained earnings", type: "money" },
  ],
  payroll_report: [
    { sourceKey: "total_wages", targetField: "1120.deductions.salaries_wages", section: "deductions", form: "1120", label: "Total wages (payroll)", type: "money" },
  ],
};

const M_990EZ: Record<string, FieldMapDef[]> = {
  prior_990ez: [
    { sourceKey: "organization_name", targetField: "990ez.identity.org_name", section: "identity", form: "990ez", label: "Organization name" },
    { sourceKey: "ein", targetField: "990ez.identity.ein", section: "identity", form: "990ez", label: "EIN" },
    { sourceKey: "accounting_method", targetField: "990ez.identity.accounting_method", section: "identity", form: "990ez", label: "Accounting method" },
    { sourceKey: "exempt_status", targetField: "990ez.identity.exempt_status", section: "identity", form: "990ez", label: "Exempt status" },
  ],
  prior_990: [
    { sourceKey: "organization_name", targetField: "990ez.identity.org_name", section: "identity", form: "990ez", label: "Organization name" },
    { sourceKey: "ein", targetField: "990ez.identity.ein", section: "identity", form: "990ez", label: "EIN" },
  ],
  "990ez_support": [
    { sourceKey: "total_revenue", targetField: "990ez.part1.total_revenue", section: "part1", form: "990ez", label: "Total revenue", type: "money" },
    { sourceKey: "contributions", targetField: "990ez.part1.contributions", section: "part1", form: "990ez", label: "Contributions & gifts", type: "money" },
    { sourceKey: "program_service_revenue", targetField: "990ez.part1.program_service_revenue", section: "part1", form: "990ez", label: "Program service revenue", type: "money" },
    { sourceKey: "membership_dues", targetField: "990ez.part1.membership_dues", section: "part1", form: "990ez", label: "Membership dues", type: "money" },
    { sourceKey: "investment_income", targetField: "990ez.part1.investment_income", section: "part1", form: "990ez", label: "Investment income", type: "money" },
    { sourceKey: "total_expenses", targetField: "990ez.part1.total_expenses", section: "part1", form: "990ez", label: "Total expenses", type: "money" },
    { sourceKey: "grants_paid", targetField: "990ez.part1.grants_paid", section: "part1", form: "990ez", label: "Grants paid", type: "money" },
    { sourceKey: "salaries", targetField: "990ez.part1.salaries", section: "part1", form: "990ez", label: "Salaries & benefits", type: "money" },
    { sourceKey: "professional_fees", targetField: "990ez.part1.professional_fees", section: "part1", form: "990ez", label: "Professional fees", type: "money" },
    { sourceKey: "occupancy", targetField: "990ez.part1.occupancy", section: "part1", form: "990ez", label: "Occupancy/rent", type: "money" },
    { sourceKey: "total_assets_eoy", targetField: "990ez.part2.total_assets_eoy", section: "part2", form: "990ez", label: "Total assets (end of year)", type: "money" },
    { sourceKey: "total_liabilities_eoy", targetField: "990ez.part2.total_liabilities_eoy", section: "part2", form: "990ez", label: "Total liabilities (end of year)", type: "money" },
    { sourceKey: "net_assets_eoy", targetField: "990ez.part2.net_assets_eoy", section: "part2", form: "990ez", label: "Net assets (end of year)", type: "money" },
    { sourceKey: "officer_count", targetField: "990ez.part4.officer_count", section: "part4", form: "990ez", label: "Number of officers", type: "number" },
  ],
  profit_and_loss: [
    { sourceKey: "total_revenue", targetField: "990ez.part1.total_revenue", section: "part1", form: "990ez", label: "Total revenue", type: "money" },
    { sourceKey: "total_expenses", targetField: "990ez.part1.total_expenses", section: "part1", form: "990ez", label: "Total expenses", type: "money" },
  ],
  balance_sheet: [
    { sourceKey: "total_assets_eoy", targetField: "990ez.part2.total_assets_eoy", section: "part2", form: "990ez", label: "Total assets (end of year)", type: "money" },
    { sourceKey: "total_liabilities_eoy", targetField: "990ez.part2.total_liabilities_eoy", section: "part2", form: "990ez", label: "Total liabilities (end of year)", type: "money" },
  ],
};

const M_990SCHA: Record<string, FieldMapDef[]> = {
  "990_schedule_a": [
    { sourceKey: "public_charity_box", targetField: "990_schedule_a.part1.public_charity_box", section: "part1", form: "990_schedule_a", label: "Public charity reason" },
    { sourceKey: "support_y1", targetField: "990_schedule_a.part2.support_y1", section: "part2", form: "990_schedule_a", label: "Support — Year 1", type: "money" },
    { sourceKey: "support_y2", targetField: "990_schedule_a.part2.support_y2", section: "part2", form: "990_schedule_a", label: "Support — Year 2", type: "money" },
    { sourceKey: "support_y3", targetField: "990_schedule_a.part2.support_y3", section: "part2", form: "990_schedule_a", label: "Support — Year 3", type: "money" },
    { sourceKey: "support_y4", targetField: "990_schedule_a.part2.support_y4", section: "part2", form: "990_schedule_a", label: "Support — Year 4", type: "money" },
    { sourceKey: "support_y5", targetField: "990_schedule_a.part2.support_y5", section: "part2", form: "990_schedule_a", label: "Support — Year 5", type: "money" },
    { sourceKey: "public_support_pct", targetField: "990_schedule_a.part2.public_support_pct", section: "part2", form: "990_schedule_a", label: "Public support %", type: "number" },
  ],
};

const FIELD_MAPS: Record<FormCode, Record<string, FieldMapDef[]>> = {
  "1040": M_1040,
  "1120": M_1120,
  "990ez": M_990EZ,
  "990": M_990EZ,
  "990n": {},
  "990_schedule_a": M_990SCHA,
};

function formsForFilingType(filingType: string): FormCode[] {
  switch (filingType) {
    case "individual":
    case "individual_1040":
      return ["1040"];
    case "corporate_1120":
    case "small_business":
    case "partnership_1065":
      return ["1120"];
    case "nonprofit_990n":
      return ["990n"];
    case "nonprofit_990ez":
      return ["990ez", "990_schedule_a"];
    case "nonprofit_990":
      return ["990", "990_schedule_a"];
    default:
      return [];
  }
}

function getMappingsFor(docType: string, filingType: string): FieldMapDef[] {
  const out: FieldMapDef[] = [];
  for (const f of formsForFilingType(filingType)) {
    const list = FIELD_MAPS[f]?.[docType];
    if (list) out.push(...list);
  }
  return out;
}

function expectedKeysFor(docType: string): string[] {
  const seen = new Set<string>();
  for (const f of Object.keys(FIELD_MAPS) as FormCode[]) {
    const list = FIELD_MAPS[f]?.[docType];
    if (!list) continue;
    for (const m of list) seen.add(m.sourceKey);
  }
  return Array.from(seen);
}

/* --------------------------- main --------------------------- */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documentId } = await req.json();
    if (!documentId) throw new Error("documentId is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Load document + tax file context
    const { data: doc, error: dErr } = await sb
      .from("tax_file_documents")
      .select("*, tax_files(id, filing_type, tax_year, ai_recommended_filing_type)")
      .eq("id", documentId)
      .single();
    if (dErr || !doc) throw new Error("Document not found");

    const taxFile = doc.tax_files as any;
    const filingType = taxFile?.filing_type || "individual";
    // Trust ai_classification first, then fallback to category, then "other_tax_document"
    const docType: string = (doc.ai_classification || doc.document_type || doc.category || "other_tax_document").toLowerCase();

    const expectedKeys = expectedKeysFor(docType);
    const mappings = getMappingsFor(docType, filingType);

    // 2. Build extraction prompt
    const schemaHint = expectedKeys.length
      ? `Extract these fields if visible (numbers as plain numbers, no $ or commas):\n${expectedKeys.map((k) => `  - ${k}`).join("\n")}`
      : "Extract all key tax-relevant values you can identify (amounts, names, identifiers, dates).";

    const userPrompt = `Document: ${doc.name}
Detected document type: ${docType}
Detected category: ${doc.category}
Filing type for this return: ${filingType}
Tax year: ${taxFile?.tax_year || "unknown"}

${schemaHint}

Also identify: tax_year on the document, taxpayer or entity name, identifier (EIN/SSN), and an overall confidence (0-100) for the extraction.`;

    // 3. Call AI Gateway with tool-calling for structured output
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You extract tax-relevant data from documents. Return values exactly as shown on the document. If a field is not visible, omit it. Use the extract_tax_document tool." },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_tax_document",
            description: "Return structured extracted values from a tax document.",
            parameters: {
              type: "object",
              properties: {
                detected_tax_year: { type: "integer" },
                detected_entity_name: { type: "string" },
                detected_entity_tin: { type: "string" },
                confidence: { type: "number", minimum: 0, maximum: 100 },
                fields: {
                  type: "object",
                  description: "Map of source-key → string value. Use the source keys provided.",
                  additionalProperties: { type: "string" },
                },
                warnings: { type: "array", items: { type: "string" } },
              },
              required: ["fields", "confidence"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_tax_document" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway ${aiResp.status}`);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any = { fields: {}, confidence: 0, warnings: [] };
    if (toolCall?.function?.arguments) {
      try { parsed = JSON.parse(toolCall.function.arguments); } catch { /* keep default */ }
    }
    const extractedFields: Record<string, string> = parsed.fields || {};
    const detectedYear: number | null = parsed.detected_tax_year ?? null;
    const detectedEntityName: string | null = parsed.detected_entity_name ?? null;
    const detectedEntityTin: string | null = parsed.detected_entity_tin ?? null;
    const confidence: number = Math.max(0, Math.min(100, Number(parsed.confidence ?? 50)));
    const warnings: string[] = Array.isArray(parsed.warnings) ? parsed.warnings : [];

    // 4. Apply mappings and build field-value rows
    const mappedRows: Array<{ map: FieldMapDef; raw: string; numeric: number | null }> = [];
    const unmappedKeys: string[] = [];
    for (const [k, v] of Object.entries(extractedFields)) {
      if (v === null || v === undefined || String(v).trim() === "") continue;
      const map = mappings.find((m) => m.sourceKey === k);
      if (!map) { unmappedKeys.push(k); continue; }
      const numeric = map.type === "money" || map.type === "number"
        ? Number(String(v).replace(/[^0-9.\-]/g, ""))
        : null;
      mappedRows.push({ map, raw: String(v), numeric: Number.isFinite(numeric as number) ? (numeric as number) : null });
    }

    // 5. Persist tax_document_extractions row (unique by document_id is not enforced; we keep history per call)
    const { data: extractionRow, error: exErr } = await sb
      .from("tax_document_extractions")
      .insert({
        document_id: documentId,
        tax_file_id: doc.tax_file_id,
        document_type: docType,
        detected_tax_year: detectedYear,
        detected_entity_name: detectedEntityName,
        detected_entity_tin: detectedEntityTin,
        extracted_fields: extractedFields,
        key_amounts: Object.fromEntries(mappedRows.filter(r => r.numeric !== null).map(r => [r.map.targetField, r.numeric])),
        warnings,
        extraction_model: "google/gemini-3-flash-preview",
        extraction_status: "complete",
        target_form_code: mappedRows[0]?.map.form ?? null,
        target_section_key: mappedRows[0]?.map.section ?? null,
        mapped_count: mappedRows.length,
        unmapped_count: unmappedKeys.length,
      })
      .select()
      .single();
    if (exErr) throw new Error(`Persist extraction failed: ${exErr.message}`);

    // 6. Update tax_file_documents with classification + tax_year + status
    await sb.from("tax_file_documents").update({
      ai_classification: docType,
      ai_confidence: confidence,
      tax_year: detectedYear ?? doc.tax_year,
      extraction_status: "complete",
      extracted_data: extractedFields,
    }).eq("id", documentId);

    // 7. Resolve tax_file_form_id per form mentioned (auto-create if missing)
    const formCodes = Array.from(new Set(mappedRows.map(r => r.map.form)));
    const formIdByCode: Record<string, string> = {};
    for (const code of formCodes) {
      const { data: existing } = await sb
        .from("tax_file_forms")
        .select("id")
        .eq("tax_file_id", doc.tax_file_id)
        .eq("form_code", code)
        .maybeSingle();
      if (existing?.id) {
        formIdByCode[code] = existing.id;
      } else {
        const { data: created } = await sb
          .from("tax_file_forms")
          .insert({ tax_file_id: doc.tax_file_id, form_code: code, status: "in_progress", selection_source: "ai" })
          .select("id")
          .maybeSingle();
        if (created?.id) formIdByCode[code] = created.id;
      }
    }

    // 8. Upsert tax_field_values rows as `ai_needs_review`
    let inserted = 0;
    for (const row of mappedRows) {
      const formId = formIdByCode[row.map.form];
      if (!formId) continue;
      const payload = {
        tax_file_id: doc.tax_file_id,
        tax_file_form_id: formId,
        field_key: row.map.targetField,
        section_key: row.map.section,
        field_type: row.map.type ?? "string",
        value: row.raw,
        value_numeric: row.numeric,
        source: "ai_extracted",
        source_document_id: documentId,
        source_extraction_id: extractionRow.id,
        ai_original_value: row.raw,
        confidence: confidence,
        review_status: "ai_needs_review",
        verified: false,
      };
      // Upsert on (tax_file_form_id, field_key)
      const { error: upErr } = await sb
        .from("tax_field_values")
        .upsert(payload as any, { onConflict: "tax_file_form_id,field_key" });
      if (!upErr) inserted++;
    }

    // 9. Update tax_file status to awaiting_verification (only if not already past it)
    await sb.from("tax_files").update({
      status: "awaiting_verification" as any,
    }).eq("id", doc.tax_file_id).in("status", ["new_intake", "documents_uploaded", "ai_analyzing"] as any);

    return new Response(JSON.stringify({
      ok: true,
      extraction_id: extractionRow.id,
      doc_type: docType,
      detected_tax_year: detectedYear,
      mapped_count: mappedRows.length,
      unmapped_count: unmappedKeys.length,
      unmapped_keys: unmappedKeys,
      values_inserted: inserted,
      confidence,
      warnings,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("tax-extract-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
