/**
 * D.O.M.E. Packet Assembler
 * 
 * Assembles professional immigration packets by merging:
 * 1. Shell pages (cover, TOC, summary) via jsPDF
 * 2. Real USCIS form pages via pdf-lib template filling (Layer 1)
 * 3. Structured fallback for failed templates (Layer 2)
 * 4. Emergency fallback as last resort (Layer 3)
 * 
 * RULE: Export must ALWAYS succeed. Never block export entirely.
 * COMPLIANCE: All output is "prepared for review" — not for direct filing.
 */

import { PDFDocument } from "pdf-lib";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fillPdfTemplate, TEMPLATE_REGISTRY, buildCaseDataObject, type FillResult } from "./pdf-template-engine";
import { renderStructuredFallback, renderEmergencyFallback, type FallbackResult } from "./export-fallback-renderer";
import { isEOIRForm, renderEOIRForm, EOIR_FORM_INFO } from "./eoir-renderer";
import { renderI485Overlay } from "./i485-overlay-renderer";
import { logPlatformError } from "./error-logger";

export interface PacketConfig {
  includeCover: boolean;
  includeTOC: boolean;
  includeSummary: boolean;
  includeReviewNotes: boolean;
  reviewNotes: string;
  downloadMode: "full" | "forms_only" | "docs_only";
}

export interface PacketCaseData {
  clientName: string;
  caseNumber: string;
  caseType: string;
  displayName: string;
  readiness: number;
  applicantDob: string;
  applicantCob: string;
  applicantANumber: string;
  mailingAddress: string;
}

export interface PacketFormEntry {
  formType: string;
  formName: string;
  status: string;
  progress: number;
}

export interface PacketDocEntry {
  name: string;
  category: string;
  fileType: string;
  createdAt: string;
}

export type TemplateStatus =
  | "ready"
  | "partial"
  | "fallback_structured"
  | "fallback_emergency"
  | "eoir_rendered"
  | "overlay_stamped";

export interface FormExportResult {
  formType: string;
  templateStatus: TemplateStatus;
  fillResult?: FillResult;
  fallbackResult?: FallbackResult;
  pageCount: number;
  warnings: string[];
}

export interface ValidationResult {
  canExport: boolean;
  missingFields: string[];
  warnings: string[];
  formResults: Record<string, FillResult>;
  formExportResults: Record<string, FormExportResult>;
  unmappedForms: string[];
}

// Excluded categories for non-case assets  
const EXCLUDED_DOC_CATEGORIES = ["branding", "system", "logo", "template"];

/** Filter out non-case assets from documents */
export function filterCaseEvidence(docs: PacketDocEntry[]): PacketDocEntry[] {
  return docs.filter(d => {
    const catLower = d.category.toLowerCase();
    return !EXCLUDED_DOC_CATEGORIES.some(ex => catLower.includes(ex));
  });
}

/** Hard validation gate — checks required fields before export.
 *  NOTE: This NO LONGER blocks export for template failures. */
export function validateForExport(
  caseData: PacketCaseData,
  forms: PacketFormEntry[],
  docs: PacketDocEntry[],
  formFillResults: Record<string, FillResult>,
): ValidationResult {
  const missingFields: string[] = [];
  const warnings: string[] = [];
  const unmappedForms: string[] = [];
  const formExportResults: Record<string, FormExportResult> = {};

  // Core identity validation
  if (!caseData.clientName || caseData.clientName.trim() === "" || caseData.clientName.trim() === "—") {
    missingFields.push("Applicant Full Legal Name");
  }
  if (!caseData.applicantDob) missingFields.push("Date of Birth");
  if (!caseData.applicantCob) missingFields.push("Country of Birth");
  if (!caseData.mailingAddress || caseData.mailingAddress === "—") missingFields.push("Mailing Address");
  if (!caseData.caseType) missingFields.push("Case Type");

  // Check each form's fill result — but DO NOT block export
  for (const form of forms) {
    const result = formFillResults[form.formType];

    if (isEOIRForm(form.formType)) {
      formExportResults[form.formType] = {
        formType: form.formType,
        templateStatus: "eoir_rendered",
        pageCount: EOIR_FORM_INFO[form.formType]?.totalPages || 2,
        warnings: [],
      };
      continue;
    }

    if (!result) {
      if (TEMPLATE_REGISTRY[form.formType]) {
        warnings.push(`Form ${form.formType} has not been validated yet`);
        formExportResults[form.formType] = {
          formType: form.formType,
          templateStatus: "ready",
          pageCount: TEMPLATE_REGISTRY[form.formType].totalPages,
          warnings: [],
        };
      } else {
        // No template — will use fallback
        formExportResults[form.formType] = {
          formType: form.formType,
          templateStatus: "fallback_structured",
          pageCount: 1,
          warnings: [`${form.formType}: No official template — will export as structured data`],
        };
        warnings.push(`${form.formType}: No official template — structured fallback will be used`);
      }
      continue;
    }

    if (result.missingRequired.length > 0) {
      // Still report missing fields but as warnings, not blockers
      warnings.push(...result.missingRequired.map(f => `${form.formType}: Missing ${f.replace(/\./g, " › ")}`));
    }

    formExportResults[form.formType] = {
      formType: form.formType,
      templateStatus: result.missingRequired.length === 0 ? "ready" : "partial",
      fillResult: result,
      pageCount: TEMPLATE_REGISTRY[form.formType]?.totalPages || 1,
      warnings: result.missingRequired.map(f => `Missing: ${f}`),
    };
  }

  // Document validation
  if (docs.length === 0) warnings.push("No supporting documents uploaded");

  return {
    canExport: missingFields.length === 0,
    missingFields,
    warnings,
    formResults: formFillResults,
    formExportResults,
    unmappedForms,
  };
}

/** Calculate accurate readiness score */
export function calculateReadiness(
  caseData: PacketCaseData,
  forms: PacketFormEntry[],
  docs: PacketDocEntry[],
): number {
  let total = 0;
  let completed = 0;

  // Identity fields (weight 30%)
  const identityFields = [
    !!caseData.clientName && caseData.clientName.trim() !== "" && caseData.clientName.trim() !== "—",
    !!caseData.applicantDob,
    !!caseData.applicantCob,
    !!caseData.mailingAddress && caseData.mailingAddress !== "—",
  ];
  total += 30;
  completed += (identityFields.filter(Boolean).length / identityFields.length) * 30;

  // Forms completion (weight 40%)
  if (forms.length > 0) {
    total += 40;
    const readyStatuses = new Set(["completed", "ready_for_review", "submitted", "approved"]);
    const readyCount = forms.filter(f => readyStatuses.has(f.status) || f.progress >= 100).length;
    completed += (readyCount / forms.length) * 40;
  }

  // Documents (weight 20%)
  total += 20;
  if (docs.length > 0) completed += 20;

  // Case type (weight 10%)
  total += 10;
  if (caseData.caseType) completed += 10;

  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

/** Generate the shell PDF (cover, TOC, summary) as bytes */
function generateShellPdf(
  config: PacketConfig,
  caseData: PacketCaseData,
  forms: PacketFormEntry[],
  docs: PacketDocEntry[],
  formPageCounts: Record<string, number>,
  formStatuses: Record<string, TemplateStatus>,
): Uint8Array {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  let isFirstPage = true;

  const addPage = () => {
    if (!isFirstPage) doc.addPage();
    isFirstPage = false;
  };

  // 1. Cover Page
  if (config.includeCover) {
    addPage();
    doc.setFillColor(30, 55, 100);
    doc.rect(0, 0, w, 45, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Immigration Application Packet", w / 2, 22, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Prepared by D.O.M.E. — Digital Onboarding for Migration Ease", w / 2, 34, { align: "center" });
    doc.setTextColor(0, 0, 0);

    const info = [
      ["Applicant Name", caseData.clientName || "—"],
      ["Case Type", caseData.caseType || "—"],
      ["Case Number", caseData.caseNumber || "—"],
      ["Prepared Date", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
      ["Prepared By", caseData.displayName || caseData.clientName || "Client"],
      ["Forms Included", `${forms.length} form(s)`],
      ["Documents Included", `${docs.length} document(s)`],
    ];

    autoTable(doc, {
      startY: 60,
      body: info,
      margin: { left: 30, right: 30 },
      styles: { fontSize: 11, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
      theme: "plain",
    });
    const y = (doc as any).lastAutoTable.finalY + 15;

    // Disclaimer
    doc.setDrawColor(200, 170, 50);
    doc.setFillColor(255, 250, 230);
    doc.roundedRect(25, y, w - 50, 28, 3, 3, "FD");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("IMPORTANT NOTICE", w / 2, y + 8, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const notice = "This packet has been prepared for review. Please verify all information, signatures, and filing requirements before submission. D.O.M.E. does not provide legal advice and does not guarantee acceptance by any government agency.";
    const lines = doc.splitTextToSize(notice, w - 60);
    doc.text(lines, w / 2, y + 14, { align: "center" });
  }

  // 2. Table of Contents
  if (config.includeTOC) {
    addPage();
    let y = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("TABLE OF CONTENTS", w / 2, y, { align: "center" });
    y += 12;

    const tocItems: Array<[string, string, string]> = [];
    let pageNum = (config.includeCover ? 1 : 0) + 1 + 1;

    if (config.includeSummary) {
      tocItems.push(["Case Summary", "Overview of applicant and case details", `${pageNum}`]);
      pageNum++;
    }

    for (const form of forms) {
      const pages = formPageCounts[form.formType] || 0;
      const status = formStatuses[form.formType] || "ready";
      const statusLabel = status === "ready" ? "official layout"
        : status === "partial" ? "official layout (partial)"
        : status === "overlay_stamped" ? "official layout (overlay)"
        : status === "eoir_rendered" ? "EOIR structured"
        : status === "fallback_structured" ? "structured fallback"
        : "emergency fallback";

      if (pages > 0) {
        tocItems.push([`Form ${form.formType}`, `${form.formName} (${pages} pg — ${statusLabel})`, `${pageNum}`]);
        pageNum += pages;
      }
    }

    if (docs.length > 0) {
      tocItems.push(["Supporting Evidence", `${docs.length} document(s)`, `${pageNum}`]);
    }

    autoTable(doc, {
      startY: y,
      head: [["Section", "Description", "Page"]],
      body: tocItems,
      margin: { left: 25, right: 25 },
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [30, 55, 100], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
  }

  // 3. Case Summary
  if (config.includeSummary) {
    addPage();
    let y = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("CASE SUMMARY", w / 2, y, { align: "center" });
    y += 12;

    autoTable(doc, {
      startY: y,
      head: [["Field", "Value"]],
      body: [
        ["Applicant Name", caseData.clientName],
        ["Date of Birth", caseData.applicantDob || "—"],
        ["Country of Birth", caseData.applicantCob || "—"],
        ["A-Number", caseData.applicantANumber || "—"],
        ["Case Type", caseData.caseType || "—"],
        ["Case Number", caseData.caseNumber || "—"],
        ["Mailing Address", caseData.mailingAddress || "—"],
      ],
      margin: { left: 25, right: 25 },
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [30, 55, 100], textColor: [255, 255, 255] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Forms table with template status
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Included Forms", 25, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      head: [["#", "Form", "Name", "Render Mode"]],
      body: forms.map((f, i) => {
        const status = formStatuses[f.formType] || "fallback_structured";
        const label = status === "ready" ? "Official template — filled"
          : status === "partial" ? "Official template — partial"
          : status === "overlay_stamped" ? "Official template — coordinate overlay"
          : status === "eoir_rendered" ? "EOIR structured render"
          : status === "fallback_structured" ? "Structured data fallback"
          : "Emergency data fallback";
        return [`${i + 1}`, f.formType, f.formName, label];
      }),
      margin: { left: 25, right: 25 },
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 55, 100], textColor: [255, 255, 255] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    // Evidence table
    if (docs.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Supporting Documents", 25, y);
      y += 6;
      autoTable(doc, {
        startY: y,
        head: [["#", "Document", "Category", "Uploaded"]],
        body: docs.map((d, i) => [
          `${i + 1}`, d.name, d.category, new Date(d.createdAt).toLocaleDateString(),
        ]),
        margin: { left: 25, right: 25 },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [30, 55, 100], textColor: [255, 255, 255] },
      });
    }
  }

  // Evidence listing page
  if (config.downloadMode !== "forms_only" && docs.length > 0) {
    addPage();
    let y = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SUPPORTING EVIDENCE", w / 2, y, { align: "center" });
    y += 12;

    const categories = Array.from(new Set(docs.map(d => d.category)));
    categories.forEach(cat => {
      if (y > doc.internal.pageSize.getHeight() - 50) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(cat.toUpperCase(), 25, y);
      y += 6;
      const catDocs = docs.filter(d => d.category === cat);
      autoTable(doc, {
        startY: y,
        head: [["#", "Document", "Type", "Upload Date"]],
        body: catDocs.map((d, i) => [`${i + 1}`, d.name, d.fileType || "—", new Date(d.createdAt).toLocaleDateString()]),
        margin: { left: 25, right: 25 },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [30, 55, 100], textColor: [255, 255, 255] },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    });
  }

  // Review notes
  if (config.includeReviewNotes && config.reviewNotes.trim()) {
    addPage();
    let y = 20;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("REVIEW NOTES", w / 2, y, { align: "center" });
    y += 12;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    doc.text("This section is for internal review only and should not be included in final filing.", 25, y);
    doc.setTextColor(0, 0, 0);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(config.reviewNotes, w - 50);
    doc.text(noteLines, 25, y);
  }

  // Footer on all shell pages
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text(
      `${caseData.caseNumber} | Prepared for review — not for direct filing | Generated ${new Date().toLocaleDateString()}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

/**
 * Multi-Layer Export Engine
 * 
 * Layer 1: Official Template Render (pdf-lib)
 * Layer 2: Structured Render Fallback (jsPDF)
 * Layer 3: Emergency Fallback (jsPDF data dump)
 * 
 * RULE: Export ALWAYS succeeds using the highest available layer.
 */
export async function assemblePacket(
  config: PacketConfig,
  caseData: PacketCaseData,
  rawCaseDataObj: Record<string, unknown>,
  forms: PacketFormEntry[],
  docs: PacketDocEntry[],
): Promise<{
  pdfBytes: Uint8Array;
  formResults: Record<string, FillResult>;
  formExportResults: Record<string, FormExportResult>;
  fileName: string;
  warnings: string[];
}> {
  const formResults: Record<string, FillResult> = {};
  const formExportResults: Record<string, FormExportResult> = {};
  const formPdfDocs: Array<{ formType: string; doc: PDFDocument }> = [];
  const formPageCounts: Record<string, number> = {};
  const formStatuses: Record<string, TemplateStatus> = {};
  const warnings: string[] = [];

  const formsToFill = config.downloadMode === "docs_only" ? [] : forms;

  // Step 1: Process each form through the multi-layer engine
  for (const form of formsToFill) {
    try {
      // Check if EOIR form — use special renderer
      if (isEOIRForm(form.formType)) {
        const eoirResult = renderEOIRForm(form.formType, rawCaseDataObj);
        const eoirDoc = await PDFDocument.load(eoirResult.pdfBytes);
        formPdfDocs.push({ formType: form.formType, doc: eoirDoc });
        formPageCounts[form.formType] = eoirDoc.getPageCount();
        formStatuses[form.formType] = "eoir_rendered";
        formExportResults[form.formType] = {
          formType: form.formType,
          templateStatus: "eoir_rendered",
          pageCount: eoirDoc.getPageCount(),
          warnings: eoirResult.missingRequired.map(f => `Missing: ${f}`),
        };
        if (eoirResult.missingRequired.length > 0) {
          warnings.push(`${form.formType}: ${eoirResult.missingRequired.length} field(s) missing — exported with blanks`);
        }
        continue;
      }

      // I-485 — XFA-only template, route to coordinate-overlay renderer instead of Layer 1.
      if (form.formType === "I-485") {
        try {
          const overlayResult = await renderI485Overlay(rawCaseDataObj);
          formResults[form.formType] = overlayResult;
          const overlayDoc = await PDFDocument.load(overlayResult.pdfBytes);
          formPdfDocs.push({ formType: form.formType, doc: overlayDoc });
          formPageCounts[form.formType] = overlayDoc.getPageCount();
          formStatuses[form.formType] = "overlay_stamped";
          formExportResults[form.formType] = {
            formType: form.formType,
            templateStatus: "overlay_stamped",
            fillResult: overlayResult,
            pageCount: overlayDoc.getPageCount(),
            warnings: overlayResult.missingRequired.map(f => `Missing: ${f}`),
          };
          if (overlayResult.missingRequired.length > 0) {
            warnings.push(`I-485: ${overlayResult.missingRequired.length} field(s) missing or unmapped — exported with blanks`);
          }
          continue;
        } catch (overlayErr: any) {
          console.warn("I-485 overlay render failed:", overlayErr?.message);
          warnings.push(`I-485: Overlay render failed — falling back to structured render. Reason: ${overlayErr?.message}`);
          logPlatformError({
            type: "export_failure",
            severity: "high",
            message: `I-485 overlay render failed: ${overlayErr?.message || "Unknown error"}`,
            details: { formType: "I-485", caseNumber: caseData.caseNumber, layer: "overlay_to_2_fallback" },
          });
          // Fall through to structured fallback below.
        }
      }

      // Layer 1: Try official template render
      // (Skip for I-485 — XFA-only, already handled above; falls through to Layer 2 if overlay failed.)
      if (TEMPLATE_REGISTRY[form.formType] && form.formType !== "I-485") {
        try {
          const result = await fillPdfTemplate(form.formType, rawCaseDataObj);
          formResults[form.formType] = result;
          const filledDoc = await PDFDocument.load(result.pdfBytes);
          formPdfDocs.push({ formType: form.formType, doc: filledDoc });
          formPageCounts[form.formType] = filledDoc.getPageCount();

          const status: TemplateStatus = result.missingRequired.length === 0 ? "ready" : "partial";
          formStatuses[form.formType] = status;
          formExportResults[form.formType] = {
            formType: form.formType,
            templateStatus: status,
            fillResult: result,
            pageCount: filledDoc.getPageCount(),
            warnings: result.missingRequired.map(f => `Missing: ${f}`),
          };

          if (result.missingRequired.length > 0) {
            warnings.push(`${form.formType}: ${result.missingRequired.length} required field(s) missing — exported with blanks`);
          }
          continue; // Success — move to next form
        } catch (templateErr: any) {
          // Layer 1 failed — fall through to Layer 2
          console.warn(`Layer 1 failed for ${form.formType}:`, templateErr.message);
          warnings.push(`${form.formType}: Official template render failed — using structured fallback. Reason: ${templateErr.message}`);

          logPlatformError({
            type: "export_failure",
            severity: "high",
            message: `Template fill failed for ${form.formType}, falling back to structured render: ${templateErr?.message || "Unknown error"}`,
            details: { formType: form.formType, caseNumber: caseData.caseNumber, layer: "1_to_2_fallback" },
          });
        }
      }

      // Layer 2: Structured Render Fallback
      try {
        const formTitle = TEMPLATE_REGISTRY[form.formType]?.formTitle || form.formName;
        const reason = TEMPLATE_REGISTRY[form.formType]
          ? "Official template rendering failed"
          : "No official template available";

        const fallback = renderStructuredFallback(form.formType, formTitle, rawCaseDataObj, reason);
        const fallbackDoc = await PDFDocument.load(fallback.pdfBytes);
        formPdfDocs.push({ formType: form.formType, doc: fallbackDoc });
        formPageCounts[form.formType] = fallbackDoc.getPageCount();
        formStatuses[form.formType] = "fallback_structured";
        formExportResults[form.formType] = {
          formType: form.formType,
          templateStatus: "fallback_structured",
          fallbackResult: fallback,
          pageCount: fallbackDoc.getPageCount(),
          warnings: [`Rendered as structured data fallback: ${reason}`],
        };
        continue;
      } catch (structuredErr: any) {
        // Layer 2 failed — fall through to Layer 3
        console.warn(`Layer 2 failed for ${form.formType}:`, structuredErr.message);
        warnings.push(`${form.formType}: Structured fallback also failed — using emergency data dump`);
      }

      // Layer 3: Emergency Fallback — this MUST NOT fail
      try {
        const formTitle = form.formName || form.formType;
        const fallback = renderEmergencyFallback(form.formType, formTitle, rawCaseDataObj, "All rendering layers failed");
        const emergencyDoc = await PDFDocument.load(fallback.pdfBytes);
        formPdfDocs.push({ formType: form.formType, doc: emergencyDoc });
        formPageCounts[form.formType] = emergencyDoc.getPageCount();
        formStatuses[form.formType] = "fallback_emergency";
        formExportResults[form.formType] = {
          formType: form.formType,
          templateStatus: "fallback_emergency",
          fallbackResult: fallback,
          pageCount: emergencyDoc.getPageCount(),
          warnings: ["Emergency data dump — all rendering layers failed"],
        };
      } catch (emergencyErr: any) {
        // Even emergency failed — log but continue (form just won't be in packet)
        console.error(`All 3 layers failed for ${form.formType}:`, emergencyErr.message);
        formPageCounts[form.formType] = 0;
        formStatuses[form.formType] = "fallback_emergency";
        warnings.push(`${form.formType}: CRITICAL — all export layers failed. Form excluded from packet.`);

        logPlatformError({
          type: "export_failure",
          severity: "critical",
          message: `All 3 export layers failed for ${form.formType}: ${emergencyErr?.message}`,
          details: { formType: form.formType, caseNumber: caseData.caseNumber },
        });
      }
    } catch (outerErr: any) {
      // Catch-all — never let a single form crash the entire export
      console.error(`Unexpected error processing ${form.formType}:`, outerErr);
      formPageCounts[form.formType] = 0;
      warnings.push(`${form.formType}: Unexpected error — form excluded from packet`);
    }
  }

  // Step 2: Generate shell pages
  const filteredDocs = filterCaseEvidence(docs);
  const shellBytes = config.downloadMode === "forms_only"
    ? null
    : generateShellPdf(config, caseData, forms, filteredDocs, formPageCounts, formStatuses);

  // Step 3: Merge everything with pdf-lib
  const mergedPdf = await PDFDocument.create();

  // Add shell pages first
  if (shellBytes) {
    const shellDoc = await PDFDocument.load(shellBytes);
    const shellPages = await mergedPdf.copyPages(shellDoc, shellDoc.getPageIndices());
    shellPages.forEach(page => mergedPdf.addPage(page));
  }

  // Add form pages (official templates, fallbacks, and EOIR renders)
  for (const { doc } of formPdfDocs) {
    const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }

  // If no pages were added, create at least one info page
  if (mergedPdf.getPageCount() === 0) {
    const page = mergedPdf.addPage();
    page.drawText("No content available for export.", { x: 50, y: 700, size: 16 });
    page.drawText("Please complete required forms and upload documents first.", { x: 50, y: 670, size: 12 });
  }

  const pdfBytes = await mergedPdf.save();
  const safeClient = (caseData.clientName || "Client").replace(/[^a-zA-Z0-9_-]/g, "_").replace(/__+/g, "_");
  const modeLabel = config.downloadMode === "full" ? "Full_Packet" : config.downloadMode === "forms_only" ? "Forms" : "Documents";
  const fileName = `DOME_${modeLabel}_${safeClient}_${caseData.caseNumber}_${new Date().toISOString().slice(0, 10)}.pdf`;

  return { pdfBytes: new Uint8Array(pdfBytes), formResults, formExportResults, fileName, warnings };
}
