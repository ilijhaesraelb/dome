/**
 * Export Verification — runs sample data through every wired UFE form
 * and confirms that each stamped value lands inside the official widget
 * rect declared in the coordinate table.
 *
 * The check is performed mathematically (no actual PDF render is needed):
 *   1. Resolve the widget rect for each mapped question.
 *   2. Estimate the stamp position used by the overlay renderer
 *      (top-left of the rect with a small inset, matching
 *      `i485-overlay-renderer.ts` and the AcroForm fallback).
 *   3. Fail the field if the estimated stamp box (text width × line
 *      height at the renderer's auto-sized font) escapes the widget
 *      rect on any side.
 *
 * Used by:
 *   - `ExportVerificationPanel` (admin / review surface)
 *   - CI / smoke checks before enabling export for a new form.
 */
import { iterateQuestions, type UFEForm, type UFEQuestion } from "./schema";
import { getUFEForm } from "./registry";
import { I485_OVERLAY_FIELDS } from "@/lib/i485-overlay-coords";
import {
  TEMPLATE_OVERLAY_COORDS,
  type TemplateOverlayField,
} from "@/lib/pdf-template-coordinates";

/** Rect = [x0, y0, x1, y1] in PDF user-space (lower-left origin). */
export type Rect = [number, number, number, number];

export interface VerificationField {
  key: string;
  label: string;
  page: number | null;
  widgetName: string | null;
  widgetRect: Rect | null;
  /** The bounding box the renderer would actually paint into. */
  stampRect: Rect | null;
  /** Inches of overflow per side; 0 means clean. */
  overflow: { left: number; right: number; top: number; bottom: number };
  status: "ok" | "warning" | "error" | "unmapped";
  message: string;
}

export interface VerificationReport {
  formCode: string;
  totalQuestions: number;
  mapped: number;
  okCount: number;
  warningCount: number;
  errorCount: number;
  unmappedCount: number;
  fields: VerificationField[];
}

/* ─────────── widget resolution (mirrors UFECoordinateMapPanel) ─────────── */

const i485Index = new Map(I485_OVERLAY_FIELDS.map((f) => [f.name, f]));

function resolveWidget(
  formCode: string,
  widgetName: string,
): { page: number; rect: Rect } | null {
  if (formCode === "I-485") {
    const o = i485Index.get(widgetName);
    return o ? { page: o.page, rect: o.rect } : null;
  }
  const table = TEMPLATE_OVERLAY_COORDS[formCode];
  const c: TemplateOverlayField | undefined = table?.[widgetName];
  return c ? { page: c.page, rect: c.rect } : null;
}

function widgetNameOf(q: UFEQuestion): string | null {
  if (q.mapping.kind === "overlay") return q.mapping.coordKey;
  if (q.mapping.kind === "acroform") return q.mapping.pdfFieldName;
  return null;
}

/* ─────────── renderer-equivalent stamp estimation ─────────── */

/**
 * Mirror of the I-485 overlay renderer: 6–10pt Helvetica, auto-sized
 * to fit, stamped from the top-left of the widget with a 2pt inset.
 */
const HELVETICA_AVG_CHAR_WIDTH = 0.5; // em (Helvetica avg)
const PT_INSET = 2;

function estimateStamp(rect: Rect, raw: unknown): Rect {
  const [x0, y0, x1, y1] = rect;
  const widgetW = Math.max(1, x1 - x0);
  const widgetH = Math.max(1, y1 - y0);
  const text = String(raw ?? "");
  // Auto font sizing identical to overlay renderer.
  const maxFont = Math.min(10, widgetH - 2);
  const minFont = 6;
  const fitFont = Math.min(
    maxFont,
    Math.max(
      minFont,
      (widgetW - PT_INSET * 2) /
        Math.max(1, text.length * HELVETICA_AVG_CHAR_WIDTH),
    ),
  );
  const textW = text.length * fitFont * HELVETICA_AVG_CHAR_WIDTH;
  const textH = fitFont;
  const stampX0 = x0 + PT_INSET;
  const stampY1 = y1 - PT_INSET; // top in PDF user space
  const stampX1 = stampX0 + textW;
  const stampY0 = stampY1 - textH;
  return [stampX0, stampY0, stampX1, stampY1];
}

function overflowOf(stamp: Rect, widget: Rect) {
  return {
    left: Math.max(0, widget[0] - stamp[0]),
    bottom: Math.max(0, widget[1] - stamp[1]),
    right: Math.max(0, stamp[2] - widget[2]),
    top: Math.max(0, stamp[3] - widget[3]),
  };
}

/* ─────────── sample data ─────────── */

const GENERIC_SAMPLE: Record<string, unknown> = {
  first_name: "Maria",
  middle_name: "Elena",
  last_name: "Rodriguez-Garcia",
  date_of_birth: "1990-04-15",
  country_of_birth: "Mexico",
  alien_number: "A123456789",
  ssn: "123-45-6789",
  current_address: "1234 West Adams Boulevard",
  city: "Los Angeles",
  state: "CA",
  zip: "90018",
  marital_status: "Married",
  employer: "Acme Corporation",
  occupation: "Software Engineer",
  date_became_resident: "2020-06-01",
  petitioner_date_of_marriage: "2018-09-22",
  petitioner_marriage_city: "Las Vegas",
  petitioner_marriage_state: "NV",
  petitioner_marriage_country: "United States",
  petitioner_marital_status: "Married",
  petitioner_last_name: "Johnson",
  petitioner_first_name: "Robert",
  petitioner_dob: "1988-11-03",
  petitioner_ssn: "987-65-4321",
  joint_lease_or_mortgage: "Yes",
  joint_bank_accounts: "Yes",
  joint_tax_returns: "Yes",
  children_together: "1",
  vaccination_record_available: "Yes",
  mental_health_conditions: "No",
  substance_abuse_history: "No",
};

/** Sample value generator — falls back to type-aware defaults. */
export function sampleValueFor(q: UFEQuestion): unknown {
  if (GENERIC_SAMPLE[q.key] !== undefined) return GENERIC_SAMPLE[q.key];
  switch (q.type) {
    case "date":
      return "2024-01-15";
    case "yesno":
      return "Yes";
    case "checkbox":
      return true;
    case "number":
      return "1";
    case "ssn":
      return "123-45-6789";
    case "alien_number":
      return "A123456789";
    case "email":
      return "[email protected]";
    case "phone":
      return "555-0100";
    case "select":
    case "radio":
      return q.options?.[0] ?? "Other";
    default:
      return "Sample";
  }
}

/* ─────────── verifier ─────────── */

export function verifyFormExport(form: UFEForm): VerificationReport {
  const fields: VerificationField[] = [];
  let mapped = 0;
  let okCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let unmappedCount = 0;

  for (const q of iterateQuestions(form)) {
    const widgetName = widgetNameOf(q);
    if (!widgetName) {
      unmappedCount++;
      fields.push({
        key: q.key,
        label: q.label,
        page: null,
        widgetName: null,
        widgetRect: null,
        stampRect: null,
        overflow: { left: 0, right: 0, top: 0, bottom: 0 },
        status: "unmapped",
        message: "No widget mapping",
      });
      continue;
    }
    const w = resolveWidget(form.code, widgetName);
    if (!w) {
      errorCount++;
      fields.push({
        key: q.key,
        label: q.label,
        page: null,
        widgetName,
        widgetRect: null,
        stampRect: null,
        overflow: { left: 0, right: 0, top: 0, bottom: 0 },
        status: "error",
        message: "Widget name not found in coordinate table",
      });
      continue;
    }
    mapped++;
    const value = sampleValueFor(q);
    const stamp = estimateStamp(w.rect, value);
    const o = overflowOf(stamp, w.rect);
    const totalOverflow = o.left + o.right + o.top + o.bottom;
    let status: VerificationField["status"] = "ok";
    let message = "Within widget bounds";
    if (totalOverflow > 0.5 && totalOverflow <= 4) {
      status = "warning";
      message = `Stamp overflows widget by ${totalOverflow.toFixed(1)}pt`;
      warningCount++;
    } else if (totalOverflow > 4) {
      status = "error";
      message = `Stamp escapes widget by ${totalOverflow.toFixed(1)}pt`;
      errorCount++;
    } else {
      okCount++;
    }
    fields.push({
      key: q.key,
      label: q.label,
      page: w.page + 1,
      widgetName,
      widgetRect: w.rect,
      stampRect: stamp,
      overflow: o,
      status,
      message,
    });
  }

  return {
    formCode: form.code,
    totalQuestions: fields.length,
    mapped,
    okCount,
    warningCount,
    errorCount,
    unmappedCount,
    fields,
  };
}

/** Forms covered by the export verification checklist. */
export const VERIFICATION_TARGET_CODES = ["I-765", "N-400", "I-751", "I-693"];

export function verifyTargetForms(): VerificationReport[] {
  return VERIFICATION_TARGET_CODES.map((code) => getUFEForm(code))
    .filter((f): f is UFEForm => !!f)
    .map(verifyFormExport);
}