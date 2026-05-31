/**
 * D.O.M.E. Tax Field Mapping Catalog
 *
 * Maps extracted document values onto internal canonical form field keys.
 * Used by the AI extraction pipeline AND the verification UI so both sides
 * speak the same language.
 *
 * field_key convention: <form_code>.<section_key>.<field_id>
 *   e.g.  1040.income.wages_w2
 *         1120.income.gross_receipts
 *         990ez.part1.total_revenue
 */

export type DocType =
  | "w2"
  | "1099_int"
  | "1099_div"
  | "1099_nec"
  | "1099_misc"
  | "1099_r"
  | "prior_1040"
  | "prior_1120"
  | "prior_990"
  | "prior_990ez"
  | "990ez_support"
  | "990_schedule_a"
  | "bookkeeping_export"
  | "csv_financial"
  | "profit_and_loss"
  | "balance_sheet"
  | "bank_statement"
  | "payroll_report"
  | "irs_notice"
  | "other_tax_document";

export type FormCode = "1040" | "1120" | "990n" | "990ez" | "990" | "990_schedule_a";

export interface FieldMapDef {
  /** Canonical key on the source document side (what the AI emits). */
  sourceKey: string;
  /** Internal canonical field key for the target form. */
  targetField: string;
  /** Section key (matches `tax_field_values.section_key`). */
  section: string;
  /** Form code this field belongs to. */
  form: FormCode;
  /** Human-readable label for the verify-screen. */
  label: string;
  /** Plain-English explanation for simple mode. */
  plain?: string;
  /** Optional formatting hint. */
  type?: "money" | "string" | "number" | "boolean" | "date" | "id";
}

/* ============================================================
   1040 — Individual income tax
   ============================================================ */
const map_1040: Record<DocType, FieldMapDef[]> = {
  w2: [
    { sourceKey: "wages",        targetField: "1040.income.wages_w2",        section: "income",     form: "1040", label: "Wages (Box 1)",          plain: "Money you earned from a W-2 job",                   type: "money" },
    { sourceKey: "fed_withheld", targetField: "1040.payments.fed_withheld",  section: "payments",   form: "1040", label: "Federal tax withheld",   plain: "Federal tax already withheld from your paycheck",   type: "money" },
    { sourceKey: "ss_wages",     targetField: "1040.income.ss_wages",        section: "income",     form: "1040", label: "Social Security wages",  type: "money" },
    { sourceKey: "medicare_wages", targetField: "1040.income.medicare_wages", section: "income",    form: "1040", label: "Medicare wages",          type: "money" },
    { sourceKey: "employer_name", targetField: "1040.income.employer_name",  section: "income",     form: "1040", label: "Employer name",          type: "string" },
    { sourceKey: "employer_ein", targetField: "1040.income.employer_ein",    section: "income",     form: "1040", label: "Employer EIN",           type: "id" },
  ],
  "1099_int": [
    { sourceKey: "interest_income", targetField: "1040.income.taxable_interest", section: "income", form: "1040", label: "Taxable interest", plain: "Interest you earned (e.g. from a bank account)", type: "money" },
    { sourceKey: "fed_withheld",    targetField: "1040.payments.fed_withheld_1099", section: "payments", form: "1040", label: "Federal tax withheld (1099)", type: "money" },
    { sourceKey: "payer_name",      targetField: "1040.income.interest_payer", section: "income", form: "1040", label: "Payer", type: "string" },
  ],
  "1099_div": [
    { sourceKey: "ordinary_dividends",  targetField: "1040.income.ordinary_dividends",  section: "income", form: "1040", label: "Ordinary dividends",  plain: "Dividends paid from stocks or funds",        type: "money" },
    { sourceKey: "qualified_dividends", targetField: "1040.income.qualified_dividends", section: "income", form: "1040", label: "Qualified dividends", plain: "Dividends taxed at the lower long-term rate", type: "money" },
  ],
  "1099_nec": [
    { sourceKey: "nonemployee_comp",  targetField: "1040.income.self_employment_income", section: "income", form: "1040", label: "Self-employment income", plain: "Money you earned as a contractor (1099-NEC)", type: "money" },
    { sourceKey: "payer_name",        targetField: "1040.income.se_payer_name",          section: "income", form: "1040", label: "Payer", type: "string" },
    { sourceKey: "fed_withheld",      targetField: "1040.payments.fed_withheld_1099",    section: "payments", form: "1040", label: "Federal tax withheld (1099)", type: "money" },
  ],
  "1099_misc": [
    { sourceKey: "rents",        targetField: "1040.income.rents",          section: "income", form: "1040", label: "Rents",            type: "money" },
    { sourceKey: "royalties",    targetField: "1040.income.royalties",      section: "income", form: "1040", label: "Royalties",        type: "money" },
    { sourceKey: "other_income", targetField: "1040.income.other_misc_income", section: "income", form: "1040", label: "Other income",  type: "money" },
  ],
  "1099_r": [
    { sourceKey: "gross_distribution", targetField: "1040.income.pension_distributions", section: "income", form: "1040", label: "Pension/IRA distributions", plain: "Money you received from a retirement account", type: "money" },
    { sourceKey: "taxable_amount",     targetField: "1040.income.pension_taxable",       section: "income", form: "1040", label: "Taxable retirement amount", type: "money" },
    { sourceKey: "fed_withheld",       targetField: "1040.payments.fed_withheld_1099",   section: "payments", form: "1040", label: "Federal tax withheld (1099)", type: "money" },
  ],
  prior_1040: [
    { sourceKey: "filing_status",  targetField: "1040.identity.filing_status",   section: "identity",   form: "1040", label: "Filing status",     plain: "Last year's filing status (used as default)", type: "string" },
    { sourceKey: "dependents_count", targetField: "1040.identity.dependents_count", section: "identity", form: "1040", label: "Dependents",         type: "number" },
    { sourceKey: "primary_ssn",    targetField: "1040.identity.primary_ssn",     section: "identity",   form: "1040", label: "Taxpayer SSN",       type: "id" },
    { sourceKey: "spouse_ssn",     targetField: "1040.identity.spouse_ssn",      section: "identity",   form: "1040", label: "Spouse SSN",         type: "id" },
    { sourceKey: "address_line",   targetField: "1040.identity.address",         section: "identity",   form: "1040", label: "Address",           type: "string" },
    { sourceKey: "city",           targetField: "1040.identity.city",            section: "identity",   form: "1040", label: "City",              type: "string" },
    { sourceKey: "state",          targetField: "1040.identity.state",           section: "identity",   form: "1040", label: "State",             type: "string" },
    { sourceKey: "zip",            targetField: "1040.identity.zip",             section: "identity",   form: "1040", label: "ZIP",               type: "string" },
    { sourceKey: "agi",            targetField: "1040.carryforward.prior_agi",   section: "carryforward", form: "1040", label: "Prior year AGI",  type: "money" },
  ],
  prior_1120: [],
  prior_990: [],
  prior_990ez: [],
  "990ez_support": [],
  "990_schedule_a": [],
  bookkeeping_export: [],
  csv_financial: [],
  profit_and_loss: [],
  balance_sheet: [],
  bank_statement: [],
  payroll_report: [],
  irs_notice: [],
  other_tax_document: [],
};

/* ============================================================
   1120 — C-Corporation
   ============================================================ */
const map_1120: Record<DocType, FieldMapDef[]> = {
  prior_1120: [
    { sourceKey: "ein",                 targetField: "1120.identity.ein",                 section: "identity", form: "1120", label: "EIN",                type: "id" },
    { sourceKey: "corporation_name",    targetField: "1120.identity.corporation_name",    section: "identity", form: "1120", label: "Corporation name",   type: "string" },
    { sourceKey: "incorporation_date",  targetField: "1120.identity.incorporation_date",  section: "identity", form: "1120", label: "Date incorporated",  type: "date" },
    { sourceKey: "total_assets",        targetField: "1120.balance.total_assets",         section: "balance",  form: "1120", label: "Total assets",       type: "money" },
  ],
  profit_and_loss: [
    { sourceKey: "gross_receipts",      targetField: "1120.income.gross_receipts",        section: "income",   form: "1120", label: "Gross receipts",     plain: "Total revenue from sales/services", type: "money" },
    { sourceKey: "returns_allowances",  targetField: "1120.income.returns_allowances",    section: "income",   form: "1120", label: "Returns & allowances", type: "money" },
    { sourceKey: "cost_of_goods_sold",  targetField: "1120.income.cogs",                  section: "income",   form: "1120", label: "Cost of goods sold", type: "money" },
    { sourceKey: "total_deductions",    targetField: "1120.deductions.total_deductions",  section: "deductions", form: "1120", label: "Total deductions", type: "money" },
    { sourceKey: "officer_compensation", targetField: "1120.deductions.officer_comp",     section: "deductions", form: "1120", label: "Compensation of officers", type: "money" },
    { sourceKey: "salaries_wages",      targetField: "1120.deductions.salaries_wages",    section: "deductions", form: "1120", label: "Salaries & wages",   type: "money" },
    { sourceKey: "rents",               targetField: "1120.deductions.rents",             section: "deductions", form: "1120", label: "Rents",              type: "money" },
    { sourceKey: "depreciation",        targetField: "1120.deductions.depreciation",      section: "deductions", form: "1120", label: "Depreciation",       type: "money" },
    { sourceKey: "advertising",         targetField: "1120.deductions.advertising",       section: "deductions", form: "1120", label: "Advertising",        type: "money" },
  ],
  balance_sheet: [
    { sourceKey: "total_assets",        targetField: "1120.balance.total_assets",         section: "balance",  form: "1120", label: "Total assets",       type: "money" },
    { sourceKey: "total_liabilities",   targetField: "1120.balance.total_liabilities",    section: "balance",  form: "1120", label: "Total liabilities",  type: "money" },
    { sourceKey: "retained_earnings",   targetField: "1120.balance.retained_earnings",    section: "balance",  form: "1120", label: "Retained earnings",  type: "money" },
  ],
  bookkeeping_export: [],
  csv_financial: [],
  bank_statement: [],
  payroll_report: [
    { sourceKey: "total_wages",         targetField: "1120.deductions.salaries_wages",    section: "deductions", form: "1120", label: "Total wages (payroll)", type: "money" },
  ],
  w2: [], "1099_int": [], "1099_div": [], "1099_nec": [], "1099_misc": [], "1099_r": [],
  prior_1040: [], prior_990: [], prior_990ez: [], "990ez_support": [], "990_schedule_a": [],
  irs_notice: [],
  other_tax_document: [],
};

/* ============================================================
   990-EZ — Short form for small nonprofits
   ============================================================ */
const map_990ez: Record<DocType, FieldMapDef[]> = {
  prior_990ez: [
    { sourceKey: "organization_name",   targetField: "990ez.identity.org_name",           section: "identity", form: "990ez", label: "Organization name",  type: "string" },
    { sourceKey: "ein",                 targetField: "990ez.identity.ein",                section: "identity", form: "990ez", label: "EIN",                type: "id" },
    { sourceKey: "accounting_method",   targetField: "990ez.identity.accounting_method",  section: "identity", form: "990ez", label: "Accounting method",  type: "string" },
    { sourceKey: "exempt_status",       targetField: "990ez.identity.exempt_status",      section: "identity", form: "990ez", label: "Exempt status",      type: "string" },
  ],
  prior_990: [
    { sourceKey: "organization_name",   targetField: "990ez.identity.org_name",           section: "identity", form: "990ez", label: "Organization name",  type: "string" },
    { sourceKey: "ein",                 targetField: "990ez.identity.ein",                section: "identity", form: "990ez", label: "EIN",                type: "id" },
  ],
  "990ez_support": [
    { sourceKey: "total_revenue",          targetField: "990ez.part1.total_revenue",      section: "part1", form: "990ez", label: "Total revenue",       plain: "All money the nonprofit received this year", type: "money" },
    { sourceKey: "contributions",          targetField: "990ez.part1.contributions",      section: "part1", form: "990ez", label: "Contributions & gifts", type: "money" },
    { sourceKey: "program_service_revenue", targetField: "990ez.part1.program_service_revenue", section: "part1", form: "990ez", label: "Program service revenue", type: "money" },
    { sourceKey: "membership_dues",        targetField: "990ez.part1.membership_dues",    section: "part1", form: "990ez", label: "Membership dues",     type: "money" },
    { sourceKey: "investment_income",      targetField: "990ez.part1.investment_income",  section: "part1", form: "990ez", label: "Investment income",   type: "money" },
    { sourceKey: "total_expenses",         targetField: "990ez.part1.total_expenses",     section: "part1", form: "990ez", label: "Total expenses",      type: "money" },
    { sourceKey: "grants_paid",            targetField: "990ez.part1.grants_paid",        section: "part1", form: "990ez", label: "Grants paid",         type: "money" },
    { sourceKey: "salaries",               targetField: "990ez.part1.salaries",           section: "part1", form: "990ez", label: "Salaries & benefits", type: "money" },
    { sourceKey: "professional_fees",      targetField: "990ez.part1.professional_fees", section: "part1", form: "990ez", label: "Professional fees",   type: "money" },
    { sourceKey: "occupancy",              targetField: "990ez.part1.occupancy",          section: "part1", form: "990ez", label: "Occupancy/rent",      type: "money" },
    { sourceKey: "total_assets_eoy",       targetField: "990ez.part2.total_assets_eoy",   section: "part2", form: "990ez", label: "Total assets (end of year)", type: "money" },
    { sourceKey: "total_liabilities_eoy",  targetField: "990ez.part2.total_liabilities_eoy", section: "part2", form: "990ez", label: "Total liabilities (end of year)", type: "money" },
    { sourceKey: "net_assets_eoy",         targetField: "990ez.part2.net_assets_eoy",     section: "part2", form: "990ez", label: "Net assets (end of year)", type: "money" },
    { sourceKey: "officer_count",          targetField: "990ez.part4.officer_count",      section: "part4", form: "990ez", label: "Number of officers",  type: "number" },
  ],
  profit_and_loss: [
    { sourceKey: "total_revenue",   targetField: "990ez.part1.total_revenue",   section: "part1", form: "990ez", label: "Total revenue",   type: "money" },
    { sourceKey: "total_expenses",  targetField: "990ez.part1.total_expenses",  section: "part1", form: "990ez", label: "Total expenses",  type: "money" },
  ],
  balance_sheet: [
    { sourceKey: "total_assets_eoy",      targetField: "990ez.part2.total_assets_eoy",      section: "part2", form: "990ez", label: "Total assets (end of year)",  type: "money" },
    { sourceKey: "total_liabilities_eoy", targetField: "990ez.part2.total_liabilities_eoy", section: "part2", form: "990ez", label: "Total liabilities (end of year)", type: "money" },
  ],
  bookkeeping_export: [],
  csv_financial: [],
  w2: [], "1099_int": [], "1099_div": [], "1099_nec": [], "1099_misc": [], "1099_r": [],
  prior_1040: [], prior_1120: [], "990_schedule_a": [],
  bank_statement: [], payroll_report: [], irs_notice: [], other_tax_document: [],
};

/* ============================================================
   990 Schedule A — Public charity status & support history
   ============================================================ */
const map_990_schedule_a: Record<DocType, FieldMapDef[]> = {
  "990_schedule_a": [
    { sourceKey: "public_charity_box",  targetField: "990_schedule_a.part1.public_charity_box", section: "part1", form: "990_schedule_a", label: "Public charity reason (box checked)", type: "string" },
    { sourceKey: "support_y1",          targetField: "990_schedule_a.part2.support_y1",         section: "part2", form: "990_schedule_a", label: "Support — Year 1", type: "money" },
    { sourceKey: "support_y2",          targetField: "990_schedule_a.part2.support_y2",         section: "part2", form: "990_schedule_a", label: "Support — Year 2", type: "money" },
    { sourceKey: "support_y3",          targetField: "990_schedule_a.part2.support_y3",         section: "part2", form: "990_schedule_a", label: "Support — Year 3", type: "money" },
    { sourceKey: "support_y4",          targetField: "990_schedule_a.part2.support_y4",         section: "part2", form: "990_schedule_a", label: "Support — Year 4", type: "money" },
    { sourceKey: "support_y5",          targetField: "990_schedule_a.part2.support_y5",         section: "part2", form: "990_schedule_a", label: "Support — Year 5", type: "money" },
    { sourceKey: "public_support_pct",  targetField: "990_schedule_a.part2.public_support_pct", section: "part2", form: "990_schedule_a", label: "Public support %",  type: "number" },
  ],
  prior_990: [], prior_990ez: [], "990ez_support": [],
  w2: [], "1099_int": [], "1099_div": [], "1099_nec": [], "1099_misc": [], "1099_r": [],
  prior_1040: [], prior_1120: [],
  bookkeeping_export: [], csv_financial: [], profit_and_loss: [], balance_sheet: [],
  bank_statement: [], payroll_report: [], irs_notice: [], other_tax_document: [],
};

/* ============================================================
   Master lookup
   ============================================================ */
export const FIELD_MAPS: Record<FormCode, Partial<Record<DocType, FieldMapDef[]>>> = {
  "1040": map_1040,
  "1120": map_1120 as any,
  "990ez": map_990ez,
  "990": map_990ez, // 990 reuses 990-EZ targets at this layer (further specialization in form engine)
  "990n": {},        // 990-N is post-card; no extraction targets
  "990_schedule_a": map_990_schedule_a,
};

/**
 * Resolve which form mappings apply for a given filing type string
 * (matches `tax_files.filing_type` and the AI's `detected_filing_type`).
 */
export function formsForFilingType(filingType: string): FormCode[] {
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
    case "nonprofit_8868":
      return [];
    default:
      return [];
  }
}

/**
 * For a given doc type + filing type, return all field mappings that should be
 * created from the AI's extracted values.
 */
export function getMappingsFor(docType: DocType, filingType: string): FieldMapDef[] {
  const forms = formsForFilingType(filingType);
  const out: FieldMapDef[] = [];
  for (const f of forms) {
    const list = FIELD_MAPS[f]?.[docType];
    if (list) out.push(...list);
  }
  return out;
}

/**
 * The list of value keys we expect the AI to emit per document type — used as
 * the "schema" we pass to the model so it knows what to look for.
 */
export function expectedKeysFor(docType: DocType): string[] {
  const seen = new Set<string>();
  for (const form of Object.keys(FIELD_MAPS) as FormCode[]) {
    const list = FIELD_MAPS[form]?.[docType];
    if (!list) continue;
    for (const m of list) seen.add(m.sourceKey);
  }
  return Array.from(seen);
}
