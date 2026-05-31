import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Sparkles,
  FileText, Heart, Briefcase, GraduationCap, Shield,
  Globe, Award, Loader2, ChevronRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface QuizStep {
  id: string;
  question: string;
  helpText?: string;
  options: { value: string; label: string; icon?: any; description?: string }[];
}

const steps: QuizStep[] = [
  {
    id: "category",
    question: "What brings you to the immigration process?",
    helpText: "Select the category that best describes your situation.",
    options: [
      { value: "family", label: "Family", icon: Heart, description: "Spouse, parent, child, or sibling sponsorship" },
      { value: "work", label: "Work", icon: Briefcase, description: "Employment-based visa or green card" },
      { value: "study", label: "Study", icon: GraduationCap, description: "Student visa or academic program" },
      { value: "humanitarian", label: "Humanitarian", icon: Shield, description: "Asylum, TPS, VAWA, or U-visa" },
      { value: "citizenship", label: "Citizenship", icon: Award, description: "Naturalization or citizenship" },
      { value: "travel", label: "Travel / Status", icon: Globe, description: "Extend visa, change status, or travel document" },
    ],
  },
  {
    id: "family_relationship",
    question: "Who are you applying through?",
    helpText: "Select the family relationship that applies.",
    options: [
      { value: "spouse", label: "Spouse", description: "Married to a U.S. citizen or permanent resident" },
      { value: "parent", label: "Parent", description: "Your parent is a U.S. citizen" },
      { value: "child", label: "Child", description: "Your child is a U.S. citizen (21+)" },
      { value: "sibling", label: "Sibling", description: "Your sibling is a U.S. citizen" },
    ],
  },
  {
    id: "sponsor_status",
    question: "Is your petitioner a U.S. citizen or permanent resident?",
    options: [
      { value: "citizen", label: "U.S. Citizen", description: "Born in the U.S. or naturalized" },
      { value: "lpr", label: "Permanent Resident", description: "Green card holder (LPR)" },
      { value: "unsure", label: "I'm not sure", description: "We can help you figure this out" },
    ],
  },
  {
    id: "location",
    question: "Where are you currently located?",
    options: [
      { value: "inside_us", label: "Inside the United States", description: "Currently physically present in the U.S." },
      { value: "outside_us", label: "Outside the United States", description: "Living abroad or at a U.S. consulate" },
    ],
  },
  {
    id: "entry_type",
    question: "How did you enter the United States?",
    helpText: "This helps determine which filing path may apply.",
    options: [
      { value: "visa", label: "With a valid visa", description: "Tourist, student, work, or other visa" },
      { value: "parole", label: "With parole or humanitarian entry", description: "Paroled into the U.S." },
      { value: "without_inspection", label: "Without inspection", description: "Entered without a visa or official entry" },
      { value: "not_applicable", label: "Not applicable", description: "Born in the U.S. or entered as an infant" },
    ],
  },
  {
    id: "prior_filings",
    question: "Have you ever applied for immigration benefits before?",
    options: [
      { value: "yes", label: "Yes", description: "I have filed immigration forms before" },
      { value: "no", label: "No", description: "This is my first time" },
      { value: "unsure", label: "I'm not sure", description: "I may have but I'm not certain" },
    ],
  },
  {
    id: "work_ead",
    question: "Do you need a work permit while your case is pending?",
    options: [
      { value: "yes", label: "Yes, I need to work", description: "I want to apply for an Employment Authorization Document" },
      { value: "no", label: "No, I don't need one now", description: "I already have work authorization or don't need it" },
    ],
  },
  {
    id: "travel_doc",
    question: "Do you need to travel outside the U.S. while your case is pending?",
    options: [
      { value: "yes", label: "Yes, I may need to travel", description: "I want to apply for Advance Parole" },
      { value: "no", label: "No travel planned", description: "I will stay in the U.S." },
    ],
  },
];

// Determine which forms are needed based on answers
function determineRequiredForms(answers: Record<string, string>): { code: string; name: string; reason: string; required: boolean }[] {
  const forms: { code: string; name: string; reason: string; required: boolean }[] = [];
  const cat = answers.category;

  if (cat === "family") {
    forms.push({ code: "I-130", name: "Petition for Alien Relative", reason: "Required to establish the family relationship", required: true });

    if (answers.location === "inside_us" && answers.entry_type !== "without_inspection") {
      forms.push({ code: "I-485", name: "Adjustment of Status", reason: "Apply for a green card from inside the U.S.", required: true });
    }

    if (answers.sponsor_status === "citizen" && answers.family_relationship === "spouse" && answers.location === "inside_us") {
      forms.push({ code: "I-864", name: "Affidavit of Support", reason: "Financial sponsorship required for family-based cases", required: true });
      forms.push({ code: "I-693", name: "Medical Examination Report", reason: "Required medical exam for adjustment of status", required: true });
    }

    if (answers.work_ead === "yes") {
      forms.push({ code: "I-765", name: "Employment Authorization", reason: "Work permit while your case is pending", required: false });
    }

    if (answers.travel_doc === "yes") {
      forms.push({ code: "I-131", name: "Travel Document", reason: "Advance parole for travel during pending case", required: false });
    }

    if (answers.location === "outside_us") {
      forms.push({ code: "DS-160", name: "Nonimmigrant Visa Application", reason: "Required for consular processing", required: true });
    }
  }

  if (cat === "work") {
    forms.push({ code: "I-129", name: "Petition for Nonimmigrant Worker", reason: "Employer-sponsored work visa petition", required: true });
    if (answers.location === "inside_us") {
      forms.push({ code: "I-765", name: "Employment Authorization", reason: "Work permit application", required: true });
    }
  }

  if (cat === "study") {
    forms.push({ code: "I-20", name: "Student Visa (F-1)", reason: "Certificate of eligibility for student status", required: true });
    if (answers.location === "outside_us") {
      forms.push({ code: "DS-160", name: "Nonimmigrant Visa Application", reason: "Visa application at consulate", required: true });
    }
  }

  if (cat === "humanitarian") {
    forms.push({ code: "I-589", name: "Application for Asylum", reason: "Apply for protection from persecution", required: true });
    forms.push({ code: "I-765", name: "Employment Authorization", reason: "Work permit for asylum applicants", required: false });
  }

  if (cat === "citizenship") {
    forms.push({ code: "N-400", name: "Application for Naturalization", reason: "Apply for U.S. citizenship", required: true });
  }

  if (cat === "travel") {
    forms.push({ code: "I-539", name: "Change/Extend Status", reason: "Extend your stay or change visa category", required: true });
  }

  return forms;
}

// Determine which steps to show based on answers
function getVisibleSteps(answers: Record<string, string>): QuizStep[] {
  const visible: QuizStep[] = [steps[0]]; // always show category

  if (answers.category === "family") {
    visible.push(steps[1]); // family_relationship
    visible.push(steps[2]); // sponsor_status
    visible.push(steps[3]); // location
    if (answers.location === "inside_us") {
      visible.push(steps[4]); // entry_type
    }
    visible.push(steps[5]); // prior_filings
    visible.push(steps[6]); // work_ead
    visible.push(steps[7]); // travel_doc
  } else {
    visible.push(steps[3]); // location
    visible.push(steps[5]); // prior_filings
    if (answers.category === "work" || answers.category === "humanitarian") {
      visible.push(steps[6]); // work_ead
    }
  }

  return visible;
}

const GuidedPetitionBuilder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const visibleSteps = getVisibleSteps(answers);
  const step = visibleSteps[currentStep];
  const progress = showResults ? 100 : ((currentStep) / visibleSteps.length) * 100;

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [step.id]: value };
    setAnswers(newAnswers);

    // Recalculate visible steps with new answers
    const newVisible = getVisibleSteps(newAnswers);
    if (currentStep + 1 >= newVisible.length) {
      setShowResults(true);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const goBack = () => {
    if (showResults) {
      setShowResults(false);
      return;
    }
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const requiredForms = showResults ? determineRequiredForms(answers) : [];

  const handleStartForms = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      // Ensure case exists
      const { data: participants } = await supabase
        .from("case_participants")
        .select("case_id")
        .eq("user_id", user.id)
        .limit(1);

      let caseId: string;

      if (participants && participants.length > 0) {
        caseId = participants[0].case_id;
      } else {
        const caseNumber = `DOME-${Date.now().toString(36).toUpperCase()}`;
        const caseType = (answers.category === "family" && answers.family_relationship === "spouse" && answers.location === "inside_us")
          ? "Adjustment of Status"
          : answers.category || "general";
        const { data: newCase, error } = await supabase
          .from("cases")
          .insert({ case_number: caseNumber, case_type: caseType, created_by: user.id, status: "draft", priority: "medium" })
          .select("id")
          .single();
        if (error) throw error;
        await supabase.from("case_participants").insert({ case_id: newCase.id, user_id: user.id, role: "client" });
        caseId = newCase.id;
      }

      // Check existing form instances
      const { data: existing } = await supabase
        .from("form_instances")
        .select("form_type")
        .eq("case_id", caseId);

      const existingTypes = existing?.map(f => f.form_type) || [];
      const newForms = requiredForms.filter(f => !existingTypes.includes(f.code));

      if (newForms.length > 0) {
        const rows = newForms.map(f => ({
          case_id: caseId,
          form_type: f.code,
          form_name: f.name,
          status: "not_started" as const,
          progress: 0,
        }));

        const { error } = await supabase.from("form_instances").insert(rows);
        if (error) throw error;
      }

      toast({
        title: `${newForms.length} form(s) added to your case`,
        description: "You can now start filling them out.",
      });

      navigate("/portal/case-package");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-2 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={currentStep === 0 && !showResults ? undefined : goBack} className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Guided Petition Builder</h1>
          <p className="text-xs text-muted-foreground">Answer simple questions — we'll determine your forms</p>
        </div>
        <Sparkles className="w-5 h-5 text-secondary" />
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-1.5" />
      <p className="text-[10px] text-muted-foreground text-right">
        {showResults ? "Results" : `Step ${currentStep + 1} of ${visibleSteps.length}`}
      </p>

      {!showResults && step ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-display text-lg font-bold text-foreground">{step.question}</h2>
            {step.helpText && (
              <p className="text-xs text-muted-foreground">{step.helpText}</p>
            )}
          </div>

          <div className="space-y-2">
            {step.options.map(opt => {
              const isSelected = answers[step.id] === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl p-4 border-2 transition-all text-left",
                    isSelected
                      ? "border-secondary bg-secondary/5 shadow-sm"
                      : "border-border hover:border-secondary/30 hover:bg-muted/30"
                  )}
                >
                  {Icon && (
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      isSelected ? "bg-secondary text-secondary-foreground" : "bg-muted"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    {opt.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                    )}
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      ) : showResults ? (
        <div className="space-y-4">
          {/* Results header */}
          <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl border border-secondary/20 p-5 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-secondary mx-auto" />
            <h2 className="font-display text-lg font-bold">Your Recommended Forms</h2>
            <p className="text-xs text-muted-foreground">
              Based on your answers, these forms may be needed for your case. This is informational guidance only — not legal advice.
            </p>
          </div>

          {/* Required forms */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-secondary" /> Required Forms
            </h3>
            {requiredForms.filter(f => f.required).map(form => (
              <Card key={form.code} className="border-secondary/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{form.code}</span>
                      <Badge className="bg-secondary/10 text-secondary border-0 text-[9px]">Required</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{form.name}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">{form.reason}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Optional forms */}
          {requiredForms.filter(f => !f.required).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground">Optional / Recommended</h3>
              {requiredForms.filter(f => !f.required).map(form => (
                <Card key={form.code} className="border-border/50">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{form.code}</span>
                        <Badge variant="outline" className="text-[9px]">Optional</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{form.name}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">{form.reason}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <Button
              className="w-full gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground h-12 text-base"
              onClick={handleStartForms}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>Add All Forms to My Case <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>

            <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/portal/forms")}>
              <FileText className="w-4 h-4" /> Or Browse All Forms Manually
            </Button>

            <Button variant="ghost" className="w-full text-xs" onClick={() => { setShowResults(false); setCurrentStep(0); setAnswers({}); }}>
              Start Over
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground/60 text-center pb-4">
            D.O.M.E. provides educational tools and document organization. D.O.M.E. does not provide legal advice.
            Consider reviewing with an immigration attorney or DOJ Accredited Representative.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default GuidedPetitionBuilder;
