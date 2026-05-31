import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Briefcase, Building2, FileText, DollarSign, TrendingUp, Users, Rocket, ClipboardCheck } from "lucide-react";
import { useT } from "@/hooks/useT";

const workflows = [
  { title: "Business Launch Center", desc: "Access the full D.O.M.E. Business Launch platform for LLC, Corp, and Nonprofit formation", icon: Rocket, count: 12 },
  { title: "LLC & Corporation Formation", desc: "Guided workflows for entity formation with state-specific requirements", icon: Building2, count: 8 },
  { title: "Nonprofit Formation", desc: "501(c)(3) and other nonprofit formation guidance and document prep", icon: FileText, count: 3 },
  { title: "EIN & Tax Setup", desc: "Federal EIN application guidance and state tax registration workflows", icon: DollarSign, count: 10 },
];

const EntrepreneurPrograms = () => {
  const t = useT();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("govEntrepreneur.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("govEntrepreneur.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: t("govEntrepreneur.entrepreneurParticipants"), value: "25", icon: Users },
          { label: t("govEntrepreneur.businessesLaunched"), value: "8", icon: Rocket },
          { label: t("govEntrepreneur.formationInProgress"), value: "11", icon: Building2 },
          { label: t("govEntrepreneur.avgReadiness"), value: "58%", icon: TrendingUp },
        ].map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <s.icon className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map((w) => (
          <Card key={w.title} className="border-border hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-secondary/10">
                  <w.icon className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{w.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{w.desc}</p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline" className="text-[10px]">{t("govEntrepreneur.participants", { count: w.count })}</Badge>
                    <Button size="sm" variant="outline" className="text-xs h-7">{t("govEntrepreneur.view")}</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            {t("govEntrepreneur.readinessChecklist")}
          </CardTitle>
          <CardDescription>{t("govEntrepreneur.checklistDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { step: "Business Idea Validated", pct: 88 },
            { step: "Entity Type Selected", pct: 72 },
            { step: "Formation Documents Prepared", pct: 52 },
            { step: "EIN Obtained", pct: 40 },
            { step: "Tax Registration Complete", pct: 32 },
            { step: "Business Operational", pct: 20 },
          ].map((item) => (
            <div key={item.step} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-foreground">{item.step}</span>
                <span className="text-muted-foreground">{item.pct}%</span>
              </div>
              <Progress value={item.pct} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border bg-muted/30">
        <CardContent className="p-5">
          <h3 className="font-semibold text-foreground text-sm mb-2">{t("govEntrepreneur.designedFor")}</h3>
          <div className="flex flex-wrap gap-2">
            {["SBA-Aligned Programs", "City Economic Development", "Nonprofit Accelerators", "Immigrant Business Support"].map((uc) => (
              <Badge key={uc} variant="outline" className="text-xs">{uc}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-[11px] text-muted-foreground text-center py-3">
        {t("common.disclaimerLong")}
      </div>
    </div>
  );
};

export default EntrepreneurPrograms;
