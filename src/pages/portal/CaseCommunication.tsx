import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Mic, MicOff, Loader2, Lock, ShieldCheck, Headphones, Languages, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLanguagePreferences } from "@/hooks/useLanguagePreferences";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { getLangFlag, getLangLabel } from "@/hooks/useTranslation";
import TranslatedMessageBubble from "@/components/communication/TranslatedMessageBubble";
import LanguageSupportRequestDialog from "@/components/communication/LanguageSupportRequestDialog";
import { toast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { logPlatformError } from "@/lib/error-logger";

interface CaseMessage {
  id: string;
  case_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  created_at: string;
  sender_id: string | null;
}

const CaseCommunication = () => {
  const { id: caseId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { prefs } = useLanguagePreferences();
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { start: startListening, stop: stopListening, listening, transcript, isSupported } = useSpeechToText(
    (result) => setInput((prev) => prev + " " + result)
  );

  // Load messages
  useEffect(() => {
    if (!caseId) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("case_messages")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as CaseMessage[]);
      setLoading(false);
    };
    loadMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`case-messages-${caseId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "case_messages", filter: `case_id=eq.${caseId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as CaseMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [caseId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || !caseId) return;
    setSending(true);
    const { error } = await supabase.from("case_messages").insert({
      case_id: caseId,
      content: input.trim(),
      sender_id: user.id,
      sender_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "User",
      sender_role: "client",
    });
    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
      logPlatformError({
        type: "notification_failure",
        severity: "high",
        message: error.message || "Failed to send case message",
        caseId: caseId,
        details: { action: "send_message" },
      });
    }
    setInput("");
    setSending(false);
  };

  const handleVoiceToggle = () => {
    if (listening) {
      stopListening();
    } else {
      startListening(prefs.preferred_language);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="bg-primary rounded-xl p-5 text-primary-foreground">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Languages className="w-6 h-6" /> Case Communication
        </h1>
        <p className="text-primary-foreground/70 text-sm mt-1">
          Multi-language conversation thread · Auto-translated to your preferred language
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge className="bg-white/20 text-white border-0 text-[10px]">
            {getLangFlag(prefs.preferred_language)} {getLangLabel(prefs.preferred_language)}
          </Badge>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50 border">
        <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground">
          Translations are provided for communication support. For legal accuracy, important case details should be reviewed with a qualified professional. D.O.M.E. does not provide legal advice.
        </p>
      </div>

      {/* Messages */}
      <Card className="min-h-[400px] max-h-[500px] overflow-y-auto">
        <CardContent className="p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Languages className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No messages yet. Start the conversation!</p>
              <p className="text-xs mt-1">Messages will be auto-translated for all participants.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <TranslatedMessageBubble
                key={msg.id}
                senderName={msg.sender_name}
                senderRole={msg.sender_role}
                content={msg.content}
                viewerLang={prefs.preferred_language}
                timestamp={new Date(msg.created_at).toLocaleString()}
                isOwn={msg.sender_id === user?.id}
                onReply={(text) => setInput((prev) => prev + " " + text)}
              />
            ))
          )}
          <div ref={scrollRef} />
        </CardContent>
      </Card>

      {/* Input area */}
      <Card>
        <CardContent className="p-3">
          {listening && transcript && (
            <div className="mb-2 p-2 rounded bg-destructive/10 text-sm animate-pulse">
              <span className="text-[10px] font-bold text-destructive">🎤 Listening...</span>
              <p className="text-xs mt-0.5">{transcript}</p>
            </div>
          )}
          <div className="flex gap-2">
            {isSupported && prefs.voice_input_enabled && (
              <Button
                variant={listening ? "destructive" : "outline"}
                size="icon"
                onClick={handleVoiceToggle}
                className="shrink-0"
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={sending || !input.trim()} size="icon" className="shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Language Support Request */}
      <div className="flex justify-center">
        <LanguageSupportRequestDialog caseId={caseId} />
      </div>

      {/* Security footer */}
      <div className="space-y-2 px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5 text-secondary" />
          <span>All messages encrypted · Role-based access enforced</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
          <span>Original messages preserved · Audit logged</span>
        </div>
      </div>
    </div>
  );
};

export default CaseCommunication;
