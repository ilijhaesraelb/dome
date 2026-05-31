import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Home, Briefcase, GraduationCap, Stethoscope, Building2, Globe, Users, Settings } from "lucide-react";
import { useT } from "@/hooks/useT";

const modules = [
  { title: "Document Organization", desc: "Help newcomers organize essential documents for life in the U.S.", icon: Building2, active: true },
  { title: "Housing & Relocation", desc: "Resource listings for housing, relocation, and settlement support", icon: Home, active: true },
  { title: "Job Readiness & Opportunities", desc: "Employment referrals, resume tools, and workforce readiness", icon: Briefcase, active: true },
  { title: "Education & Scholarships", desc: "Access to educational programs, ESL, and scholarship databases", icon: GraduationCap, active: true },
  { title: "Health & Community", desc: "Health resources, mental health support, and community connections", icon: Stethoscope, active: false },
  { title: "Entrepreneurship Launch", desc: "Guidance on starting a business in the United States", icon: Building2, active: true },
  { title: "Nonprofit & Community Support", desc: "Referrals to community organizations and support networks", icon: Heart, active: true },
  { title: "Multilingual Orientation", desc: "Orientation modules available in 7+ languages", icon: Globe, active: true },
];

const IntegrationPrograms = () => {
  const t = useT();
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("govIntegration.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("govIntegration.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          {t("govIntegration.configureModules")}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: t("govIntegration.activeParticipants"), value: "29", icon: Users },
          { label: t("govIntegration.modulesEnabled"), value: "7/8", icon: Building2 },
          { label: t("govIntegration.resourcesListed"), value: "142", icon: Heart },
          { label: t("govIntegration.languages"), value: "7", icon: Globe },
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

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">{t("govIntegration.integrationModules")}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t("govIntegration.modulesDesc")}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((mod) => (
            <Card key={mod.title} className={`border-border ${!mod.active ? "opacity-60" : "hover:shadow-md"} transition-shadow`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${mod.active ? "bg-primary/10" : "bg-muted"}`}>
                    <mod.icon className={`w-5 h-5 ${mod.active ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{mod.title}</h3>
                      <Badge variant={mod.active ? "default" : "outline"} className="text-[10px]">
                        {mod.active ? t("govIntegration.active") : t("govIntegration.disabled")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{mod.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground text-center py-3">
        {t("common.disclaimerLong")}
      </div>
    </div>
  );
};

export default IntegrationPrograms;
