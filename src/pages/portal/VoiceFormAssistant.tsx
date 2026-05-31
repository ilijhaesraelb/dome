import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mic, MicOff, CheckCircle2, ChevronRight, Globe, FileText, Briefcase,
  Edit, RotateCcw, Loader2, Sparkles, Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

/* ── Readiness Gauge ── */
const ReadinessGauge = ({ score }: { score: number }) => {
  const radius = 80;
  const cx = 100;
  const cy = 100;
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;
  const scoreAngle = startAngle + (totalAngle * score) / 100;

  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const segments = [
    { from: 0, to: 25, color: "hsl(0,84%,60%)" },
    { from: 25, to: 50, color: "hsl(22,76%,53%)" },
    { from: 50, to: 75, color: "hsl(38,92%,50%)" },
    { from: 75, to: 90, color: "hsl(142,71%,45%)" },
    { from: 90, to: 100, color: "hsl(218,41%,21%)" },
  ];

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 200 160" className="w-48 h-auto">
        <path d={describeArc(startAngle, endAngle)} fill="none" stroke="hsl(var(--muted))" strokeWidth="16" strokeLinecap="round" />
        {segments.map((seg, i) => {
          const segStart = startAngle + (totalAngle * seg.from) / 100;
          const segEnd = startAngle + (totalAngle * Math.min(seg.to, score)) / 100;
          if (score < seg.from) return null;
          return <path key={i} d={describeArc(segStart, segEnd)} fill="none" stroke={seg.color} strokeWidth="16" strokeLinecap="round" />;
        })}
        {(() => {
          const pos = polarToCartesian(scoreAngle);
          return <circle cx={pos.x} cy={pos.y} r="7" fill="hsl(var(--foreground))" />;
        })()}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
        <span className="text-4xl font-bold text-foreground">{score}%</span>
        <span className="text-sm text-muted-foreground font-semibold">Case Ready</span>
      </div>
    </div>
  );
};

/* ── Waveform ── */
const Waveform = ({ active }: { active: boolean }) => {
  const bars = 28;
  const [, forceRender] = useState(0);
  const animRef = useRef<number>();

  useEffect(() => {
    if (active) {
      const tick = () => {
        forceRender((p) => p + 1);
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [active]);

  return (
    <div className="flex items-center justify-center gap-[2px] h-8 my-1">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-[3px] rounded-full transition-all duration-100",
            active ? "bg-primary/50" : "bg-muted"
          )}
          style={{
            height: active
              ? `${10 + Math.sin(i * 0.7 + Date.now() * 0.004) * 14}px`
              : `${3 + Math.sin(i * 0.5) * 3}px`,
          }}
        />
      ))}
    </div>
  );
};

/* ── Improve Tips ── */
const improveTips = [
  { icon: Globe, text: "Add travel history to strengthen your case" },
  { icon: FileText, text: "Upload passport scan for identity verification" },
  { icon: Briefcase, text: "Include employment records for visa eligibility" },
];

/* ── Field type ── */
interface FormField {
  label: string;
  value: string;
  confirmed: boolean;
  editing: boolean;
}

/* ── Main ── */
const VoiceFormAssistant = () => {
  const { toast } = useToast();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const isSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const [fields, setFields] = useState<FormField[]>([
    { label: "First Name", value: "", confirmed: false, editing: false },
    { label: "Last Name", value: "", confirmed: false, editing: false },
    { label: "Date of Birth", value: "", confirmed: false, editing: false },
    { label: "Country of Birth", value: "", confirmed: false, editing: false },
    { label: "Phone Number", value: "", confirmed: false, editing: false },
  ]);

  const [inputMode, setInputMode] = useState<"voice" | "type">("voice");

  /* Voice recognition */
  const startListening = useCallback(() => {
    if (!isSupported) {
      toast({ title: "Not supported", description: "Voice input is not supported in this browser." });
      return;
    }
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let full = "";
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      setTranscript(full);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setTranscript("");
    toast({ title: "Listening…", description: "Speak clearly. Say your name, date of birth, country, etc." });
  }, [isSupported, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const toggleListening = () => {
    if (listening) stopListening();
    else startListening();
  };

  /* Parse voice transcript into fields (simple heuristic) */
  const parseTranscript = () => {
    const t = transcript.toLowerCase();
    const updated = [...fields];

    // Simple extraction patterns
    const nameMatch = t.match(/(?:my )?(?:first )?name is (\w+)/i);
    if (nameMatch) {
      const idx = updated.findIndex(f => f.label === "First Name");
      if (idx >= 0) updated[idx] = { ...updated[idx], value: nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1) };
    }
    const lastMatch = t.match(/(?:my )?last name is (\w+)/i);
    if (lastMatch) {
      const idx = updated.findIndex(f => f.label === "Last Name");
      if (idx >= 0) updated[idx] = { ...updated[idx], value: lastMatch[1].charAt(0).toUpperCase() + lastMatch[1].slice(1) };
    }
    const dobMatch = t.match(/(?:born|birth|birthday).*?(\d{1,2}[\s/.-]\d{1,2}[\s/.-]\d{2,4})/i);
    if (dobMatch) {
      const idx = updated.findIndex(f => f.label === "Date of Birth");
      if (idx >= 0) updated[idx] = { ...updated[idx], value: dobMatch[1] };
    }
    const countryMatch = t.match(/(?:from|born in|country.*?is) (\w[\w\s]{1,20})/i);
    if (countryMatch) {
      const idx = updated.findIndex(f => f.label === "Country of Birth");
      if (idx >= 0) updated[idx] = { ...updated[idx], value: countryMatch[1].trim().replace(/\b\w/g, c => c.toUpperCase()) };
    }

    setFields(updated);
    toast({ title: "Fields extracted", description: "Review below and correct any values by tapping Edit." });
  };

  /* Field actions */
  const startEditing = (index: number) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, editing: true } : f));
  };

  const updateFieldValue = (index: number, value: string) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, value } : f));
  };

  const confirmField = (index: number) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, confirmed: true, editing: false } : f));
  };

  const handleContinue = () => {
    const unconfirmed = fields.filter(f => f.value && !f.confirmed);
    if (unconfirmed.length > 0) {
      toast({ title: "Please confirm all fields", description: `${unconfirmed.length} field(s) still need confirmation.` });
      return;
    }
    toast({ title: "Information saved", description: "Your data has been recorded for form population." });
  };

  const completedCount = fields.filter(f => f.confirmed).length;
  const score = Math.round((completedCount / fields.length) * 100);

  return (
    <div className="px-4 py-2 max-w-lg mx-auto space-y-5">
      {/* Title */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-display font-bold text-foreground">Voice Form Assistant</h1>
        <div className="w-16 h-0.5 bg-secondary mx-auto rounded-full" />
        <p className="text-sm text-muted-foreground">
          Enter your information by <span className="font-semibold text-secondary">voice</span> or <span className="font-semibold text-primary">typing</span>. Correct anything by tapping Edit.
        </p>
      </div>

      {/* Input Mode Toggle */}
      <div className="flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant={inputMode === "voice" ? "default" : "outline"}
          onClick={() => setInputMode("voice")}
          className="gap-1.5"
        >
          <Mic className="w-3.5 h-3.5" />
          Voice Input
        </Button>
        <Button
          size="sm"
          variant={inputMode === "type" ? "default" : "outline"}
          onClick={() => setInputMode("type")}
          className="gap-1.5"
        >
          <Edit className="w-3.5 h-3.5" />
          Type Input
        </Button>
      </div>

      {/* Gauge + Mic (voice mode) */}
      {inputMode === "voice" && (
        <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5 flex flex-col items-center">
          <ReadinessGauge score={score} />
          <button
            onClick={toggleListening}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center -mt-3 transition-all shadow-lg border-2",
              listening
                ? "bg-destructive text-destructive-foreground border-destructive animate-pulse"
                : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
            )}
          >
            {listening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            {listening ? "Tap to stop recording" : "Tap to start speaking"}
          </p>
        </div>
      )}

      {/* Live transcript (voice mode) */}
      {inputMode === "voice" && (transcript || listening) && (
        <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Mic className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              {transcript ? (
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{transcript}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Waiting for speech...
                </p>
              )}
            </div>
          </div>
          {transcript && !listening && (
            <div className="flex gap-2">
              <Button size="sm" onClick={parseTranscript} className="gap-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                <Sparkles className="w-3 h-3" /> Extract Fields
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setTranscript(""); startListening(); }} className="gap-1">
                <RotateCcw className="w-3 h-3" /> Retry
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Waveform (voice mode) */}
      {inputMode === "voice" && <Waveform active={listening} />}

      {/* Editable Fields */}
      <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h2 className="text-base font-display font-semibold text-foreground">Your Information</h2>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{fields.length} confirmed
          </Badge>
        </div>
        <div className="divide-y divide-border">
          {fields.map((field, i) => (
            <div key={field.label} className="px-4 py-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground font-medium">{field.label}</span>
                {field.confirmed && (
                  <Badge className="bg-green-500/10 text-green-600 border-0 text-[10px] px-1.5">Confirmed</Badge>
                )}
              </div>
              {field.editing || (inputMode === "type" && !field.confirmed) ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={field.value}
                    onChange={(e) => updateFieldValue(i, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="h-9 text-sm"
                    autoFocus={field.editing}
                  />
                  <Button
                    size="sm"
                    onClick={() => confirmField(i)}
                    disabled={!field.value}
                    className="h-9 px-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-semibold", field.value ? "text-foreground" : "text-muted-foreground italic")}>
                    {field.value || "Not provided"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {!field.confirmed && field.value && (
                      <Button size="sm" variant="ghost" onClick={() => confirmField(i)} className="h-7 px-2 text-xs gap-1 text-green-600">
                        <CheckCircle2 className="w-3 h-3" /> Confirm
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => startEditing(i)} className="h-7 px-2 text-xs gap-1">
                      <Edit className="w-3 h-3" /> Edit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Improve Your Score */}
      <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-base font-display font-semibold text-foreground">Improve Your Score</h2>
        </div>
        <div className="divide-y divide-border">
          {improveTips.map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
            >
              <item.icon className="w-4 h-4 text-secondary shrink-0" />
              <span className="flex-1 text-sm text-foreground">{item.text}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <div className="pb-4">
        <Button
          onClick={handleContinue}
          className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl shadow-md"
        >
          Continue Improving My Case
        </Button>
      </div>
    </div>
  );
};

export default VoiceFormAssistant;
