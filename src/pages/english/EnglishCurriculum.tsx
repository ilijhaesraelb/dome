import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import BackButton from "@/components/BackButton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Mic,
  Award,
  ChevronRight,
  GraduationCap,
  Volume2,
  Lock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { CURRICULUM, TOTAL_LESSONS, TOTAL_MODULES, type EnglishLevel } from "@/data/englishCurriculum";
import { useT } from "@/hooks/useT";

const LEVEL_COLORS: Record<EnglishLevel, string> = {
  beginner: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  basic: "bg-blue-500/10 text-blue-700 border-blue-200",
  workplace: "bg-amber-500/10 text-amber-700 border-amber-200",
  advanced: "bg-purple-500/10 text-purple-700 border-purple-200",
};

const LEVEL_ICONS: Record<EnglishLevel, string> = {
  beginner: "🌱",
  basic: "💬",
  workplace: "💼",
  advanced: "🎓",
};

const EnglishCurriculum = () => {
  const t = useT();
  const [activeLevel, setActiveLevel] = useState<EnglishLevel>("beginner");
  const selectedLevel = CURRICULUM.find((l) => l.id === activeLevel)!;

  const speakPrompt = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.8;
    speechSynthesis.speak(u);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24">
      <BackButton />

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">
          📚 {t("engCurr.title")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          English for Migration, Work &amp; Opportunity —{" "}
          <span className="font-medium text-foreground">{TOTAL_LESSONS} lessons</span> across{" "}
          <span className="font-medium text-foreground">{TOTAL_MODULES} modules</span>
        </p>
      </div>

      {/* Level selector tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CURRICULUM.map((level) => (
          <button
            key={level.id}
            onClick={() => setActiveLevel(level.id)}
            className={`rounded-xl border-2 p-3 text-left transition-all ${
              activeLevel === level.id
                ? "border-secondary shadow-md"
                : "border-border hover:border-secondary/40"
            }`}
          >
            <p className="text-xl mb-1">{LEVEL_ICONS[level.id]}</p>
            <p className="font-semibold text-sm">{level.subtitle}</p>
            <p className="text-xs text-muted-foreground truncate">{level.title}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {level.lessonCount} lessons · {level.modules.length} modules
            </p>
          </button>
        ))}
      </div>

      {/* Selected level detail */}
      <Card className="border-secondary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <Badge className={LEVEL_COLORS[activeLevel]}>
                {LEVEL_ICONS[activeLevel]} {selectedLevel.subtitle}
              </Badge>
              <CardTitle className="text-xl mt-2">{selectedLevel.title}</CardTitle>
            </div>
            <Award className="w-8 h-8 text-secondary/30" />
          </div>
          <p className="text-sm text-muted-foreground">{selectedLevel.goal}</p>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> {selectedLevel.lessonCount} lessons
            </span>
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> {selectedLevel.modules.length} modules
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> {selectedLevel.certificate}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Modules + Lessons */}
      <Accordion type="multiple" defaultValue={[selectedLevel.modules[0]?.id]} className="space-y-3">
        {selectedLevel.modules.map((mod) => (
          <AccordionItem
            key={mod.id}
            value={mod.id}
            className="border rounded-xl overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3 text-left">
                <span className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-sm font-bold text-secondary shrink-0">
                  {mod.number}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Module {mod.number}: {mod.title}</p>
                  <p className="text-xs text-muted-foreground">{mod.lessons.length} lessons</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-2">
              {/* Voice practice prompt for module */}
              {mod.voicePrompt && (
                <div className="bg-accent/50 rounded-lg p-3 flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mic className="w-4 h-4 text-secondary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Voice Practice
                      </p>
                      <p className="text-sm font-medium truncate">
                        &ldquo;{mod.voicePrompt}&rdquo;
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => speakPrompt(mod.voicePrompt!)}
                  >
                    <Volume2 className="w-3.5 h-3.5 mr-1" /> Listen
                  </Button>
                </div>
              )}

              {/* Lesson list */}
              {mod.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
                      {lesson.number}
                    </span>
                    <p className="text-sm font-medium truncate">{lesson.title}</p>
                  </div>
                  <Link to="/portal/english/practice">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      Practice <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Certificate callout */}
      <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 to-transparent">
        <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4">
          <Award className="w-12 h-12 text-secondary shrink-0" />
          <div className="text-center sm:text-left flex-1">
            <p className="font-semibold">{selectedLevel.certificate}</p>
            <p className="text-sm text-muted-foreground">
              Complete all {selectedLevel.lessonCount} lessons to earn your certificate.
            </p>
            <p className="text-[10px] text-muted-foreground italic mt-1">
              This certificate reflects course completion and is not a government or degree credential.
            </p>
          </div>
          <Button asChild>
            <Link to="/portal/english">
              Start Learning <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground/70 text-center italic">
        D.O.M.E. provides English language learning support and communication training.
        These courses are not accredited academic degree programs.
      </p>
    </div>
  );
};

export default EnglishCurriculum;
