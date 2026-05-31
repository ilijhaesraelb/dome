/**
 * Nonprofit Tax Intake — Collects org info and determines likely filing path.
 * DB-persistent via useTaxFilingPersistence.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Lightbulb, Shield, AlertTriangle } from "lucide-react";
import GuidedField from "@/components/form-engine/GuidedField";
import { NONPROFIT_INTAKE_SECTIONS, determineNonprofitFiling } from "@/data/taxFormSections";
import BackButton from "@/components/BackButton";
import { useTaxFilingPersistence } from "@/hooks/useTaxFilingPersistence";
import PageLoader from "@/components/PageLoader";
import { cn } from "@/lib/utils";

const NonprofitTaxIntake = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // ── DB-backed persistence ──
  const {
    values, handleChange, manualSave, saveStatus, loading,
  } = useTaxFilingPersistence({ filingType: "nonprofit_intake" });

  const sections = NONPROFIT_INTAKE_SECTIONS;
  const section = sections[step];
  const progress = Math.round(((step + 1) / sections.length) * 100);

  const handleNext = () => {
    manualSave();
    if (step < sections.length - 1) setStep(step + 1);
    else setShowResult(true);
  };

  if (loading) return <PageLoader />;

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

  if (showResult) {
    const result = determineNonprofitFiling(values);
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6 animate-fade-in">
        <BackButton />
        <div className="text-center space-y-3">
          <Lightbulb className="w-16 h-16 text-secondary mx-auto" />
          <h1 className="text-2xl font-display font-bold">Filing Path Recommendation</h1>
          <p className="text-sm text-muted-foreground">Based on your responses, here is the most likely filing path.</p>
        </div>

        <Card className="border-2 border-secondary/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center">
                <FileText className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{result.likelyForm}</h2>
                <p className="text-sm text-muted-foreground">{result.description}</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              <p className="font-medium mb-1">Why this form?</p>
              <p className="text-muted-foreground">{result.reason}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Documents Likely Needed</h3>
            <ul className="space-y-2">
              {result.documentsNeeded.map(d => (
                <li key={d} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> {d}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Important Disclaimer</p>
              <p className="text-xs text-muted-foreground mt-1">
                This recommendation is based on the information you provided and is for guidance purposes only.
                Tax filings should be reviewed for accuracy by a qualified professional.
                D.O.M.E. does not provide legal or tax advice.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button className="flex-1 gap-2" onClick={() => navigate("/tax/nonprofit/workspace")}>
            <ArrowRight className="w-4 h-4" /> Start Filing Workspace
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate("/tax/documents")}>
            Upload Documents First
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <Badge className="bg-secondary/10 text-secondary border-0 mb-2">Nonprofit Annual Filing</Badge>
          <h1 className="text-2xl font-display font-bold">Nonprofit Filing Intake</h1>
          <p className="text-sm text-muted-foreground mt-1">We'll help determine which form your organization likely needs to file.</p>
        </div>
        <SaveBadge />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {sections.length}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="px-5 py-4 border-b bg-muted/30">
            <h2 className="font-semibold">{section.title}</h2>
            <p className="text-xs text-muted-foreground">{section.purpose}</p>
          </div>
          <div className="divide-y">
            {section.fields.map(f => (
              <GuidedField key={f.key} field={f} value={values[f.key] || ""} onChange={handleChange} />
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
          <Button onClick={handleNext} className="gap-1">
            {step === sections.length - 1 ? "See Recommendation" : "Next"} <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 text-muted-foreground/40 text-[10px]">
        <Shield className="w-3 h-3" /> <span>Secure • Auto-saved • Nonprofit-friendly</span>
      </div>
    </div>
  );
};

export default NonprofitTaxIntake;
