/**
 * Answer-summary PDF for forms that have no official USCIS PDF template
 * (e.g. TAX-INTAKE, NP-INTAKE). Renders each section as a Field / Value table.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { FormSection } from "@/data/formSections";

export function buildAnswerSummaryPdf(
  title: string,
  sections: FormSection[],
  values: Record<string, string>,
): Uint8Array {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  doc.setFillColor(30, 55, 100);
  doc.rect(0, 0, w, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${title} — Preview`, w / 2, 12, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("D.O.M.E. — Digital Onboarding for Migration Ease", w / 2, 21, { align: "center" });
  doc.setTextColor(0, 0, 0);

  let y = 38;
  for (const sec of sections) {
    if (!sec.fields.length) continue;
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(sec.title, 15, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Field", "Value"]],
      body: sec.fields.map((f) => [f.label, values[f.key]?.trim() || (f.required ? "Missing (required)" : "—")]),
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 55, 100], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 249, 252] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `${title} | Preview | Generated ${new Date().toLocaleString()} | Page ${i} of ${total}`,
      w / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );
    doc.setTextColor(0, 0, 0);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
