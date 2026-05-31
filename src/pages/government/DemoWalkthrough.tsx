import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, Globe, Monitor, FileCheck, Smartphone, Rocket, BarChart3,
  ArrowRight, Play, Clock, CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useT } from "@/hooks/useT";

const steps = [
  { step: 1, title: "Create a D.O.M.E. User Account", desc: "Simple onboarding with role selection. Participants choose between Client, Attorney, or DOJ Accredited Representative. The system auto-assigns roles and creates profiles.", icon: Users, highlights: ["One-click signup", "Role-based access", "Automatic profile creation"], duration: "30 seconds" },
  { step: 2, title: "Immigration Passport Profile", desc: "Each participant builds a comprehensive digital profile including personal information, immigration history, family details, and employment records — their complete case snapshot.", icon: Globe, highlights: ["Biographic data", "Immigration history", "Family & employment records"], duration: "45 seconds" },
  { step: 3, title: "Case Dashboard", desc: "A centralized view of all active cases, deadlines, milestones, document status, and readiness scores. Staff and participants see role-appropriate views.", icon: Monitor, highlights: ["Readiness score", "Deadline tracking", "Milestone progress"], duration: "30 seconds" },
  { step: 4, title: "Document Vault", desc: "Securely upload, organize, and manage immigration documents. Documents are categorized, tagged to forms, and quality-checked with status tracking.", icon: FileCheck, highlights: ["Encrypted storage", "Auto-categorization", "Quality indicators"], duration: "30 seconds" },
  { step: 5, title: "Voice-Assisted Form Completion", desc: "Participants answer questions by voice in their preferred language. D.O.M.E. transcribes, translates, and populates form fields — reducing barriers for low-literacy users.", icon: Smartphone, highlights: ["Multilingual voice input", "Auto-population", "Accessibility-first"], duration: "45 seconds" },
  { step: 6, title: "Pathway Finder System", desc: "Rule-based eligibility assessment across 20+ immigration pathways. Generates a readiness report, identifies missing documents, and suggests next steps.", icon: Rocket, highlights: ["20+ pathways", "Eligibility scoring", "Action plan generation"], duration: "30 seconds" },
  { step: 7, title: "Government Dashboard Overview", desc: "Monitor all participants, track service delivery outcomes, generate grant-ready reports, and manage staff assignments — all with tenant-isolated data security.", icon: BarChart3, highlights: ["Real-time analytics", "Grant reporting", "Staff management"], duration: "30 seconds" },
];

const DemoWalkthrough = () => {
  const t = useT();
  const totalTime = "3–5 minutes";

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Badge className="bg-secondary text-secondary-foreground text-xs uppercase tracking-wider">
            <Play className="w-3 h-3 mr-1" /> {t("govDemo.platformDemo")}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" /> {totalTime}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{t("govDemo.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("govDemo.subtitle")}</p>
      </div>

      <div className="relative">
        <div className="absolute left-[23px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary via-secondary to-[hsl(var(--gold))] hidden md:block" />
        <div className="space-y-6">
          {steps.map((s) => (
            <div key={s.step} className="flex gap-5">
              <div className="relative z-10 shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-lg border-4 border-background">
                  {s.step}
                </div>
              </div>
              <Card className="flex-1 border-border hover:shadow-lg transition-shadow group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-accent">
                          <s.icon className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <h3 className="font-bold text-foreground text-lg">{s.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {s.highlights.map((h) => (
                          <div key={h} className="flex items-center gap-1.5 text-xs text-foreground">
                            <CheckCircle className="w-3 h-3 text-[hsl(var(--success))]" />
                            {h}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      <Clock className="w-2.5 h-2.5 mr-1" /> {s.duration}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <Card className="border-secondary bg-secondary/5">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{t("govDemo.readyToSee")}</h3>
            <p className="text-sm text-muted-foreground">{t("govDemo.scheduleCTA")}</p>
          </div>
          <Link to="/gov/partnerships#demo">
            <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 whitespace-nowrap">
              {t("govDemo.requestLiveDemo")} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="text-[11px] text-muted-foreground text-center py-3 border-t border-border">
        {t("common.disclaimerLong")}
      </div>
    </div>
  );
};

export default DemoWalkthrough;
