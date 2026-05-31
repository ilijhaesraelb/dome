/**
 * UFE Mapping Validator
 *
 * Walks every required UFEQuestion in a form and verifies it has a real
 * mapping target. Used to BLOCK exports when the internal data layer is
 * incomplete or when a required question has not been wired to the
 * official PDF.
 */

import { iterateQuestions, type UFEForm, type UFEQuestion } from "./schema";

export type MappingIssueSeverity = "error" | "warning" | "info";

export interface MappingIssue {
  severity: MappingIssueSeverity;
  questionKey: string;
  label: string;
  officialRef: string; // e.g. "I-485 / Page 3 / Part 1 / Item 18"
  message: string;
}

export interface MappingValidationReport {
  formCode: string;
  totalQuestions: number;
  mappedQuestions: number;
  unmappedRequired: MappingIssue[];
  unmappedOptional: MappingIssue[];
  missingValues: MappingIssue[];
  /** True when the form is safe to export (no required-unmapped issues AND
   *  no required-missing-value issues). */
  exportReady: boolean;
}

function refString(q: UFEQuestion): string {
  const r = q.officialRef;
  return `${r.formCode} / Page ${r.page} / Part ${r.part} / Item ${r.item}`;
}

function isFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return true;
  return Boolean(value);
}

/**
 * Validate a UFE form against the user's current answer values.
 *
 * @param form     UFE form definition
 * @param values   Flat map of fieldKey -> answer
 */
export function validateMapping(
  form: UFEForm,
  values: Record<string, unknown>,
): MappingValidationReport {
  const report: MappingValidationReport = {
    formCode: form.code,
    totalQuestions: 0,
    mappedQuestions: 0,
    unmappedRequired: [],
    unmappedOptional: [],
    missingValues: [],
    exportReady: true,
  };

  for (const q of iterateQuestions(form)) {
    report.totalQuestions++;
    const ref = refString(q);
    const required = q.validation?.required === true;
    const isMapped = q.mapping.kind === "acroform" || q.mapping.kind === "overlay" || q.mapping.kind === "continuation";

    if (isMapped) report.mappedQuestions++;

    // Mapping gap
    if (q.mapping.kind === "unmapped") {
      const issue: MappingIssue = {
        severity: required ? "error" : "warning",
        questionKey: q.key,
        label: q.label,
        officialRef: ref,
        message:
          (q.mapping.reason ?? "No export mapping configured.") +
          (required ? " (Required field — blocks export.)" : ""),
      };
      if (required) report.unmappedRequired.push(issue);
      else report.unmappedOptional.push(issue);
    }

    // Missing value on required
    if (required && !isFilled(values[q.key])) {
      report.missingValues.push({
        severity: "error",
        questionKey: q.key,
        label: q.label,
        officialRef: ref,
        message: "Required answer is missing.",
      });
    }
  }

  report.exportReady =
    report.unmappedRequired.length === 0 && report.missingValues.length === 0;

  return report;
}

/** Compact text summary for logs / toasts. */
export function summarizeReport(r: MappingValidationReport): string {
  return [
    `Form ${r.formCode}`,
    `Questions: ${r.mappedQuestions}/${r.totalQuestions} mapped`,
    `Unmapped required: ${r.unmappedRequired.length}`,
    `Missing values: ${r.missingValues.length}`,
    `Export ready: ${r.exportReady ? "YES" : "NO"}`,
  ].join(" · ");
}