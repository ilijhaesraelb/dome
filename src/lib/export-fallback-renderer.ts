/**
 * D.O.M.E. Export Fallback Renderer
 *
 * Generates structured PDF output for forms that fail official template rendering.
 * This is Layer 2 (structured) and Layer 3 (emergency) of the multi-layer export engine.
 *
 * RULE: Export must ALWAYS succeed. A fallback is always better than no export.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FORM_FIELD_MAPPINGS, resolveDataPath, applyTransform, type FieldMapping } from "./pdf-template-engine";

export type FallbackLayer = "structured" | "emergency";

export interface FallbackResult {
  pdfBytes: Uint8Array;
  layer: FallbackLayer;
  fieldsFilled: number;
  totalFields: number;
  formCode: string;
  reason: string;
}

/**
 * Layer 2: Structured Render Fallback
 * Generates a clean, labeled, printable document with all form fields and values.
 */
export function renderStructuredFallback(
  formCode: string,
  formTitle: string,
  caseData: Record<string, unknown>,
  failureReason: string,
): FallbackResult {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const mappings = FORM_FIELD_MAPPINGS[formCode] || [];
  let fieldsFilled = 0;

  // Header banner
  doc.setFillColor(30, 55, 100);
  doc.rect(0, 0, w, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Form ${formCode} — Structured Data Output`, w / 2, 14, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(formTitle, w / 2, 23, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Warning banner
  doc.setDrawColor(200, 100, 50);
  doc.setFillColor(255, 245, 230);
  doc.roundedRect(15, 35, w - 30, 20, 2, 2, "FD");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("TEMPLATE RENDER FAILED — DATA INCLUDED BELOW", w / 2, 43, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(`Reason: ${failureReason}. This data must be transferred to the official form before filing.`, w / 2, 50, { align: "center" });

  let y = 62;

  if (mappings.length > 0) {
    // Group fields by section (derive from internal path prefix)
    const sections = new Map<string, Array<{ label: string; value: string; required: boolean }>>();

    for (const mapping of mappings) {
      const parts = mapping.internalPath.split(".");
      const section = parts[0] || "General";
      const fieldLabel = parts.slice(1).join(" › ") || parts[0];
      const rawValue = resolveDataPath(caseData, mapping.internalPath);
      const value = rawValue ? applyTransform(rawValue, mapping.transform) : "";

      if (value) fieldsFilled++;

      if (!sections.has(section)) sections.set(section, []);
      sections.get(section)!.push({
        label: fieldLabel.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        value: value || "—",
        required: !!mapping.required,
      });
    }

    for (const [section, fields] of sections) {
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(section.replace(/_/g, " ").toUpperCase(), 15, y);
      y += 5;

      const rows = fields.map(f => [
        f.required ? `${f.label} *` : f.label,
        f.value,
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Field", "Value"]],
        body: rows,
        margin: { left: 15, right: 15 },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [30, 55, 100], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 249, 252] },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 } },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  } else {
    // No mappings at all — fall through to emergency
    return renderEmergencyFallback(formCode, formTitle, caseData, failureReason);
  }

  // Footer
  addFallbackFooter(doc, formCode, "structured");

  return {
    pdfBytes: new Uint8Array(doc.output("arraybuffer")),
    layer: "structured",
    fieldsFilled,
    totalFields: mappings.length,
    formCode,
    reason: failureReason,
  };
}

/**
 * Layer 3: Emergency Fallback
 * Dumps all available case data as a readable document.
 */
export function renderEmergencyFallback(
  formCode: string,
  formTitle: string,
  caseData: Record<string, unknown>,
  failureReason: string,
): FallbackResult {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(180, 50, 50);
  doc.rect(0, 0, w, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Form ${formCode} — Emergency Data Export`, w / 2, 14, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(formTitle, w / 2, 23, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // Warning
  doc.setDrawColor(200, 50, 50);
  doc.setFillColor(255, 240, 240);
  doc.roundedRect(15, 35, w - 30, 22, 2, 2, "FD");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("TEMPLATE RENDER FAILED — EMERGENCY DATA DUMP", w / 2, 43, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(`Reason: ${failureReason}. All captured data is displayed below for manual transfer.`, w / 2, 51, { align: "center" });

  let y = 64;
  let fieldsFilled = 0;

  // Flatten case data into readable rows
  const flatEntries: Array<[string, string]> = [];
  function flatten(obj: unknown, prefix: string) {
    if (obj == null) return;
    if (typeof obj === "object" && !Array.isArray(obj)) {
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        flatten(v, prefix ? `${prefix}.${k}` : k);
      }
    } else {
      const val = String(obj);
      if (val && val !== "false" && val !== "") {
        flatEntries.push([prefix, val]);
        fieldsFilled++;
      }
    }
  }
  flatten(caseData, "");

  if (flatEntries.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Data Path", "Value"]],
      body: flatEntries,
      margin: { left: 15, right: 15 },
      styles: { fontSize: 7, cellPadding: 2.5 },
      headStyles: { fillColor: [180, 50, 50], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [255, 248, 248] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 65 } },
    });
  }

  addFallbackFooter(doc, formCode, "emergency");

  return {
    pdfBytes: new Uint8Array(doc.output("arraybuffer")),
    layer: "emergency",
    fieldsFilled,
    totalFields: flatEntries.length,
    formCode,
    reason: failureReason,
  };
}

function addFallbackFooter(doc: jsPDF, formCode: string, layer: FallbackLayer) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    const label = layer === "structured" ? "Structured Fallback" : "Emergency Fallback";
    doc.text(
      `${formCode} | ${label} | Prepared for review — not for direct filing | Generated ${new Date().toLocaleDateString()}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );
    doc.setTextColor(0, 0, 0);
  }
}
