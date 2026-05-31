/**
 * Tax Error Detection Engine
 * Scans tax file data for inconsistencies, missing fields, and potential issues.
 */

export type IssueSeverity = "critical" | "high" | "medium" | "info";

export interface TaxIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  explanation: string;
  whyItMatters: string;
  howToFix: string;
  linkedField?: string;
  linkedSection?: string;
  linkedDocument?: string;
  resolved?: boolean;
  resolvedBy?: string;
  overrideNote?: string;
}

export interface TaxErrorContext {
  filingType: string;
  values: Record<string, string>;
  uploadedDocs: string[];
  extractedData: Record<string, string>;
  priorYearData?: Record<string, string>;
  paymentStatus?: string;
  stage?: string;
}

const generateId = (prefix: string, idx: number) => `${prefix}-${idx}`;

export function runTaxErrorDetection(ctx: TaxErrorContext): TaxIssue[] {
  const issues: TaxIssue[] = [];
  let idx = 0;

  const v = ctx.values;
  const ext = ctx.extractedData;
  const docs = ctx.uploadedDocs;
  const prior = ctx.priorYearData || {};

  // === IDENTITY CHECKS ===
  if (!v.legal_first_name || !v.legal_last_name) {
    issues.push({
      id: generateId("id", idx++), severity: "critical",
      title: "Missing taxpayer name",
      explanation: "Legal first name and last name are required for any tax filing.",
      whyItMatters: "The IRS requires the legal name on the return to match your SSN records.",
      howToFix: "Enter your full legal first and last name as shown on your Social Security card.",
      linkedField: "legal_first_name", linkedSection: "identity",
    });
  }

  if (!v.ssn && !v.ein && ctx.filingType !== "990-N") {
    issues.push({
      id: generateId("id", idx++), severity: "critical",
      title: "Missing SSN or EIN",
      explanation: "A Social Security Number or Employer Identification Number is required.",
      whyItMatters: "Without a valid identification number, the return cannot be processed.",
      howToFix: "Enter your SSN (individuals) or EIN (organizations) in the identity section.",
      linkedField: "ssn", linkedSection: "identity",
    });
  }

  // === EIN MISMATCH ===
  if (v.ein && ext.ein && v.ein.replace(/\D/g, "") !== ext.ein.replace(/\D/g, "")) {
    issues.push({
      id: generateId("ein", idx++), severity: "high",
      title: "EIN mismatch between entry and document",
      explanation: `You entered EIN ${v.ein} but documents show ${ext.ein}.`,
      whyItMatters: "A mismatched EIN will cause IRS rejection or processing delays.",
      howToFix: "Verify your EIN against your IRS confirmation letter and correct the entry.",
      linkedField: "ein", linkedSection: "identity", linkedDocument: "EIN Confirmation Letter",
    });
  }

  // === W-2 WAGE MISMATCH ===
  if (v.w2_wages && ext.w2_wages) {
    const entered = parseFloat(v.w2_wages.replace(/[,$]/g, ""));
    const extracted = parseFloat(ext.w2_wages.replace(/[,$]/g, ""));
    if (!isNaN(entered) && !isNaN(extracted) && Math.abs(entered - extracted) > 1) {
      issues.push({
        id: generateId("w2", idx++), severity: "high",
        title: "W-2 wages do not match uploaded document",
        explanation: `You entered $${entered.toLocaleString()} but the uploaded W-2 shows $${extracted.toLocaleString()}.`,
        whyItMatters: "Incorrect wage reporting can lead to IRS notices or audits.",
        howToFix: "Check Box 1 on your W-2 and update the wages field to match.",
        linkedField: "w2_wages", linkedSection: "income", linkedDocument: "W-2",
      });
    }
  }

  // === MISSING REQUIRED DOCUMENTS ===
  const requiredDocs: Record<string, string[]> = {
    individual: ["W-2", "Government ID"],
    "990-N": ["EIN Confirmation"],
    "990-EZ": ["EIN Confirmation", "Financial Statements"],
    "990": ["EIN Confirmation", "Financial Statements", "Board/Officer List"],
  };

  const needed = requiredDocs[ctx.filingType] || [];
  for (const doc of needed) {
    const found = docs.some(d => d.toLowerCase().includes(doc.toLowerCase().split(" ")[0].toLowerCase()));
    if (!found) {
      issues.push({
        id: generateId("doc", idx++), severity: "medium",
        title: `Missing document: ${doc}`,
        explanation: `The ${doc} has not been uploaded yet.`,
        whyItMatters: "This document is typically required for your filing type.",
        howToFix: `Upload your ${doc} in the Documents section.`,
        linkedSection: "documents", linkedDocument: doc,
      });
    }
  }

  // === FILING STATUS CHANGE FROM PRIOR YEAR ===
  if (prior.filing_status && v.filing_status && prior.filing_status !== v.filing_status) {
    issues.push({
      id: generateId("fs", idx++), severity: "medium",
      title: "Filing status changed from prior year",
      explanation: `Prior year: ${prior.filing_status}. Current year: ${v.filing_status}.`,
      whyItMatters: "A filing status change may affect deductions, credits, and tax brackets.",
      howToFix: "Confirm the change is intentional. If your marital or dependent status changed, this may be correct.",
      linkedField: "filing_status", linkedSection: "identity",
    });
  }

  // === BALANCE SHEET IMBALANCE (Nonprofit / Business) ===
  if (v.total_assets && v.total_liabilities && v.total_equity) {
    const assets = parseFloat(v.total_assets.replace(/[,$]/g, "") || "0");
    const liab = parseFloat(v.total_liabilities.replace(/[,$]/g, "") || "0");
    const equity = parseFloat(v.total_equity.replace(/[,$]/g, "") || "0");
    if (!isNaN(assets) && !isNaN(liab) && !isNaN(equity) && Math.abs(assets - (liab + equity)) > 1) {
      issues.push({
        id: generateId("bs", idx++), severity: "high",
        title: "Balance sheet does not balance",
        explanation: `Assets ($${assets.toLocaleString()}) ≠ Liabilities ($${liab.toLocaleString()}) + Equity ($${equity.toLocaleString()}).`,
        whyItMatters: "An unbalanced balance sheet indicates an accounting error that must be resolved.",
        howToFix: "Review your financial statements and correct the totals so Assets = Liabilities + Net Assets/Equity.",
        linkedSection: "financial_statements",
      });
    }
  }

  // === GROSS RECEIPTS CONFLICT (Nonprofit) ===
  if (v.gross_receipts && ext.gross_receipts) {
    const entered = parseFloat(v.gross_receipts.replace(/[,$]/g, ""));
    const extracted = parseFloat(ext.gross_receipts.replace(/[,$]/g, ""));
    if (!isNaN(entered) && !isNaN(extracted) && Math.abs(entered - extracted) > 100) {
      issues.push({
        id: generateId("gr", idx++), severity: "high",
        title: "Gross receipts conflict with uploaded statements",
        explanation: `Entered: $${entered.toLocaleString()}. Uploaded statements show: $${extracted.toLocaleString()}.`,
        whyItMatters: "Gross receipts determine which form to file and affect compliance thresholds.",
        howToFix: "Compare your financial statement totals and update the gross receipts field.",
        linkedField: "gross_receipts", linkedSection: "revenue",
      });
    }
  }

  // === MISSING PRINCIPAL OFFICER (Nonprofit) ===
  if (["990-N", "990-EZ", "990"].includes(ctx.filingType) && !v.principal_officer_name) {
    issues.push({
      id: generateId("po", idx++), severity: "critical",
      title: "Missing principal officer name",
      explanation: "The name of the principal officer is required for nonprofit filings.",
      whyItMatters: "The IRS requires identification of the responsible party on exempt organization returns.",
      howToFix: "Enter the name and title of your organization's principal officer.",
      linkedField: "principal_officer_name", linkedSection: "governance",
    });
  }

  // === TAX YEAR MISSING ===
  if (!v.tax_year) {
    issues.push({
      id: generateId("ty", idx++), severity: "critical",
      title: "Tax year not specified",
      explanation: "The tax year for this filing has not been set.",
      whyItMatters: "All tax returns must specify the applicable tax period.",
      howToFix: "Select the tax year in the filing information section.",
      linkedField: "tax_year", linkedSection: "filing_info",
    });
  }

  // === UNUSUAL / IMPOSSIBLE VALUES ===
  const numericFields = ["w2_wages", "total_income", "total_expenses", "gross_receipts"];
  for (const field of numericFields) {
    if (v[field]) {
      const val = parseFloat(v[field].replace(/[,$]/g, ""));
      if (!isNaN(val) && val < 0) {
        issues.push({
          id: generateId("neg", idx++), severity: "medium",
          title: `Negative value in ${field.replace(/_/g, " ")}`,
          explanation: `The value $${val.toLocaleString()} is negative, which is unusual.`,
          whyItMatters: "Negative values in income or receipts fields typically indicate a data entry error.",
          howToFix: "Verify the amount and correct if entered in error.",
          linkedField: field,
        });
      }
    }
  }

  // === PAYMENT / EXPORT READINESS ===
  if (ctx.stage === "ready_for_payment" || ctx.stage === "paid_ready_export") {
    const criticals = issues.filter(i => i.severity === "critical");
    if (criticals.length > 0) {
      issues.push({
        id: generateId("block", idx++), severity: "critical",
        title: "Critical issues must be resolved before proceeding",
        explanation: `There are ${criticals.length} critical issue(s) that must be resolved before payment or export.`,
        whyItMatters: "Exporting or submitting with unresolved critical issues risks rejection or errors.",
        howToFix: "Fix all critical blockers listed in the issues panel before continuing.",
        linkedSection: "review",
      });
    }
  }

  // === DUPLICATE DOCUMENT DETECTION ===
  const docCounts: Record<string, number> = {};
  for (const doc of docs) {
    const norm = doc.toLowerCase().replace(/[^a-z0-9]/g, "");
    docCounts[norm] = (docCounts[norm] || 0) + 1;
  }
  for (const [norm, count] of Object.entries(docCounts)) {
    if (count > 1) {
      issues.push({
        id: generateId("dup", idx++), severity: "info",
        title: "Possible duplicate document upload",
        explanation: `A document appears to have been uploaded ${count} times.`,
        whyItMatters: "Duplicate documents can cause confusion during review and may lead to double-counted values.",
        howToFix: "Review your uploaded documents and remove any duplicates.",
        linkedSection: "documents",
      });
      break; // only flag once
    }
  }

  // === EXPENSES WITHOUT SUPPORT ===
  if (v.total_expenses) {
    const exp = parseFloat(v.total_expenses.replace(/[,$]/g, ""));
    if (!isNaN(exp) && exp > 5000 && !docs.some(d => d.toLowerCase().includes("receipt") || d.toLowerCase().includes("expense") || d.toLowerCase().includes("statement"))) {
      issues.push({
        id: generateId("exp", idx++), severity: "info",
        title: "Expenses reported without supporting documents",
        explanation: `Total expenses of $${exp.toLocaleString()} reported but no expense-related documents uploaded.`,
        whyItMatters: "Supporting documentation strengthens your filing if audited.",
        howToFix: "Upload receipts, bank statements, or expense records to support your deductions.",
        linkedSection: "documents",
      });
    }
  }

  return issues;
}

export function getIssuesByField(issues: TaxIssue[], fieldKey: string): TaxIssue[] {
  return issues.filter(i => i.linkedField === fieldKey && !i.resolved);
}

export function getIssuesBySection(issues: TaxIssue[], sectionKey: string): TaxIssue[] {
  return issues.filter(i => i.linkedSection === sectionKey && !i.resolved);
}

export function getIssueSummary(issues: TaxIssue[]) {
  const unresolved = issues.filter(i => !i.resolved);
  return {
    total: unresolved.length,
    critical: unresolved.filter(i => i.severity === "critical").length,
    high: unresolved.filter(i => i.severity === "high").length,
    medium: unresolved.filter(i => i.severity === "medium").length,
    info: unresolved.filter(i => i.severity === "info").length,
    blockers: unresolved.filter(i => i.severity === "critical").length,
  };
}

export const SEVERITY_CONFIG: Record<IssueSeverity, { label: string; color: string; icon: string; message: string }> = {
  critical: { label: "Critical Blocker", color: "text-red-600 bg-red-50 border-red-200", icon: "🛑", message: "This must be fixed before you can continue to review, export, or filing support." },
  high: { label: "High Warning", color: "text-orange-600 bg-orange-50 border-orange-200", icon: "⚠️", message: "This may affect the accuracy of your return or filing draft." },
  medium: { label: "Medium Warning", color: "text-amber-600 bg-amber-50 border-amber-200", icon: "⚡", message: "Please review this carefully before continuing." },
  info: { label: "Info", color: "text-blue-600 bg-blue-50 border-blue-200", icon: "ℹ️", message: "Optional review item." },
};
