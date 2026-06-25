import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, MicOff, Bot, User, Sparkles, Shield, FileText, Globe, Compass, Users, ClipboardList, BookOpen, ArrowRight, MapPin, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useT } from "@/hooks/useT";
import FormFillerAgent from "@/components/form-engine/FormFillerAgent";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/immigration-assistant`;

const guidedQuestions = [
  { icon: Globe, label: "Discover pathways", prompt: "I'd like to discover which immigration pathways might be available to me. Can you ask me some questions to help figure that out?" },
  { icon: FileText, label: "Explain a form", prompt: "Can you explain what Form I-130 is and who needs to file it?" },
  { icon: ClipboardList, label: "Document checklist", prompt: "What documents do I typically need for a family-based green card application? Please give me a checklist." },
  { icon: Sparkles, label: "Timeline & fees", prompt: "How long does the typical green card process take and what are the government filing fees?" },
  { icon: Compass, label: "Work visas", prompt: "What work visa options might be available if I have a job offer from a U.S. employer?" },
  { icon: BookOpen, label: "Student visas", prompt: "Can you explain the student visa process and what's required?" },
];

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    onError(body.error || "Failed to connect to AI assistant");
    return;
  }

  if (!resp.body) { onError("No response stream"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;

  while (!done) {
    const { done: streamDone, value } = await reader.read();
    if (streamDone) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

type AIAssistantProps = {
  panelMode?: boolean;
};

const AIAssistant = ({ panelMode = false }: AIAssistantProps) => {
  const t = useT();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [agentMode, setAgentMode] = useState<"chat" | "form-fill">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => setIsLoading(false),
        onError: (err) => {
          toast({ variant: "destructive", title: t("ai.aiError"), description: err });
          setIsLoading(false);
        },
      });
    } catch {
      toast({ variant: "destructive", title: t("ai.connectionError"), description: t("ai.couldNotReach") });
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ variant: "destructive", title: t("ai.notSupported"), description: t("ai.voiceNotSupported") });
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const hasMessages = messages.length > 0;

  if (agentMode === "form-fill") {
    return (
      <div className={cn(
        "flex flex-col bg-background min-h-0",
        panelMode ? "h-full w-full" : "h-[calc(100vh-120px)] max-w-3xl mx-auto px-4",
      )}>
        <FormFillerAgent
          onExit={() => setAgentMode("chat")}
          onGoToPathwayFinder={() => { setAgentMode("chat"); navigate("/pathway-finder"); }}
        />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col bg-background min-h-0",
      panelMode ? "h-full w-full" : "h-[calc(100vh-120px)] max-w-3xl mx-auto px-4",
    )}>
      {/* Header */}
      <div className="text-center py-4 shrink-0">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-2">
          <Compass className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">{t("ai.advisorTitle")}</h1>
        <p className="text-xs text-muted-foreground">{t("ai.advisorSubtitle")}</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className={cn("flex-1 min-h-0 overflow-y-auto space-y-4 pb-4", panelMode && "px-4")}>
        {!hasMessages && (
          <div className="space-y-6 pt-2">
            {/* Fill a Form — prominent agent CTA */}
            <button
              onClick={() => setAgentMode("form-fill")}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-secondary/40 bg-gradient-to-r from-secondary/5 to-secondary/10 hover:border-secondary/70 hover:from-secondary/10 hover:to-secondary/20 transition-all group text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-secondary/15 flex items-center justify-center shrink-0 group-hover:bg-secondary/25 transition-colors">
                <PenLine className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">Fill an Application</p>
                <p className="text-xs text-muted-foreground">Green card, citizenship, work permit, visa &amp; more — guided field by field</p>
              </div>
              <ArrowRight className="w-4 h-4 text-secondary shrink-0" />
            </button>

            {/* Guided questions */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3 text-center">{t("ai.howCanIHelp")}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {guidedQuestions.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => send(qa.prompt)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent/50 text-center transition-all hover:shadow-md hover:scale-[1.02]"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <qa.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground">{qa.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/portal/passport")}>
                <Shield className="w-3.5 h-3.5" />
                {t("ai.createPassport")}
              </Button>
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/pathway-finder")}>
                <MapPin className="w-3.5 h-3.5" />
                {t("ai.pathwayQuiz")}
              </Button>
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/portal/office-locator")}>
                <Users className="w-3.5 h-3.5" />
                {t("ai.findProfessional")}
              </Button>
            </div>

            {/* Disclaimer */}
            <div className="bg-muted/50 border border-border rounded-xl p-3 text-center">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <Shield className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                {t("ai.disclaimerFull")}
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border rounded-bl-md prose prose-sm prose-neutral dark:prose-invert max-w-none"
              )}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-secondary" />
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contextual action bar after conversation */}
      {hasMessages && !isLoading && (
        <div className="flex flex-wrap gap-2 justify-center py-2 shrink-0 border-t border-border/50">
          <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => setAgentMode("form-fill")}>
            <PenLine className="w-3.5 h-3.5" />
            Fill a Form
          </Button>
          <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => send("Can you generate a document checklist for the pathway we discussed?")}>
            <ClipboardList className="w-3.5 h-3.5" />
            {t("ai.getChecklist")}
          </Button>
          <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => navigate("/portal/passport")}>
            <Shield className="w-3.5 h-3.5" />
            {t("ai.createPassportShort")}
          </Button>
          <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => navigate("/portal/office-locator")}>
            <Users className="w-3.5 h-3.5" />
            {t("ai.findPro")}
          </Button>
          <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => { setMessages([]); setInput(""); }}>
            <ArrowRight className="w-3.5 h-3.5" />
            {t("ai.newConversation")}
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border pt-3 pb-2 shrink-0">
        <div className="flex items-end gap-2">
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
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("ai.inputPlaceholder")}
            className="min-h-[40px] max-h-[120px] resize-none rounded-xl text-sm"
            rows={1}
          />
          <Button
            onClick={() => send(input)}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 rounded-full h-10 w-10 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          {t("ai.languageSupport")}
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;
