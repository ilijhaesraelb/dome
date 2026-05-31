import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Languages, Volume2, VolumeX, Lightbulb, Eye, Copy, Mic, MicOff, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MessageToolbarProps {
  text: string;
  sourceLang?: string;
  targetLang: string;
  onTranslated?: (translated: string) => void;
  onSimplified?: (simplified: string) => void;
  onVoiceReply?: (text: string) => void;
  showVoiceReply?: boolean;
  className?: string;
}

const MessageToolbar = ({
  text,
  sourceLang = "en",
  targetLang,
  onTranslated,
  onSimplified,
  onVoiceReply,
  showVoiceReply = false,
  className,
}: MessageToolbarProps) => {
  const { translate, translating } = useTranslation();
  const { speak, stop, speaking } = useTextToSpeech();
  const { start: startListening, stop: stopListening, listening, transcript } = useSpeechToText(
    (result) => onVoiceReply?.(result)
  );

  const [translated, setTranslated] = useState<string | null>(null);
  const [simplified, setSimplified] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleTranslate = async () => {
    if (translated) {
      setShowOriginal(!showOriginal);
      return;
    }
    const result = await translate({ text, sourceLang, targetLang });
    if (result) {
      setTranslated(result);
      onTranslated?.(result);
    }
  };

  const handleExplain = async () => {
    if (simplified) {
      setSimplified(null);
      return;
    }
    const result = await translate({ text, sourceLang, targetLang, mode: "explain" });
    if (result) {
      setSimplified(result);
      onSimplified?.(result);
    }
  };

  const handleListen = () => {
    if (speaking) {
      stop();
    } else {
      const textToSpeak = translated || text;
      const lang = translated ? targetLang : sourceLang;
      speak(textToSpeak, lang);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translated || text);
    toast({ title: "Copied to clipboard" });
  };

  const handleVoiceReply = () => {
    if (listening) {
      stopListening();
    } else {
      startListening(targetLang);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Action buttons */}
      <div className="flex flex-wrap gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTranslate}
          disabled={translating}
          className="h-7 px-2 text-xs gap-1"
        >
          {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
          {translated ? (showOriginal ? "Show Translated" : "Show Original") : "Translate"}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleListen}
          className="h-7 px-2 text-xs gap-1"
        >
          {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          {speaking ? "Stop" : "Listen"}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleExplain}
          disabled={translating}
          className="h-7 px-2 text-xs gap-1"
        >
          {translating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
          Explain Simply
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-xs gap-1"
        >
          <Copy className="w-3 h-3" />
          Copy
        </Button>

        {showVoiceReply && (
          <Button
            variant={listening ? "destructive" : "ghost"}
            size="sm"
            onClick={handleVoiceReply}
            className="h-7 px-2 text-xs gap-1"
          >
            {listening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
            {listening ? "Stop" : "Reply by Voice"}
          </Button>
        )}
      </div>

      {/* Translated text */}
      {translated && !showOriginal && (
        <div className="bg-accent/50 rounded-lg p-2.5 text-sm border-l-2 border-secondary">
          <p className="text-[10px] font-semibold text-secondary uppercase tracking-wide mb-1">Translated</p>
          <p className="text-foreground">{translated}</p>
        </div>
      )}

      {/* Simple explanation */}
      {simplified && (
        <div className="bg-accent/50 rounded-lg p-2.5 text-sm border-l-2 border-primary">
          <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1">Simple Explanation</p>
          <p className="text-foreground">{simplified}</p>
        </div>
      )}

      {/* Voice transcript */}
      {listening && transcript && (
        <div className="bg-destructive/10 rounded-lg p-2.5 text-sm border-l-2 border-destructive animate-pulse">
          <p className="text-[10px] font-semibold text-destructive uppercase tracking-wide mb-1">Listening...</p>
          <p className="text-foreground">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default MessageToolbar;
