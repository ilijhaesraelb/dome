import { useState, useCallback } from "react";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Compass, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Info,
  Shield, HelpCircle, Loader2, Mic, Star, XCircle, Clock, FileText, ChevronRight, Globe, CalendarIcon
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import VoiceInput from "@/components/VoiceInput";
import domeLogo from "@/assets/dome-logo.png";
import { type Locale, LOCALE_LABELS, t, getGoals } from "@/i18n/pathwayTranslations";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Question = {
  id: string;
  title: string;
  prompt_plain: string;
  help_plain: string;
  answer_type: string;
  choices: { value: string; label: string }[];
  examples: unknown[];
};

type PathwayResult = {
  pathway_id: string;
  display_name: string;
  category: string;
  description: string;
  requires_rep_review: boolean;
  status: "STRONG" | "POSSIBLE" | "NOT_ELIGIBLE" | "NEEDS_INFO";
  score: number;
  reasons: string[];
  risk_flags: string[];
};

type Step = "welcome" | "disclaimer" | "intake" | "computing" | "results";

const statusConfig = {
  STRONG: { color: "bg-success text-success-foreground", icon: CheckCircle2, label: "Strong Match" },
  POSSIBLE: { color: "bg-warning text-warning-foreground", icon: Info, label: "Possible" },
  NEEDS_INFO: { color: "bg-muted text-muted-foreground", icon: HelpCircle, label: "Needs Info" },
  NOT_ELIGIBLE: { color: "bg-destructive/10 text-destructive", icon: XCircle, label: "Not Eligible" },
};

const categoryColors: Record<string, string> = {
  FAMILY: "bg-primary/10 text-primary",
  WORK: "bg-secondary/10 text-secondary",
  HUMANITARIAN: "bg-destructive/10 text-destructive",
  STUDY: "bg-accent text-accent-foreground",
  CITIZENSHIP: "bg-success/10 text-success",
};

function LanguagePicker({ locale, onChange }: { locale: Locale; onChange: (l: Locale) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <Select value={locale} onValueChange={(v) => onChange(v as Locale)}>
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(LOCALE_LABELS) as Locale[]).map((l) => (
            <SelectItem key={l} value={l} className="text-xs">
              {LOCALE_LABELS[l]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function PathwayFinder() {
  const { locale, setLocale: setGlobalLocale } = useLanguage();
  const [step, setStep] = useState<Step>("welcome");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PathwayResult[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const s = t(locale);

  const callEngine = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("pathway-engine", { body });
    if (error) throw error;
    return data;
  }, []);

  const startSession = async () => {
    setLoading(true);
    try {
      const data = await callEngine({ action: "create_session", locale });
      setSessionId(data.session_id);
      setStep("disclaimer");
    } catch {
      toast({ title: "Error", description: "Could not start session", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const acceptDisclaimer = () => setStep("intake");

  const submitGoal = async (goal: string) => {
    setSelectedGoal(goal);
    setLoading(true);
    try {
      const data = await callEngine({
        action: "answer",
        session_id: sessionId,
        question_id: "goal",
        answer_value: goal,
        locale,
      });
      handleEngineResponse(data);
    } catch {
      toast({ title: "Error", description: "Could not process answer", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (value: unknown) => {
    if (!currentQuestion || !sessionId) return;
    setLoading(true);
    setShowHelp(false);
    try {
      const data = await callEngine({
        action: "answer",
        session_id: sessionId,
        question_id: currentQuestion.id,
        answer_value: value,
        locale,
      });
      handleEngineResponse(data);
    } catch {
      toast({ title: "Error", description: "Could not process answer", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEngineResponse = (data: { type: string; question?: Question; progress?: number; results?: PathwayResult[] }) => {
    if (data.type === "question") {
      setCurrentQuestion(data.question!);
      setQuestionCount(data.progress || 0);
    } else if (data.type === "results") {
      setResults(data.results || []);
      setStep("results");
    }
  };

  const saveAndSignup = () => {
    // Store session_id in localStorage so signup/onboarding can import results
    if (sessionId) {
      localStorage.setItem("dome_pathway_session", sessionId);
    }
    navigate("/signup?role=client&from=pathway");
  };

  const handleVoiceConfirm = (value: string) => {
    if (!currentQuestion) return;
    if (currentQuestion.answer_type === "BOOLEAN") {
      const lower = value.toLowerCase();
      if (lower.includes("yes") || lower.includes("sí") || lower.includes("oui") || lower.includes("wi") || lower.includes("はい") || lower.includes("हां") || lower.includes("是") || lower.includes("ja") || lower.includes("ہاں")) submitAnswer(true);
      else if (lower.includes("no") || lower.includes("non") || lower.includes("いいえ") || lower.includes("नहीं") || lower.includes("否") || lower.includes("nein") || lower.includes("نہیں")) submitAnswer(false);
      else submitAnswer(value);
    } else if (currentQuestion.answer_type === "CHOICE" && currentQuestion.choices?.length) {
      const lower = value.toLowerCase();
      const match = currentQuestion.choices.find(
        (c) => c.label.toLowerCase().includes(lower) || c.value.toLowerCase() === lower
      );
      submitAnswer(match ? match.value : value);
    } else {
      submitAnswer(value);
    }
  };

  const goals = getGoals(locale);

  // WELCOME
  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col relative">
        <div className="absolute top-4 left-4 z-10"><BackButton /></div>

        {/* Capitol image background area */}
        <div className="relative flex flex-col items-center pt-12 pb-6">
          <div className="absolute inset-0 bg-[url('/og-image.png')] bg-cover bg-center opacity-10" />
          <div className="relative z-10 flex flex-col items-center">
            <img src={domeLogo} alt="D.O.M.E." className="w-24 h-auto" />
            <span className="text-[10px] text-muted-foreground mt-0.5">Digital Onboarding for Migration Ease</span>
          </div>
          <div className="absolute top-4 right-4 z-10">
            <LanguagePicker locale={locale} onChange={setGlobalLocale} />
          </div>
        </div>

        {/* Main card */}
        <div className="flex-1 flex items-start justify-center px-4 pb-8">
          <Card className="w-full max-w-lg shadow-lg">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold text-foreground">{s.pathwayFinder}</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.welcomeDesc}
                </p>
              </div>

              {/* Feature badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-xs font-semibold border-border">
                  <Clock className="w-3.5 h-3.5" /> {s.minutes}
                </Badge>
                <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-xs font-semibold border-border">
                  <Mic className="w-3.5 h-3.5" /> {s.voiceSupported}
                </Badge>
                <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-xs font-semibold border-border">
                  <Shield className="w-3.5 h-3.5" /> {s.privateSecure}
                </Badge>
                <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-xs font-semibold border-border">
                  <FileText className="w-3.5 h-3.5" /> Attorney-Ready Results
                </Badge>
              </div>

              {/* CTA */}
              <Button
                size="lg"
                onClick={startSession}
                disabled={loading}
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-base py-6 gap-2 rounded-xl"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {s.showMyOptions}
                <ChevronRight className="w-5 h-5" />
              </Button>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                {s.notLegalAdvice}
              </p>

              <Separator />

              {/* Trust indicators */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-secondary shrink-0" />
                  <span className="font-medium">Bank-grade encryption</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 text-secondary shrink-0" />
                  <span className="font-medium">Trusted by users, attorneys & nonprofit organizations</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-secondary shrink-0" />
                  <span className="font-medium">Permission-based case sharing</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom trust bar */}
        <div className="bg-primary text-primary-foreground py-3 px-4">
          <div className="flex justify-around items-start max-w-lg mx-auto text-center">
            <div className="flex flex-col items-center gap-1">
              <Shield className="w-5 h-5 text-secondary" />
              <span className="text-[10px] leading-tight">Bank-grade<br/>encryption</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Star className="w-5 h-5 text-secondary" />
              <span className="text-[10px] leading-tight">Trusted by users,<br/>attorneys & nonprofits</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Shield className="w-5 h-5 text-secondary" />
              <span className="text-[10px] leading-tight">Permission-<br/>based case sharing</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DISCLAIMER
  if (step === "disclaimer") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-warning/30 border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                <CardTitle className="text-lg">{s.importantNotice}</CardTitle>
              </div>
              <LanguagePicker locale={locale} onChange={setGlobalLocale} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {s.disclaimerP1}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {s.disclaimerP2}
            </p>
            <Separator />
            <Button className="w-full gap-2" onClick={acceptDisclaimer}>
              {s.iUnderstand} <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // INTAKE — goal selection or dynamic questions
  if (step === "intake") {
    if (!currentQuestion && !selectedGoal) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-2xl space-y-6">
            <div className="flex justify-end">
              <LanguagePicker locale={locale} onChange={setGlobalLocale} />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">{s.whatGoal}</h1>
              <p className="text-muted-foreground">{s.selectGoal}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {goals.map((g) => (
                <button
                  key={g.value}
                  onClick={() => submitGoal(g.value)}
                  disabled={loading}
                  className="flex items-start gap-3 p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-accent/50 transition-all text-left group"
                >
                  <span className="text-2xl mt-0.5">{g.icon}</span>
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">{g.label}</p>
                    <p className="text-xs text-muted-foreground">{g.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {loading && (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Dynamic question UI
    if (currentQuestion) {
      const totalEstimate = 22;
      const progressPct = Math.min(95, (questionCount / totalEstimate) * 100);

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-lg space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{s.question} {questionCount + 1}</span>
                  <span>{Math.round(progressPct)}% {s.complete}</span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </div>
              <div className="ml-3">
                <LanguagePicker locale={locale} onChange={setGlobalLocale} />
              </div>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{currentQuestion.prompt_plain}</CardTitle>
                {showHelp && currentQuestion.help_plain && (
                  <p className="text-sm text-muted-foreground bg-accent/50 rounded-lg p-3 mt-2">
                    <Info className="w-3.5 h-3.5 inline mr-1" />
                    {currentQuestion.help_plain}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Boolean */}
                {currentQuestion.answer_type === "BOOLEAN" && (
                  <div className="flex gap-3">
                    <Button className="flex-1" onClick={() => submitAnswer(true)} disabled={loading}>{s.yes}</Button>
                    <Button className="flex-1" variant="outline" onClick={() => submitAnswer(false)} disabled={loading}>{s.no}</Button>
                  </div>
                )}

                {/* Choice */}
                {currentQuestion.answer_type === "CHOICE" && currentQuestion.choices?.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => submitAnswer(c.value)}
                    disabled={loading}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/30 transition-all text-sm"
                  >
                    {c.label}
                  </button>
                ))}

                {/* Multi-choice */}
                {currentQuestion.answer_type === "MULTI_CHOICE" && (
                  <MultiChoiceInput
                    choices={currentQuestion.choices || []}
                    onSubmit={submitAnswer}
                    loading={loading}
                    continueLabel={s.continue}
                  />
                )}

                {/* Text / Number */}
                {(currentQuestion.answer_type === "TEXT" || currentQuestion.answer_type === "NUMBER") && (
                  <TextInput
                    type={currentQuestion.answer_type === "NUMBER" ? "number" : "text"}
                    onSubmit={submitAnswer}
                    loading={loading}
                    placeholder={s.typeAnswer}
                  />
                )}

                {/* Date */}
                {currentQuestion.answer_type === "DATE" && (
                  <DateInput onSubmit={submitAnswer} loading={loading} />
                )}

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHelp(!showHelp)}
                    className="gap-1 text-xs"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showHelp ? s.hide : s.explain}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => submitAnswer(null)}
                    disabled={loading}
                    className="text-xs text-muted-foreground"
                  >
                    {s.notSureSkip}
                  </Button>
                </div>

                {/* Voice input */}
                <VoiceInput
                  fieldId={currentQuestion.id}
                  fieldLabel={currentQuestion.title}
                  onConfirm={handleVoiceConfirm}
                />
              </CardContent>
            </Card>

            {loading && (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  // COMPUTING
  if (step === "computing") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium">{s.analyzing}</p>
          <p className="text-sm text-muted-foreground">{s.checkingPathways}</p>
        </div>
      </div>
    );
  }

  // RESULTS
  if (step === "results") {
    const strongMatches = results.filter((r) => r.status === "STRONG");
    const possibleMatches = results.filter((r) => r.status === "POSSIBLE");
    const needsInfo = results.filter((r) => r.status === "NEEDS_INFO");
    const notEligible = results.filter((r) => r.status === "NOT_ELIGIBLE");

    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex justify-end">
            <LanguagePicker locale={locale} onChange={setGlobalLocale} />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">{s.yourOptions}</h1>
            <p className="text-muted-foreground">
              {s.resultsDesc}
            </p>
            <Badge variant="outline" className="gap-1 text-xs">
              <AlertTriangle className="w-3 h-3" /> {s.notLegalAdvice}
            </Badge>
          </div>

          {strongMatches.length > 0 && (
            <ResultSection title={s.strongMatches} icon={<Star className="w-5 h-5 text-success" />} results={strongMatches} s={s} />
          )}
          {possibleMatches.length > 0 && (
            <ResultSection title={s.possibleOptions} icon={<Info className="w-5 h-5 text-warning" />} results={possibleMatches} s={s} />
          )}
          {needsInfo.length > 0 && (
            <ResultSection title={s.needMoreInfo} icon={<HelpCircle className="w-5 h-5 text-muted-foreground" />} results={needsInfo} s={s} />
          )}
          {notEligible.length > 0 && (
            <ResultSection title={s.likelyNotEligible} icon={<XCircle className="w-5 h-5 text-destructive" />} results={notEligible} s={s} />
          )}

          {/* Save & Signup CTA */}
          <Card className="border-secondary/30 bg-secondary/5">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold">Save your results and start preparing your case.</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Create a free account to keep your pathway results, build your Immigration Passport, and begin organizing your case.
              </p>
              <Button size="lg" className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground" onClick={saveAndSignup}>
                Create My Free Account <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-xs text-muted-foreground">No credit card required</p>
            </CardContent>
          </Card>

          <div className="text-center pt-4">
            <Button variant="outline" onClick={() => { setStep("welcome"); setSessionId(null); setResults([]); setSelectedGoal(null); setCurrentQuestion(null); setQuestionCount(0); }}>
              {s.startOver}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Sub-components

type TranslationStrings = ReturnType<typeof t>;

function ResultSection({ title, icon, results, s }: {
  title: string;
  icon: React.ReactNode;
  results: PathwayResult[];
  s: TranslationStrings;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-semibold text-lg">{title}</h2>
        <Badge variant="secondary" className="text-xs">{results.length}</Badge>
      </div>
      {results.map((r) => (
        <ResultCard key={r.pathway_id} result={r} s={s} />
      ))}
    </div>
  );
}

function ResultCard({ result, s }: { result: PathwayResult; s: TranslationStrings }) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[result.status];
  const StatusIcon = config.icon;

  return (
    <Card className="overflow-hidden">
      <button
        className="w-full text-left p-4 flex items-start gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}>
          <StatusIcon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{result.display_name}</span>
            <Badge variant="outline" className={`text-[10px] ${categoryColors[result.category] || ""}`}>
              {result.category}
            </Badge>
            {result.requires_rep_review && (
              <Badge variant="outline" className="text-[10px] gap-0.5">
                <Shield className="w-2.5 h-2.5" /> {s.reviewNeeded}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Progress value={result.score} className="h-1.5 flex-1 max-w-[120px]" />
            <span className="text-xs font-medium">{result.score}%</span>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t pt-3">
          {result.reasons.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{s.whyThisResult}</p>
              {result.reasons.map((r, i) => (
                <p key={i} className="text-xs flex gap-1.5">
                  <span className="text-primary mt-0.5">•</span> {r}
                </p>
              ))}
            </div>
          )}
          {result.risk_flags.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {s.riskFlags}
              </p>
              {result.risk_flags.map((f, i) => (
                <p key={i} className="text-xs text-destructive/80 flex gap-1.5">
                  <span>⚠️</span> {f}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function MultiChoiceInput({ choices, onSubmit, loading, continueLabel }: {
  choices: { value: string; label: string }[];
  onSubmit: (value: unknown) => void;
  loading: boolean;
  continueLabel: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <div className="space-y-2">
      {choices.map((c) => (
        <button
          key={c.value}
          onClick={() =>
            setSelected((s) =>
              s.includes(c.value) ? s.filter((v) => v !== c.value) : [...s, c.value]
            )
          }
          className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
            selected.includes(c.value)
              ? "border-primary bg-primary/5 font-medium"
              : "border-border hover:border-primary/30"
          }`}
        >
          {c.label}
        </button>
      ))}
      <Button
        onClick={() => onSubmit(selected)}
        disabled={loading || selected.length === 0}
        className="w-full"
      >
        {continueLabel} <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

function TextInput({ type, onSubmit, loading, placeholder }: { type: string; onSubmit: (value: unknown) => void; loading: boolean; placeholder: string }) {
  const [value, setValue] = useState("");

  return (
    <div className="flex gap-2">
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) onSubmit(type === "number" ? Number(value) : value);
        }}
      />
      <Button onClick={() => onSubmit(type === "number" ? Number(value) : value)} disabled={loading || !value.trim()}>
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

function DateInput({ onSubmit, loading }: { onSubmit: (value: unknown) => void; loading: boolean }) {
  const [date, setDate] = useState<Date>();

  return (
    <div className="flex gap-2 items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("flex-1 justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "MM/dd/yyyy") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      <Button onClick={() => date && onSubmit(format(date, "yyyy-MM-dd"))} disabled={loading || !date}>
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
