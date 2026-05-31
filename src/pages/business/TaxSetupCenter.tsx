import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Landmark, FileText, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import { useState } from "react";
import { useT } from "@/hooks/useT";

const taxChecklist = [
  { key: "ein", label: "Apply for EIN", desc: "Employer Identification Number from the IRS — needed for bank accounts, hiring, and tax filings." },
  { key: "responsible_party", label: "Identify Responsible Party", desc: "The person the IRS designates as the primary contact for the business." },
  { key: "tax_classification", label: "Understand Tax Classification", desc: "Sole proprietorship, partnership, S-corp, C-corp — each has different tax implications." },
  { key: "state_tax", label: "State Tax Registration", desc: "Register for state income tax, sales tax, and employment tax as applicable." },
  { key: "accounting", label: "Set Up Accounting System", desc: "Choose accounting software and establish bookkeeping practices." },
  { key: "bank_account", label: "Open Business Bank Account", desc: "Separate business and personal finances." },
  { key: "quarterly_taxes", label: "Quarterly Tax Payment Setup", desc: "Estimated tax payments may be required for self-employed or business income." },
  { key: "payroll", label: "Payroll Setup (if hiring)", desc: "Register for payroll tax withholding and reporting." },
  { key: "1099_tracking", label: "1099 / Contractor Tracking", desc: "Track payments to independent contractors for year-end reporting." },
  { key: "annual_return", label: "Annual Return Reminders", desc: "Set up reminders for federal and state annual tax filings." },
];

const TaxSetupCenter = () => {
  const t = useT();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const toggle = (key: string) => {
    setCompleted(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };
  const progress = Math.round((completed.size / taxChecklist.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/business" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">D.O.M.E.</span>
          </Link>
          <BackButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Landmark className="w-6 h-6 text-secondary" />
          <h1 className="font-display text-2xl font-bold">{t("tax.title")}</h1>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t("tax.progress")}</span>
              <span className="text-sm font-bold text-secondary">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-secondary" />
              {t("tax.checklist")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {taxChecklist.map(item => (
              <div
                key={item.key}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  completed.has(item.key) ? "border-secondary/50 bg-secondary/5" : "border-border hover:border-secondary/30"
                }`}
                onClick={() => toggle(item.key)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox checked={completed.has(item.key)} className="mt-0.5" />
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {item.label}
                      {completed.has(item.key) && <CheckCircle2 className="w-4 h-4 text-secondary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="font-display font-semibold text-lg">{t("tax.hireTaxTeam")}</h3>
              <p className="text-muted-foreground text-sm mt-1">{t("tax.hireTaxTeamDesc")}</p>
            </div>
            <Link to="/business/hire-help">
              <Button className="gap-2 bg-secondary hover:bg-secondary/90 whitespace-nowrap">
                <Shield className="w-4 h-4" /> {t("tax.getTaxHelp")} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Tax Disclaimer:</strong> {t("tax.disclaimer")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaxSetupCenter;
