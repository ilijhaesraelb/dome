/**
 * I-485 Coordinate-Overlay Renderer
 *
 * The official USCIS I-485 PDF is XFA-only — pdf-lib cannot fill its
 * AcroForm widgets directly. This renderer instead loads the flattened
 * `/templates/i-485.pdf` as a static background and stamps each answer
 * at the exact (x, y, page) coordinates extracted from the original
 * widget annotations (see `i485-overlay-coords.ts`, 736 widgets / 24 pages).
 *
 * Internal data flow:
 *   internal field.key
 *     → FIELD_KEY_TO_DATA_PATH (dot path into rawCaseDataObj)
 *     → resolved string value
 *     → I485_KEY_TO_OVERLAY (XFA name)
 *     → I485_OVERLAY_FIELDS (page + rect)
 *     → drawn as Helvetica text or ✓ checkmark
 *
 * Returns a `FillResult`-shaped object so packet-assembler can treat it
 * exactly like a regular template-fill result.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  FIELD_KEY_TO_DATA_PATH,
  FORM_SECTIONS,
  type FormFieldDef,
  type FormSection,
} from "@/data/formSections";
import { I485_KEY_TO_OVERLAY } from "./ufe/i485-key-map";
import { I485_OVERLAY_FIELDS, type I485OverlayField } from "./i485-overlay-coords";
import { resolveDataPath, applyTransform, type FillResult } from "./pdf-template-engine";

const TEMPLATE_PATH = "/templates/i-485.pdf";

/** Index overlay fields by XFA name for O(1) lookup. */
const OVERLAY_INDEX: Map<string, I485OverlayField> = new Map(
  I485_OVERLAY_FIELDS.map((f) => [f.name, f]),
);

/** All I-485 internal field defs — used to detect required + type. */
function collectI485Fields(): FormFieldDef[] {
  const sections = (FORM_SECTIONS as Record<string, FormSection[]>)["I-485"] ?? [];
  const out: FormFieldDef[] = [];
  for (const s of sections) for (const f of s.fields) out.push(f);
  return out;
}

/** Format a value for stamping based on the internal field type. */
function formatForStamp(value: string, field: FormFieldDef | undefined): string {
  if (!value) return "";
  if (field?.type === "date") {
    return applyTransform(value, "date_mmddyyyy");
  }
  return value;
}

/** Decide if a checkbox-type overlay should be ticked given the user's value. */
function shouldTickCheckbox(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "y" || v === "checked" || v === "on";
}

/** Pick a font size that will fit the available rect width for the given text. */
function pickFontSize(text: string, rectWidth: number): number {
  // Heuristic: avg glyph width ≈ 0.55 * fontSize for Helvetica.
  for (const size of [10, 9, 8, 7, 6]) {
    const estWidth = text.length * size * 0.55;
    if (estWidth <= rectWidth - 4) return size;
  }
  return 6;
}

/**
 * Render the I-485 overlay PDF.
 *
 * @param rawCaseDataObj  Flat case data object (same shape as buildCaseDataObject output).
 * @returns FillResult-compatible payload with stamped/skipped counts.
 */
export async function renderI485Overlay(
  rawCaseDataObj: Record<string, unknown>,
): Promise<FillResult> {
  // 1. Load flattened template.
  const res = await fetch(TEMPLATE_PATH);
  if (!res.ok) {
    throw new Error(`I-485 template not reachable at ${TEMPLATE_PATH} (HTTP ${res.status})`);
  }
  const templateBytes = await res.arrayBuffer();
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const fields = collectI485Fields();
  const fieldByKey = new Map(fields.map((f) => [f.key, f]));

  const filledFields: string[] = [];
  const missingRequired: string[] = [];
  const unmappedPdfFields: string[] = [];
  let totalFields = 0;
  let mappedFields = 0;

  // 2. Walk every internal I-485 field and stamp if we can.
  for (const field of fields) {
    totalFields++;

    const overlayName = I485_KEY_TO_OVERLAY[field.key];
    if (!overlayName) {
      // No coord mapping yet — collect for diagnostics.
      if (field.required) missingRequired.push(field.key);
      continue;
    }

    const overlay = OVERLAY_INDEX.get(overlayName);
    if (!overlay) {
      unmappedPdfFields.push(overlayName);
      if (field.required) missingRequired.push(field.key);
      continue;
    }

    mappedFields++;

    // Resolve the value via data-path map.
    const dataPath = FIELD_KEY_TO_DATA_PATH[field.key];
    const rawValue = dataPath ? resolveDataPath(rawCaseDataObj, dataPath) : undefined;

    if (rawValue == null || rawValue === "") {
      if (field.required) missingRequired.push(field.key);
      continue;
    }

    const valueStr = String(rawValue);
    const page = pages[overlay.page];
    if (!page) continue;

    const [x0, y0, x1, y1] = overlay.rect;
    const rectWidth = x1 - x0;
    const rectHeight = y1 - y0;

    // 3. Stamp according to overlay widget type.
    if (overlay.type === "checkbox") {
      if (shouldTickCheckbox(valueStr)) {
        // Draw a clean ✓ glyph centred in the box.
        const size = Math.min(rectHeight, rectWidth) * 0.9;
        page.drawText("X", {
          x: x0 + (rectWidth - size * 0.55) / 2,
          y: y0 + (rectHeight - size * 0.7) / 2,
          size,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        filledFields.push(field.key);
      }
      continue;
    }

    // text / dropdown — draw inline.
    const display = formatForStamp(valueStr, field);
    if (!display) continue;

    const fontSize = pickFontSize(display, rectWidth);
    // Vertical centre: lower-left baseline ≈ rect bottom + (rectHeight - fontSize) / 2 + 2pt for descender.
    const baselineY = y0 + (rectHeight - fontSize) / 2 + 2;
    page.drawText(display, {
      x: x0 + 2, // 2pt inset from left
      y: baselineY,
      size: fontSize,
      font: helvetica,
      color: rgb(0, 0, 0),
      maxWidth: rectWidth - 4,
    });
    filledFields.push(field.key);
  }

  // 4. Footer: mark every page so downstream reviewers know this is a D.O.M.E. render.
  for (const page of pages) {
    const { width } = page.getSize();
    page.drawText("Prepared by D.O.M.E. — overlay render — review before filing", {
      x: 36,
      y: 12,
      size: 6,
      font: helvetica,
      color: rgb(0.55, 0.55, 0.55),
      maxWidth: width - 72,
    });
  }

  const pdfBytes = await pdfDoc.save();

  return {
    pdfBytes: new Uint8Array(pdfBytes),
    filledFields,
    missingRequired,
    totalFields,
    mappedFields,
    unmappedPdfFields,
  };
}

/** Number of I-485 internal fields that currently have a coordinate mapping. */
export function i485OverlayCoverage(): { mapped: number; total: number } {
  const fields = collectI485Fields();
  let mapped = 0;
  for (const f of fields) {
    if (I485_KEY_TO_OVERLAY[f.key] && OVERLAY_INDEX.has(I485_KEY_TO_OVERLAY[f.key])) {
      mapped++;
    }
  }
  return { mapped, total: fields.length };
}

// Suppress unused-warning for fieldByKey when in production builds; reserved for
// future per-field validation diagnostics.
void collectI485Fields;