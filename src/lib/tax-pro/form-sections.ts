/**
 * Form section registry — canonical list of sections per tax form.
 * Powers professional-mode deep links: pros click a section and jump
 * directly to that part of the form workspace, not the beginner sequence.
 *
 * Section keys MUST match `tax_field_values.section_key` and the section
 * keys used by the field-maps catalog (`src/lib/tax-extraction/field-maps.ts`).
 */

export interface FormSectionDef {
  /** Stable key used in the DB and field maps. */
  key: string;
  /** Human label shown to professionals. */
  label: string;
  /** Short professional-style hint (line range / part number). */
  hint?: string;
}

export interface FormSectionRegistryEntry {
  formCode: string;
  formName: string;
  sections: FormSectionDef[];
  /** True when this form has a dedicated workspace route. */
  hasWorkspace: boolean;
}

/**
 * NOTE: Until per-form deep-link routes exist for every form, the
 * `formSectionDeepLink` helper falls back to the file's pro view with a
 * `?section=` query param. The Pro file view can read it and scroll/focus.
 */
export const FORM_SECTION_REGISTRY: Record<string, FormSectionRegistryEntry> = {
  "1040": {
    formCode: "1040",
    formName: "Form 1040 — Individual Income Tax",
    hasWorkspace: false,
    sections: [
      { key: "identity", label: "Identity & Filing Status", hint: "Lines 1–6" },
      { key: "dependents", label: "Dependents", hint: "Line 6c" },
      { key: "income", label: "Income", hint: "Lines 1–8" },
      { key: "adjustments", label: "Adjustments to Income", hint: "Schedule 1" },
      { key: "deductions", label: "Deductions", hint: "Lines 12–14" },
      { key: "tax_credits", label: "Tax & Credits", hint: "Lines 16–22" },
      { key: "payments", label: "Payments & Withholding", hint: "Lines 25–33" },
      { key: "refund", label: "Refund / Amount Owed", hint: "Lines 34–37" },
      { key: "signature", label: "Signature", hint: "Bottom of page 2" },
    ],
  },
  "1120": {
    formCode: "1120",
    formName: "Form 1120 — Corporate Income Tax",
    hasWorkspace: false,
    sections: [
      { key: "identity", label: "Corporation Identity", hint: "Header" },
      { key: "income", label: "Income", hint: "Lines 1–11" },
      { key: "deductions", label: "Deductions", hint: "Lines 12–27" },
      { key: "tax_payments", label: "Tax, Refundable Credits & Payments", hint: "Lines 28–36" },
      { key: "schedule_c", label: "Schedule C — Dividends" },
      { key: "schedule_j", label: "Schedule J — Tax Computation" },
      { key: "schedule_k", label: "Schedule K — Other Information" },
      { key: "schedule_l", label: "Schedule L — Balance Sheet" },
      { key: "schedule_m1", label: "Schedule M-1 — Reconciliation" },
      { key: "signature", label: "Signature" },
    ],
  },
  "990ez": {
    formCode: "990ez",
    formName: "Form 990-EZ — Short Form Return",
    hasWorkspace: true,
    sections: [
      { key: "identity", label: "Organization Identity" },
      { key: "part1", label: "Part I — Revenue, Expenses & Net Assets" },
      { key: "part2", label: "Part II — Balance Sheet" },
      { key: "part3", label: "Part III — Program Service Accomplishments" },
      { key: "part4", label: "Part IV — Officers, Directors & Trustees" },
      { key: "part5", label: "Part V — Other Information" },
      { key: "part6", label: "Part VI — 501(c)(3) Specific" },
      { key: "signature", label: "Signature" },
    ],
  },
  "990n": {
    formCode: "990n",
    formName: "Form 990-N — e-Postcard",
    hasWorkspace: true,
    sections: [
      { key: "identity", label: "Organization Identity" },
      { key: "eligibility", label: "Eligibility Confirmation" },
      { key: "submission", label: "Submission" },
    ],
  },
  "990": {
    formCode: "990",
    formName: "Form 990 — Return of Organization",
    hasWorkspace: false,
    sections: [
      { key: "identity", label: "Organization Identity" },
      { key: "part1", label: "Part I — Summary" },
      { key: "part3", label: "Part III — Program Service Accomplishments" },
      { key: "part4", label: "Part IV — Checklist of Required Schedules" },
      { key: "part7", label: "Part VII — Compensation" },
      { key: "part8", label: "Part VIII — Statement of Revenue" },
      { key: "part9", label: "Part IX — Statement of Functional Expenses" },
      { key: "part10", label: "Part X — Balance Sheet" },
      { key: "signature", label: "Signature" },
    ],
  },
  "990_schedule_a": {
    formCode: "990_schedule_a",
    formName: "Schedule A — Public Charity Status & Public Support",
    hasWorkspace: false,
    sections: [
      { key: "part1", label: "Part I — Reason for Public Charity Status" },
      { key: "part2", label: "Part II — Support Schedule (170(b)(1)(A)(vi))" },
      { key: "part3", label: "Part III — Support Schedule (509(a)(2))" },
      { key: "part4", label: "Part IV — Supporting Organizations" },
    ],
  },
  "8868": {
    formCode: "8868",
    formName: "Form 8868 — Application for Extension",
    hasWorkspace: true,
    sections: [
      { key: "identity", label: "Filer Identity" },
      { key: "extension", label: "Extension Request" },
      { key: "signature", label: "Signature" },
    ],
  },
};

/** Look up sections for a form code, normalised to lowercase. */
export function getFormSections(formCode: string | null | undefined): FormSectionDef[] {
  if (!formCode) return [];
  const key = formCode.toLowerCase();
  return FORM_SECTION_REGISTRY[key]?.sections ?? [];
}

/**
 * Build a deep-link URL to a specific form section inside the Pro console.
 *
 * - Forms with a real client workspace open the workspace with `?section=`.
 * - Other forms route back to the Pro file view with `?form=&section=`
 *   so the Forms tab can scroll the matching row into view.
 */
export function formSectionDeepLink(
  fileId: string,
  formCode: string,
  sectionKey: string,
): string {
  const code = formCode.toLowerCase();
  const entry = FORM_SECTION_REGISTRY[code];
  if (entry?.hasWorkspace) {
    // Reuse existing workspace routes (already implemented for 990n/ez/8868).
    if (code === "990n") return `/tax/file/${fileId}/990n?section=${sectionKey}`;
    if (code === "990ez") return `/tax/file/${fileId}/990ez?section=${sectionKey}`;
    if (code === "8868") return `/tax/file/${fileId}/8868?section=${sectionKey}`;
  }
  return `/tax/pro/file/${fileId}?form=${code}&section=${sectionKey}#answers`;
}