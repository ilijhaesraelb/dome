/**
 * 990-N (e-Postcard) Guided Filing Workspace — Complete data collection,
 * readiness check, review, and payment flow in one page.
 * NOW WITH SUPABASE PERSISTENCE via useTaxFilingPersistence.
 */
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useProductPrice } from "@/hooks/useProductPricing";
import UpsellCard from "@/components/UpsellCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Circle, Eye, Save, Shield,
  FileText, Loader2, DollarSign, Lock, AlertTriangle, Upload,
} from "lucide-react";
import GuidedField from "@/components/form-engine/GuidedField";
import { cn } from "@/lib/utils";
import BackButton from "@/components/BackButton";
import { useIsMobile } from "@/hooks/use-mobile";
import ExportPaymentGate from "@/components/form-engine/ExportPaymentGate";
import { useToast } from "@/hooks/use-toast";
import { useTaxFilingPersistence } from "@/hooks/useTaxFilingPersistence";
import type { FormSection } from "@/data/formSections";

// ── 990-N Specific Sections ──
const FILING_990N_SECTIONS: FormSection[] = [
  {
    id: "org_basics",
    title: "Organization Basics",
    purpose: "Legal name and EIN of your organization.",
    fields: [
      { key: "org_legal_name", label: "Legal Name of Organization", placeholder: "Full legal name", required: true,
        help: { what: "As shown on your IRS determination letter or organizing documents." } },
      { key: "ein", label: "Employer Identification Number (EIN)", placeholder: "XX-XXXXXXX", required: true,
        help: { what: "Your 9-digit IRS-issued EIN.", example: "12-3456789" } },
      { key: "org_dba", label: "Doing Business As (DBA)", placeholder: "If different from legal name",
        help: { what: "Any other name your organization uses publicly. Leave blank if same as legal name." } },
    ],
  },
  {
    id: "contact_info",
    title: "Contact Information",
    purpose: "Mailing address and website for your organization.",
    fields: [
      { key: "org_address", label: "Mailing Address", placeholder: "123 Main St", required: true,
        help: { what: "The organization's principal mailing address." } },
      { key: "org_city", label: "City", placeholder: "e.g. Washington", required: true, help: { what: "City." } },
      { key: "org_state", label: "State", placeholder: "e.g. DC", required: true, help: { what: "Two-letter state abbreviation." } },
      { key: "org_zip", label: "ZIP Code", placeholder: "e.g. 20001", required: true, help: { what: "5-digit ZIP code." } },
      { key: "org_website", label: "Website (if any)", placeholder: "https://...",
        help: { what: "Your organization's website. Leave blank if you don't have one." } },
    ],
  },
  {
    id: "principal_officer",
    title: "Principal Officer",
    purpose: "Name and address of your organization's principal officer.",
    fields: [
      { key: "principal_officer_name", label: "Principal Officer Name", placeholder: "Full name", required: true,
        help: { what: "The name of the organization's principal officer (President, CEO, Executive Director)." } },
      { key: "principal_officer_address", label: "Principal Officer Mailing Address", placeholder: "Full address", required: true,
        help: { what: "The mailing address of the principal officer. Can be the same as the organization address." } },
    ],
  },
  {
    id: "filing_year",
    title: "Filing Year",
    purpose: "The tax year this 990-N covers.",
    fields: [
      { key: "tax_year_start", label: "Tax Year Beginning", placeholder: "MM/DD/YYYY", type: "date", required: true,
        help: { what: "First day of your organization's tax year.", example: "01/01/2025" } },
      { key: "tax_year_end", label: "Tax Year Ending", placeholder: "MM/DD/YYYY", type: "date", required: true,
        help: { what: "Last day of your organization's tax year.", example: "12/31/2025" } },
    ],
  },
  {
    id: "gross_receipts",
    title: "Gross Receipts Confirmation",
    purpose: "Confirm your organization's gross receipts are normally $50,000 or less.",
    fields: [
      { key: "gross_receipts_confirm", label: "Are your gross receipts normally $50,000 or less?", placeholder: "Select", type: "select", required: true,
        options: ["Yes — $50,000 or less", "No — more than $50,000"],
        help: { what: "Gross receipts are total revenue before subtracting any expenses. The IRS uses a 3-year average.",
                warning: "If your gross receipts are normally above $50,000, you may need to file Form 990-EZ or 990 instead." } },
    ],
  },
  {
    id: "operational_status",
    title: "Operational Status",
    purpose: "Confirm whether your organization is still active.",
    fields: [
      { key: "is_still_operating", label: "Is your organization still in operation?", placeholder: "Select", type: "select", required: true,
        options: ["Yes", "No — terminated or dissolved"],
        help: { what: "Whether the organization is currently operating and has not been dissolved." } },
      { key: "termination_note", label: "If terminated, provide details (optional)", placeholder: "e.g. Dissolved on 06/15/2025",
        help: { what: "Brief note about when and why the organization ceased operations." } },
    ],
  },
];

const DynamicPriceBadge = ({ productKey, fallback }: { productKey: string; fallback: string }) => {
  const { price, isLoading } = useProductPrice(productKey);
  return (
    <Badge className="bg-secondary/10 text-secondary border-0 text-lg font-bold">
      {isLoading ? fallback : `$${(price ?? 29).toFixed(0)}`}
    </Badge>
  );
};

const Filing990NWorkspace = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const location = useLocation();
  const prefill = (location.state as any)?.prefill || {};

  const [step, setStep] = useState(0);
  const [view, setView] = useState<"workspace" | "readiness" | "review" | "payment" | "success">("workspace");

  // ── Supabase persistence ──
  const {
    values,
    loading: persistLoading,
    saveStatus,
    handleChange,
    manualSave,
    markCompleted,
  } = useTaxFilingPersistence({ filingType: "990-N", prefill });

  const sections = FILING_990N_SECTIONS;
  const section = sections[step];

  // Completion math
  const sectionCompletion = sections.map(s => {
    const req = s.fields.filter(f => f.required);
    if (req.length === 0) return s.fields.some(f => values[f.key]?.trim()) ? 100 : 0;
    const filled = req.filter(f => values[f.key]?.trim());
    return Math.round((filled.length / req.length) * 100);
  });
  const totalProgress = Math.round(sectionCompletion.reduce((a, b) => a + b, 0) / sections.length);
  const allRequired = sections.flatMap(s => s.fields.filter(f => f.required));
  const missingRequired = allRequired.filter(f => !values[f.key]?.trim());

  const handleExport = async () => {
    await markCompleted();
    toast({ title: "990-N filing draft exported!", description: "Your filing package has been prepared." });
    setView("success");
  };

  if (persistLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── SUCCESS ──
  if (view === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6 animate-fade-in">
        <CheckCircle2 className="w-16 h-16 text-success mx-auto" />
        <h1 className="text-2xl font-display font-bold">Filing Submitted Successfully</h1>
        <p className="text-sm text-muted-foreground">Your 990-N filing data has been prepared and exported. You can view it on your dashboard.</p>
        <Card className="text-left">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Organization</span><span className="font-medium">{values.org_legal_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">EIN</span><span className="font-medium">{values.ein}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax Year</span><span className="font-medium">{values.tax_year_start} – {values.tax_year_end}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Filing Type</span><Badge className="bg-success/10 text-success border-0">990-N</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-secondary/10 text-secondary border-0">Completed</Badge></div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={() => window.location.href = "/tax"}>← Back to Tax Services</Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          D.O.M.E. provides filing preparation tools — not legal or tax advice. Confirm filing obligations with a qualified professional.
        </p>
      </div>
    );
  }

  // ── PAYMENT ──
  if (view === "payment") {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <BackButton />
        <div className="text-center space-y-3">
          <DollarSign className="w-12 h-12 text-secondary mx-auto" />
          <h1 className="text-2xl font-display font-bold">Complete Your 990-N Filing</h1>
          <p className="text-sm text-muted-foreground">Review your flat-fee pricing and submit your filing.</p>
        </div>

        <Card className="border-2 border-secondary/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">990-N (e-Postcard) Filing</p>
                <p className="text-xs text-muted-foreground">Guided preparation & filing support</p>
              </div>
              <DynamicPriceBadge productKey="990n_filing" fallback="$29" />
            </div>
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">What's Included:</p>
              <ul className="space-y-1.5">
                {[
                  "Guided filing workspace with all required fields",
                  "Eligibility check and readiness analysis",
                  "Clean filing draft for review",
                  "Save and resume anytime",
                  "Filing support workflow / export",
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <ExportPaymentGate
              formType="990-N Filing"
              productKey="990n_filing"
              onExportAllowed={handleExport}
              onPreview={() => { setView("review"); }}
            />
          </CardContent>
        </Card>

        <Button variant="ghost" className="w-full" onClick={() => setView("review")}>← Back to Review</Button>

        <p className="text-[10px] text-muted-foreground text-center">
          D.O.M.E. provides filing preparation tools — not legal or tax advice.
        </p>
      </div>
    );
  }

  // ── READINESS ──
  if (view === "readiness") {
    const checks = [
      { label: "Organization Name", ok: !!values.org_legal_name?.trim() },
      { label: "EIN", ok: !!values.ein?.trim() },
      { label: "Mailing Address", ok: !!values.org_address?.trim() && !!values.org_city?.trim() && !!values.org_state?.trim() && !!values.org_zip?.trim() },
      { label: "Principal Officer", ok: !!values.principal_officer_name?.trim() && !!values.principal_officer_address?.trim() },
      { label: "Tax Year", ok: !!values.tax_year_start?.trim() && !!values.tax_year_end?.trim() },
      { label: "Gross Receipts Confirmed", ok: values.gross_receipts_confirm === "Yes — $50,000 or less" },
      { label: "Operational Status", ok: !!values.is_still_operating?.trim() },
    ];
    const ready = checks.every(c => c.ok);
    const hasReceiptWarning = values.gross_receipts_confirm === "No — more than $50,000";

    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <BackButton />
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-display font-bold">990-N Readiness Check</h1>
          <p className="text-sm text-muted-foreground">Make sure everything is complete before review.</p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            {checks.map(c => (
              <div key={c.label} className="flex items-center gap-3">
                {c.ok
                  ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  : <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                }
                <span className={cn("text-sm", c.ok ? "" : "text-warning font-medium")}>{c.label}</span>
                {c.ok
                  ? <Badge className="ml-auto bg-success/10 text-success border-0 text-[10px]">Complete</Badge>
                  : <Badge className="ml-auto bg-warning/10 text-warning border-0 text-[10px]">Missing</Badge>
                }
              </div>
            ))}
          </CardContent>
        </Card>

        {hasReceiptWarning && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">Gross Receipts Over $50,000</p>
                <p className="text-xs text-muted-foreground mt-1">Your organization may need to file Form 990-EZ or 990 instead. Consider reviewing your filing path.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {ready ? (
            <Button className="flex-1 gap-2 bg-secondary hover:bg-secondary/90" onClick={() => setView("review")}>
              <Eye className="w-4 h-4" /> Continue to Review
            </Button>
          ) : (
            <Button className="flex-1 gap-2" onClick={() => { setView("workspace"); setStep(0); }}>
              Fix Missing Items
            </Button>
          )}
          <Button variant="outline" className="flex-1" onClick={() => setView("workspace")}>← Back to Workspace</Button>
        </div>
      </div>
    );
  }

  // ── REVIEW ──
  if (view === "review") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <BackButton />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold">Review Your 990-N Filing</h1>
            <p className="text-sm text-muted-foreground">Verify all information before proceeding.</p>
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
                  {sectionCompletion[i] === 100
                    ? <CheckCircle2 className="w-4 h-4 text-success" />
                    : <Circle className="w-4 h-4 text-muted-foreground" />
                  }
                  <h3 className="font-semibold text-sm">{s.title}</h3>
                  {sectionCompletion[i] < 100 && (
                    <Badge variant="outline" className="text-[10px] ml-1">
                      {s.fields.filter(f => f.required && !values[f.key]?.trim()).length} missing
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setStep(i); setView("workspace"); }}>Edit</Button>
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

        <UpsellCard
          productKey="professional_review"
          headline="Add Professional Review"
          description="Have an expert review your 990-N filing before submission for extra confidence."
          ctaLabel="Add Review"
          variant="banner"
        />

        <Card className="bg-muted/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              By continuing, you confirm that the information provided is accurate to the best of your knowledge. D.O.M.E. provides guided filing preparation — not legal or tax advice.
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="flex-1 gap-2 bg-secondary hover:bg-secondary/90" onClick={() => setView("payment")} disabled={missingRequired.length > 0}>
            <Lock className="w-4 h-4" /> Pay & Submit Filing
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setView("readiness")}>
            ← Readiness Check
          </Button>
        </div>
      </div>
    );
  }

  // ── WORKSPACE (main data entry) ──
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — desktop */}
      {!isMobile && (
        <aside className="w-56 border-r bg-sidebar shrink-0 p-4 space-y-1">
          <div className="mb-4"><BackButton /></div>
          <p className="text-xs font-semibold text-muted-foreground mb-3">990-N SECTIONS</p>
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
                {sectionCompletion[i] === 100
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  : i === step
                    ? <div className="w-3.5 h-3.5 rounded-full bg-primary shrink-0" />
                    : <Circle className="w-3.5 h-3.5 shrink-0" />
                }
                <span className="truncate flex-1">{s.title}</span>
                {missing > 0 && sectionCompletion[i] < 100 && (
                  <span className="text-[10px] text-warning">{missing}</span>
                )}
              </button>
            );
          })}
          <div className="pt-4 space-y-1">
            <button onClick={() => setView("readiness")} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted">
              <CheckCircle2 className="w-3.5 h-3.5" /> Readiness Check
            </button>
            <button onClick={() => setView("review")} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted">
              <Eye className="w-3.5 h-3.5" /> Review & Pay
            </button>
          </div>
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
              {saveStatus === "error" && <><AlertTriangle className="w-3 h-3 text-destructive" /> Save failed</>}
            </span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>

        {/* Reassurance — first section */}
        {step === 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center space-y-1">
              <p className="text-sm font-medium">You don't need to know every tax term to begin.</p>
              <p className="text-xs text-muted-foreground">We'll guide you step by step. The 990-N only needs a few pieces of information.</p>
            </CardContent>
          </Card>
        )}

        {/* Section card */}
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

        {/* Nav */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={manualSave} className="gap-1">
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
            {isMobile && (
              <Button variant="outline" size="sm" onClick={() => setView("readiness")}>
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
            {step < sections.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} className="gap-1">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={() => setView("readiness")} className="gap-1 bg-secondary hover:bg-secondary/90">
                Readiness Check <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-muted-foreground/40 text-[10px]">
          <Shield className="w-3 h-3" /> <span>Encrypted • Auto-saved • Resume anytime</span>
        </div>
      </div>
    </div>
  );
};

export default Filing990NWorkspace;
