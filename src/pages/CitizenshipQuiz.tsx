import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  Share2, Compass, Shield, Clock, Check, Award
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
    question: "What is your current immigration status?",
    helpText: "You must be a lawful permanent resident (green card holder) to naturalize.",
    options: [
      { value: "lpr", label: "Lawful permanent resident (green card holder)" },
      { value: "conditional", label: "Conditional resident (2-year green card)" },
      { value: "other", label: "Other status (visa holder, undocumented, etc.)" },
    ],
  },
  {
    id: 2,
    question: "How long have you had your green card?",
    helpText: "Most applicants need 5 years as an LPR. If married to a U.S. citizen, only 3 years.",
    options: [
      { value: "5plus", label: "5 years or more" },
      { value: "3to5_married", label: "3–5 years, and I'm married to a U.S. citizen" },
      { value: "3to5", label: "3–5 years (not married to a U.S. citizen)" },
      { value: "under3", label: "Less than 3 years" },
    ],
  },
  {
    id: 3,
    question: "Have you lived continuously in the United States?",
    helpText: "You generally cannot leave the U.S. for more than 6 months at a time, or 30+ months total in the qualifying period.",
    options: [
      { value: "yes", label: "Yes — no trips longer than 6 months" },
      { value: "short_break", label: "I had one trip between 6–12 months" },
      { value: "long_break", label: "I was outside the U.S. for more than 12 months" },
    ],
  },
  {
    id: 4,
    question: "Have you been physically present in the U.S. for the required time?",
    helpText: "You must have been physically in the U.S. for at least 30 months out of 5 years (or 18 months out of 3 years if married to a citizen).",
    options: [
      { value: "yes", label: "Yes, I meet the physical presence requirement" },
      { value: "unsure", label: "I'm not sure — I travel frequently" },
      { value: "no", label: "No, I haven't been in the U.S. long enough" },
    ],
  },
  {
    id: 5,
    question: "Do you have any criminal history or immigration violations?",
    helpText: "Certain crimes or violations can affect the 'good moral character' requirement for citizenship.",
    options: [
      { value: "none", label: "No criminal history or violations" },
      { value: "minor", label: "Minor offenses (traffic tickets, minor misdemeanors)" },
      { value: "serious", label: "Felony, drug offense, or fraud conviction" },
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
  const [status, duration, continuous, physical, criminal] = answers;

  if (status === "other") {
    return {
      status: "not_eligible",
      headline: "You Must Be a Green Card Holder First",
      summary: "Only lawful permanent residents can apply for U.S. citizenship through naturalization. You would need to obtain a green card before pursuing citizenship.",
      details: [
        "Naturalization requires lawful permanent resident status",
        "Explore pathways to a green card first",
      ],
      nextSteps: [
        "Explore immigration pathways to permanent residency",
        "Use D.O.M.E. Pathway Finder to discover your options",
        "Consult an immigration attorney",
      ],
      estimatedTimeline: "N/A — green card required first",
    };
  }

  if (status === "conditional") {
    return {
      status: "maybe",
      headline: "You Need to Remove Conditions First",
      summary: "Conditional residents must file Form I-751 to remove conditions on their green card before (or sometimes concurrently with) applying for naturalization.",
      details: [
        "Conditional residents hold a 2-year green card",
        "File I-751 to remove conditions",
        "Time as a conditional resident counts toward the residency requirement",
      ],
      nextSteps: [
        "File Form I-751 (Petition to Remove Conditions)",
        "After removal, assess naturalization eligibility",
        "Use D.O.M.E. to organize your case",
      ],
      estimatedTimeline: "6–12 months for I-751, then naturalization",
    };
  }

  // Not enough time
  if (duration === "under3") {
    return {
      status: "not_eligible",
      headline: "You Haven't Held Your Green Card Long Enough",
      summary: "You need at least 5 years as a permanent resident (or 3 years if married to a U.S. citizen) before you can apply for citizenship.",
      details: [
        "Green card holder ✓",
        "Residency duration not yet met",
        "You can file up to 90 days before meeting the requirement",
      ],
      nextSteps: [
        "Calculate your earliest possible filing date",
        "Start gathering documents now",
        "Use D.O.M.E. to prepare in advance",
      ],
      estimatedTimeline: "Wait until residency requirement is met",
    };
  }

  if (duration === "3to5") {
    return {
      status: "not_eligible",
      headline: "You Need 5 Years Unless Married to a U.S. Citizen",
      summary: "The standard naturalization requirement is 5 years as a permanent resident. The 3-year rule only applies if you are married to and living with a U.S. citizen.",
      details: [
        "Green card holder ✓",
        "3–5 years of residency — may not yet meet the 5-year rule",
        "The 3-year exception requires marriage to a U.S. citizen",
      ],
      nextSteps: [
        "Wait until you reach the 5-year mark",
        "You can file 90 days before your 5-year anniversary",
        "Start preparing your N-400 application with D.O.M.E.",
      ],
      estimatedTimeline: "File after 5 years as LPR",
    };
  }

  // Serious criminal issue
  if (criminal === "serious") {
    return {
      status: "not_eligible",
      headline: "Criminal History May Bar Citizenship",
      summary: "Certain serious offenses — including aggravated felonies, drug trafficking, and fraud — can permanently bar naturalization. You need legal counsel immediately.",
      details: [
        "Green card holder ✓",
        "Residency duration may be met ✓",
        "Serious criminal history — potential permanent bar",
        "Filing N-400 with certain convictions can trigger removal proceedings",
      ],
      nextSteps: [
        "Consult an immigration attorney before filing anything",
        "Consider consulting an attorney before filing N-400",
        "Gather all court records and dispositions",
      ],
      estimatedTimeline: "Legal review required first",
    };
  }

  // Long absence
  if (continuous === "long_break") {
    return {
      status: "not_eligible",
      headline: "Extended Absence May Reset Your Clock",
      summary: "An absence of 12+ months generally breaks continuous residence and may reset the residency clock. You may need to reestablish residency before applying.",
      details: [
        "Green card holder ✓",
        "Absence over 12 months likely breaks continuous residence",
        "You may need to restart the 5-year (or 3-year) count",
      ],
      nextSteps: [
        "Consult an attorney about reestablishing continuous residence",
        "Check if you filed a reentry permit (I-131) before leaving",
        "Use D.O.M.E. to track your residency timeline",
      ],
      estimatedTimeline: "May need to restart residency period",
    };
  }

  // Short break in continuity
  if (continuous === "short_break") {
    return {
      status: "maybe",
      headline: "Your Absence May Require Explanation",
      summary: "A single trip of 6–12 months creates a presumption that continuous residence was broken. You can overcome this by showing you maintained ties to the U.S.",
      details: [
        "Green card holder ✓",
        duration === "5plus" ? "5+ years residency ✓" : "3+ years residency (married to citizen) ✓",
        "6–12 month absence — rebuttable presumption",
        "You'll need to prove you maintained U.S. ties",
      ],
      nextSteps: [
        "Gather evidence of U.S. ties (tax returns, lease, employment, family)",
        "Prepare a statement explaining the trip",
        "Consider consulting an attorney before filing",
        "Use D.O.M.E. to organize supporting evidence",
      ],
      estimatedTimeline: "8–14 months (with additional documentation)",
    };
  }

  // Physical presence issue
  if (physical === "no") {
    return {
      status: "not_eligible",
      headline: "Physical Presence Requirement Not Met",
      summary: "You must be physically present in the U.S. for at least 30 months out of 5 years (or 18 months out of 3 years). You may need to wait longer before applying.",
      details: [
        "Green card holder ✓",
        "Continuous residence may be met ✓",
        "Physical presence days not sufficient",
      ],
      nextSteps: [
        "Count your exact days of physical presence",
        "Wait until you meet the threshold",
        "Use D.O.M.E. to track your travel history",
      ],
      estimatedTimeline: "Wait until physical presence is met",
    };
  }

  if (physical === "unsure") {
    return {
      status: "maybe",
      headline: "Possible Eligibility — Verify Your Travel Dates",
      summary: "If you travel frequently, you need to carefully count your days outside the U.S. to confirm you meet the physical presence requirement.",
      details: [
        "Green card holder ✓",
        duration === "5plus" ? "5+ years residency ✓" : "3+ years residency (married to citizen) ✓",
        "Physical presence unclear — needs verification",
        criminal === "minor" ? "Minor offenses — unlikely to affect eligibility" : "No criminal history ✓",
      ],
      nextSteps: [
        "Gather all passports and travel records",
        "Calculate exact days outside the U.S.",
        "Use D.O.M.E. to build your travel history",
        "File once you confirm you meet the requirement",
      ],
      estimatedTimeline: "8–14 months (after confirming eligibility)",
    };
  }

  // All clear
  const married = duration === "3to5_married";
  return {
    status: "eligible",
    headline: "You May Be Eligible for U.S. Citizenship",
    summary: married
      ? "Based on your answers, you may meet the key requirements for naturalization through Form N-400. Consider reviewing your situation with an attorney or accredited representative."
      : "Based on your answers, you may meet the key requirements for naturalization. Consider reviewing your situation with an attorney or accredited representative.",
    details: [
      "Lawful permanent resident ✓",
      married ? "3+ years married to U.S. citizen ✓" : "5+ years as LPR ✓",
      "Continuous residence maintained ✓",
      "Physical presence requirement met ✓",
      criminal === "minor"
        ? "Minor offenses — generally do not affect eligibility ✓"
        : "Good moral character ✓",
    ],
    nextSteps: [
      "File Form N-400 (Application for Naturalization)",
      "Prepare for the civics and English tests",
      "Gather supporting documents (tax returns, travel records, ID)",
      "Attend biometrics appointment",
      "Use D.O.M.E. to organize your entire application",
    ],
    estimatedTimeline: "8–14 months",
  };
}

const statusConfig = {
  eligible: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-800", badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  maybe: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30", border: "border-yellow-200 dark:border-yellow-800", badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  not_eligible: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800", badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

const CitizenshipQuiz = () => {
  const [step, setStep] = useState(0);
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
    const text = "Curious about U.S. citizenship? Explore your possible pathway in 60 seconds with this free quiz:";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Citizenship Pathway Quiz — D.O.M.E.", text, url: shareUrl });
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
              <Award className="h-4 w-4" />
              Citizenship Quiz
            </div>

            <h1 className="text-3xl sm:text-5xl font-bold font-['Outfit'] text-foreground leading-tight">
              Explore Your Path to<br />U.S. Citizenship
            </h1>

            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Answer 5 quick questions about your residency, presence, and background — and find out in under 60 seconds.
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
                  <RadioGroupItem value={opt.value} id={`cq-${opt.value}`} />
                  <Label htmlFor={`cq-${opt.value}`} className="cursor-pointer text-base font-medium text-foreground flex-1">
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

            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <Clock className="h-8 w-8 text-secondary shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Timeline</p>
                  <p className="text-xl font-bold text-foreground font-['Outfit']">{result.estimatedTimeline}</p>
                </div>
              </CardContent>
            </Card>

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

            <div className="space-y-3 pt-2">
              <Link to="/pathway-finder" className="block">
                <Button size="lg" className="w-full text-lg py-6 rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Compass className="h-5 w-5" /> Explore All 26+ Immigration Pathways
                </Button>
              </Link>

              <Button size="lg" variant="outline" onClick={handleShare} className="w-full py-6 rounded-xl gap-2 text-lg">
                {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                {copied ? "Link Copied!" : "Share This Quiz"}
              </Button>

              <Button variant="ghost" onClick={restart} className="w-full">
                Retake Quiz
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center max-w-md mx-auto pt-4">
              This quiz provides general information only and does not constitute legal advice. Immigration law is complex — please consult a licensed immigration attorney or DOJ Accredited Representative for guidance specific to your situation.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CitizenshipQuiz;
