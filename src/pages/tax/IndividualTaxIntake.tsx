/**
 * Individual Tax Intake — Full guided flow with DB persistence:
 * Complete Form → Save → Review → Signature → Preview → Payment → Export
 */
import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, CheckCircle2, FileText, Upload, Shield,
  Edit, AlertCircle, Eye, FileDown, Loader2, PenTool, TriangleAlert,
} from "lucide-react";
import TaxGuidedField from "@/components/tax-help/TaxGuidedField";
import TaxHelpModeToggle from "@/components/tax-help/TaxHelpModeToggle";
import TaxSectionHelpPanel from "@/components/tax-help/TaxSectionHelpPanel";
import { TaxHelpProvider } from "@/contexts/TaxHelpContext";
import { TAX_SECTION_HELP } from "@/data/taxFieldHelp";
import { INDIVIDUAL_TAX_INTAKE_SECTIONS } from "@/data/taxFormSections";
import BackButton from "@/components/BackButton";
import TaxWorkspaceWithAI from "@/components/tax-help/TaxWorkspaceWithAI";
import SignaturePad from "@/components/SignaturePad";
import ExportPaymentGate from "@/components/form-engine/ExportPaymentGate";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTaxFilingPersistence } from "@/hooks/useTaxFilingPersistence";
import PageLoader from "@/components/PageLoader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type FlowStage = "form" | "review" | "signature" | "preview" | "export";

const STAGE_LABELS: Record<FlowStage, string> = {
  form: "Complete Form",
  review: "Review Answers",
  signature: "Sign Document",
  preview: "Preview Official Form",
  export: "Payment & Export",
};

const STAGE_ORDER: FlowStage[] = ["form", "review", "signature", "preview", "export"];

const IndividualTaxIntake = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── DB-backed persistence ──
  const {
    values, handleChange, manualSave, saveStatus, loading,
  } = useTaxFilingPersistence({ filingType: "individual" });

  const [step, setStep] = useState(0);
  const [stage, setStage] = useState<FlowStage>("form");
  const [signatureId, setSignatureId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const sections = INDIVIDUAL_TAX_INTAKE_SECTIONS;
  const section = sections[step];
  const formProgress = Math.round(((step + 1) / sections.length) * 100);

  // ── Compute review data ──
  const reviewGroups = useMemo(() => {
    return sections.map((sec, idx) => {
      const fields = sec.fields.map((f) => ({
        label: f.label,
        value: values[f.key] || "",
        required: !!f.required,
        missing: !!f.required && !values[f.key],
      }));
      const missing = fields.filter((f) => f.missing).length;
      const complete = fields.length > 0
        ? Math.round(((fields.length - missing) / fields.length) * 100)
        : 100;
      return { title: sec.title, sectionIndex: idx, complete, missing, fields };
    });
  }, [values, sections]);

  const totalRequired = useMemo(
    () => sections.flatMap((s) => s.fields).filter((f) => f.required).length,
    [sections]
  );
  const totalFilled = useMemo(
    () =>
      sections
        .flatMap((s) => s.fields)
        .filter((f) => f.required && values[f.key]).length,
    [sections, values]
  );
  const totalMissing = totalRequired - totalFilled;
  const overallProgress = totalRequired > 0 ? Math.round((totalFilled / totalRequired) * 100) : 100;

  const formStatus = totalMissing === 0 ? "Ready" : `${totalMissing} missing`;
  const statusColor = totalMissing === 0 ? "bg-success/10 text-success" : "bg-warning/10 text-warning";

  // ── Stage navigation ──
  const stageIndex = STAGE_ORDER.indexOf(stage);
  const canGoToPreview = totalFilled > 0;
  const canGoToExport = !!signatureId && !!previewUrl;

  const goToStage = (s: FlowStage) => setStage(s);

  // ── Form navigation ──
  const handleFormNext = () => {
    manualSave();
    if (step < sections.length - 1) {
      setStep(step + 1);
    } else {
      setStage("review");
    }
  };

  // ── Preview generation ──
  const generatePreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const doc = new jsPDF();
      const w = doc.internal.pageSize.getWidth();

      doc.setFillColor(30, 55, 100);
      doc.rect(0, 0, w, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Individual Tax Filing — Official Preview", w / 2, 12, { align: "center" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("D.O.M.E. — Digital Onboarding for Migration Ease", w / 2, 21, { align: "center" });
      doc.setTextColor(0, 0, 0);

      let y = 38;

      for (const sec of sections) {
        if (y > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(sec.title, 15, y);
        y += 4;

        const rows = sec.fields.map((f) => [
          f.label,
          values[f.key] || (f.required ? "⚠ Missing" : "—"),
        ]);

        autoTable(doc, {
          startY: y,
          head: [["Field", "Value"]],
          body: rows,
          margin: { left: 15, right: 15 },
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [30, 55, 100], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [248, 249, 252] },
          columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 } },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }

      if (signatureId) {
        if (y > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text(`Digitally signed — Signature ID: ${signatureId.slice(0, 8)}...`, 15, y);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, y + 6);
      }

      const total = doc.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setFontSize(6.5);
        doc.setTextColor(160, 160, 160);
        doc.text(
          `Individual Tax Filing | Preview | Generated ${new Date().toLocaleString()} | Page ${i} of ${total}`,
          w / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: "center" }
        );
        doc.setTextColor(0, 0, 0);
      }

      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setStage("preview");
    } catch (err: any) {
      console.error("Preview generation failed:", err);
      setPreviewError("We could not load the official form preview right now. Your data is saved. Please try again.");
      toast({
        title: "Preview failed",
        description: "Could not generate the official form preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPreviewLoading(false);
    }
  }, [values, sections, signatureId, toast]);

  // ── Export ──
  const handleExport = useCallback(async () => {
    if (!previewUrl) return;
    setExporting(true);
    try {
      const resp = await fetch(previewUrl);
      const blob = await resp.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `dome-individual-tax-filing-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExported(true);
      toast({ title: "✅ Export complete", description: "Your tax filing has been downloaded." });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message || "Could not export. Please try again.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }, [previewUrl, toast]);

  // ── Save status badge ──
  const SaveBadge = () => (
    <Badge variant="outline" className={cn("text-[10px]",
      saveStatus === "saving" && "border-warning text-warning",
      saveStatus === "saved" && "border-success text-success",
      saveStatus === "error" && "border-destructive text-destructive",
    )}>
      {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "✓ Saved" : saveStatus === "error" ? "Save failed" : ""}
    </Badge>
  );

  // ── Stage indicator ──
  const renderStageIndicator = () => (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STAGE_ORDER.map((s, i) => {
        const isCurrent = s === stage;
        const isPast = STAGE_ORDER.indexOf(stage) > i;
        const isDone =
          (s === "form" && stageIndex > 0) ||
          (s === "review" && stageIndex > 1) ||
          (s === "signature" && !!signatureId) ||
          (s === "preview" && !!previewUrl) ||
          (s === "export" && exported);
        return (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <div
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium transition-all",
                isCurrent && "bg-primary text-primary-foreground",
                isPast && !isCurrent && "bg-primary/10 text-primary",
                !isCurrent && !isPast && "bg-muted text-muted-foreground"
              )}
            >
              {isDone && <CheckCircle2 className="w-3 h-3" />}
              <span className="hidden sm:inline">{STAGE_LABELS[s]}</span>
              <span className="sm:hidden">{i + 1}</span>
            </div>
            {i < STAGE_ORDER.length - 1 && (
              <ArrowRight className="w-3 h-3 text-muted-foreground/40 shrink-0" />
            )}
          </div>
        );
      })}
      <SaveBadge />
    </div>
  );

  if (loading) return <PageLoader />;

  // ═══════════════════════
  // STAGE: FORM
  // ═══════════════════════
  if (stage === "form") {
    const sectionHelpKey =
      section.id === "filing_info" ? "income" : section.id === "deductions_credits" ? "deductions" : undefined;
    const sectionHelp = sectionHelpKey ? TAX_SECTION_HELP[sectionHelpKey] : undefined;

    return (
      <TaxWorkspaceWithAI filingType="individual" values={values} currentSection={section?.id}>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
          <BackButton />
          {renderStageIndicator()}

          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-primary/10 text-primary border-0 mb-2">Individual Tax Help</Badge>
              <h1 className="text-2xl font-display font-bold">Let's Understand Your Tax Situation</h1>
              <p className="text-sm text-muted-foreground mt-1">Answer a few simple questions so we can guide you.</p>
            </div>
            <TaxHelpModeToggle compact />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Step {step + 1} of {sections.length}</span>
              <span>{formProgress}%</span>
            </div>
            <Progress value={formProgress} className="h-2" />
          </div>

          {sectionHelp && <TaxSectionHelpPanel section={sectionHelp} />}

          <Card>
            <CardContent className="p-0">
              <div className="px-5 py-4 border-b bg-muted/30">
                <h2 className="font-semibold">{section.title}</h2>
                <p className="text-xs text-muted-foreground">{section.purpose}</p>
              </div>
              <div className="divide-y">
                {section.fields.map((f) => (
                  <TaxGuidedField key={f.key} field={f} value={values[f.key] || ""} onChange={handleChange} />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={manualSave} size="sm">Save Draft</Button>
              <Button onClick={handleFormNext} className="gap-1">
                {step === sections.length - 1 ? "Continue to Review" : "Next"} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-muted-foreground/40 text-[10px]">
            <Shield className="w-3 h-3" /> <span>Secure • Auto-saved • Guided</span>
          </div>
        </div>
      </TaxWorkspaceWithAI>
    );
  }

  // ═══════════════════════
  // STAGE: REVIEW
  // ═══════════════════════
  if (stage === "review") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
        <BackButton />
        {renderStageIndicator()}

        <div>
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            Review Your Tax Information
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review all information below. Click "Edit" on any section to make changes.
          </p>
        </div>

        {/* Status card */}
        <Card className="border-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold">Overall Completion</p>
                <p className="text-sm text-muted-foreground">{totalFilled} of {totalRequired} required fields</p>
              </div>
              <Badge className={cn("text-xs px-3 py-1", statusColor)}>{formStatus}</Badge>
            </div>
            <Progress value={overallProgress} className="h-3" />
            {totalMissing > 0 && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-destructive/5 rounded-lg">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive flex-1">
                  {totalMissing} required field{totalMissing > 1 ? "s" : ""} still need your attention
                </p>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={() => {
                    const idx = reviewGroups.findIndex((g) => g.missing > 0);
                    if (idx >= 0) { setStep(idx); setStage("form"); }
                  }}
                >
                  Fix Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section summaries */}
        {reviewGroups.map((group, gi) => (
          <Card
            key={gi}
            className={cn(
              "transition-all",
              group.complete === 100 && "border-success/30",
              group.missing > 0 && "border-destructive/20"
            )}
          >
            <div className="py-3 px-5 flex items-center justify-between border-b">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                {group.complete === 100 ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-destructive/60" />
                )}
                {group.title}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1"
                onClick={() => { setStep(group.sectionIndex); setStage("form"); }}
              >
                <Edit className="w-3 h-3" /> Edit
              </Button>
            </div>
            <CardContent className="px-5 pb-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {group.fields.map((f, fi) => (
                  <div key={fi} className="flex items-baseline gap-2 text-sm py-1 border-b border-border/50 last:border-0">
                    <span className={cn("text-muted-foreground shrink-0 text-xs", f.missing && "text-destructive font-medium")}>
                      {f.label}
                    </span>
                    <span className="flex-1" />
                    {f.value ? (
                      <span className="font-medium text-foreground text-xs text-right max-w-[200px] truncate">{f.value}</span>
                    ) : f.required ? (
                      <span className="text-destructive text-xs italic">Required</span>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Status labels */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={totalMissing === 0 ? "border-success text-success" : "border-warning text-warning"}>
            {totalMissing === 0 ? "✓ Form Complete" : "Form In Progress"}
          </Badge>
          <Badge variant="outline" className={signatureId ? "border-success text-success" : "border-muted text-muted-foreground"}>
            {signatureId ? "✓ Signed" : "Signature Required"}
          </Badge>
          <Badge variant="outline" className={previewUrl ? "border-success text-success" : "border-muted text-muted-foreground"}>
            {previewUrl ? "✓ Previewed" : "Preview Pending"}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => setStage("form")} className="gap-1">
            <Edit className="w-4 h-4" /> Edit Answers
          </Button>
          <Button onClick={() => setStage("signature")} className="gap-1">
            Continue to Signature <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════
  // STAGE: SIGNATURE
  // ═══════════════════════
  if (stage === "signature") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <BackButton />
        {renderStageIndicator()}

        <div>
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <PenTool className="w-6 h-6 text-primary" /> Signature Required
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sign below to certify that the information provided is accurate.
          </p>
        </div>

        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4 flex items-start gap-3">
            <TriangleAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Certification Notice</p>
              <p className="text-xs text-muted-foreground mt-1">
                By signing, you certify that the information provided is accurate and complete to the
                best of your knowledge. D.O.M.E. does not provide tax advice — this is a preparation tool only.
              </p>
            </div>
          </CardContent>
        </Card>

        <SignaturePad onSignatureComplete={(id) => { setSignatureId(id); toast({ title: "Signature saved" }); }} />

        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => setStage("review")} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Review
          </Button>
          <Button
            disabled={!signatureId || previewLoading}
            onClick={generatePreview}
            className="gap-1"
          >
            {previewLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            ) : (
              <>Generate Preview <Eye className="w-4 h-4" /></>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════
  // STAGE: PREVIEW
  // ═══════════════════════
  if (stage === "preview") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <BackButton />
        {renderStageIndicator()}

        <div>
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <Eye className="w-6 h-6 text-primary" /> Official Form Preview
          </h2>
          <p className="text-sm text-muted-foreground">
            Review the document below. If corrections are needed, go back.
          </p>
        </div>

        {previewError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-5">
              <p className="text-sm text-destructive">{previewError}</p>
              <Button variant="outline" onClick={generatePreview} className="mt-3 text-xs">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {previewUrl && (
          <div className="border rounded-lg overflow-hidden">
            <iframe src={previewUrl} className="w-full h-[600px]" title="Tax Filing Preview" />
          </div>
        )}

        {!previewUrl && !previewError && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center space-y-4">
              {previewLoading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Generating your official form preview…</p>
                </>
              ) : (
                <>
                  <Eye className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    No preview yet. Click below to generate the official form preview from your saved answers.
                  </p>
                  <Button onClick={generatePreview} className="gap-1">
                    <Eye className="w-4 h-4" /> Generate Preview
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => setStage("review")} className="gap-1">
            <Edit className="w-4 h-4" /> Back to Review
          </Button>
          <Button onClick={() => setStage("export")} className="gap-1" disabled={!previewUrl}>
            Continue to Export <FileDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════
  // STAGE: EXPORT
  // ═══════════════════════
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <BackButton />
      {renderStageIndicator()}

      <div>
        <h2 className="text-xl font-display font-bold flex items-center gap-2">
          <FileDown className="w-6 h-6 text-primary" /> Payment & Export
        </h2>
        <p className="text-sm text-muted-foreground">
          Complete payment to download your official tax filing package.
        </p>
      </div>

      <ExportPaymentGate
        formType="individual_tax"
        productKey="tax_self_prep_export"
        onExportAllowed={handleExport}
        onPreview={() => {
          setStage("preview");
          // Always (re)generate so the iframe has something to display.
          void generatePreview();
        }}
        exporting={exporting}
      />
    </div>
  );
};

export default IndividualTaxIntake;
