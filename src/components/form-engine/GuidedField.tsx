/**
 * GuidedField — TurboTax-style question card.
 * Each field feels like a simple guided question, not a government form field.
 * Includes speak-to-fill mic icon for text/textarea fields.
 */
import { useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ChevronDown, ChevronUp, HelpCircle, Mic, MicOff, Loader2, Info, MapPin, Lightbulb, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { FormFieldDef } from "@/data/formSections";
import { useToast } from "@/hooks/use-toast";

interface GuidedFieldProps {
  field: FormFieldDef;
  value: string;
  error?: string;
  onChange: (key: string, value: string) => void;
}

const GuidedField = ({ field, value, error, onChange }: GuidedFieldProps) => {
  const [showHelp, setShowHelp] = useState(false);
  const isLongText = field.key === "appeal_summary" || field.key.includes("summary") || field.key.includes("reasons");
  const { toast } = useToast();

  // ── Speak-to-fill state ──
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);

  const isVoiceSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const canVoice = isVoiceSupported && field.type !== "select" && field.type !== "checkbox";

  const startListening = useCallback(() => {
    if (!isVoiceSupported) {
      toast({ title: "Voice not supported", description: "Your browser doesn't support speech recognition.", variant: "destructive" });
      return;
    }
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    let finalText = "";
    let hasReceivedSpeech = false;

    recognition.onresult = (event: any) => {
      hasReceivedSpeech = true;
      let interim = "";
      finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimText(finalText || interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalText.trim()) {
        const newValue = value.trim() ? `${value.trim()} ${finalText.trim()}` : finalText.trim();
        onChange(field.key, newValue);
        toast({ title: "Voice captured", description: `"${finalText.trim()}" added to ${field.label}` });
      } else if (!hasReceivedSpeech) {
        // Auto-restart once if no speech was detected (browser timed out too fast)
        try {
          recognition.start();
          setIsListening(true);
          return;
        } catch {
          // If restart fails, silently end
        }
      }
      setInterimText("");
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        // Don't alarm the user — just silently let onend handle restart
        return;
      }
      setIsListening(false);
      setInterimText("");
      const msg = event.error === "not-allowed"
        ? "Microphone access denied. Please allow microphone in your browser settings."
        : event.error === "aborted"
        ? "Voice input was cancelled."
        : `Speech error: ${event.error}`;
      toast({ title: "Voice input issue", description: msg, variant: "destructive" });
    };

    recognition.start();
    setIsListening(true);
    setInterimText("");
  }, [isVoiceSupported, value, field.key, field.label, onChange, toast]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return (
    <div className={cn(
      "px-5 py-5 transition-all duration-200",
      error && "bg-destructive/5",
      !error && value.trim() && "bg-success/[0.03]"
    )}>
      {/* Question label with universal (!) hover-help */}
      <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-0.5">
        <span>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </span>
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Help for ${field.label}`}
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="start"
            className="max-w-xs p-0 text-left"
          >
            <div className="p-3 space-y-2">
              <p className="text-xs font-semibold text-foreground leading-snug">
                {field.label}
              </p>
              {field.help?.what ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {field.help.what}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/70 italic leading-relaxed">
                  Enter the information requested for this field.
                </p>
              )}
              {field.help?.example && (
                <div className="flex items-start gap-1.5 pt-1.5 border-t border-border/60">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-warning shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">Example: </span>
                    <span className="font-mono">{field.help.example}</span>
                  </p>
                </div>
              )}
              {field.help?.whereToFind && (
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">Where to find: </span>
                    {field.help.whereToFind}
                  </p>
                </div>
              )}
              {field.help?.warning && (
                <div className="flex items-start gap-1.5 pt-1.5 border-t border-destructive/20">
                  <AlertTriangle className="w-3 h-3 mt-0.5 text-destructive shrink-0" />
                  <p className="text-[11px] text-destructive/90 leading-relaxed">
                    {field.help.warning}
                  </p>
                </div>
              )}
              {field.required && (
                <p className="text-[10px] text-destructive/80 font-medium uppercase tracking-wide pt-1">
                  Required
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </label>

      {/* Plain explanation — always visible */}
      {field.help && (
        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
          {field.help.what}
        </p>
      )}

      {/* Example hint */}
      {field.help?.example && (
        <p className="text-[11px] text-muted-foreground/60 mb-2">
          Example: <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">{field.help.example}</span>
        </p>
      )}

      {/* Input */}
      {field.type === "select" && field.options ? (
        <Select value={value} onValueChange={(v) => onChange(field.key, v)}>
          <SelectTrigger className={cn(
            "h-11 text-sm bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20",
            error && "border-destructive ring-destructive/20"
          )}>
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : isLongText ? (
        <div className="relative">
          <Textarea
            value={isListening ? `${value}${value ? " " : ""}${interimText}` : value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={6}
            className={cn(
              "text-sm resize-y min-h-[120px] bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 pr-10",
              error && "border-destructive ring-destructive/20",
              isListening && "ring-2 ring-destructive/40 border-destructive/40"
            )}
          />
          {canVoice && (
            <button
              type="button"
              onClick={toggleVoice}
              className={cn(
                "absolute top-2 right-2 p-1.5 rounded-full transition-all",
                isListening
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
              title={isListening ? "Stop listening" : "Speak to fill"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Input
            value={isListening ? `${value}${value ? " " : ""}${interimText}` : value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={cn(
              "h-11 text-sm bg-background transition-all duration-200 focus:ring-2 focus:ring-primary/20 pr-10",
              error && "border-destructive ring-destructive/20",
              isListening && "ring-2 ring-destructive/40 border-destructive/40"
            )}
          />
          {canVoice && (
            <button
              type="button"
              onClick={toggleVoice}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-full transition-all",
                isListening
                  ? "bg-destructive text-destructive-foreground animate-pulse"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
              title={isListening ? "Stop listening" : "Speak to fill"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}

      {/* Voice listening indicator */}
      {isListening && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
          </span>
          Listening… speak now
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1.5 mt-2 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
        </p>
      )}

      {/* Expandable detailed help */}
      {field.help?.warning && (
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <HelpCircle className="w-3 h-3" />
          {showHelp ? "Hide details" : "Important note"}
          {showHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}
      {showHelp && field.help?.warning && (
        <div className="mt-2 rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-xs text-destructive/80 flex items-start gap-2 animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{field.help.warning}</span>
        </div>
      )}
    </div>
  );
};

export default GuidedField;
