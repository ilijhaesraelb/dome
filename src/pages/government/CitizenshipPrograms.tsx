import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, BookOpen, ClipboardCheck, Users, FileText, Award, Calendar, TrendingUp } from "lucide-react";
import { useT } from "@/hooks/useT";

const CitizenshipPrograms = () => {
  const t = useT();

  const modules = [
    { titleKey: "Civics Preparation", descKey: "100 civics questions, practice tests, and study materials", icon: BookOpen, status: "active", participants: 34 },
    { titleKey: "N-400 Document Prep", descKey: "Document checklist and organization for naturalization application", icon: FileText, status: "active", participants: 28 },
    { titleKey: "Interview Preparation", descKey: "Mock interview practice and English proficiency exercises", icon: ClipboardCheck, status: "active", participants: 22 },
    { titleKey: "Digital Study Modules", descKey: "Self-paced learning modules for civics and English", icon: GraduationCap, status: "active", participants: 41 },
  ];

  const milestones = [
    { name: "Enrolled", count: 48, pct: 100 },
    { name: "Civics Started", count: 42, pct: 87 },
    { name: "Documents Ready", count: 31, pct: 65 },
    { name: "Interview Ready", count: 22, pct: 46 },
    { name: "Application Filed", count: 15, pct: 31 },
    { name: "Naturalized", count: 8, pct: 17 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("govCitizenship.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("govCitizenship.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: t("govCitizenship.totalEnrollments"), value: "48", icon: Users },
          { label: t("govCitizenship.avgReadiness"), value: "64%", icon: TrendingUp },
          { label: t("govCitizenship.naturalized"), value: "8", icon: Award },
          { label: t("govCitizenship.upcomingInterviews"), value: "6", icon: Calendar },
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

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">{t("govCitizenship.milestoneFunnel")}</CardTitle>
          <CardDescription>{t("govCitizenship.funnelDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.map((m) => (
            <div key={m.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">{m.name}</span>
                <span className="text-muted-foreground">{m.count} ({m.pct}%)</span>
              </div>
              <Progress value={m.pct} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">{t("govCitizenship.programModules")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod) => (
            <Card key={mod.titleKey} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <mod.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{mod.titleKey}</h3>
                      <Badge variant="secondary" className="text-[10px]">{t("govCitizenship.participants", { count: mod.participants })}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{mod.descKey}</p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="text-xs">{t("govCitizenship.viewDetails")}</Button>
                      <Button size="sm" variant="outline" className="text-xs">{t("govCitizenship.assignStaff")}</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-border bg-muted/30">
        <CardContent className="p-5">
          <h3 className="font-semibold text-foreground text-sm mb-2">{t("govCitizenship.designedFor")}</h3>
          <div className="flex flex-wrap gap-2">
            {["USCIS-Funded Programs", "Nonprofit Naturalization Education", "City Immigrant Affairs Offices", "Community-Based Organizations"].map((uc) => (
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

export default CitizenshipPrograms;
