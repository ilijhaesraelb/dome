import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scale, BookOpen, ClipboardList, Globe, Bell, FileText, Users, ArrowRight } from "lucide-react";
import { useT } from "@/hooks/useT";

const modules = [
  { title: "Guided Legal Orientation", desc: "Step-by-step modules explaining immigration processes in plain language", icon: BookOpen, participants: 45 },
  { title: "Plain-Language Explanations", desc: "Process breakdowns for hearings, filings, and documentation requirements", icon: FileText, participants: 38 },
  { title: "Court Preparation Checklists", desc: "Organized checklists to help participants prepare for hearings", icon: ClipboardList, participants: 27 },
  { title: "Document Organization", desc: "Tools for organizing and tracking required documents", icon: Scale, participants: 52 },
  { title: "Referral Routing", desc: "Connect participants with accredited representatives or attorneys", icon: ArrowRight, participants: 19 },
  { title: "Multilingual Content", desc: "Educational materials available in 7+ languages", icon: Globe, participants: 61 },
];

const LegalOrientation = () => {
  const t = useT();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("govLegal.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("govLegal.subtitle")}</p>
      </div>

      <Card className="border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]">
        <CardContent className="p-4 flex items-start gap-3">
          <Scale className="w-5 h-5 text-[hsl(var(--gold))] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">{t("govLegal.educationalOnly")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("govLegal.educationalDesc")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("govLegal.participantsEngaged"), value: "87", icon: Users },
          { label: t("govLegal.modulesCompleted"), value: "312", icon: BookOpen },
          { label: t("govLegal.referralsMade"), value: "19", icon: ArrowRight },
        ].map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <Card key={mod.title} className="border-border hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="p-2.5 rounded-lg bg-primary/10 w-fit mb-3">
                <mod.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{mod.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-3">{mod.desc}</p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px]">{t("govLegal.participants", { count: mod.participants })}</Badge>
                <Button size="sm" variant="ghost" className="text-xs h-7">{t("govLegal.manage")}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-[hsl(var(--warning))]" />
            {t("govLegal.hearingReminders")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { participant: "Maria G.", date: "Mar 15, 2026", type: "Individual Hearing" },
              { participant: "Carlos R.", date: "Mar 18, 2026", type: "Master Calendar" },
              { participant: "Fatima A.", date: "Mar 22, 2026", type: "Merit Hearing" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.participant}</p>
                  <p className="text-xs text-muted-foreground">{item.type}</p>
                </div>
                <Badge variant="outline" className="text-xs">{item.date}</Badge>
              </div>
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

export default LegalOrientation;
