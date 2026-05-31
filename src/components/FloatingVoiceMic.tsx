import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const FloatingVoiceMic = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [expanded, setExpanded] = useState(false);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      toast({ title: "Voice not supported", description: "Your browser doesn't support speech recognition.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      const fullText = (final + interim).trim();
      setTranscript(fullText);

      // Check for NEXT command
      if (final.toLowerCase().includes("next")) {
        handleNextCommand();
        recognition.stop();
        setListening(false);
        setTranscript("");
      }
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
    setListening(true);
    setExpanded(true);
  }, [SpeechRecognition]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const handleNextCommand = () => {
    // Navigate to the next logical page based on current location
    const portalPages = [
      "/portal",
      "/portal/passport",
      "/portal/forms",
      "/portal/documents",
      "/portal/readiness",
      "/portal/timeline",
      "/portal/interview",
      "/portal/attorney",
      "/portal/messages",
    ];

    const currentIndex = portalPages.indexOf(location.pathname);
    if (currentIndex >= 0 && currentIndex < portalPages.length - 1) {
      navigate(portalPages[currentIndex + 1]);
      toast({ title: "Navigating...", description: `Going to ${portalPages[currentIndex + 1].replace("/portal/", "").replace("/portal", "Home")}` });
    } else {
      toast({ title: "Voice command", description: "You're on the last page. Say 'NEXT' on earlier pages to advance." });
    }
  };

  const toggleMic = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2">
      {/* Transcript bubble */}
      {expanded && transcript && (
        <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-lg p-3 max-w-[250px] animate-in fade-in slide-in-from-bottom-2">
          <p className="text-xs text-muted-foreground mb-1">Listening...</p>
          <p className="text-sm text-foreground">{transcript}</p>
          <p className="text-[10px] text-secondary mt-1.5">Say "NEXT" to go to the next page</p>
        </div>
      )}

      {/* Mic button */}
      <button
        onClick={toggleMic}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all",
          listening
            ? "bg-destructive text-destructive-foreground animate-pulse shadow-destructive/30"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-secondary/30"
        )}
      >
        {listening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default FloatingVoiceMic;
