import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle, Globe, Briefcase, CreditCard, FileText,
  CheckCircle2, ChevronRight, Info, Loader2, ShieldAlert,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMyCase } from "@/hooks/useMyCase";
import { useCaseDocuments, useCaseFormInstances, useCasePersons, useCaseConsistencyIssues } from "@/hooks/useCases";
import { useNavigate } from "react-router-dom";
import { useT } from "@/hooks/useT";

/* SVG Gauge */
const ReadinessGauge = ({ score }: { score: number }) => {
  const radius = 80;
  const cx = 100;
  const cy = 100;
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;
  const scoreAngle = startAngle + (totalAngle * score) / 100;

  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const segments = [
    { from: 0, to: 25, color: "hsl(0,84%,60%)" },
    { from: 25, to: 50, color: "hsl(22,76%,53%)" },
    { from: 50, to: 75, color: "hsl(38,92%,50%)" },
    { from: 75, to: 90, color: "hsl(142,71%,45%)" },
    { from: 90, to: 100, color: "hsl(218,41%,21%)" },
  ];

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 200 160" className="w-52 h-auto">
        <path d={describeArc(startAngle, endAngle)} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round" />
        {segments.map((seg, i) => {
          const segStart = startAngle + (totalAngle * seg.from) / 100;
          const segEnd = startAngle + (totalAngle * Math.min(seg.to, score)) / 100;
          if (score < seg.from) return null;
          return <path key={i} d={describeArc(segStart, segEnd)} fill="none" stroke={seg.color} strokeWidth="14" strokeLinecap="round" />;
        })}
        {(() => {
          const pos = polarToCartesian(scoreAngle);
          return <circle cx={pos.x} cy={pos.y} r="6" fill="hsl(var(--foreground))" />;
        })()}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-4xl font-bold text-foreground">{score}%</span>
        <span className="text-sm text-muted-foreground font-medium">Case Ready</span>
      </div>
    </div>
  );
};

const CaseReadiness = () => {
  const t = useT();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: myCase, isLoading: caseLoading } = useMyCase();
  const { data: documents = [] } = useCaseDocuments(myCase?.id);
  const { data: forms = [] } = useCaseFormInstances(myCase?.id);
  const { data: persons = [] } = useCasePersons(myCase?.id);
  const { data: issues = [] } = useCaseConsistencyIssues(myCase?.id);

  // --- Real scoring ---
  const formsScore = forms.length
    ? Math.round(forms.reduce((acc, f) => acc + (f.progress || 0), 0) / forms.length)
    : 0;
  const docsApproved = documents.filter(d => d.status === "approved").length;
  const docsScore = documents.length
    ? Math.round((docsApproved / documents.length) * 100)
    : 0;
  const unresolvedIssues = issues.filter(i => !i.resolved);
  const consistencyScore = issues.length
    ? Math.round(((issues.length - unresolvedIssues.length) / issues.length) * 100)
    : 100; // no issues = perfect

  // Weighted: forms 40%, docs 30%, consistency 15%, persons 15%
  const readinessScore = myCase
    ? Math.round(
        formsScore * 0.4 +
        docsScore * 0.3 +
        consistencyScore * 0.15 +
        (persons.length > 0 ? 100 : 0) * 0.15
      )
    : 0;

  // Missing items
  const missingItems: { icon: any; label: string; action: string; route: string }[] = [];
  if (persons.length === 0)
    missingItems.push({ icon: Globe, label: "Petitioner / Beneficiary Info", action: "Add", route: "/portal/passport" });
  if (documents.filter(d => d.category === "identity").length === 0)
    missingItems.push({ icon: CreditCard, label: "Passport / ID Scan", action: "Upload", route: "/portal/documents" });
  if (documents.filter(d => d.category === "employment").length === 0)
    missingItems.push({ icon: Briefcase, label: "Employment Verification", action: "Upload", route: "/portal/documents" });
  if (forms.filter(f => f.status === "not_started").length > 0)
    missingItems.push({ icon: FileText, label: `${forms.filter(f => f.status === "not_started").length} form(s) not started`, action: "Complete", route: "/portal/forms" });
  if (unresolvedIssues.length > 0)
    missingItems.push({ icon: ShieldAlert, label: `${unresolvedIssues.length} consistency issue(s)`, action: "Review", route: "/portal/forms" });

  const completedItems = [
    ...(persons.length > 0 ? [{ text: `${persons.length} person(s) on file` }] : []),
    ...(docsApproved > 0 ? [{ text: `${docsApproved} document(s) approved` }] : []),
    ...(forms.filter(f => f.status === "completed" || f.status === "submitted").length > 0
      ? [{ text: `${forms.filter(f => f.status === "completed" || f.status === "submitted").length} form(s) completed` }]
      : []),
    ...(unresolvedIssues.length === 0 && issues.length > 0 ? [{ text: "All consistency issues resolved" }] : []),
  ];

  // Sub-scores for breakdown
  const breakdownItems = [
    { label: t("caseReady.formsCompletion"), value: formsScore },
    { label: t("caseReady.evidenceDocs"), value: docsScore },
    { label: t("caseReady.dataConsistency"), value: consistencyScore },
    { label: t("caseReady.profileCompleteness"), value: persons.length > 0 ? 100 : 0 },
  ];

  if (caseLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!myCase) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-display font-bold text-foreground">{t("caseReady.noCase")}</h2>
        <p className="text-sm text-muted-foreground">{t("caseReady.noCaseDesc")}</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 max-w-lg mx-auto space-y-5">
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-display font-bold text-foreground">{t("caseReady.title")}</h1>
        <div className="w-16 h-0.5 bg-secondary mx-auto rounded-full" />
        <p className="text-sm text-muted-foreground">{t("caseReady.subtitle")}</p>
      </div>

      <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-4 flex justify-center">
        <ReadinessGauge score={readinessScore} />
      </div>

      {/* Score Breakdown */}
      <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-4 space-y-3">
        <h2 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
          <Info className="w-4 h-4 text-secondary" /> {t("caseReady.scoreBreakdown")}
        </h2>
        {breakdownItems.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium text-foreground">{item.value}%</span>
            </div>
            <Progress value={item.value} className="h-1.5" />
          </div>
        ))}
      </div>

      {/* Missing Information */}
      {missingItems.length > 0 && (
        <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <h2 className="text-base font-display font-semibold text-foreground">{t("caseReady.missingInfo")}</h2>
          </div>
          <div className="divide-y divide-border">
            {missingItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(item.route)}
              >
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-secondary" />
                </div>
                <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                <Badge variant="outline" className="text-xs font-medium border-secondary/30 text-secondary">
                  {item.action}
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Sections */}
      {completedItems.length > 0 && (
        <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h2 className="text-base font-display font-semibold text-foreground">{t("caseReady.completed")}</h2>
          </div>
          <div className="divide-y divide-border">
            {completedItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <span className="flex-1 text-sm text-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={() => navigate("/portal/forms")}
        className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl shadow-md"
      >
        {t("caseReady.continueImproving")}
      </Button>

      <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Packet Readiness {readinessScore}% Complete</span>
        </div>
        <Progress value={readinessScore} className="h-2" />
        <p className="text-xs text-center text-muted-foreground">Export Available at 90%</p>
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center pb-4">
        D.O.M.E. provides educational tools and document organization. D.O.M.E. does not provide legal advice.
      </p>
    </div>
  );
};

export default CaseReadiness;
