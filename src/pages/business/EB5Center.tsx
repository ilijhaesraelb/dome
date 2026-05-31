import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, AlertTriangle, Shield, FileText, Upload, CheckCircle2, Scale, Users } from "lucide-react";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import { useT } from "@/hooks/useT";

const eb5Basics = [
  { icon: DollarSign, title: "Investment Thresholds", desc: "$1,050,000 standard investment or $800,000 in a Targeted Employment Area (TEA) or infrastructure project." },
  { icon: Users, title: "Job Creation", desc: "Investment must create or preserve at least 10 full-time jobs for qualifying U.S. workers." },
  { icon: Scale, title: "New Commercial Enterprise", desc: "Investment must be in a new commercial enterprise established after November 29, 1990, or restructured/expanded." },
];

const readinessChecklist = [
  { key: "source_funds", label: "Source of Funds Documentation", desc: "Tax returns, bank statements, business records, inheritance documents" },
  { key: "business_plan", label: "Business Plan", desc: "Comprehensive plan showing job creation and investment structure" },
  { key: "legal_structure", label: "Legal Entity Structure", desc: "Business formation documents for the commercial enterprise" },
  { key: "job_creation", label: "Job Creation Plan", desc: "Detailed plan showing how 10+ full-time positions will be created" },
  { key: "tee_designation", label: "TEA Designation (if applicable)", desc: "Documentation supporting Targeted Employment Area qualification" },
  { key: "attorney_review", label: "Attorney Consultation", desc: "Review with qualified immigration attorney experienced in EB-5" },
];

const EB5Center = () => {
  const t = useT();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const toggle = (key: string) => {
    setCompleted(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

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
          <DollarSign className="w-6 h-6 text-secondary" />
          <h1 className="font-display text-2xl font-bold">{t("eb5.title")}</h1>
        </div>

        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 font-medium text-sm">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              {t("eb5.importantDisclosures")}
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-7 list-disc">
              <li>EB-5 outcomes depend on law, facts, documentation, and adjudication.</li>
              <li>D.O.M.E. does not guarantee visa or green card approval.</li>
              <li>Investment opportunities may involve securities laws and must be reviewed by qualified legal and financial professionals.</li>
              <li>D.O.M.E. does not provide investment advice or securities brokerage services.</li>
            </ul>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {eb5Basics.map(item => (
            <Card key={item.title}>
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("eb5.directVsRegional")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 rounded-lg border">
              <div className="font-medium text-sm">Direct EB-5</div>
              <p className="text-xs text-muted-foreground mt-0.5">Investor directly manages or controls the commercial enterprise and must demonstrate direct job creation.</p>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="font-medium text-sm">Regional Center EB-5</div>
              <p className="text-xs text-muted-foreground mt-0.5">Investment through a USCIS-designated regional center. May count indirect and induced jobs toward the 10-job requirement.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-secondary" />
              {t("eb5.readinessChecklist")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {readinessChecklist.map(item => (
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-secondary" />
              {t("eb5.documentUpload")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-xl p-8 text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t("eb5.uploadDesc")}</p>
              <Button variant="outline" className="mt-4">{t("eb5.selectFiles")}</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Link to="/business/hire-help">
            <Button className="gap-2 bg-secondary hover:bg-secondary/90">
              <Shield className="w-4 h-4" /> {t("eb5.consultAttorney")}
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground text-center">{t("eb5.disclaimer")}</p>
      </div>
    </div>
  );
};

export default EB5Center;
