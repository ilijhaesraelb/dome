/**
 * 990-N Eligibility Check — Short guided flow to confirm likely 990-N fit.
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
  { key: "org_legal_name", label: "Organization Legal Name", placeholder: "Full legal name as registered with IRS", required: true,
    help: { what: "Enter the name exactly as it appears on your IRS determination letter." } },
  { key: "ein", label: "Employer Identification Number (EIN)", placeholder: "XX-XXXXXXX", required: true,
    help: { what: "Your 9-digit IRS-issued EIN.", example: "12-3456789" } },
  { key: "tax_year_end", label: "Tax Year End Date", placeholder: "MM/DD/YYYY", type: "date", required: true,
    help: { what: "The last day of the tax year you are filing for." } },
  { key: "gross_receipts", label: "Were your gross receipts normally $50,000 or less?", placeholder: "Select", type: "select", required: true,
    options: ["Yes — $50,000 or less", "No — more than $50,000", "I'm not sure"],
    help: { what: "Gross receipts are total revenue before subtracting any expenses.", example: "Add up all donations, grants, program fees, and other income." } },
  { key: "is_active", label: "Is your organization still in operation?", placeholder: "Select", type: "select", required: true,
    options: ["Yes", "No — terminated or dissolved"],
    help: { what: "Whether the organization is currently active and operating." } },
  { key: "is_first_filing", label: "Is this your first annual filing?", placeholder: "Select", type: "select",
    options: ["Yes", "No"],
    help: { what: "First-time filers may need extra guidance." } },
  { key: "required_different_form", label: "To the best of your knowledge, are you required to file a different form (990 or 990-EZ)?", placeholder: "Select", type: "select", required: true,
    options: ["No", "Yes", "I don't know"],
    help: { what: "Some organizations are required to file a more detailed return regardless of receipts.", warning: "If you've been notified by the IRS that you must file a 990 or 990-EZ, select Yes." } },
];

type Result = "eligible" | "not_eligible" | "needs_review" | null;

function evaluateEligibility(v: Record<string, string>): { result: Result; reason: string } {
  if (!v.org_legal_name?.trim() || !v.ein?.trim()) return { result: null, reason: "" };

  if (v.required_different_form === "Yes") {
    return { result: "not_eligible", reason: "You indicated your organization may be required to file a different form. We recommend consulting your records or a tax professional." };
  }
  if (v.gross_receipts === "No — more than $50,000") {
    return { result: "not_eligible", reason: "Organizations with gross receipts above $50,000 typically need to file Form 990-EZ or Form 990 instead." };
  }
  if (v.gross_receipts === "I'm not sure" || v.required_different_form === "I don't know") {
    return { result: "needs_review", reason: "We need a little more information to be confident. Consider uploading prior documents or requesting a professional review." };
  }
  if (v.gross_receipts === "Yes — $50,000 or less" && v.required_different_form === "No") {
    return { result: "eligible", reason: "Based on your responses, the 990-N (e-Postcard) is the most likely filing path for your organization." };
  }
  return { result: null, reason: "" };
}

const Filing990NEligibility = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});

  const handleChange = useCallback((key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  }, []);

  const fields = ELIGIBILITY_FIELDS;
  const current = fields[step];
  const progress = Math.round(((step + 1) / fields.length) * 100);
  const isLast = step === fields.length - 1;
  const canNext = current.required ? !!values[current.key]?.trim() : true;

  const { result, reason } = isLast ? evaluateEligibility(values) : { result: null, reason: "" };
  const showResult = isLast && result;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        <BackButton />

        <div className="text-center space-y-2">
          <Badge className="bg-secondary/10 text-secondary border-0">990-N Eligibility</Badge>
          <h1 className="text-2xl font-display font-bold">Check Your 990-N Eligibility</h1>
          <p className="text-sm text-muted-foreground">Answer a few quick questions so we can guide you.</p>
        </div>

        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">Question {step + 1} of {fields.length}</p>

        {/* Question Card */}
        <Card>
          <CardContent className="p-0">
            <GuidedField field={current} value={values[current.key] || ""} onChange={handleChange} />
          </CardContent>
        </Card>

        {/* Result */}
        {showResult && (
          <Card className={
            result === "eligible" ? "border-2 border-success/40 bg-success/5" :
            result === "not_eligible" ? "border-2 border-destructive/40 bg-destructive/5" :
            "border-2 border-warning/40 bg-warning/5"
          }>
            <CardContent className="p-5 text-center space-y-3">
              {result === "eligible" && <CheckCircle2 className="w-10 h-10 text-success mx-auto" />}
              {result === "not_eligible" && <XCircle className="w-10 h-10 text-destructive mx-auto" />}
              {result === "needs_review" && <HelpCircle className="w-10 h-10 text-warning mx-auto" />}

              <h3 className="font-bold text-lg">
                {result === "eligible" && "Likely 990-N Fit"}
                {result === "not_eligible" && "Different Filing Path Recommended"}
                {result === "needs_review" && "More Information Needed"}
              </h3>
              <p className="text-sm text-muted-foreground">{reason}</p>

              {result === "eligible" && (
                <Button className="gap-2 bg-secondary hover:bg-secondary/90 mt-2" onClick={() => navigate("/tax/990n/workspace", { state: { prefill: values } })}>
                  <FileText className="w-4 h-4" /> Continue to 990-N Filing <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              {result === "not_eligible" && (
                <Button variant="outline" className="gap-2 mt-2" onClick={() => navigate("/tax/nonprofit/start")}>
                  Explore Other Filing Options <ArrowRight className="w-4 h-4" />
                </Button>
              )}
              {result === "needs_review" && (
                <div className="flex flex-col sm:flex-row gap-2 justify-center mt-2">
                  <Button variant="outline" className="gap-2" onClick={() => navigate("/tax/990n/workspace", { state: { prefill: values } })}>
                    Continue Anyway
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => navigate("/tax/review")}>
                    Request Review
                  </Button>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground pt-2">
                This is guided preparation — not legal certainty. Filing obligations should be confirmed with a qualified professional.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
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

export default Filing990NEligibility;
