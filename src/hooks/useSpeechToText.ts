import { useState, useCallback, useRef } from "react";

const LANG_MAP: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
  fr: "fr-FR",
  ht: "fr-HT",
  ar: "ar-SA",
  zh: "zh-CN",
  ja: "ja-JP",
  ur: "ur-PK",
  hi: "hi-IN",
  de: "de-DE",
};

export function useSpeechToText(onResult?: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const start = useCallback(
    (lang: string = "en") => {
      if (!SpeechRecognition) {
        console.warn("Speech recognition not supported");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = LANG_MAP[lang] || lang;
      recognitionRef.current = recognition;

      let finalText = "";

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript(finalText + interim);
      };

      recognition.onend = () => {
        setListening(false);
        if (finalText.trim() && onResult) {
          onResult(finalText.trim());
        }
      };

      recognition.onerror = () => setListening(false);

      recognition.start();
      setListening(true);
      setTranscript("");
    },
    [SpeechRecognition, onResult]
  );

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const isSupported = !!SpeechRecognition;

  return { start, stop, listening, transcript, isSupported };
}
