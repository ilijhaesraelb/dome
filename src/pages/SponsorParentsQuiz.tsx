import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  Share2, Compass, Heart, Shield, Clock, Copy, Check
} from "lucide-react";
import domeLogo from "@/assets/dome-logo.png";
import BackButton from "@/components/BackButton";

type Answer = string | null;

interface QuizQuestion {
  id: number;
  question: string;
  helpText: string;
  options: { value: string; label: string }[];
}

const questions: QuizQuestion[] = [
  {
    id: 1,
    question: "Are you a U.S. citizen?",
    helpText: "Only U.S. citizens can sponsor parents for immigration.",
    options: [
      { value: "yes", label: "Yes, I am a U.S. citizen" },
      { value: "lpr", label: "No, I am a lawful permanent resident (green card holder)" },
      { value: "no", label: "No, I don't have U.S. status" },
    ],
  },
  {
    id: 2,
    question: "Are you 21 years of age or older?",
    helpText: "You must be at least 21 to petition for your parents.",
    options: [
      { value: "yes", label: "Yes, I am 21 or older" },
      { value: "no", label: "No, I am under 21" },
    ],
  },
  {
    id: 3,
    question: "Where are your parents currently located?",
    helpText: "This affects the process: adjustment of status vs. consular processing.",
    options: [
      { value: "us", label: "In the United States" },
      { value: "abroad", label: "Outside the United States" },
    ],
  },
  {
    id: 4,
    question: "Can you demonstrate sufficient income to support your parents?",
    helpText: "Sponsors must meet the income threshold (125% of federal poverty guidelines) or use a joint sponsor.",
    options: [
      { value: "yes", label: "Yes, I meet income requirements" },
      { value: "joint", label: "Not alone, but I have a joint sponsor" },
      { value: "no", label: "No, I cannot meet the requirement" },
    ],
  },
  {
    id: 5,
    question: "Do your parents have any prior immigration violations?",
    helpText: "Overstays, deportation orders, or unlawful presence can complicate the process.",
    options: [
      { value: "none", label: "No violations" },
      { value: "overstay", label: "Yes, they have an overstay or unlawful presence" },
      { value: "deportation", label: "Yes, they have a deportation or removal order" },
    ],
  },
];

type ResultStatus = "eligible" | "not_eligible" | "maybe";

interface QuizResult {
  status: ResultStatus;
  headline: string;
  summary: string;
  details: string[];
  nextSteps: string[];
  estimatedTimeline: string;
}

function computeResult(answers: Answer[]): QuizResult {
  const [citizenship, age, location, income, violations] = answers;

  // Not a citizen
  if (citizenship !== "yes") {
    return {
      status: "not_eligible",
      headline: "You Cannot Sponsor Parents at This Time",
      summary: "Only U.S. citizens can petition for their parents. Lawful permanent residents (green card holders) are generally not able to sponsor parents.",
      details: [
        "Parent sponsorship requires U.S. citizenship",
        citizenship === "lpr"
          ? "As an LPR, you may be able to sponsor parents after naturalizing"
          : "You would first need to obtain U.S. status",
      ],
      nextSteps: [
        "Explore pathways to U.S. citizenship",
        "Explore whether you may be able to naturalize",
        "Consult an immigration attorney for your specific situation",
      ],
      estimatedTimeline: "N/A — citizenship required first",
    };
  }

  // Under 21
  if (age === "no") {
    return {
      status: "not_eligible",
      headline: "You Must Be 21 to Sponsor Parents",
      summary: "U.S. citizens must be at least 21 years old to file an I-130 petition for their parents.",
      details: [
        "The minimum age requirement is 21",
        "This is a federal requirement that cannot be waived",
      ],
      nextSteps: [
        "Wait until you turn 21 to file",
        "Start gathering documents in advance",
        "Use D.O.M.E. to prepare your case before filing",
      ],
      estimatedTimeline: "File after turning 21",
    };
  }

  // Income issue
  if (income === "no") {
    return {
      status: "maybe",
      headline: "Income Requirement May Be a Challenge",
      summary: "You meet citizenship and age requirements, but sponsors must demonstrate they can financially support their parents at 125% of the federal poverty guidelines.",
      details: [
        "You are a U.S. citizen over 21 ✓",
        "Income requirement not met — consider a joint sponsor",
        "Assets can sometimes be used to supplement income",
      ],
      nextSteps: [
        "Find a joint sponsor who meets income requirements",
        "Review if your assets qualify as alternative support",
        "Consult an attorney about Affidavit of Support (I-864)",
      ],
      estimatedTimeline: "Depends on resolving financial sponsorship",
    };
  }

  // Deportation order
  if (violations === "deportation") {
    return {
      status: "maybe",
      headline: "Sponsorship Possible, But Complications Exist",
      summary: "You may be able to sponsor your parents, but a prior deportation or removal order creates significant legal hurdles that require professional guidance.",
      details: [
        "You are a U.S. citizen over 21 ✓",
        "Income/joint sponsor requirement met ✓",
        "Deportation/removal order requires legal strategy",
        "A waiver may be needed (Form I-212)",
      ],
      nextSteps: [
        "Consult an immigration attorney immediately",
        "Gather all prior immigration documentation",
        "Use D.O.M.E. to organize your case materials",
      ],
      estimatedTimeline: "Varies — legal review required",
    };
  }

  // Overstay
  if (violations === "overstay") {
    const inUS = location === "us";
    return {
      status: "maybe",
      headline: "Likely Eligible, But Unlawful Presence Needs Attention",
      summary: inUS
        ? "Good news — parents in the U.S. who entered lawfully may be able to adjust status despite an overstay, since you're an immediate relative sponsor."
        : "Your parents may face a 3- or 10-year bar due to unlawful presence. A waiver (I-601) may be available.",
      details: [
        "You are a U.S. citizen over 21 ✓",
        "Income/joint sponsor requirement met ✓",
        inUS
          ? "Parents in the U.S. may adjust status as immediate relatives"
          : "Parents abroad may need an unlawful presence waiver",
      ],
      nextSteps: [
        "Consult an immigration attorney about waiver options",
        "Gather evidence of your qualifying relationship",
        "Use D.O.M.E. to build your complete case",
      ],
      estimatedTimeline: inUS ? "12–18 months (adjustment)" : "18–36 months (with waiver)",
    };
  }

  // All clear
  const inUS = location === "us";
  return {
    status: "eligible",
    headline: "You May Be Able to Sponsor Your Parents",
    summary: inUS
      ? "Your parents may be able to adjust their status without leaving the United States. As immediate relatives, there is no visa backlog — this is one of the fastest family immigration pathways."
      : "You can petition for your parents through consular processing at a U.S. embassy or consulate abroad. Immediate relatives have no visa backlog.",
    details: [
      "U.S. citizen over 21 ✓",
      "Income/joint sponsor meets threshold ✓",
      "No immigration violations ✓",
      `Parents ${inUS ? "in the U.S. — may adjust status" : "abroad — consular processing"}`,
      "Immediate relative category — no wait time for visa number",
    ],
    nextSteps: [
      "File Form I-130 (Petition for Alien Relative)",
      inUS ? "File Form I-485 (Adjustment of Status) concurrently" : "Wait for NVC processing and embassy interview",
      "Prepare Affidavit of Support (I-864)",
      "Gather civil documents (birth certificates, etc.)",
      "Use D.O.M.E. to organize everything in one place",
    ],
    estimatedTimeline: inUS ? "12–18 months" : "14–24 months",
  };
}

const statusConfig = {
  eligible: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800", badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  maybe: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-800", badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  not_eligible: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

const SponsorParentsQuiz = () => {
  const [step, setStep] = useState(0); // 0 = intro, 1-5 = questions, 6 = result
  const [answers, setAnswers] = useState<Answer[]>([null, null, null, null, null]);
  const [copied, setCopied] = useState(false);

  const progress = step === 0 ? 0 : step > 5 ? 100 : (step / 5) * 100;

  const handleAnswer = (value: string) => {
    const updated = [...answers];
    updated[step - 1] = value;
    setAnswers(updated);
    // Auto-advance after brief visual feedback
    setTimeout(() => {
      setStep((s) => s + 1);
    }, 400);
  };

  const next = () => {
    if (step >= 1 && step <= 5 && !answers[step - 1]) return;
    setStep((s) => s + 1);
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));

  const restart = () => {
    setStep(0);
    setAnswers([null, null, null, null, null]);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = async () => {
    const text = "Can you sponsor your parents for immigration? Find out in 60 seconds with this free quiz:";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Can I Sponsor My Parents? — Immigration Quiz", text, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const result = step > 5 ? computeResult(answers) : null;
  const config = result ? statusConfig[result.status] : null;
  const StatusIcon = config?.icon ?? CheckCircle2;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <BackButton />
            <Link to="/" className="flex items-center gap-2">
              <img src={domeLogo} alt="D.O.M.E." className="h-7 w-7 rounded" />
              <span className="font-bold text-foreground font-['Outfit']">D.O.M.E.</span>
            </Link>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:block">Free Immigration Quiz</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Progress */}
        {step > 0 && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Question {Math.min(step, 5)} of 5</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* INTRO */}
        {step === 0 && (
          <div className="text-center space-y-8 animate-in fade-in duration-500">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-1.5 text-sm font-medium text-secondary">
              <Heart className="h-4 w-4" />
              Family Immigration Quiz
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold font-['Outfit'] text-foreground leading-tight">
              Can I Sponsor<br />My Parents?
            </h1>

            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Answer 5 quick questions and find out if you can bring your parents to the United States — in under 60 seconds.
            </p>

            <Button size="lg" onClick={next} className="text-lg px-8 py-6 rounded-xl gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
              Start the Quiz <ArrowRight className="h-5 w-5" />
            </Button>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 60 seconds</span>
              <span className="flex items-center gap-1"><Shield className="h-4 w-4" /> 100% free</span>
              <span className="flex items-center gap-1"><Compass className="h-4 w-4" /> No signup</span>
            </div>

            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              This quiz is for informational purposes only and does not constitute legal advice. Consult an immigration attorney for guidance specific to your case.
            </p>
          </div>
        )}

        {/* QUESTIONS */}
        {step >= 1 && step <= 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300" key={step}>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-foreground">
              {questions[step - 1].question}
            </h2>
            <p className="text-muted-foreground">{questions[step - 1].helpText}</p>

            <RadioGroup
              value={answers[step - 1] ?? ""}
              onValueChange={handleAnswer}
              className="space-y-3 pt-2"
            >
              {questions[step - 1].options.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    answers[step - 1] === opt.value
                      ? "border-secondary bg-secondary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <RadioGroupItem value={opt.value} id={opt.value} />
                  <Label htmlFor={opt.value} className="cursor-pointer text-base font-medium text-foreground flex-1">
                    {opt.label}
                  </Label>
                </label>
              ))}
            </RadioGroup>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={prev} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={next}
                disabled={!answers[step - 1]}
                className="gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                {step === 5 ? "See My Results" : "Next"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {step > 5 && result && config && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className={`${config.bg} ${config.border} border-2`}>
              <CardContent className="pt-8 pb-6 text-center space-y-4">
                <StatusIcon className={`h-16 w-16 mx-auto ${config.color}`} />
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${config.badge}`}>
                  {result.status === "eligible" ? "Possible Pathway" : result.status === "maybe" ? "May Need Review" : "May Not Apply"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-foreground">{result.headline}</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">{result.summary}</p>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold text-foreground font-['Outfit'] text-lg">Your Assessment</h3>
                {result.details.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-secondary" />
                    <span>{d}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <Clock className="h-8 w-8 text-secondary shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Timeline</p>
                  <p className="text-xl font-bold text-foreground font-['Outfit']">{result.estimatedTimeline}</p>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold text-foreground font-['Outfit'] text-lg">Recommended Next Steps</h3>
                {result.nextSteps.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground pt-0.5">{s}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* CTAs */}
            <div className="space-y-3 pt-2">
              <Link to="/pathway-finder" className="block">
                <Button size="lg" className="w-full text-lg py-6 rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Compass className="h-5 w-5" /> Explore All 26+ Immigration Pathways
                </Button>
              </Link>

              <Button
                size="lg"
                variant="outline"
                onClick={handleShare}
                className="w-full py-6 rounded-xl gap-2 text-lg"
              >
                {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                {copied ? "Link Copied!" : "Share This Quiz"}
              </Button>

              <Button variant="ghost" onClick={restart} className="w-full">
                Retake Quiz
              </Button>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center max-w-md mx-auto pt-4">
              This quiz provides general information only and does not constitute legal advice. Immigration law is complex — please consult a licensed immigration attorney or DOJ Accredited Representative for guidance specific to your situation.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default SponsorParentsQuiz;
