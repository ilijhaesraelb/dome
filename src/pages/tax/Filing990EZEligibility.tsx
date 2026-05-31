/**
 * 990-EZ Eligibility Check — Guided flow to confirm likely 990-EZ fit.
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, HelpCircle, FileText, XCircle,
} from "lucide-react";
import GuidedField from "@/components/form-engine/GuidedField";
import BackButton from "@/components/BackButton";
import type { FormFieldDef } from "@/data/formSections";

const ELIGIBILITY_FIELDS: FormFieldDef[] = [
  { key: "org_legal_name", label: "Organization Legal Name", placeholder: "Full legal name", required: true,
    help: { what: "Enter the name exactly as it appears on your IRS determination letter." } },
  { key: "ein", label: "Employer Identification Number (EIN)", placeholder: "XX-XXXXXXX", required: true,
    help: { what: "Your 9-digit IRS-issued EIN.", example: "12-3456789" } },
  { key: "tax_year_end", label: "Tax Year End Date", placeholder: "MM/DD/YYYY", type: "date", required: true,
    help: { what: "The last day of the tax year you are filing for." } },
  { key: "gross_receipts", label: "Approximate gross receipts for the year", placeholder: "Select range", type: "select", required: true,
    options: ["Under $50,000", "$50,000 – $199,999", "$200,000 or more"],
    help: { what: "Total revenue before subtracting expenses. Includes donations, grants, program fees, and other income." } },
  { key: "total_assets", label: "Approximate total assets at year-end", placeholder: "Select range", type: "select", required: true,
    options: ["Under $500,000", "$500,000 or more"],
    help: { what: "Total value of everything the organization owns — cash, investments, property, equipment." } },
  { key: "is_active", label: "Is your organization still in operation?", placeholder: "Select", type: "select", required: true,
    options: ["Yes", "No — terminated or dissolved"],
    help: { what: "Whether the organization is currently operating." } },
  { key: "has_employees", label: "Does your organization have employees?", placeholder: "Select", type: "select",
    options: ["Yes", "No"],
    help: { what: "Whether the organization paid any employees during the tax year." } },
  { key: "has_officer_compensation", label: "Were any officers or directors compensated?", placeholder: "Select", type: "select",
    options: ["Yes", "No"],
    help: { what: "Whether any officers, directors, or key employees received compensation." } },
  { key: "has_program_revenue", label: "Does the organization have program service revenue?", placeholder: "Select", type: "select",
    options: ["Yes", "No"],
    help: { what: "Revenue from activities related to your exempt purpose — tuition, admissions, patient fees, etc." } },
  { key: "required_different_form", label: "To the best of your knowledge, are you required to file a different form?", placeholder: "Select", type: "select", required: true,
    options: ["No", "Yes — must file full 990", "I don't know"],
    help: { what: "Some organizations are required to file the full Form 990 regardless of size.", warning: "If the IRS has notified you to file Form 990, select Yes." } },
];

type Result = "eligible" | "use_990n" | "use_990" | "needs_review" | null;

function evaluate(v: Record<string, string>): { result: Result; reason: string } {
  if (!v.org_legal_name?.trim() || !v.ein?.trim()) return { result: null, reason: "" };

  if (v.required_different_form === "Yes — must file full 990") {
    return { result: "use_990", reason: "You indicated your organization may be required to file the full Form 990." };
  }
  if (v.gross_receipts === "Under $50,000") {
    return { result: "use_990n", reason: "With gross receipts under $50,000, your organization likely qualifies for the simpler 990-N (e-Postcard) instead." };
  }
  if (v.gross_receipts === "$200,000 or more" || v.total_assets === "$500,000 or more") {
    return { result: "use_990", reason: "Organizations with gross receipts of $200,000+ or total assets of $500,000+ typically need to file the full Form 990." };
  }
  if (v.required_different_form === "I don't know") {
    return { result: "needs_review", reason: "We need a bit more clarity. Consider uploading prior documents or requesting a professional review." };
  }
  if (v.gross_receipts === "$50,000 – $199,999" && v.total_assets === "Under $500,000") {
    return { result: "eligible", reason: "Based on your responses, Form 990-EZ is the most likely filing path for your organization." };
  }
  return { result: null, reason: "" };
}

const Filing990EZEligibility = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});

  const handleChange = useCallback((key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  }, []);

  const current = ELIGIBILITY_FIELDS[step];
  const progress = Math.round(((step + 1) / ELIGIBILITY_FIELDS.length) * 100);
  const isLast = step === ELIGIBILITY_FIELDS.length - 1;
  const canNext = current.required ? !!values[current.key]?.trim() : true;
  const { result, reason } = isLast ? evaluate(values) : { result: null, reason: "" };
  const showResult = isLast && result;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <BackButton />
        <div className="text-center space-y-2">
          <Badge className="bg-secondary/10 text-secondary border-0">990-EZ Eligibility</Badge>
          <h1 className="text-2xl font-display font-bold">Check Your 990-EZ Filing Path</h1>
          <p className="text-sm text-muted-foreground">Answer a few questions so we can guide you to the right form.</p>
        </div>

        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">Question {step + 1} of {ELIGIBILITY_FIELDS.length}</p>

        <Card>
          <CardContent className="p-0">
            <GuidedField field={current} value={values[current.key] || ""} onChange={handleChange} />
          </CardContent>
        </Card>

        {showResult && (
          <Card className={
            result === "eligible" ? "border-2 border-success/40 bg-success/5" :
            result === "use_990n" ? "border-2 border-secondary/40 bg-secondary/5" :
            result === "use_990" ? "border-2 border-destructive/40 bg-destructive/5" :
            "border-2 border-warning/40 bg-warning/5"
          }>
            <CardContent className="p-5 text-center space-y-3">
              {result === "eligible" && <CheckCircle2 className="w-10 h-10 text-success mx-auto" />}
              {result === "use_990n" && <FileText className="w-10 h-10 text-secondary mx-auto" />}
              {result === "use_990" && <XCircle className="w-10 h-10 text-destructive mx-auto" />}
              {result === "needs_review" && <HelpCircle className="w-10 h-10 text-warning mx-auto" />}

              <h3 className="font-bold text-lg">
                {result === "eligible" && "Likely 990-EZ Fit"}
                {result === "use_990n" && "You May Qualify for 990-N Instead"}
                {result === "use_990" && "Full 990 Likely Required"}
                {result === "needs_review" && "More Information Needed"}
              </h3>
              <p className="text-sm text-muted-foreground">{reason}</p>

              {result === "eligible" && (
                <Button className="gap-2 bg-secondary hover:bg-secondary/90 mt-2" onClick={() => navigate("/tax/990ez/workspace", { state: { prefill: values } })}>
                  <FileText className="w-4 h-4" /> Continue to 990-EZ Filing <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              {result === "use_990n" && (
                <Button className="gap-2 bg-secondary hover:bg-secondary/90 mt-2" onClick={() => navigate("/tax/990n")}>
                  Go to 990-N Filing <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              {result === "use_990" && (
                <Button variant="outline" className="gap-2 mt-2" onClick={() => navigate("/tax/nonprofit/start")}>
                  Explore Filing Options <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              {result === "needs_review" && (
                <div className="flex flex-col sm:flex-row gap-2 justify-center mt-2">
                  <Button variant="outline" onClick={() => navigate("/tax/990ez/workspace", { state: { prefill: values } })}>Continue Anyway</Button>
                  <Button variant="outline" onClick={() => navigate("/tax/review")}>Request Review</Button>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground pt-2">
                This is guided preparation — not legal certainty. Confirm filing obligations with a qualified professional.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          {!showResult && (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext || isLast} className="gap-1">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Filing990EZEligibility;
