/**
 * Form 8868 Extension Guided Workspace — Fast data collection, readiness,
 * review, and payment in one page. NOW WITH SUPABASE PERSISTENCE.
 */
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useProductPrice } from "@/hooks/useProductPricing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Circle, Eye, Save, Shield,
  Loader2, DollarSign, Lock, AlertTriangle, Clock, Zap,
} from "lucide-react";
import GuidedField from "@/components/form-engine/GuidedField";
import { cn } from "@/lib/utils";
import BackButton from "@/components/BackButton";
import { useIsMobile } from "@/hooks/use-mobile";
import ExportPaymentGate from "@/components/form-engine/ExportPaymentGate";
import { useToast } from "@/hooks/use-toast";
import { useTaxFilingPersistence } from "@/hooks/useTaxFilingPersistence";
import type { FormSection } from "@/data/formSections";

// ── 8868 Sections — kept intentionally minimal ──
const SECTIONS: FormSection[] = [
  {
    id: "org_info",
    title: "Organization Information",
    purpose: "Legal name, EIN, and address of your organization.",
    fields: [
      { key: "org_legal_name", label: "Legal Name of Organization", placeholder: "Full legal name", required: true,
        help: { what: "As shown on your IRS determination letter or organizing documents." } },
      { key: "ein", label: "Employer Identification Number (EIN)", placeholder: "XX-XXXXXXX", required: true,
        help: { what: "Your 9-digit IRS-issued EIN.", example: "12-3456789" } },
      { key: "org_address", label: "Mailing Address", placeholder: "123 Main St", required: true,
        help: { what: "The organization's principal mailing address." } },
      { key: "org_city", label: "City", placeholder: "e.g. Washington", required: true, help: { what: "City." } },
      { key: "org_state", label: "State", placeholder: "e.g. DC", required: true, help: { what: "Two-letter state abbreviation." } },
      { key: "org_zip", label: "ZIP Code", placeholder: "e.g. 20001", required: true, help: { what: "5-digit ZIP code." } },
    ],
  },
  {
    id: "filing_ref",
    title: "Filing Type Reference",
    purpose: "Which return you are requesting more time to file.",
    fields: [
      { key: "return_type", label: "Type of return being extended", placeholder: "Select", type: "select", required: true,
        options: ["Form 990", "Form 990-EZ", "Form 990-N", "Form 990-PF", "Form 990-T", "Other / Unsure"],
        help: { what: "Select the type of return your organization needs additional time to file.", example: "Most small nonprofits file 990-N or 990-EZ." } },
      { key: "return_type_other", label: "If other, please specify", placeholder: "e.g. Form 1120-POL",
        help: { what: "Only needed if you selected 'Other / Unsure' above." } },
    ],
  },
  {
    id: "tax_year",
    title: "Tax Year",
    purpose: "The tax period you need more time for.",
    fields: [
      { key: "tax_year_start", label: "Tax Year Beginning", placeholder: "MM/DD/YYYY", type: "date", required: true,
        help: { what: "First day of the tax year being extended.", example: "01/01/2025" } },
      { key: "tax_year_end", label: "Tax Year Ending", placeholder: "MM/DD/YYYY", type: "date", required: true,
        help: { what: "Last day of the tax year being extended.", example: "12/31/2025" } },
    ],
  },
  {
    id: "extension_confirm",
    title: "Extension Confirmation",
    purpose: "Confirm why you need additional time.",
    fields: [
      { key: "needs_extension", label: "Confirm: your organization needs additional time to file", placeholder: "Select", type: "select", required: true,
        options: ["Yes — we need more time", "No"],
        help: { what: "Select 'Yes' to confirm you are requesting an automatic extension of time to file." } },
      { key: "extension_reason", label: "Reason for extension (optional)", placeholder: "e.g. Awaiting final financial reports",
        help: { what: "A brief, optional explanation of why the extension is needed. This is for your records." } },
    ],
  },
  {
    id: "auth_contact",
    title: "Authorized Contact",
    purpose: "Who is authorized to sign or submit this request.",
    fields: [
      { key: "contact_name", label: "Name of Authorized Person", placeholder: "Full name", required: true,
        help: { what: "The officer or authorized person requesting the extension." } },
      { key: "contact_title", label: "Title / Role", placeholder: "e.g. Executive Director, Treasurer", required: true,
        help: { what: "The person's title or role within the organization." } },
      { key: "contact_phone", label: "Phone (optional)", placeholder: "e.g. (555) 123-4567",
        help: { what: "A contact number in case follow-up is needed." } },
    ],
  },
];

const DynamicPriceBadge = ({ productKey, fallback }: { productKey: string; fallback: string }) => {
  const { price, isLoading } = useProductPrice(productKey);
  return (
    <Badge className="bg-secondary/10 text-secondary border-0 text-lg font-bold">
      {isLoading ? fallback : `$${(price ?? 25).toFixed(0)}`}
    </Badge>
  );
};

const Filing8868Workspace = () => {
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
  } = useTaxFilingPersistence({ filingType: "8868", prefill });

  const section = SECTIONS[step];

  const sectionCompletion = SECTIONS.map(s => {
    const req = s.fields.filter(f => f.required);
    if (req.length === 0) return s.fields.some(f => values[f.key]?.trim()) ? 100 : 0;
    const filled = req.filter(f => values[f.key]?.trim());
    return Math.round((filled.length / req.length) * 100);
  });
  const totalProgress = Math.round(sectionCompletion.reduce((a, b) => a + b, 0) / SECTIONS.length);
  const allRequired = SECTIONS.flatMap(s => s.fields.filter(f => f.required));
  const missingRequired = allRequired.filter(f => !values[f.key]?.trim());

  const handleExport = async () => {
    await markCompleted();
    toast({ title: "Extension request prepared!", description: "Your Form 8868 filing package has been saved." });
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
        <h1 className="text-2xl font-display font-bold">Extension Request Prepared</h1>
        <p className="text-sm text-muted-foreground">Your Form 8868 extension data has been saved. You can view it on your dashboard.</p>
        <Card className="text-left">
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Organization</span><span className="font-medium">{values.org_legal_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">EIN</span><span className="font-medium">{values.ein}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax Year</span><span className="font-medium">{values.tax_year_start} – {values.tax_year_end}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Return Extended</span><span className="font-medium">{values.return_type || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-success/10 text-success border-0">Extension Prepared</Badge></div>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={() => window.location.href = "/tax/nonprofit/landing"}>← Back to Nonprofit Filing</Button>
          <Button variant="ghost" onClick={() => window.location.href = "/tax"}>Back to Tax Services</Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          D.O.M.E. provides filing preparation tools — not legal or tax advice.
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
          <h1 className="text-2xl font-display font-bold">Complete Your Extension Filing</h1>
          <p className="text-sm text-muted-foreground">Review your flat-fee pricing and submit your extension request.</p>
        </div>

        <Card className="border-2 border-secondary/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Form 8868 Extension Filing</p>
                <p className="text-xs text-muted-foreground">Guided preparation & filing support</p>
              </div>
              <DynamicPriceBadge productKey="8868_extension" fallback="$25" />
            </div>
            <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-xs text-muted-foreground">
              <p className="font-medium text-foreground text-sm">What's Included:</p>
              <ul className="space-y-1.5">
                {[
                  "Guided extension workspace with all required fields",
                  "Eligibility check and readiness analysis",
                  "Clean extension summary for review",
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
              formType="8868 Extension Filing"
              productKey="8868_extension"
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
      { label: "Return Type", ok: !!values.return_type?.trim() },
      { label: "Tax Year", ok: !!values.tax_year_start?.trim() && !!values.tax_year_end?.trim() },
      { label: "Extension Confirmed", ok: values.needs_extension === "Yes — we need more time" },
      { label: "Authorized Contact", ok: !!values.contact_name?.trim() && !!values.contact_title?.trim() },
    ];
    const ready = checks.every(c => c.ok);

    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <BackButton />
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-display font-bold">Extension Readiness Check</h1>
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
            <h1 className="text-2xl font-display font-bold">Review Your Extension Request</h1>
            <p className="text-sm text-muted-foreground">Verify all information before proceeding.</p>
          </div>
          <Badge className={totalProgress === 100 ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}>
            {totalProgress}% Complete
          </Badge>
        </div>

        {SECTIONS.map((s, i) => (
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
            <Lock className="w-4 h-4" /> Pay & Submit Extension
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
          <p className="text-xs font-semibold text-muted-foreground mb-3">8868 EXTENSION</p>
          {SECTIONS.map((s, i) => {
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
            <span>Section {step + 1} of {SECTIONS.length} — {section.title}</span>
            <span className="flex items-center gap-1">
              {saveStatus === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>}
              {saveStatus === "saved" && <><Save className="w-3 h-3 text-success" /> Saved</>}
              {saveStatus === "error" && <><AlertTriangle className="w-3 h-3 text-destructive" /> Save failed</>}
            </span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>

        {/* Speed badge */}
        {step === 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                <Zap className="w-4 h-4" /> Quick Filing — Under 5 Minutes
              </div>
              <p className="text-xs text-muted-foreground">This extension request only requires a few pieces of information.</p>
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
            {step < SECTIONS.length - 1 ? (
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

export default Filing8868Workspace;
