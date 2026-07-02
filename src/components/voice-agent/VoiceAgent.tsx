/**
 * D.O.M.E. Voice-Guided Application Agent
 *
 * Security:
 *  - Raw audio is never stored — only parsed text values
 *  - Sensitive fields (SSN, A-Number, EIN, passport) masked in UI, never spoken aloud
 *  - Confirmation required before saving any sensitive field
 */

import { useReducer, useRef, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic, X, ChevronLeft, ChevronRight, Play, Pause, RefreshCw,
  Check, HelpCircle, RotateCcw, FileText, Globe, Shield,
  Building2, Heart, AlertCircle, ArrowRight, BookOpen,
  CheckCircle2, ChevronDown, ChevronUp, Keyboard, Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SUPPORTED_LANGUAGES } from "@/hooks/useTranslation";
import { buildFormDraftStorageKey } from "@/lib/form-flow";
import { FORM_SECTIONS, type FormSection, type FormFieldDef } from "@/data/formSections";
import { INDIVIDUAL_TAX_INTAKE_SECTIONS, NONPROFIT_INTAKE_SECTIONS } from "@/data/taxFormSections";
import { detectCommand } from "@/lib/voice-agent/commandDetector";
import { parseAnswer, isSensitiveField, maskValue } from "@/lib/voice-agent/answerParser";
import {
  type AgentLang,
  AGENT_LANG_LOCALE,
  t as tMsg,
  getFieldQuestion,
} from "@/lib/voice-agent/agentTranslations";

// ── Types ─────────────────────────────────────────────────────────────────────
type MicStatus = "Off" | "Listening" | "Processing" | "Confirming" | "Saved" | "Paused" | "Error";
type Phase = "idle" | "starting" | "asking" | "confirming" | "section_end" | "form_complete" | "paused" | "error";

// ── State / reducer ───────────────────────────────────────────────────────────
interface AgentState {
  phase: Phase;
  formCode: string; formName: string; sections: FormSection[];
  sectionIdx: number; fieldIdx: number;
  answers: Record<string, string>;
  pendingValue: string; pendingMasked: string; pendingSensitive: boolean;
  formInstanceId: string | null;
  liveTranscript: string; agentSpeech: string;
  micStatus: MicStatus; isSpeaking: boolean;
  language: AgentLang;
  spellingMode: boolean; spellingBuffer: string;
  error: string | null;
}

const INITIAL: AgentState = {
  phase: "idle", formCode: "", formName: "", sections: [],
  sectionIdx: 0, fieldIdx: 0, answers: {},
  pendingValue: "", pendingMasked: "", pendingSensitive: false,
  formInstanceId: null, liveTranscript: "", agentSpeech: "",
  micStatus: "Off", isSpeaking: false, language: "en",
  spellingMode: false, spellingBuffer: "", error: null,
};

type Action =
  | { type: "START"; formCode: string; formName: string; sections: FormSection[]; formInstanceId: string }
  | { type: "SET_LIVE"; text: string }
  | { type: "SET_SPEECH"; text: string }
  | { type: "SET_MIC"; status: MicStatus }
  | { type: "SET_SPEAKING"; v: boolean }
  | { type: "SET_PENDING"; value: string; masked: string; sensitive: boolean }
  | { type: "CONFIRM" } | { type: "REJECT" } | { type: "SKIP" }
  | { type: "GO_BACK" } | { type: "PAUSE" } | { type: "RESUME" }
  | { type: "STOP" } | { type: "NEXT_SECTION" }
  | { type: "TOGGLE_SPELL" } | { type: "SPELL_LETTER"; letter: string } | { type: "SPELL_DONE" }
  | { type: "SET_LANG"; lang: AgentLang }
  | { type: "SET_ERROR"; msg: string };

function nextPos(s: AgentState) {
  if (s.fieldIdx + 1 < s.sections[s.sectionIdx].fields.length) return { si: s.sectionIdx, fi: s.fieldIdx + 1 };
  if (s.sectionIdx + 1 < s.sections.length) return { si: s.sectionIdx + 1, fi: 0 };
  return null;
}
function prevPos(s: AgentState) {
  if (s.fieldIdx > 0) return { si: s.sectionIdx, fi: s.fieldIdx - 1 };
  if (s.sectionIdx > 0) return { si: s.sectionIdx - 1, fi: s.sections[s.sectionIdx - 1].fields.length - 1 };
  return null;
}
function isEndOfSection(s: AgentState) {
  return s.fieldIdx === s.sections[s.sectionIdx].fields.length - 1;
}
function confirmField(s: AgentState): AgentState {
  const field = s.sections[s.sectionIdx]?.fields[s.fieldIdx];
  const newAnswers = field ? { ...s.answers, [field.key]: s.pendingValue } : s.answers;
  const next = nextPos(s);
  if (!next) return { ...s, answers: newAnswers, phase: "form_complete", micStatus: "Saved", pendingValue: "", pendingMasked: "", liveTranscript: "" };
  const crossSection = isEndOfSection(s) && next.si !== s.sectionIdx;
  return {
    ...s, answers: newAnswers,
    phase: crossSection ? "section_end" : "asking",
    sectionIdx: next.si, fieldIdx: next.fi,
    micStatus: crossSection ? "Saved" : "Listening",
    pendingValue: "", pendingMasked: "", liveTranscript: "",
  };
}

function reducer(s: AgentState, a: Action): AgentState {
  switch (a.type) {
    case "START": return { ...INITIAL, phase: "asking", formCode: a.formCode, formName: a.formName, sections: a.sections, formInstanceId: a.formInstanceId, micStatus: "Listening", language: s.language };
    case "SET_LIVE": return { ...s, liveTranscript: a.text };
    case "SET_SPEECH": return { ...s, agentSpeech: a.text };
    case "SET_MIC": return { ...s, micStatus: a.status };
    case "SET_SPEAKING": return { ...s, isSpeaking: a.v };
    case "SET_PENDING": return { ...s, phase: "confirming", micStatus: "Confirming", pendingValue: a.value, pendingMasked: a.masked, pendingSensitive: a.sensitive, liveTranscript: "" };
    case "CONFIRM": return confirmField(s);
    case "REJECT": return { ...s, phase: "asking", micStatus: "Listening", pendingValue: "", pendingMasked: "", liveTranscript: "" };
    case "SKIP": {
      const next = nextPos(s);
      if (!next) return { ...s, phase: "form_complete", micStatus: "Saved" };
      const crossSection = isEndOfSection(s) && next.si !== s.sectionIdx;
      return { ...s, phase: crossSection ? "section_end" : "asking", sectionIdx: next.si, fieldIdx: next.fi, micStatus: crossSection ? "Saved" : "Listening", liveTranscript: "" };
    }
    case "GO_BACK": {
      const prev = prevPos(s);
      if (!prev) return s;
      return { ...s, phase: "asking", sectionIdx: prev.si, fieldIdx: prev.fi, micStatus: "Listening", pendingValue: "", pendingMasked: "", liveTranscript: "" };
    }
    case "PAUSE": return { ...s, phase: "paused", micStatus: "Paused" };
    case "RESUME": return { ...s, phase: "asking", micStatus: "Listening" };
    case "STOP": return { ...INITIAL };
    case "NEXT_SECTION": return { ...s, phase: "asking", micStatus: "Listening", liveTranscript: "" };
    case "TOGGLE_SPELL": return { ...s, spellingMode: !s.spellingMode, spellingBuffer: "" };
    case "SPELL_LETTER": return { ...s, spellingBuffer: s.spellingBuffer + a.letter };
    case "SPELL_DONE": {
      const val = s.spellingBuffer.toUpperCase();
      const field = s.sections[s.sectionIdx]?.fields[s.fieldIdx];
      const sens = field ? isSensitiveField(field.key) : false;
      return { ...s, phase: "confirming", micStatus: "Confirming", pendingValue: val, pendingMasked: sens ? "•".repeat(val.length) : val, pendingSensitive: sens, spellingMode: false, spellingBuffer: "", liveTranscript: "" };
    }
    case "SET_LANG": return { ...s, language: a.lang };
    case "SET_ERROR": return { ...s, phase: "error", error: a.msg, micStatus: "Error" };
    default: return s;
  }
}

// ── Form registry ─────────────────────────────────────────────────────────────
interface FormEntry { code: string; name: string; description: string; icon: typeof FileText; sections: FormSection[]; category: string }
const FORM_REGISTRY: FormEntry[] = [
  { code: "I-485", name: "Green Card (I-485)", description: "Adjustment of status for permanent residence", icon: Globe, sections: FORM_SECTIONS["I-485"] || [], category: "immigration" },
  { code: "I-130", name: "Petition for Relative (I-130)", description: "Sponsor a family member for immigration", icon: Heart, sections: FORM_SECTIONS["I-130"] || [], category: "immigration" },
  { code: "N-400", name: "Citizenship (N-400)", description: "Application for naturalization", icon: Shield, sections: FORM_SECTIONS["N-400"] || [], category: "immigration" },
  { code: "I-765", name: "Work Permit (I-765)", description: "Employment Authorization Document", icon: Building2, sections: FORM_SECTIONS["I-765"] || [], category: "immigration" },
  { code: "I-751", name: "Remove Conditions (I-751)", description: "Remove 2-year conditions on residence", icon: CheckCircle2, sections: FORM_SECTIONS["I-751"] || [], category: "immigration" },
  { code: "I-693", name: "Medical Exam (I-693)", description: "Immigration medical examination report", icon: BookOpen, sections: FORM_SECTIONS["I-693"] || [], category: "immigration" },
  { code: "TAX-INTAKE", name: "Individual Tax Intake", description: "Determine your tax filing needs", icon: FileText, sections: INDIVIDUAL_TAX_INTAKE_SECTIONS, category: "tax" },
  { code: "NP-INTAKE", name: "Nonprofit Intake", description: "Determine your 990 filing requirements", icon: Building2, sections: NONPROFIT_INTAKE_SECTIONS, category: "tax" },
];

// ── Build the spoken question for a field ────────────────────────────────────
function buildQuestion(field: FormFieldDef, lang: AgentLang): string {
  return getFieldQuestion(field.key, field.label, field.help?.what, lang);
}

// ── Mic badge ─────────────────────────────────────────────────────────────────
function MicBadge({ status }: { status: MicStatus }) {
  const map: Record<MicStatus, { dot: string; label: string; text: string; pulse: boolean }> = {
    Listening:  { dot: "bg-emerald-500", label: "LISTENING",  text: "text-emerald-600", pulse: true },
    Processing: { dot: "bg-amber-400",   label: "PROCESSING", text: "text-amber-600",   pulse: true },
    Confirming: { dot: "bg-blue-500",    label: "CONFIRMING", text: "text-blue-600",    pulse: false },
    Saved:      { dot: "bg-emerald-500", label: "SAVED",      text: "text-emerald-600", pulse: false },
    Paused:     { dot: "bg-gray-400",    label: "PAUSED",     text: "text-gray-500",    pulse: false },
    Error:      { dot: "bg-red-500",     label: "ERROR",      text: "text-red-600",     pulse: false },
    Off:        { dot: "bg-gray-300",    label: "OFF",        text: "text-gray-400",    pulse: false },
  };
  const c = map[status];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("relative inline-flex h-3 w-3 rounded-full", c.dot)}>
        {c.pulse && <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", c.dot)} />}
      </span>
      <span className={cn("text-xs font-bold tracking-widest", c.text)}>{c.label}</span>
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export interface VoiceAgentProps { onExit: () => void }

export default function VoiceAgent({ onExit }: VoiceAgentProps) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useLanguage();
  const [showAnswers, setShowAnswers] = useState(false);

  // Sync agent language with the app's current locale on first render
  useEffect(() => {
    const valid = SUPPORTED_LANGUAGES.find(l => l.code === locale);
    if (valid && locale !== state.language) {
      dispatch({ type: "SET_LANG", lang: locale as AgentLang });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mutable refs — avoids stale closures in event handlers
  const stateRef = useRef(state);
  stateRef.current = state;

  const recognitionRef = useRef<any>(null);
  const accumulatedFinals = useRef("");
  const debounceTimer = useRef<number | null>(null);
  const speakGen = useRef(0); // generation counter: only last TTS restarts mic

  // Forward-declared so speak() can call startListening without circular dep
  const startListeningRef = useRef<() => void>(() => {});

  // ── Stop recognition ────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (debounceTimer.current) { clearTimeout(debounceTimer.current); debounceTimer.current = null; }
    try { recognitionRef.current?.abort(); } catch {}
    recognitionRef.current = null;
    accumulatedFinals.current = "";
  }, []);

  // ── TTS — stops recognition before speaking, restarts after via gen counter ─
  const speak = useCallback((text: string, onEnd?: () => void) => {
    // Always stop recognition before TTS (Chrome STT/TTS conflict)
    if (debounceTimer.current) { clearTimeout(debounceTimer.current); debounceTimer.current = null; }
    try { recognitionRef.current?.abort(); } catch {}
    recognitionRef.current = null;
    accumulatedFinals.current = "";

    if (!("speechSynthesis" in window)) { onEnd?.(); return; }
    window.speechSynthesis.cancel();

    const gen = ++speakGen.current; // tag this TTS invocation

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = AGENT_LANG_LOCALE[stateRef.current.language] ?? "en-US";
    utt.rate = 0.9;
    utt.onstart = () => dispatch({ type: "SET_SPEAKING", v: true });
    utt.onend = () => {
      dispatch({ type: "SET_SPEAKING", v: false });
      onEnd?.();
      // Only restart if no newer speak() has been called (i.e. we're at end of chain)
      setTimeout(() => {
        if (gen === speakGen.current) {
          const ph = stateRef.current.phase;
          if (ph === "asking" || ph === "confirming") {
            startListeningRef.current();
          }
        }
      }, 180);
    };
    utt.onerror = () => { dispatch({ type: "SET_SPEAKING", v: false }); onEnd?.(); };
    dispatch({ type: "SET_SPEECH", text });
    window.speechSynthesis.speak(utt);
  }, []); // no deps — uses refs only

  // ── Question helpers ────────────────────────────────────────────────────────
  const speakCurrentQuestion = useCallback(() => {
    const s = stateRef.current;
    const field = s.sections[s.sectionIdx]?.fields[s.fieldIdx];
    if (!field) return;
    const q = buildQuestion(field, s.language);
    const warn = field.help?.warning ? ` Note: ${field.help.warning}` : "";
    const evid = field.evidenceHint ? ` You may need: ${field.evidenceHint}.` : "";
    speak(q + warn + evid, () => dispatch({ type: "SET_MIC", status: "Listening" }));
  }, [speak]);

  const speakAfterConfirm = useCallback(() => {
    setTimeout(() => {
      const s = stateRef.current;
      if (s.phase === "section_end") {
        const prevSec = s.sections[s.sectionIdx - 1];
        const done = prevSec?.fields.filter(f => s.answers[f.key]).length ?? 0;
        speak(
          tMsg("sectionCompleteFull", s.language, { done: String(done), nextSection: s.sections[s.sectionIdx]?.title ?? "" }),
          () => speakCurrentQuestion()
        );
      } else if (s.phase === "asking") {
        speakCurrentQuestion();
      } else if (s.phase === "form_complete") {
        speak(tMsg("formComplete", s.language));
      }
    }, 200);
  }, [speak, speakCurrentQuestion]);

  // ── Auto-save to localStorage ───────────────────────────────────────────────
  const autoSave = useCallback(() => {
    const s = stateRef.current;
    if (!s.formInstanceId || !s.pendingValue) return;
    const field = s.sections[s.sectionIdx]?.fields[s.fieldIdx];
    if (!field) return;
    const updated = { ...s.answers, [field.key]: s.pendingValue };
    localStorage.setItem(buildFormDraftStorageKey(s.formInstanceId), JSON.stringify(updated));
  }, []);

  // ── Process recognized transcript ────────────────────────────────────────────
  // Stored in a ref so startListening's onresult always calls the latest version
  const processTranscriptRef = useRef<(t: string) => void>(() => {});
  processTranscriptRef.current = (transcript: string) => {
    const s = stateRef.current;
    const lang = s.language;
    if (s.phase !== "asking" && s.phase !== "confirming" && s.phase !== "section_end") return;
    dispatch({ type: "SET_MIC", status: "Processing" });

    // Spelling mode
    if (s.spellingMode) {
      if (/^done$/i.test(transcript.trim())) {
        dispatch({ type: "SPELL_DONE" });
        speak(tMsg("spelledValue", lang, { value: s.spellingBuffer.toUpperCase() }));
      } else {
        const letters = transcript.trim().split(/\s+/).map(w => w[0] ?? "").join("").toUpperCase();
        dispatch({ type: "SPELL_LETTER", letter: letters });
        dispatch({ type: "SET_MIC", status: "Listening" });
      }
      return;
    }

    const cmd = detectCommand(transcript);
    if (cmd) {
      switch (cmd.command) {
        case "confirm":
          if (s.phase === "confirming") { autoSave(); dispatch({ type: "CONFIRM" }); speak(tMsg("saved", lang), () => speakAfterConfirm()); }
          else dispatch({ type: "SET_MIC", status: "Listening" });
          break;
        case "reject":
          dispatch({ type: "REJECT" });
          speak(tMsg("letMeAskAgain", lang), () => speakCurrentQuestion());
          break;
        case "skip": {
          const field = s.sections[s.sectionIdx]?.fields[s.fieldIdx];
          if (field?.required) { speak(tMsg("requiredField", lang, { fieldName: field.label }), () => speakCurrentQuestion()); }
          else { dispatch({ type: "SKIP" }); speak(tMsg("skipped", lang), () => speakAfterConfirm()); }
          break;
        }
        case "back":
          dispatch({ type: "GO_BACK" });
          speak(tMsg("goingBack", lang), () => speakCurrentQuestion());
          break;
        case "pause":
          dispatch({ type: "PAUSE" });
          stopListening();
          speak(tMsg("paused", lang));
          break;
        case "stop":
          stopListening(); window.speechSynthesis?.cancel(); dispatch({ type: "STOP" });
          break;
        case "help":
          speak(tMsg("helpText", lang));
          break;
        case "repeat": speakCurrentQuestion(); break;
        case "spell":
          dispatch({ type: "TOGGLE_SPELL" });
          speak(s.spellingMode ? tMsg("spellingModeOff", lang) : tMsg("spellingModeOn", lang));
          break;
        case "review": {
          const entries = Object.entries(s.answers);
          if (!entries.length) { speak(tMsg("noAnswersYet", lang)); break; }
          const allFields = s.sections.flatMap(sec => sec.fields);
          const summary = entries.map(([k, v]) => {
            const f = allFields.find(x => x.key === k);
            return `${f?.label ?? k}: ${isSensitiveField(k) ? "protected" : v}`;
          }).join(". ");
          speak("Your answers so far: " + summary);
          break;
        }
        case "next":
          if (s.phase === "confirming") { autoSave(); dispatch({ type: "CONFIRM" }); speak(tMsg("saved", lang), () => speakAfterConfirm()); }
          else if (s.phase === "section_end") { dispatch({ type: "NEXT_SECTION" }); speakCurrentQuestion(); }
          else dispatch({ type: "SET_MIC", status: "Listening" });
          break;
        case "save":
          if (s.phase === "confirming") { autoSave(); dispatch({ type: "CONFIRM" }); speak(tMsg("saved", lang), () => speakAfterConfirm()); }
          break;
        default: dispatch({ type: "SET_MIC", status: "Listening" });
      }
      return;
    }

    // Treat as answer
    if (s.phase === "asking") {
      const field = s.sections[s.sectionIdx]?.fields[s.fieldIdx];
      if (!field) return;
      const parsed = parseAnswer(transcript, field.key, field.type);
      dispatch({ type: "SET_PENDING", value: parsed.value, masked: parsed.masked, sensitive: parsed.sensitive });
      const confirmText = parsed.sensitive
        ? tMsg("confirmPromptSensitive", lang, { fieldName: field.label.toLowerCase() })
        : tMsg("confirmPromptSafe", lang, { value: parsed.masked });
      speak(confirmText);
    } else if (s.phase === "confirming") {
      speak(tMsg("confirmYesOrNo", lang));
    } else {
      dispatch({ type: "SET_MIC", status: "Listening" });
    }
  };

  // ── Start recognition (fresh instance every call) ────────────────────────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      dispatch({ type: "SET_ERROR", msg: "Voice recognition is not supported in this browser. Please use Chrome or Edge." });
      return;
    }
    // Flush any pending transcript before resetting — handles Chrome ending
    // recognition naturally after delivering a final result (race with debounce)
    if (debounceTimer.current) {
      const pending = accumulatedFinals.current.trim();
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
      if (pending) {
        accumulatedFinals.current = "";
        processTranscriptRef.current(pending);
        return; // processTranscript → speak() → restarts mic after TTS
      }
    }

    // Always create a fresh instance — reusing the same instance after abort/end fails on Chrome
    try { recognitionRef.current?.abort(); } catch {}
    recognitionRef.current = null;
    accumulatedFinals.current = "";

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = AGENT_LANG_LOCALE[stateRef.current.language] ?? "en-US";

    rec.onresult = (event: any) => {
      // No isSpeaking guard — we physically stop recognition before TTS starts
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          accumulatedFinals.current += event.results[i][0].transcript + " ";
        } else {
          interim = event.results[i][0].transcript;
        }
      }
      dispatch({ type: "SET_LIVE", text: (accumulatedFinals.current + interim).trim() });

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (accumulatedFinals.current.trim()) {
        const accumulated = accumulatedFinals.current.trim();
        const delay = detectCommand(accumulated) ? 500 : 1400;
        debounceTimer.current = window.setTimeout(() => {
          const t = accumulatedFinals.current.trim();
          if (!t) return;
          accumulatedFinals.current = "";
          dispatch({ type: "SET_LIVE", text: "" });
          processTranscriptRef.current(t);
        }, delay);
      }
    };

    rec.onerror = (e: any) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      console.warn("SpeechRecognition error:", e.error);
    };

    // onend: only auto-restart for unexpected ends (not caused by speak())
    rec.onend = () => {
      if (recognitionRef.current === rec) recognitionRef.current = null;
      const s = stateRef.current;
      if ((s.phase === "asking" || s.phase === "confirming") && !s.isSpeaking) {
        setTimeout(() => {
          const ph = stateRef.current.phase;
          if ((ph === "asking" || ph === "confirming") && !stateRef.current.isSpeaking && !recognitionRef.current) {
            startListeningRef.current();
          }
        }, 400);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch (e) { console.error("rec.start failed:", e); }
  }, []); // no deps — uses refs only

  // Keep startListeningRef current
  useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  // ── Start session ────────────────────────────────────────────────────────────
  const startSession = useCallback(async (entry: FormEntry) => {
    if (!user) { toast({ variant: "destructive", title: "Sign in required" }); return; }
    const sections = entry.sections.filter(sec => sec.fields.length > 0);
    if (!sections.length) { toast({ variant: "destructive", title: "No fields available for this form." }); return; }

    try {
      const { data: caseData, error: caseErr } = await supabase.rpc("initialize_client_case", { _user_id: user.id });
      if (caseErr) throw caseErr;
      const caseId = (caseData as any)?.case_id;

      const { data: fi, error: fiErr } = await supabase
        .from("form_instances")
        .insert({ case_id: caseId, form_type: entry.code, form_name: entry.name, status: "not_started", progress: 0 })
        .select("id").single();
      if (fiErr) throw fiErr;

      dispatch({ type: "START", formCode: entry.code, formName: entry.name, sections, formInstanceId: fi.id });

      const lang = stateRef.current.language;
      speak(
        tMsg("welcomePart1", lang, { formName: entry.name }) + " " +
        tMsg("welcomePart2", lang) + " " +
        tMsg("startWith", lang, { sectionTitle: sections[0].title }),
        () => speakCurrentQuestion()
      );
    } catch (err: any) {
      dispatch({ type: "SET_ERROR", msg: err.message ?? "Failed to start session." });
      toast({ variant: "destructive", title: "Session error", description: err.message });
    }
  }, [user, speak, speakCurrentQuestion]);

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => { stopListening(); window.speechSynthesis?.cancel(); };
  }, [stopListening]);

  useEffect(() => {
    if (["paused", "idle", "form_complete", "section_end", "error"].includes(state.phase)) {
      stopListening();
    }
  }, [state.phase, stopListening]);

  // ── Computed ──────────────────────────────────────────────────────────────────
  const currentSection = state.sections[state.sectionIdx] ?? null;
  const currentField = currentSection?.fields[state.fieldIdx] ?? null;
  const totalFields = state.sections.flatMap(s => s.fields).length;
  const answeredCount = Object.keys(state.answers).length;
  const progressPct = totalFields > 0 ? Math.round((answeredCount / totalFields) * 100) : 0;

  // ── Language picker (shared across idle + active views) ───────────────────
  const LangPicker = (
    <div className="relative inline-flex items-center">
      <Globe className="absolute left-2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      <select
        value={state.language}
        onChange={e => dispatch({ type: "SET_LANG", lang: e.target.value as AgentLang })}
        className="appearance-none pl-7 pr-6 py-1 text-xs rounded-md border border-border bg-muted/50 text-foreground hover:bg-accent cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40"
      >
        {SUPPORTED_LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-1.5 w-3 h-3 text-muted-foreground pointer-events-none" />
    </div>
  );

  // ── Form selection ────────────────────────────────────────────────────────────
  if (state.phase === "idle") {
    const immForms = FORM_REGISTRY.filter(f => f.category === "immigration" && f.sections.length > 0);
    const taxForms = FORM_REGISTRY.filter(f => f.category === "tax" && f.sections.length > 0);
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <button onClick={onExit} className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-none">Voice Application Agent</p>
              <p className="text-[11px] text-muted-foreground">Select a form — answer questions by speaking</p>
            </div>
          </div>
          <div className="ml-auto shrink-0">{LangPicker}</div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Immigration</p>
            <div className="grid grid-cols-2 gap-2">
              {immForms.map(f => (
                <button key={f.code} onClick={() => startSession(f)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/40 text-left transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors mt-0.5">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-tight">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{f.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tax &amp; Nonprofit</p>
            <div className="grid grid-cols-2 gap-2">
              {taxForms.map(f => (
                <button key={f.code} onClick={() => startSession(f)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-secondary/40 text-left transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors mt-0.5">
                    <f.icon className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground leading-tight">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{f.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 border border-border p-3 flex gap-2">
            <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Voice audio is never stored — only your typed answers are saved. Sensitive values (SSN, A-Number, EIN) are masked and never read aloud.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="font-semibold">Session Error</p>
        <p className="text-sm text-muted-foreground">{state.error}</p>
        <Button variant="outline" onClick={() => dispatch({ type: "STOP" })}>Go Back</Button>
      </div>
    );
  }

  if (state.phase === "form_complete") {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <p className="font-semibold text-sm">Form Complete</p>
          <button onClick={() => dispatch({ type: "STOP" })} className="ml-auto p-1 rounded hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <p className="font-semibold text-lg">All fields complete</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Your answers for <strong>{state.formName}</strong> have been saved. Open the form workspace to review and submit.
          </p>
          <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
            <Button onClick={() => state.formInstanceId && navigate(`/portal/forms/${state.formInstanceId}`)} className="gap-2">
              <FileText className="w-4 h-4" /> Open Form Workspace
            </Button>
            <Button variant="outline" onClick={() => dispatch({ type: "STOP" })}>Back to Advisor</Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Voice session UI ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{state.formName}</p>
          <p className="text-[10px] text-muted-foreground">
            Section {state.sectionIdx + 1} / {state.sections.length}: {currentSection?.title ?? ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {LangPicker}
          {state.phase === "paused" ? (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => {
              dispatch({ type: "RESUME" });
              speak(tMsg("resuming", state.language), () => speakCurrentQuestion());
            }}>
              <Play className="w-3 h-3" /> Resume
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
              dispatch({ type: "PAUSE" }); stopListening(); speak(tMsg("paused", state.language));
            }}>
              <Pause className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => {
            stopListening(); window.speechSynthesis?.cancel(); dispatch({ type: "STOP" });
          }}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-2 pb-1 shrink-0">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>{answeredCount} / {totalFields} fields saved</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-secondary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-3">
        {/* Mic status + controls */}
        <div className="flex items-center justify-between">
          <MicBadge status={state.micStatus} />
          <div className="flex items-center gap-1">
            <button onClick={() => speakCurrentQuestion()} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Repeat question">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { dispatch({ type: "GO_BACK" }); speak(tMsg("goingBack", state.language), () => speakCurrentQuestion()); }}
              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Previous field">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { dispatch({ type: "TOGGLE_SPELL" }); speak(state.spellingMode ? tMsg("spellingModeOff", state.language) : tMsg("spellingModeOn", state.language)); }}
              className={cn("p-1.5 rounded-md transition-colors", state.spellingMode ? "bg-secondary/15 text-secondary" : "hover:bg-accent text-muted-foreground hover:text-foreground")} title="Spell mode">
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Section-end summary */}
        {state.phase === "section_end" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
            <p className="text-sm font-semibold text-emerald-800 mb-1">Section complete!</p>
            <p className="text-xs text-emerald-700 mb-3">Next: <strong>{currentSection?.title}</strong></p>
            <Button size="sm" className="gap-1.5 h-8" onClick={() => {
              dispatch({ type: "NEXT_SECTION" });
              speak(tMsg("movingTo", state.language, { sectionTitle: currentSection?.title ?? "" }), () => speakCurrentQuestion());
            }}>
              Continue <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Agent speech bubble */}
        {state.agentSpeech && state.phase !== "section_end" && (
          <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
            <div className="flex items-start gap-2">
              <Volume2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed">{state.agentSpeech}</p>
            </div>
            {currentField?.help?.example && (
              <p className="text-[11px] text-muted-foreground mt-1.5 pl-6">Example: {currentField.help.example}</p>
            )}
            {currentField?.evidenceHint && (
              <p className="text-[11px] text-amber-600 mt-1 pl-6">You may need: {currentField.evidenceHint}</p>
            )}
          </div>
        )}

        {/* Paused */}
        {state.phase === "paused" && (
          <div className="rounded-xl bg-muted/60 border border-border p-4 text-center">
            <Pause className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">Session Paused</p>
            <p className="text-xs text-muted-foreground mt-1">Press Resume when ready to continue.</p>
          </div>
        )}

        {/* Live transcript */}
        {state.liveTranscript && state.phase !== "paused" && (
          <div className="rounded-xl border border-border bg-card px-3 py-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">You said</p>
            <p className="text-sm text-foreground">{state.liveTranscript}</p>
          </div>
        )}

        {/* Pending answer confirmation */}
        {state.phase === "confirming" && state.pendingValue && (
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-3">
            <p className="text-[10px] text-blue-500 uppercase tracking-wider mb-1 font-semibold">Confirm answer</p>
            <p className="text-base font-semibold text-foreground mb-3 flex items-center gap-1.5">
              {state.pendingSensitive && <Shield className="w-4 h-4 text-muted-foreground shrink-0" />}
              {state.pendingMasked}
              {state.pendingSensitive && <span className="text-xs text-muted-foreground font-normal">(protected)</span>}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" className="gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => { autoSave(); dispatch({ type: "CONFIRM" }); speak(tMsg("saved", state.language), () => speakAfterConfirm()); }}>
                <Check className="w-3.5 h-3.5" /> Yes, save
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => { dispatch({ type: "REJECT" }); speak(tMsg("letMeAskAgain", state.language), () => speakCurrentQuestion()); }}>
                <RefreshCw className="w-3.5 h-3.5" /> No, try again
              </Button>
              {!currentField?.required && (
                <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => { dispatch({ type: "SKIP" }); speak(tMsg("skipped", state.language), () => speakAfterConfirm()); }}>
                  Skip
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Spelling mode */}
        {state.spellingMode && (
          <div className="rounded-xl bg-secondary/10 border border-secondary/30 p-3">
            <p className="text-xs font-semibold text-secondary mb-1">Spelling Mode — say each letter</p>
            <p className="text-lg font-mono font-bold tracking-widest text-foreground">{state.spellingBuffer || "..."}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Say <em>done</em> when finished</p>
          </div>
        )}

        {/* Saved answers */}
        {Object.keys(state.answers).length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden">
            <button onClick={() => setShowAnswers(p => !p)}
              className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/60 transition-colors">
              <span className="text-xs font-semibold text-muted-foreground">Saved answers ({Object.keys(state.answers).length})</span>
              {showAnswers ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
            {showAnswers && (
              <div className="divide-y divide-border/50">
                {Object.entries(state.answers).map(([k, v]) => {
                  const f = state.sections.flatMap(s => s.fields).find(x => x.key === k);
                  const display = isSensitiveField(k) ? maskValue(v, k) : v;
                  return (
                    <div key={k} className="flex items-start justify-between px-3 py-2 gap-3">
                      <span className="text-[11px] text-muted-foreground shrink-0">{f?.label ?? k}</span>
                      <span className="text-[11px] text-foreground font-medium text-right break-all">{display}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pb-2">
          <HelpCircle className="w-3 h-3" />
          Say <em>help</em>, <em>back</em>, <em>skip</em>, <em>pause</em>, <em>spell</em>, or <em>review</em> at any time
        </div>
      </div>

      {/* Bottom bar */}
      {state.phase === "asking" && (
        <div className="shrink-0 border-t border-border px-4 py-2 flex items-center gap-2">
          <button onClick={() => { dispatch({ type: "GO_BACK" }); speak(tMsg("goingBack", state.language), () => speakCurrentQuestion()); }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <p className="flex-1 text-center text-[10px] text-muted-foreground">
            Field {state.fieldIdx + 1} / {currentSection?.fields.length ?? 0}
          </p>
          {!currentField?.required && (
            <button onClick={() => { dispatch({ type: "SKIP" }); speak(tMsg("skipped", state.language), () => speakAfterConfirm()); }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Skip <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
