/**
 * Nonprofit 990 Filing Workspace — Guided step-by-step workspace
 * for completing nonprofit annual filing data.
 * Refactored into sub-components for maintainability.
 */
import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Circle, Eye, Save, Shield,
  FileText, Download, Loader2, DollarSign, Lock,
} from "lucide-react";
import TaxGuidedField from "@/components/tax-help/TaxGuidedField";
import TaxHelpModeToggle from "@/components/tax-help/TaxHelpModeToggle";
import TaxSectionHelpPanel from "@/components/tax-help/TaxSectionHelpPanel";
import TaxWorkspaceWithAI from "@/components/tax-help/TaxWorkspaceWithAI";
import { TAX_SECTION_HELP } from "@/data/taxFieldHelp";
import { NONPROFIT_990_WORKSPACE_SECTIONS, TAX_PRICING } from "@/data/taxFormSections";
import { cn } from "@/lib/utils";
import BackButton from "@/components/BackButton";
import { useIsMobile } from "@/hooks/use-mobile";
import ExportPaymentGate from "@/components/form-engine/ExportPaymentGate";
import { useToast } from "@/hooks/use-toast";

const NonprofitFilingWorkspace = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showReview, setShowReview] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const sections = NONPROFIT_990_WORKSPACE_SECTIONS;
  const section = sections[step];

  // Calculate completion
  const sectionCompletion = sections.map(s => {
    const required = s.fields.filter(f => f.required);
    if (required.length === 0) return s.fields.some(f => values[f.key]?.trim()) ? 100 : 0;
    const filled = required.filter(f => values[f.key]?.trim());
    return Math.round((filled.length / required.length) * 100);
  });
  const totalProgress = Math.round(sectionCompletion.reduce((a, b) => a + b, 0) / sections.length);

  const handleChange = useCallback((key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setSaveStatus("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSaveStatus("saved"), 1200);
  }, []);

  const handleExport = () => {
    toast({ title: "Filing draft exported!", description: "Your nonprofit filing package has been downloaded." });
    setShowPayment(false);
  };

  // ── Payment Screen ──
  if (showPayment) {
    const pricing = TAX_PRICING.nonprofit_990ez;
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <BackButton />
        <div className="text-center space-y-3">
          <DollarSign className="w-12 h-12 text-secondary mx-auto" />
          <h1 className="text-2xl font-display font-bold">Complete Your Filing</h1>
          <p className="text-sm text-muted-foreground">Review your flat-fee pricing and export your filing package.</p>
        </div>

        <Card className="border-2 border-secondary/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Nonprofit Filing Prep</p>
                <p className="text-xs text-muted-foreground">Guided 990-series preparation</p>
              </div>
              <Badge className="bg-secondary/10 text-secondary border-0 text-lg font-bold">${pricing.price}</Badge>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">What's Included:</p>
              <ul className="space-y-1.5">
                {[
                  "Guided filing workspace with all sections",
                  "Filing readiness analysis",
                  "Clean filing draft export (PDF)",
                  "Save and resume anytime",
                  "Document upload and organization",
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <ExportPaymentGate
              formType="Nonprofit 990 Filing"
              onExportAllowed={handleExport}
              onPreview={() => { setShowPayment(false); setShowReview(true); }}
            />
          </CardContent>
        </Card>

        <Button variant="ghost" className="w-full" onClick={() => setShowPayment(false)}>
          ← Back to Review
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          D.O.M.E. provides filing preparation tools — not legal or tax advice.
        </p>
      </div>
    );
  }

  // ── Review Screen ──
  if (showReview) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <BackButton />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold">Review Your Filing</h1>
            <p className="text-sm text-muted-foreground">Check all sections before exporting.</p>
          </div>
          <Badge className={totalProgress === 100 ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}>
            {totalProgress}% Complete
          </Badge>
        </div>

        {sections.map((s, i) => (
          <Card key={s.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {sectionCompletion[i] === 100 ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <h3 className="font-semibold text-sm">{s.title}</h3>
                  {sectionCompletion[i] < 100 && (
                    <Badge variant="outline" className="text-[10px] ml-1">
                      {s.fields.filter(f => f.required && !values[f.key]?.trim()).length} missing
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setStep(i); setShowReview(false); }}>
                  Edit
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {s.fields.map(f => (
                  <div key={f.key} className={!values[f.key]?.trim() && f.required ? "text-destructive" : ""}>
                    <span className="text-muted-foreground">{f.label}:</span>{" "}
                    <span className="font-medium">{values[f.key] || "—"}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="flex-1 gap-2 bg-secondary hover:bg-secondary/90" onClick={() => setShowPayment(true)}>
            <Lock className="w-4 h-4" /> Pay & Export Filing
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setShowReview(false)}>
            ← Back to Workspace
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          D.O.M.E. provides filing preparation tools — not legal or tax advice.
        </p>
      </div>
    );
  }

  // ── Main Workspace ──
  return (
    <TaxWorkspaceWithAI filingType="990" values={values} currentSection={section?.id}>
    <div className="flex min-h-screen bg-background">
      {/* Left panel — Section nav (desktop) */}
      {!isMobile && (
        <aside className="w-56 border-r bg-sidebar shrink-0 p-4 space-y-1">
          <div className="mb-2"><BackButton /></div>
          <TaxHelpModeToggle compact className="mb-3" />
          <p className="text-xs font-semibold text-muted-foreground mb-3">SECTIONS</p>
          {sections.map((s, i) => {
            const missing = s.fields.filter(f => f.required && !values[f.key]?.trim()).length;
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all text-left",
                  i === step ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {sectionCompletion[i] === 100 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                ) : i === step ? (
                  <div className="w-3.5 h-3.5 rounded-full bg-primary shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="truncate flex-1">{s.title}</span>
                {missing > 0 && sectionCompletion[i] < 100 && (
                  <span className="text-[10px] text-warning">{missing}</span>
                )}
              </button>
            );
          })}
          <button
            onClick={() => setShowReview(true)}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted mt-4"
          >
            <Eye className="w-3.5 h-3.5" /> Review & Export
          </button>
        </aside>
      )}

      {/* Center — questions */}
      <div className="flex-1 max-w-2xl mx-auto px-4 py-8 space-y-5">
        {isMobile && <BackButton />}

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Section {step + 1} of {sections.length} — {section.title}</span>
            <span className="flex items-center gap-1">
              {saveStatus === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
              {saveStatus === "saved" && <><Save className="w-3 h-3 text-success" /> Saved</>}
            </span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>

        {/* Reassurance copy — first section only */}
        {step === 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center space-y-1">
              <p className="text-sm font-medium">You don't need to know every tax term to begin.</p>
              <p className="text-xs text-muted-foreground">We'll guide you step by step. Upload what you have and continue.</p>
            </CardContent>
          </Card>
        )}

        {/* Section */}
        <Card>
          <CardContent className="p-0">
            <div className="px-5 py-4 border-b bg-muted/30">
              <h2 className="font-semibold">{section.title}</h2>
              <p className="text-xs text-muted-foreground">{section.purpose}</p>
            </div>
            <div className="divide-y">
              {section.fields.map(f => (
                <TaxGuidedField key={f.key} field={f} value={values[f.key] || ""} onChange={handleChange} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nav */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            {isMobile && (
              <Button variant="outline" size="sm" onClick={() => setShowReview(true)}>
                <Eye className="w-4 h-4" />
              </Button>
            )}
            {step < sections.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} className="gap-1">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={() => setShowReview(true)} className="gap-1 bg-secondary hover:bg-secondary/90">
                Review & Export <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-muted-foreground/40 text-[10px]">
          <Shield className="w-3 h-3" /> <span>Encrypted • Auto-saved • Resume anytime</span>
        </div>
      </div>
    </div>
    </TaxWorkspaceWithAI>
  );
};

export default NonprofitFilingWorkspace;
