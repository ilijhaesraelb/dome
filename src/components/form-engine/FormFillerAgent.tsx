import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Bot, User, ArrowRight, CheckCircle2, ArrowLeft,
  Mic, MicOff, Send, Loader2, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { buildFormDraftStorageKey } from "@/lib/form-flow";

// ── Field & Application types ──────────────────────────────────────────

interface AgentField {
  key: string;
  label: string;
  question: string;
  type: "text" | "date" | "select";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  help?: string;
}

interface ApplicationConfig {
  goalId: string;
  icon: string;
  title: string;
  subtitle: string;
  formCode: string;
  formName: string;
  filingFee: string;
  estimatedTime: string;
  fields: AgentField[];
}

// ── Application definitions ────────────────────────────────────────────
// Keys match formSections.ts so the FormWorkspace hydrates from localStorage

const APPLICATIONS: ApplicationConfig[] = [
  {
    goalId: "green_card",
    icon: "🟢",
    title: "Get a Green Card",
    subtitle: "Permanent residence in the U.S.",
    formCode: "I-485",
    formName: "Adjustment of Status",
    filingFee: "$1,140",
    estimatedTime: "8–14 months",
    fields: [
      { key: "first_name", label: "First Name", question: "What is your legal given (first) name?", type: "text", required: true, placeholder: "e.g. Maria" },
      { key: "last_name", label: "Last Name", question: "What is your legal family (last) name?", type: "text", required: true, placeholder: "e.g. Santos" },
      { key: "date_of_birth", label: "Date of Birth", question: "What is your date of birth? (MM/DD/YYYY)", type: "text", required: true, placeholder: "e.g. 04/15/1990", help: "Use MM/DD/YYYY format" },
      { key: "country_of_birth", label: "Country of Birth", question: "In which country were you born?", type: "text", required: true, placeholder: "e.g. Philippines" },
      { key: "immigration_status", label: "Current Immigration Status", question: "What is your current U.S. immigration status?", type: "select", required: true, options: ["F-1 Student", "H-1B Worker", "B-1/B-2 Visitor", "Asylee/Refugee", "Humanitarian Parole", "TPS Holder", "Out of status / Undocumented", "Other"] },
      { key: "date_of_last_entry", label: "Date of Last U.S. Entry", question: "What date did you last enter the United States? (MM/DD/YYYY)", type: "text", required: true, placeholder: "e.g. 06/01/2022" },
      { key: "alien_number", label: "A-Number", question: "Do you have an Alien Registration Number (A-Number)? Enter it, or type \"None\".", type: "text", placeholder: "e.g. A012345678 or None", help: "Found on green card, EAD, or prior notices" },
      { key: "city", label: "City of Residence", question: "What city do you currently live in?", type: "text", required: true, placeholder: "e.g. Miami" },
      { key: "state", label: "State", question: "What 2-letter U.S. state abbreviation do you live in?", type: "text", required: true, placeholder: "e.g. FL" },
    ],
  },
  {
    goalId: "citizenship",
    icon: "🇺🇸",
    title: "Become a U.S. Citizen",
    subtitle: "Naturalization through N-400",
    formCode: "N-400",
    formName: "Application for Naturalization",
    filingFee: "$710",
    estimatedTime: "8–14 months",
    fields: [
      { key: "first_name", label: "First Name", question: "What is your legal given (first) name?", type: "text", required: true, placeholder: "e.g. Carlos" },
      { key: "last_name", label: "Last Name", question: "What is your legal family (last) name?", type: "text", required: true, placeholder: "e.g. Mendez" },
      { key: "date_of_birth", label: "Date of Birth", question: "What is your date of birth? (MM/DD/YYYY)", type: "text", required: true, placeholder: "e.g. 07/22/1985" },
      { key: "country_of_birth", label: "Country of Birth", question: "What country were you born in?", type: "text", required: true, placeholder: "e.g. Mexico" },
      { key: "alien_number", label: "A-Number", question: "What is the A-Number on your green card?", type: "text", required: true, placeholder: "e.g. A012345678", help: "Printed on the front of your Permanent Resident Card" },
      { key: "date_became_resident", label: "Date Became Permanent Resident", question: "What date did you become a Permanent Resident? (MM/DD/YYYY)", type: "text", required: true, placeholder: "e.g. 03/10/2018", help: "Shown on the front of your green card" },
      { key: "marital_status", label: "Marital Status", question: "What is your current marital status?", type: "select", options: ["Single", "Married", "Divorced", "Widowed", "Separated"] },
      { key: "city", label: "City", question: "What city do you currently live in?", type: "text", required: true, placeholder: "e.g. Chicago" },
      { key: "state", label: "State", question: "What state? (2-letter abbreviation)", type: "text", required: true, placeholder: "e.g. IL" },
    ],
  },
  {
    goalId: "work_permit",
    icon: "💼",
    title: "Get a Work Permit",
    subtitle: "Employment Authorization (EAD)",
    formCode: "I-765",
    formName: "Application for Employment Authorization",
    filingFee: "$410",
    estimatedTime: "3–6 months",
    fields: [
      { key: "first_name", label: "First Name", question: "What is your legal first name?", type: "text", required: true, placeholder: "e.g. Aisha" },
      { key: "last_name", label: "Last Name", question: "What is your legal last name?", type: "text", required: true, placeholder: "e.g. Khan" },
      { key: "date_of_birth", label: "Date of Birth", question: "What is your date of birth? (MM/DD/YYYY)", type: "text", required: true, placeholder: "e.g. 09/30/1992" },
      { key: "country_of_birth", label: "Country of Birth", question: "What country were you born in?", type: "text", required: true, placeholder: "e.g. Pakistan" },
      { key: "category", label: "EAD Eligibility Category", question: "Which best describes the basis for your work permit application?", type: "select", required: true, options: ["Pending I-485 (adjustment applicant)", "Asylum applicant (I-589 pending)", "TPS holder or applicant", "DACA recipient", "Spouse of H-1B (H-4 pending EAD)", "Refugee or asylee", "Other"] },
      { key: "alien_number", label: "A-Number", question: "Do you have an A-Number? Enter it, or type \"None\".", type: "text", placeholder: "e.g. A012345678 or None" },
      { key: "city", label: "City", question: "What city do you currently live in?", type: "text", required: true, placeholder: "e.g. Houston" },
      { key: "state", label: "State", question: "What state? (2-letter)", type: "text", required: true, placeholder: "e.g. TX" },
    ],
  },
  {
    goalId: "remove_conditions",
    icon: "📋",
    title: "Remove Conditions",
    subtitle: "I-751 for conditional residents",
    formCode: "I-751",
    formName: "Petition to Remove Conditions on Residence",
    filingFee: "$750",
    estimatedTime: "12–24 months",
    fields: [
      { key: "first_name", label: "First Name", question: "What is your legal first name (as shown on your conditional green card)?", type: "text", required: true, placeholder: "e.g. Sofia" },
      { key: "last_name", label: "Last Name", question: "What is your legal last name?", type: "text", required: true, placeholder: "e.g. Rossi" },
      { key: "date_of_birth", label: "Date of Birth", question: "What is your date of birth? (MM/DD/YYYY)", type: "text", required: true, placeholder: "e.g. 11/05/1988" },
      { key: "alien_number", label: "A-Number", question: "What is the A-Number on your conditional green card?", type: "text", required: true, placeholder: "e.g. A012345678", help: "On the front of your 2-year green card" },
      { key: "petitioner_marital_status", label: "Current Marital Status", question: "What is your current marital status?", type: "select", required: true, options: ["Married", "Divorced", "Widowed", "Separated"] },
      { key: "petitioner_first_name", label: "Spouse First Name", question: "What is the first name of the spouse who originally petitioned for you?", type: "text", required: true, placeholder: "e.g. John" },
      { key: "petitioner_last_name", label: "Spouse Last Name", question: "What is your spouse's last name?", type: "text", required: true, placeholder: "e.g. Smith" },
      { key: "city", label: "City", question: "What city do you currently live in?", type: "text", required: true, placeholder: "e.g. New York" },
      { key: "state", label: "State", question: "What state? (2-letter)", type: "text", required: true, placeholder: "e.g. NY" },
    ],
  },
  {
    goalId: "protection",
    icon: "🛡️",
    title: "I Need Protection",
    subtitle: "Asylum, U-visa, VAWA, TPS",
    formCode: "I-589",
    formName: "Application for Asylum and Withholding of Removal",
    filingFee: "$0",
    estimatedTime: "6–48 months",
    fields: [
      { key: "first_name", label: "First Name", question: "What is your legal first name?", type: "text", required: true, placeholder: "e.g. Jean" },
      { key: "last_name", label: "Last Name", question: "What is your legal last name?", type: "text", required: true, placeholder: "e.g. Pierre" },
      { key: "date_of_birth", label: "Date of Birth", question: "What is your date of birth? (MM/DD/YYYY)", type: "text", required: true, placeholder: "e.g. 02/14/1995" },
      { key: "country_of_birth", label: "Country of Nationality", question: "What country are you a citizen of or from?", type: "text", required: true, placeholder: "e.g. Haiti" },
      { key: "protection_type", label: "Type of Protection", question: "Which type of protection are you seeking?", type: "select", required: true, options: ["Asylum (fear of persecution)", "U Visa (crime victim)", "VAWA (domestic violence)", "Temporary Protected Status (TPS)"] },
      { key: "date_of_last_entry", label: "Date of Last U.S. Entry", question: "When did you last enter the United States? (MM/DD/YYYY)", type: "text", required: true, placeholder: "e.g. 01/20/2023" },
      { key: "city", label: "City", question: "What city do you currently live in?", type: "text", required: true, placeholder: "e.g. Miami" },
      { key: "state", label: "State", question: "What state? (2-letter)", type: "text", required: true, placeholder: "e.g. FL" },
    ],
  },
  {
    goalId: "visa",
    icon: "✈️",
    title: "Get a Visa",
    subtitle: "Visitor, student, or work visa",
    formCode: "I-539",
    formName: "Application to Change/Extend Nonimmigrant Status",
    filingFee: "$370",
    estimatedTime: "3–8 months",
    fields: [
      { key: "first_name", label: "First Name", question: "What is your legal first name?", type: "text", required: true, placeholder: "e.g. Nguyen" },
      { key: "last_name", label: "Last Name", question: "What is your legal last name?", type: "text", required: true, placeholder: "e.g. Tran" },
      { key: "date_of_birth", label: "Date of Birth", question: "What is your date of birth? (MM/DD/YYYY)", type: "text", required: true, placeholder: "e.g. 05/19/1993" },
      { key: "country_of_birth", label: "Country of Birth", question: "What country were you born in?", type: "text", required: true, placeholder: "e.g. Vietnam" },
      { key: "immigration_status", label: "Current Status", question: "What is your current nonimmigrant status in the U.S.?", type: "select", required: true, options: ["B-1/B-2 (visitor)", "F-1 (student)", "H-1B (worker)", "H-4 (dependent)", "L-1 (intracompany transfer)", "J-1 (exchange visitor)", "Other"] },
      { key: "applicant_i94_expires", label: "I-94 Expiry", question: "When does your current status expire? Check i94.cbp.dhs.gov if needed. (MM/DD/YYYY)", type: "text", required: true, placeholder: "e.g. 12/31/2025" },
      { key: "city", label: "City", question: "What city do you currently live in?", type: "text", required: true, placeholder: "e.g. San Francisco" },
      { key: "state", label: "State", question: "What state? (2-letter)", type: "text", required: true, placeholder: "e.g. CA" },
    ],
  },
  {
    goalId: "not_sure",
    icon: "❓",
    title: "I'm Not Sure",
    subtitle: "Help me figure out my options",
    formCode: "",
    formName: "",
    filingFee: "",
    estimatedTime: "",
    fields: [],
  },
];

// ── Chat message type ──────────────────────────────────────────────────

interface ChatMsg {
  role: "agent" | "user";
  text: string;
  fieldKey?: string;
}

type Phase = "select" | "filling" | "submitting" | "complete";

// ── Props ──────────────────────────────────────────────────────────────

interface FormFillerAgentProps {
  onExit: () => void;
  onGoToPathwayFinder?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────

export default function FormFillerAgent({ onExit, onGoToPathwayFinder }: FormFillerAgentProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("select");
  const [selectedApp, setSelectedApp] = useState<ApplicationConfig | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [completedFormId, setCompletedFormId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatHistory]);

  const resetToSelect = () => {
    setPhase("select");
    setSelectedApp(null);
    setCurrentStep(0);
    setAnswers({});
    setChatHistory([]);
    setInputValue("");
    setCompletedFormId(null);
  };

  const startApp = (app: ApplicationConfig) => {
    if (app.goalId === "not_sure") {
      if (onGoToPathwayFinder) onGoToPathwayFinder();
      else navigate("/pathway-finder");
      return;
    }
    setSelectedApp(app);
    setCurrentStep(0);
    setAnswers({});
    setChatHistory([
      {
        role: "agent",
        text: `I'll help you start your ${app.formCode} — ${app.formName} (filing fee: ${app.filingFee || "none"}, typical time: ${app.estimatedTime}). I'll ask you ${app.fields.length} questions to gather your key information. You can complete the full details in the form workspace afterward.\n\nLet's begin!`,
      },
      {
        role: "agent",
        text: app.fields[0].question,
        fieldKey: app.fields[0].key,
      },
    ]);
    setPhase("filling");
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const submitAnswer = useCallback((value: string) => {
    if (!selectedApp || !value.trim()) return;
    const field = selectedApp.fields[currentStep];
    const trimmed = value.trim();

    setChatHistory(prev => [...prev, { role: "user", text: trimmed }]);
    const updatedAnswers = { ...answers, [field.key]: trimmed };
    setAnswers(updatedAnswers);
    setInputValue("");

    const nextStep = currentStep + 1;

    if (nextStep < selectedApp.fields.length) {
      setCurrentStep(nextStep);
      const nextField = selectedApp.fields[nextStep];
      setTimeout(() => {
        setChatHistory(prev => [...prev, {
          role: "agent",
          text: nextField.question,
          fieldKey: nextField.key,
        }]);
        inputRef.current?.focus();
      }, 300);
    } else {
      setTimeout(() => {
        setChatHistory(prev => [...prev, {
          role: "agent",
          text: "Perfect — I have everything I need. Creating your form now...",
        }]);
        handleSubmit(updatedAnswers);
      }, 300);
    }
  }, [selectedApp, currentStep, answers]);

  const handleSubmit = async (finalAnswers: Record<string, string>) => {
    if (!selectedApp || !user) return;
    setPhase("submitting");

    try {
      // Ensure case exists
      const { data: caseData, error: caseError } = await supabase.rpc("initialize_client_case", {
        _user_id: user.id,
      });
      if (caseError) throw caseError;
      const caseId = (caseData as { case_id: string } | null)?.case_id;
      if (!caseId) throw new Error("Could not initialize your case file.");

      // Create form instance
      const { data: formInstance, error: formError } = await supabase
        .from("form_instances")
        .insert({
          case_id: caseId,
          form_type: selectedApp.formCode,
          form_name: selectedApp.formName,
          status: "not_started",
          progress: 0,
        })
        .select("id")
        .single();
      if (formError) throw formError;

      const formId = formInstance.id;

      // Pre-populate the form workspace draft from collected answers
      localStorage.setItem(buildFormDraftStorageKey(formId), JSON.stringify(finalAnswers));

      setCompletedFormId(formId);
      setPhase("complete");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create your form.";
      toast({ title: "Error", description: message, variant: "destructive" });
      setPhase("filling");
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = (window as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
      || (window as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) {
      toast({ variant: "destructive", title: "Not supported", description: "Voice input is not available in this browser." });
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      setInputValue(e.results[0][0].transcript);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  };

  // ── Phase: Select ──────────────────────────────────────────────────

  if (phase === "select") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onExit}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <p className="text-sm font-semibold text-foreground">Fill an Application</p>
            <p className="text-xs text-muted-foreground">Select what you'd like to do</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {APPLICATIONS.map((app) => (
            <button
              key={app.goalId}
              onClick={() => startApp(app)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border bg-card hover:border-primary/40 hover:bg-accent/30 transition-all text-left group"
            >
              <span className="text-2xl shrink-0 leading-none">{app.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">{app.title}</p>
                <p className="text-xs text-muted-foreground">{app.subtitle}</p>
                {app.formCode && (
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono">{app.formCode}</Badge>
                    {app.filingFee && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">{app.filingFee}</Badge>
                    )}
                    {app.estimatedTime && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">{app.estimatedTime}</Badge>
                    )}
                  </div>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Phase: Submitting ─────────────────────────────────────────────

  if (phase === "submitting") {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 p-8 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm font-semibold text-foreground">Creating your form...</p>
        <p className="text-xs text-muted-foreground">Saving your answers and setting up your workspace.</p>
      </div>
    );
  }

  // ── Phase: Complete ───────────────────────────────────────────────

  if (phase === "complete" && selectedApp) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{selectedApp.formCode} Started!</p>
            <p className="text-xs text-muted-foreground">Your answers have been pre-filled</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-center space-y-1.5">
            <p className="text-sm font-medium text-foreground">
              {selectedApp.icon} {selectedApp.formName}
            </p>
            <p className="text-xs text-muted-foreground">
              {Object.keys(answers).length} fields collected — click below to continue in the full editor
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/60 divide-y divide-border/50">
            {Object.entries(answers).map(([key, val]) => {
              const field = selectedApp.fields.find(f => f.key === key);
              return (
                <div key={key} className="flex items-start gap-3 px-4 py-3">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{field?.label || key}</p>
                    <p className="text-sm text-foreground font-medium truncate">{val}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground text-center leading-relaxed px-2">
            This tool provides general assistance only and is not legal advice. Please consult a qualified immigration attorney or accredited representative for your specific situation.
          </p>
        </div>

        <div className="shrink-0 p-4 border-t border-border space-y-2">
          <Button
            className="w-full gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
            onClick={() => completedFormId && navigate(`/portal/forms/${completedFormId}`)}
          >
            <FileText className="w-4 h-4" />
            Continue in Form Workspace
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="w-full text-xs" onClick={resetToSelect}>
            Start Another Application
          </Button>
        </div>
      </div>
    );
  }

  // ── Phase: Filling ────────────────────────────────────────────────

  if (phase === "filling" && selectedApp) {
    const totalFields = selectedApp.fields.length;
    const progressPct = Math.round((currentStep / totalFields) * 100);
    const currentField = selectedApp.fields[currentStep];

    return (
      <div className="flex flex-col h-full">
        {/* Header + progress */}
        <div className="shrink-0 px-4 py-3 border-b border-border space-y-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={resetToSelect}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{selectedApp.icon} {selectedApp.title}</p>
              <p className="text-[10px] text-muted-foreground font-mono">
                {selectedApp.formCode} · Question {Math.min(currentStep + 1, totalFields)} of {totalFields}
              </p>
            </div>
          </div>
          <Progress value={progressPct} className="h-1.5" />
        </div>

        {/* Chat messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {chatHistory.map((msg, i) => (
            <div key={i} className={cn("flex gap-2 items-end", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "agent" && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.role === "agent" && msg.fieldKey && (
                  (() => {
                    const fieldHelp = selectedApp.fields.find(f => f.key === msg.fieldKey)?.help;
                    return fieldHelp ? (
                      <p className="text-[10px] text-muted-foreground mt-1.5 italic">💡 {fieldHelp}</p>
                    ) : null;
                  })()
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-secondary" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="shrink-0 p-4 border-t border-border space-y-2">
          {currentField?.type === "select" && currentField.options ? (
            <div className="flex flex-col gap-1.5">
              {currentField.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => submitAnswer(opt)}
                  className="w-full text-left px-4 py-2.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/30 transition-all text-sm font-medium"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleVoice}
                className={cn(
                  "shrink-0 rounded-full h-10 w-10",
                  isListening && "bg-secondary text-secondary-foreground border-secondary animate-pulse"
                )}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue.trim()) submitAnswer(inputValue);
                }}
                placeholder={currentField?.placeholder || "Type your answer..."}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition"
              />
              <Button
                size="icon"
                className="shrink-0 rounded-full h-10 w-10 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                onClick={() => submitAnswer(inputValue)}
                disabled={!inputValue.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}

          {!currentField?.required && (
            <button
              onClick={() => submitAnswer("—")}
              className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors py-0.5 text-center"
            >
              Skip this question →
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
