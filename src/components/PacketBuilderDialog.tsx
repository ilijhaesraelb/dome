import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Package, FileText, BookOpen, FileCheck, Paperclip, Download,
  Loader2, CheckCircle2, Copy, User, Building,
} from "lucide-react";
import { Case, Application, Evidence, ClientProfile, supportedForms } from "@/data/mockData";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF type for autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

type PacketCopy = "client" | "representative" | "attorney";

interface PacketBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: Case;
  applications: Application[];
  evidence: Evidence[];
  profile?: ClientProfile;
}

const PacketBuilderDialog = ({
  open, onOpenChange, caseData, applications, evidence, profile,
}: PacketBuilderDialogProps) => {
  const [includeCoverLetter, setIncludeCoverLetter] = useState(true);
  const [includeTOC, setIncludeTOC] = useState(true);
  const [includeForms, setIncludeForms] = useState(true);
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [selectedForms, setSelectedForms] = useState<string[]>(applications.map(a => a.id));
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>(
    evidence.filter(e => e.quality === "complete").map(e => e.id)
  );
  const [copies, setCopies] = useState<PacketCopy[]>(["client", "representative"]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);

  const toggleForm = (id: string) => {
    setSelectedForms(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const toggleEvidence = (id: string) => {
    setSelectedEvidence(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  const toggleCopy = (copy: PacketCopy) => {
    setCopies(prev => prev.includes(copy) ? prev.filter(c => c !== copy) : [...prev, copy]);
  };

  const generatePDF = (copyType: PacketCopy): jsPDF => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    const addHeader = (text: string, size: number = 16) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", "bold");
      doc.text(text, pageWidth / 2, y, { align: "center" });
      y += size * 0.6;
    };

    const addText = (text: string, size: number = 10, style: string = "normal") => {
      doc.setFontSize(size);
      doc.setFont("helvetica", style);
      const lines = doc.splitTextToSize(text, pageWidth - 40);
      doc.text(lines, 20, y);
      y += lines.length * size * 0.5 + 4;
    };

    const addLine = () => {
      doc.setDrawColor(200, 200, 200);
      doc.line(20, y, pageWidth - 20, y);
      y += 6;
    };

    const checkPage = (needed: number = 30) => {
      if (y > doc.internal.pageSize.getHeight() - needed) {
        doc.addPage();
        y = 20;
      }
    };

    // ═══ Cover Letter ═══
    if (includeCoverLetter) {
      addHeader("D.O.M.E. IMMIGRATION PLATFORM", 18);
      y += 4;
      addHeader("FILING PACKET", 14);
      y += 8;
      addLine();
      y += 4;

      const copyLabel = copyType === "client" ? "CLIENT COPY" : copyType === "representative" ? "REPRESENTATIVE COPY" : "ATTORNEY COPY";
      addHeader(`— ${copyLabel} —`, 12);
      y += 8;

      addText(`Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 11, "bold");
      y += 2;
      addText(`Case Number: ${caseData.caseNumber}`, 11);
      addText(`Client: ${caseData.clientName}`, 11);
      addText(`Case Type: ${caseData.caseType} (${caseData.visaType})`, 11);
      addText(`Representative: ${caseData.representative}`, 11);
      y += 4;

      addText(`Package Contents: ${caseData.packageForms.join(", ")}`, 11);
      y += 6;

      addLine();
      y += 4;

      addText("To Whom It May Concern:", 11, "bold");
      y += 2;
      addText(
        `Please find enclosed the complete filing packet for ${caseData.clientName}, ` +
        `pertaining to ${caseData.caseType} (${caseData.visaType}). This packet includes ` +
        `${selectedForms.length} form(s) and ${selectedEvidence.length} supporting evidence document(s) ` +
        `as detailed in the Table of Contents below.`,
        10
      );
      y += 4;
      addText(
        `All forms have been reviewed for accuracy and consistency. The case readiness score ` +
        `at the time of filing is ${caseData.readinessScore}%.`,
        10
      );
      y += 6;

      if (profile) {
        addText("Beneficiary Information:", 11, "bold");
        addText(`Full Name: ${profile.firstName} ${profile.middleName ? profile.middleName + " " : ""}${profile.lastName}`, 10);
        addText(`Date of Birth: ${profile.dateOfBirth}`, 10);
        addText(`Country of Birth: ${profile.countryOfBirth}`, 10);
        addText(`A-Number: ${profile.alienNumber}`, 10);
        y += 4;
      }

      addText("Respectfully submitted,", 10);
      y += 6;
      addText(caseData.representative, 11, "bold");
      addText("Accredited Representative", 10);

      doc.addPage();
      y = 20;
    }

    // ═══ Table of Contents ═══
    if (includeTOC) {
      addHeader("TABLE OF CONTENTS", 16);
      y += 8;

      const tocItems: Array<{ section: string; description: string; page: string }> = [];
      let pageNum = includeCoverLetter ? 3 : 2;

      if (includeForms) {
        const selectedApps = applications.filter(a => selectedForms.includes(a.id));
        selectedApps.forEach(app => {
          tocItems.push({
            section: app.formType,
            description: app.formName,
            page: `${pageNum}`,
          });
          pageNum++;
        });
      }

      if (includeEvidence) {
        const selectedEvs = evidence.filter(e => selectedEvidence.includes(e.id));
        tocItems.push({ section: "EVIDENCE", description: "Supporting Documentation", page: `${pageNum}` });
        pageNum++;
        selectedEvs.forEach(ev => {
          tocItems.push({ section: `  Exhibit`, description: ev.name, page: `${pageNum}` });
          pageNum++;
        });
      }

      doc.autoTable({
        startY: y,
        head: [["Section", "Description", "Page"]],
        body: tocItems.map(item => [item.section, item.description, item.page]),
        margin: { left: 20, right: 20 },
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [41, 65, 122], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.addPage();
      y = 20;
    }

    // ═══ Forms Section ═══
    if (includeForms) {
      const selectedApps = applications.filter(a => selectedForms.includes(a.id));
      selectedApps.forEach((app, index) => {
        if (index > 0) {
          doc.addPage();
          y = 20;
        }

        addHeader(`Form ${app.formType}`, 16);
        y += 2;
        addText(app.formName, 12, "italic");
        y += 6;
        addLine();
        y += 4;

        // Form summary
        doc.autoTable({
          startY: y,
          body: [
            ["Form Type", app.formType],
            ["Form Name", app.formName],
            ["Status", app.status.replace(/_/g, " ").toUpperCase()],
            ["Progress", `${app.progress}%`],
            ["Last Updated", app.lastUpdated],
            ["Assigned To", app.assignedTo],
          ],
          margin: { left: 20, right: 20 },
          styles: { fontSize: 10, cellPadding: 4 },
          columnStyles: {
            0: { fontStyle: "bold", cellWidth: 50 },
          },
          theme: "grid",
        });

        y = doc.lastAutoTable.finalY + 10;
        checkPage();

        // If we have profile data, add key fields for this form
        if (profile) {
          addText("Populated Fields:", 11, "bold");
          y += 2;

          const fields: Array<[string, string]> = [
            ["Full Legal Name", `${profile.firstName} ${profile.middleName || ""} ${profile.lastName}`.trim()],
            ["Date of Birth", profile.dateOfBirth],
            ["Country of Birth", profile.countryOfBirth],
            ["Nationality", profile.nationality],
            ["A-Number", profile.alienNumber],
            ["Passport Number", profile.passportNumber],
          ];

          if (profile.currentAddress) {
            fields.push([
              "Current Address",
              `${profile.currentAddress.street}${profile.currentAddress.apt ? ", " + profile.currentAddress.apt : ""}, ${profile.currentAddress.city}, ${profile.currentAddress.state} ${profile.currentAddress.zip}`,
            ]);
          }

          if (profile.spouse && (app.formType === "I-130" || app.formType === "I-485")) {
            fields.push(["Spouse", `${profile.spouse.firstName} ${profile.spouse.lastName}`]);
          }

          doc.autoTable({
            startY: y,
            body: fields,
            margin: { left: 20, right: 20 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 } },
            theme: "striped",
          });
        }

        // Add linked evidence for this form
        const linkedEvs = evidence.filter(
          e => e.linkedForms.includes(app.formType) && e.quality === "complete" && selectedEvidence.includes(e.id)
        );
        if (linkedEvs.length > 0) {
          y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : y + 10;
          checkPage();
          addText("Linked Evidence:", 11, "bold");
          linkedEvs.forEach((ev, i) => {
            checkPage();
            addText(`${i + 1}. ${ev.name} (${ev.category})`, 10);
          });
        }
      });
    }

    // ═══ Evidence Section ═══
    if (includeEvidence) {
      doc.addPage();
      y = 20;
      addHeader("SUPPORTING EVIDENCE", 16);
      y += 8;

      const selectedEvs = evidence.filter(e => selectedEvidence.includes(e.id));
      const categories = Array.from(new Set(selectedEvs.map(e => e.category)));

      categories.forEach(cat => {
        checkPage(40);
        addText(cat.toUpperCase(), 12, "bold");
        y += 2;

        const catEvs = selectedEvs.filter(e => e.category === cat);
        doc.autoTable({
          startY: y,
          head: [["#", "Document", "Upload Date", "Uploaded By", "Linked Forms"]],
          body: catEvs.map((ev, i) => [
            `${i + 1}`,
            ev.name,
            ev.uploadDate || "—",
            ev.uploadedBy || "—",
            ev.linkedForms.join(", "),
          ]),
          margin: { left: 20, right: 20 },
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [41, 65, 122], textColor: [255, 255, 255] },
        });

        y = doc.lastAutoTable.finalY + 10;
      });
    }

    // ═══ Footer on all pages ═══
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(
        `${caseData.caseNumber} | ${caseData.clientName} | ${copyType.charAt(0).toUpperCase() + copyType.slice(1)} Copy | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
      doc.setTextColor(0, 0, 0);
    }

    return doc;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(0);
    const files: string[] = [];

    for (let i = 0; i < copies.length; i++) {
      const copy = copies[i];
      setProgress(Math.round(((i) / copies.length) * 100));

      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      const doc = generatePDF(copy);
      const filename = `${caseData.caseNumber}_${copy}_copy.pdf`;
      doc.save(filename);
      files.push(filename);

      setProgress(Math.round(((i + 1) / copies.length) * 100));
    }

    setGeneratedFiles(files);
    setGenerated(true);
    setGenerating(false);
  };

  const handleClose = () => {
    setGenerated(false);
    setProgress(0);
    setGeneratedFiles([]);
    onOpenChange(false);
  };

  const completeEvidence = evidence.filter(e => e.quality === "complete");
  const missingEvidence = evidence.filter(e => e.quality === "missing");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Packet Builder
          </DialogTitle>
          <DialogDescription>
            Generate a submission-ready filing packet for {caseData.caseNumber} — {caseData.clientName}
          </DialogDescription>
        </DialogHeader>

        {generated ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-display font-semibold">Packets Generated Successfully</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {generatedFiles.length} PDF packet(s) have been downloaded to your device.
            </p>
            <div className="space-y-2 max-w-sm mx-auto">
              {generatedFiles.map(file => (
                <div key={file} className="flex items-center gap-2 p-2.5 rounded-lg bg-success/5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <span className="font-medium truncate">{file}</span>
                </div>
              ))}
            </div>
            <Button onClick={handleClose} className="mt-4">Done</Button>
          </div>
        ) : (
          <>
            {/* Packet Contents */}
            <div className="space-y-4">
              <h3 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wide">
                Packet Contents
              </h3>

              <div className="space-y-3">
                {/* Cover Letter */}
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Checkbox
                    id="cover-letter"
                    checked={includeCoverLetter}
                    onCheckedChange={(v) => setIncludeCoverLetter(!!v)}
                  />
                  <BookOpen className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <label htmlFor="cover-letter" className="text-sm font-medium cursor-pointer">Cover Letter</label>
                    <p className="text-xs text-muted-foreground">Professional cover letter with case summary and beneficiary info</p>
                  </div>
                </div>

                {/* Table of Contents */}
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <Checkbox
                    id="toc"
                    checked={includeTOC}
                    onCheckedChange={(v) => setIncludeTOC(!!v)}
                  />
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <label htmlFor="toc" className="text-sm font-medium cursor-pointer">Table of Contents</label>
                    <p className="text-xs text-muted-foreground">Indexed listing of all forms and evidence with page numbers</p>
                  </div>
                </div>

                {/* Forms */}
                <div className="rounded-lg border">
                  <div className="flex items-center gap-3 p-3">
                    <Checkbox
                      id="forms"
                      checked={includeForms}
                      onCheckedChange={(v) => setIncludeForms(!!v)}
                    />
                    <FileCheck className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1">
                      <label htmlFor="forms" className="text-sm font-medium cursor-pointer">
                        Forms ({selectedForms.length}/{applications.length})
                      </label>
                      <p className="text-xs text-muted-foreground">Immigration form summaries with populated field data</p>
                    </div>
                  </div>
                  {includeForms && (
                    <div className="px-3 pb-3 space-y-1.5">
                      <Separator />
                      {applications.map(app => (
                        <div key={app.id} className="flex items-center gap-2 pl-8 py-1">
                          <Checkbox
                            checked={selectedForms.includes(app.id)}
                            onCheckedChange={() => toggleForm(app.id)}
                          />
                          <span className="text-sm font-medium">{app.formType}</span>
                          <span className="text-xs text-muted-foreground">– {app.formName}</span>
                          <Badge variant="outline" className="text-xs ml-auto">{app.progress}%</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Evidence */}
                <div className="rounded-lg border">
                  <div className="flex items-center gap-3 p-3">
                    <Checkbox
                      id="evidence"
                      checked={includeEvidence}
                      onCheckedChange={(v) => setIncludeEvidence(!!v)}
                    />
                    <Paperclip className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1">
                      <label htmlFor="evidence" className="text-sm font-medium cursor-pointer">
                        Evidence ({selectedEvidence.length}/{completeEvidence.length} complete)
                      </label>
                      <p className="text-xs text-muted-foreground">Supporting documents from the Evidence Vault</p>
                    </div>
                  </div>
                  {includeEvidence && (
                    <div className="px-3 pb-3 space-y-1.5">
                      <Separator />
                      {evidence.map(ev => (
                        <div key={ev.id} className="flex items-center gap-2 pl-8 py-1">
                          <Checkbox
                            checked={selectedEvidence.includes(ev.id)}
                            onCheckedChange={() => toggleEvidence(ev.id)}
                            disabled={ev.quality === "missing"}
                          />
                          <span className={`text-sm ${ev.quality === "missing" ? "text-muted-foreground line-through" : ""}`}>
                            {ev.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ml-auto ${
                              ev.quality === "complete" ? "text-success border-success/30" :
                              ev.quality === "missing" ? "text-destructive border-destructive/30" :
                              "text-warning border-warning/30"
                            }`}
                          >
                            {ev.quality === "missing" ? "Missing" : ev.quality === "low_quality" ? "Low Quality" : "Ready"}
                          </Badge>
                        </div>
                      ))}
                      {missingEvidence.length > 0 && (
                        <p className="text-xs text-destructive pl-8 pt-1">
                          ⚠ {missingEvidence.length} evidence item(s) are missing and cannot be included
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Output Copies */}
              <div className="space-y-3">
                <h3 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wide">
                  Output Copies
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: "client" as PacketCopy, icon: User, label: "Client Copy" },
                    { key: "representative" as PacketCopy, icon: Building, label: "Representative" },
                    { key: "attorney" as PacketCopy, icon: FileText, label: "Attorney Copy" },
                  ]).map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleCopy(key)}
                      className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-colors ${
                        copies.includes(key)
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border hover:border-primary/30 text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-4 gap-4 text-center text-sm">
                    <div>
                      <p className="text-2xl font-bold text-primary">{selectedForms.length}</p>
                      <p className="text-xs text-muted-foreground">Forms</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{selectedEvidence.length}</p>
                      <p className="text-xs text-muted-foreground">Evidence</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{copies.length}</p>
                      <p className="text-xs text-muted-foreground">Copies</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">{caseData.readinessScore}%</p>
                      <p className="text-xs text-muted-foreground">Readiness</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {generating && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating packets...
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={generating}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={generating || copies.length === 0} className="gap-1.5">
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
                ) : (
                  <><Download className="w-4 h-4" />Generate {copies.length} Packet{copies.length !== 1 ? "s" : ""}</>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PacketBuilderDialog;
