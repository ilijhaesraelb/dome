import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Heart, CheckCircle2, AlertTriangle, Shield, FileText, Building2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import { useT } from "@/hooks/useT";

const checklistItems = [
  { key: "state_incorporation", label: "State Nonprofit Incorporation", desc: "File articles of incorporation with your state's filing office." },
  { key: "ein", label: "IRS EIN (Employer Identification Number)", desc: "Apply for an EIN through the IRS — needed for banking, taxes, and exemption applications." },
  { key: "bylaws", label: "Bylaws", desc: "Draft bylaws that govern how your nonprofit operates." },
  { key: "board", label: "Board of Directors Setup", desc: "Appoint initial board members with defined roles and responsibilities." },
  { key: "conflict_policy", label: "Conflict of Interest Policy", desc: "Required by the IRS for 501(c)(3) applications." },
  { key: "organizing_minutes", label: "Organizational Minutes", desc: "Record the first meeting of your board of directors." },
  { key: "charitable_purpose", label: "Charitable Purpose Statement", desc: "Clearly define your mission consistent with IRS exemption requirements." },
  { key: "form_1023", label: "IRS Form 1023 / 1023-EZ Readiness", desc: "Prepare for federal tax-exempt status application. Applications are generally submitted electronically." },
  { key: "state_registration", label: "State Charitable Registration", desc: "Register in states where you solicit donations." },
  { key: "annual_filings", label: "Annual Filing Reminders", desc: "Set up reminders for Form 990 and state annual reports." },
];

const NonprofitCenter = () => {
  const t = useT();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const progress = Math.round((completed.size / checklistItems.length) * 100);

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
          <Heart className="w-6 h-6 text-secondary" />
          <h1 className="font-display text-2xl font-bold">{t("nonprofit.title")}</h1>
        </div>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">{t("common.importantNotice")}: {t("nonprofit.stateVsFederal")}</p>
              <p className="text-muted-foreground mt-1">{t("nonprofit.stateVsFederalDesc")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t("nonprofit.readinessProgress")}</span>
              <Badge variant={progress === 100 ? "default" : "outline"}>{progress}%</Badge>
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
              {t("nonprofit.formationChecklist")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklistItems.map(item => (
              <div
                key={item.key}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
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

        <div className="flex flex-wrap gap-3">
          <Link to="/business/formation">
            <Button className="gap-2 bg-secondary hover:bg-secondary/90">
              <Building2 className="w-4 h-4" /> {t("nonprofit.startFormation")}
            </Button>
          </Link>
          <Link to="/business/hire-help">
            <Button variant="outline" className="gap-2">
              <Shield className="w-4 h-4" /> {t("biz.hireHelp")}
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground text-center">{t("nonprofit.disclaimer")}</p>
      </div>
    </div>
  );
};

export default NonprofitCenter;
