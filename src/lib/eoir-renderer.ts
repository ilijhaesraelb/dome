/**
 * D.O.M.E. EOIR Form Renderer
 *
 * EOIR forms (e.g., EOIR-29 Notice of Appeal to the BIA) require special handling:
 * - Dynamic text areas for appeal reasons (long text support)
 * - Auto continuation pages for overflow
 * - Section-based rendering
 * - Different structure than USCIS forms
 *
 * DO NOT treat EOIR forms like USCIS forms.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { resolveDataPath } from "./pdf-template-engine";

export type EOIRFormCode = "EOIR-29" | "EOIR-26" | "EOIR-28" | "EOIR-33";

export interface EOIRFieldDef {
  key: string;
  label: string;
  dataPath: string;
  type: "text" | "checkbox" | "longtext" | "date" | "signature";
  section: string;
  required?: boolean;
}

// ── EOIR-29 Field Definitions ──
const EOIR29_FIELDS: EOIRFieldDef[] = [
  // Section 1: Appellant Information
  { key: "appellant_name", label: "Name of Appellant", dataPath: "applicant.last_name", type: "text", section: "Appellant Information", required: true },
  { key: "appellant_first_name", label: "First Name", dataPath: "applicant.first_name", type: "text", section: "Appellant Information", required: true },
  { key: "appellant_a_number", label: "Alien Registration Number (A#)", dataPath: "applicant.alien_number", type: "text", section: "Appellant Information", required: true },
  { key: "date_of_decision", label: "Date of Immigration Judge's Decision", dataPath: "eoir.date_of_decision", type: "date", section: "Appellant Information" },
  { key: "ij_name", label: "Name of Immigration Judge", dataPath: "eoir.immigration_judge_name", type: "text", section: "Appellant Information" },
  { key: "hearing_location", label: "Hearing Location / Court", dataPath: "eoir.hearing_location", type: "text", section: "Appellant Information" },
  // Section 2: Type of Appeal
  { key: "appeal_from_removal", label: "Appeal from Order of Removal", dataPath: "eoir.appeal_from_removal", type: "checkbox", section: "Type of Appeal" },
  { key: "appeal_from_bond", label: "Appeal from Bond Decision", dataPath: "eoir.appeal_from_bond", type: "checkbox", section: "Type of Appeal" },
  { key: "appeal_other", label: "Other Type of Appeal", dataPath: "eoir.appeal_other_type", type: "text", section: "Type of Appeal" },
  // Section 3: Reasons for Appeal (CRITICAL - long text support)
  { key: "appeal_reasons", label: "Statement of Reasons for Appeal", dataPath: "eoir.appeal_reasons", type: "longtext", section: "Reasons for Appeal", required: true },
  { key: "appeal_additional", label: "Additional Grounds", dataPath: "eoir.appeal_additional_grounds", type: "longtext", section: "Reasons for Appeal" },
  // Section 4: Representation
  { key: "attorney_name", label: "Attorney / Representative Name", dataPath: "preparer.last_name", type: "text", section: "Representation" },
  { key: "attorney_first", label: "Attorney First Name", dataPath: "preparer.first_name", type: "text", section: "Representation" },
  { key: "attorney_bar", label: "Bar Number / EOIR ID", dataPath: "preparer.bar_number", type: "text", section: "Representation" },
  { key: "attorney_phone", label: "Phone", dataPath: "preparer.phone", type: "text", section: "Representation" },
  { key: "attorney_address", label: "Address", dataPath: "preparer.address.street", type: "text", section: "Representation" },
  { key: "attorney_city", label: "City", dataPath: "preparer.address.city", type: "text", section: "Representation" },
  { key: "attorney_state", label: "State", dataPath: "preparer.address.state", type: "text", section: "Representation" },
  { key: "attorney_zip", label: "ZIP", dataPath: "preparer.address.zip", type: "text", section: "Representation" },
  // Section 5: Mailing
  { key: "mailing_street", label: "Mailing Address", dataPath: "applicant.address.street", type: "text", section: "Mailing Address" },
  { key: "mailing_city", label: "City", dataPath: "applicant.address.city", type: "text", section: "Mailing Address" },
  { key: "mailing_state", label: "State", dataPath: "applicant.address.state", type: "text", section: "Mailing Address" },
  { key: "mailing_zip", label: "ZIP Code", dataPath: "applicant.address.zip", type: "text", section: "Mailing Address" },
  // Signature
  { key: "signature_date", label: "Date of Signature", dataPath: "eoir.signature_date", type: "date", section: "Certification" },
];

const EOIR_FIELD_DEFS: Record<string, EOIRFieldDef[]> = {
  "EOIR-29": EOIR29_FIELDS,
};

export const EOIR_FORM_INFO: Record<string, { title: string; totalPages: number }> = {
  "EOIR-29": { title: "Notice of Appeal from a Decision of an Immigration Judge", totalPages: 2 },
};

export function isEOIRForm(formCode: string): boolean {
  return formCode.startsWith("EOIR-");
}

export interface EOIRRenderResult {
  pdfBytes: Uint8Array;
  fieldsFilled: number;
  totalFields: number;
  missingRequired: string[];
}

/**
 * Render an EOIR form with full support for:
 * - Dynamic text areas with auto continuation pages
 * - Checkbox mapping
 * - Section-based layout
 */
export function renderEOIRForm(
  formCode: string,
  caseData: Record<string, unknown>,
): EOIRRenderResult {
  const fields = EOIR_FIELD_DEFS[formCode];
  const formInfo = EOIR_FORM_INFO[formCode];
  if (!fields || !formInfo) {
    throw new Error(`No EOIR definition for ${formCode}`);
  }

  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = w - margin * 2;
  let fieldsFilled = 0;
  const missingRequired: string[] = [];

  // ── Page 1: Form Header ──
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, w, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${formCode}`, w / 2, 15, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(formInfo.title, w / 2, 24, { align: "center" });
  doc.setFontSize(7);
  doc.text("U.S. Department of Justice — Executive Office for Immigration Review", w / 2, 31, { align: "center" });
  doc.setTextColor(0, 0, 0);

  let y = 42;

  // Group by section
  const sections = new Map<string, EOIRFieldDef[]>();
  for (const field of fields) {
    if (!sections.has(field.section)) sections.set(field.section, []);
    sections.get(field.section)!.push(field);
  }

  for (const [section, sectionFields] of sections) {
    // Check if we need a new page
    if (y > h - 60) {
      doc.addPage();
      y = 20;
    }

    // Section header
    doc.setFillColor(230, 235, 245);
    doc.rect(margin, y - 3, contentWidth, 10, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(section.toUpperCase(), margin + 3, y + 4);
    y += 14;

    for (const field of sectionFields) {
      const rawValue = resolveDataPath(caseData, field.dataPath);
      let displayValue = rawValue || "";

      if (field.required && !displayValue) {
        missingRequired.push(field.label);
      }
      if (displayValue) fieldsFilled++;

      if (field.type === "longtext") {
        // ── Long text with auto continuation ──
        if (y > h - 50) { doc.addPage(); y = 20; }

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(`${field.label}${field.required ? " *" : ""}:`, margin, y);
        y += 5;

        if (displayValue) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          const lines = doc.splitTextToSize(displayValue, contentWidth - 4);

          for (let i = 0; i < lines.length; i++) {
            if (y > h - 25) {
              // Add continuation page
              addContinuationFooter(doc, formCode, section);
              doc.addPage();
              y = 20;
              doc.setFontSize(8);
              doc.setFont("helvetica", "italic");
              doc.setTextColor(100, 100, 100);
              doc.text(`${formCode} — ${section} (Continued)`, margin, y);
              doc.setTextColor(0, 0, 0);
              y += 8;
              doc.setFont("helvetica", "normal");
              doc.setFontSize(9);
            }
            doc.text(lines[i], margin + 2, y);
            y += 5;
          }
          y += 3;
        } else {
          // Draw empty lines for handwriting
          doc.setDrawColor(200, 200, 200);
          for (let i = 0; i < 6; i++) {
            doc.line(margin, y + i * 8, w - margin, y + i * 8);
          }
          y += 52;
        }
      } else if (field.type === "checkbox") {
        if (y > h - 30) { doc.addPage(); y = 20; }
        const checked = displayValue && (displayValue.toLowerCase() === "true" || displayValue === "1" || displayValue.toLowerCase() === "yes");
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.rect(margin, y - 3.5, 4, 4);
        if (checked) {
          doc.setFont("helvetica", "bold");
          doc.text("X", margin + 0.5, y);
          doc.setFont("helvetica", "normal");
        }
        doc.text(`  ${field.label}`, margin + 5, y);
        y += 8;
      } else if (field.type === "signature") {
        if (y > h - 40) { doc.addPage(); y = 20; }
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(`${field.label}:`, margin, y);
        y += 3;
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, y + 10, margin + 80, y + 10);
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text("(Signature required — sign before filing)", margin, y + 15);
        y += 22;
      } else {
        // Standard text/date field
        if (y > h - 25) { doc.addPage(); y = 20; }

        const rows = [[
          `${field.label}${field.required ? " *" : ""}`,
          displayValue || "—",
        ]];

        autoTable(doc, {
          startY: y,
          body: rows,
          margin: { left: margin, right: margin },
          styles: { fontSize: 8, cellPadding: 2.5 },
          columnStyles: { 0: { fontStyle: "bold", cellWidth: 65 } },
          theme: "plain",
        });
        y = (doc as any).lastAutoTable.finalY + 2;
      }
    }
    y += 5;
  }

  // Add disclaimer
  if (y > h - 35) { doc.addPage(); y = 20; }
  doc.setDrawColor(200, 170, 50);
  doc.setFillColor(255, 250, 230);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "FD");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.text("IMPORTANT NOTICE", w / 2, y + 6, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.text(
    "This document is prepared for review and must be verified before filing with the Board of Immigration Appeals. D.O.M.E. does not provide legal advice.",
    w / 2, y + 12, { align: "center" },
  );

  // Footer on all pages
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text(
      `${formCode} | Page ${i} of ${total} | Prepared for review — not for direct filing | Generated ${new Date().toLocaleDateString()}`,
      w / 2, h - 8, { align: "center" },
    );
    doc.setTextColor(0, 0, 0);
  }

  return {
    pdfBytes: new Uint8Array(doc.output("arraybuffer")),
    fieldsFilled,
    totalFields: fields.length,
    missingRequired,
  };
}

function addContinuationFooter(doc: jsPDF, formCode: string, section: string) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(120, 120, 120);
  doc.text(`Continued on next page — ${formCode} ${section}`, w / 2, h - 15, { align: "center" });
  doc.setTextColor(0, 0, 0);
}
