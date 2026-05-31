import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Check, Edit, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  fieldId: string;
  fieldLabel: string;
  onConfirm: (value: string) => void;
  className?: string;
}

const VoiceInput = ({ fieldId, fieldLabel, onConfirm, className }: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }
      setTranscript(finalTranscript || interimTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setConfirmed(false);
    setTranscript("");
  }, [isSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleConfirm = () => {
    const value = editing ? editValue : transcript;
    onConfirm(value);
    setConfirmed(true);
    setEditing(false);
  };

  const handleEdit = () => {
    setEditing(true);
    setEditValue(transcript);
  };

  const handleRetry = () => {
    setTranscript("");
    setConfirmed(false);
    setEditing(false);
    startListening();
  };

  if (!isSupported) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Mic button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={isListening ? stopListening : startListening}
          className="gap-1.5"
        >
          {isListening ? (
            <>
              <MicOff className="w-3.5 h-3.5" />
              Stop
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              Voice
            </>
          )}
        </Button>
        {isListening && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
            Listening...
          </div>
        )}
      </div>

      {/* Live transcript bar */}
      {(isListening || transcript) && !confirmed && (
        <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{fieldLabel}</Badge>
          </div>
          {editing ? (
            <input
              className="w-full border rounded px-2 py-1.5 text-sm bg-background"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
            />
          ) : (
            <p className="text-sm font-medium">
              {transcript || (
                <span className="text-muted-foreground italic">
                  <Loader2 className="inline w-3 h-3 animate-spin mr-1" />
                  Waiting for speech...
                </span>
              )}
            </p>
          )}
          {transcript && !isListening && (
            <div className="flex gap-1.5">
              <Button size="sm" variant="default" onClick={handleConfirm} className="gap-1 h-7 text-xs">
                <Check className="w-3 h-3" /> Confirm
              </Button>
              <Button size="sm" variant="outline" onClick={handleEdit} className="gap-1 h-7 text-xs">
                <Edit className="w-3 h-3" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={handleRetry} className="gap-1 h-7 text-xs">
                <RotateCcw className="w-3 h-3" /> Retry
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Confirmed indicator */}
      {confirmed && (
        <div className="flex items-center gap-1.5 text-xs text-success">
          <Check className="w-3 h-3" />
          Voice entry confirmed
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
