import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Mic, Award, Video, GraduationCap, Users, Calendar,
  Headphones, Star, ArrowRight, Building2, Heart, Briefcase, Globe,
} from "lucide-react";
import { useT } from "@/hooks/useT";

const FEATURES = [
  { to: "/portal/english/placement", icon: GraduationCap, titleKey: "Placement Test", descKey: "Find your English level in 10 minutes", color: "bg-emerald-500/10 text-emerald-600" },
  { to: "/portal/english/practice", icon: Mic, titleKey: "Voice Practice", descKey: "Speak, get instant AI feedback", color: "bg-secondary/10 text-secondary" },
  { to: "/portal/english/student", icon: BookOpen, titleKey: "My Dashboard", descKey: "Track courses, progress, and classes", color: "bg-primary/10 text-primary" },
  { to: "/portal/english/curriculum", icon: Star, titleKey: "Full Curriculum", descKey: "120 lessons across 4 levels", color: "bg-amber-500/10 text-amber-600" },
  { to: "/portal/english/lessons", icon: Calendar, titleKey: "Private Lessons", descKey: "1-on-1 with a teacher", color: "bg-blue-500/10 text-blue-600" },
  { to: "/portal/english/pricing", icon: Award, titleKey: "Plans & Pricing", descKey: "Free, Basic, Pro, Premium", color: "bg-purple-500/10 text-purple-600" },
  { to: "/portal/english/employer", icon: Building2, titleKey: "Employer Training", descKey: "Workforce English programs", color: "bg-orange-500/10 text-orange-600" },
  { to: "/portal/english/nonprofit", icon: Heart, titleKey: "Nonprofit Access", descKey: "Sponsor learners in bulk", color: "bg-rose-500/10 text-rose-600" },
];

const CATEGORIES = [
  "Beginner English", "Everyday English", "English for Work",
  "Immigration Interview Prep", "Citizenship Test Prep",
  "Customer Service English", "Healthcare English", "Construction & Trades",
];

const EnglishHome = () => {
  const t = useT();

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8 pb-24">
      {/* ── Hero ── */}
      <div className="rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 md:p-10 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative z-10">
          <Badge className="bg-secondary text-secondary-foreground mb-3">
            {t("engHome.badge")}
          </Badge>
          <h1 className="text-2xl md:text-4xl font-display font-bold leading-tight">
            {t("engHome.title")}
          </h1>
          <p className="text-primary-foreground/80 mt-2 max-w-xl text-sm md:text-base">
            {t("engHome.subtitle")}
          </p>
          <p className="text-primary-foreground/60 text-xs mt-1">
            {t("engHome.tagline")}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link to="/portal/english/placement">
                <GraduationCap className="w-4 h-4 mr-2" /> {t("engHome.testLevel")}
              </Link>
            </Button>
            <Button asChild variant="outline-light" size="lg">
              <Link to="/portal/english/curriculum">
                <BookOpen className="w-4 h-4 mr-2" /> {t("engHome.exploreCourses")}
              </Link>
            </Button>
            <Button asChild variant="outline-light" size="lg">
              <Link to="/portal/english/practice">
                <Mic className="w-4 h-4 mr-2" /> {t("engHome.practiceSpeaking")}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Feature Grid ── */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{t("engHome.everythingYouNeed")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FEATURES.map((f) => (
            <Link key={f.to} to={f.to}>
              <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full">
                <CardContent className="p-4 text-center space-y-2">
                  <div className={`w-11 h-11 mx-auto rounded-xl flex items-center justify-center ${f.color}`}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold">{f.titleKey}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{f.descKey}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Course Categories ── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{t("engHome.courseCategories")}</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Badge key={cat} variant="outline" className="text-xs py-1.5 px-3 cursor-pointer hover:bg-secondary/10 transition-colors">
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* ── How It Works ── */}
      <Card className="border-secondary/20">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-center">{t("engHome.howItWorks")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { step: "1", title: "Take Placement Test", desc: "Find your level" },
              { step: "2", title: "Choose Your Path", desc: "Courses, classes, or practice" },
              { step: "3", title: "Learn & Practice", desc: "Voice AI + live teachers" },
              { step: "4", title: "Earn Certificate", desc: "Show your progress" },
            ].map((s) => (
              <div key={s.step} className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                  {s.step}
                </div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { value: "120+", label: "Lessons" },
          { value: "4", label: "Levels" },
          { value: "50+", label: "Voice Scenarios" },
          { value: "4", label: "Certificates" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-secondary">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── CTA Banner ── */}
      <Card className="bg-gradient-to-r from-secondary/10 to-primary/5 border-secondary/20">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-semibold text-lg">{t("engHome.startJourney")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("engHome.journeyDesc")}
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/portal/english/placement">
              {t("common.getStarted")} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* ── Disclaimer ── */}
      <p className="text-[10px] text-muted-foreground/70 text-center italic">
        {t("engHome.disclaimer")}
      </p>
    </div>
  );
};

export default EnglishHome;
