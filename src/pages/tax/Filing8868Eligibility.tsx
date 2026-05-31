/**
 * Form 8868 Eligibility Check — Quick guided flow to confirm extension need.
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, HelpCircle, XCircle, Clock,
} from "lucide-react";
import GuidedField from "@/components/form-engine/GuidedField";
import BackButton from "@/components/BackButton";
import type { FormFieldDef } from "@/data/formSections";

const ELIGIBILITY_FIELDS: FormFieldDef[] = [
  { key: "org_legal_name", label: "Organization Legal Name", placeholder: "Full legal name as registered with IRS", required: true,
    help: { what: "Enter the name exactly as it appears on your IRS records." } },
  { key: "ein", label: "Employer Identification Number (EIN)", placeholder: "XX-XXXXXXX", required: true,
    help: { what: "Your 9-digit IRS-issued EIN.", example: "12-3456789" } },
  { key: "tax_year_end", label: "Tax Year End Date", placeholder: "MM/DD/YYYY", type: "date", required: true,
    help: { what: "The last day of the tax year you need to extend." } },
  { key: "unable_to_file", label: "Are you unable to complete your filing by the deadline?", placeholder: "Select", type: "select", required: true,
    options: ["Yes — I need more time", "No — I can file on time", "I'm not sure"],
    help: { what: "If you cannot complete your nonprofit return by the original due date, an extension may be appropriate." } },
  { key: "filing_type", label: "Which filing type are you extending (if known)?", placeholder: "Select", type: "select",
    options: ["990-N", "990-EZ", "990", "I'm not sure"],
    help: { what: "Select the type of return you need more time to file. It's OK if you're not sure." } },
];

type Result = "eligible" | "not_needed" | "needs_review" | null;

function evaluate(v: Record<string, string>): { result: Result; reason: string } {
  if (!v.org_legal_name?.trim() || !v.ein?.trim()) return { result: null, reason: "" };

  if (v.unable_to_file === "No — I can file on time") {
    return { result: "not_needed", reason: "You indicated you can file on time. An extension may not be necessary. You can continue with your regular filing instead." };
  }
  if (v.unable_to_file === "I'm not sure") {
    return { result: "needs_review", reason: "If you're unsure whether you'll meet the deadline, consider filing an extension as a precaution or request a professional review." };
  }
  if (v.unable_to_file === "Yes — I need more time") {
    return { result: "eligible", reason: "Your organization likely qualifies to request a filing extension using Form 8868. This can provide additional time to prepare your return." };
  }
  return { result: null, reason: "" };
}

const RESULT_CONFIG = {
  eligible: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10 border-success/30", title: "Likely Eligible for Extension", badge: "bg-success/15 text-success" },
  not_needed: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted border-muted-foreground/20", title: "Extension May Not Be Needed", badge: "bg-muted text-muted-foreground" },
  needs_review: { icon: HelpCircle, color: "text-warning", bg: "bg-warning/10 border-warning/30", title: "Needs Review", badge: "bg-warning/15 text-warning" },
};

const Filing8868Eligibility = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const field = ELIGIBILITY_FIELDS[step];
  const progress = Math.round(((step + 1) / ELIGIBILITY_FIELDS.length) * 100);
  const { result, reason } = evaluate(values);

  const handleChange = useCallback((key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  }, []);

  const showResult = step === ELIGIBILITY_FIELDS.length - 1 && result;
  const cfg = result ? RESULT_CONFIG[result] : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6 animate-fade-in">
        <BackButton />

        <div className="text-center space-y-2">
          <Badge className="bg-warning/10 text-warning border-0 gap-1">
            <Clock className="w-3 h-3" /> Extension Check
          </Badge>
          <h1 className="text-2xl font-display font-bold">Do You Need a Filing Extension?</h1>
          <p className="text-sm text-muted-foreground">Answer a few quick questions to find out.</p>
        </div>

        <Progress value={progress} className="h-2" />

        {!showResult && (
          <Card>
            <CardContent className="p-0">
              <GuidedField field={field} value={values[field.key] || ""} onChange={handleChange} />
            </CardContent>
          </Card>
        )}

        {showResult && cfg && (
          <Card className={`border-2 ${cfg.bg}`}>
            <CardContent className="p-6 text-center space-y-4">
              <cfg.icon className={`w-12 h-12 mx-auto ${cfg.color}`} />
              <Badge className={cfg.badge}>{cfg.title}</Badge>
              <p className="text-sm text-muted-foreground">{reason}</p>

              {result === "eligible" && (
                <div className="space-y-2 pt-2">
                  <Button className="w-full gap-2 bg-secondary hover:bg-secondary/90" onClick={() =>
                    navigate("/tax/8868/workspace", { state: { prefill: values } })
                  }>
                    Continue to Extension Filing <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
              {result === "not_needed" && (
                <div className="space-y-2 pt-2">
                  <Button className="w-full gap-2" onClick={() => navigate("/tax/nonprofit/landing")}>
                    Return to Nonprofit Filing
                  </Button>
                  <Button variant="outline" className="w-full gap-2" onClick={() =>
                    navigate("/tax/8868/workspace", { state: { prefill: values } })
                  }>
                    File Extension Anyway
                  </Button>
                </div>
              )}
              {result === "needs_review" && (
                <div className="space-y-2 pt-2">
                  <Button className="w-full gap-2 bg-secondary hover:bg-secondary/90" onClick={() =>
                    navigate("/tax/8868/workspace", { state: { prefill: values } })
                  }>
                    File Extension as Precaution <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="w-full">Request Professional Review</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!showResult && (
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={() => setStep(Math.min(ELIGIBILITY_FIELDS.length - 1, step + 1))} disabled={!values[field.key]?.trim() && field.required} className="gap-1">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          This check provides general guidance — not legal or tax advice.
        </p>
      </div>
    </div>
  );
};

export default Filing8868Eligibility;
