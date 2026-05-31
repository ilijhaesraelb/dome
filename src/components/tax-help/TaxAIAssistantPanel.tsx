/**
 * TaxAIAssistantPanel — Embedded AI chat panel for tax workflows.
 * Collapsible on desktop (right side), bottom sheet on mobile.
 */
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot, X, Send, Mic, MicOff, Volume2, Trash2, ChevronDown,
  ChevronUp, Lightbulb, AlertTriangle, HelpCircle, Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTaxAssistant, type TaxAssistantContext } from "@/hooks/useTaxAssistant";
import { useTaxHelp } from "@/contexts/TaxHelpContext";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import type { TaxIssue } from "@/lib/tax-error-engine";

interface Props {
  context?: TaxAssistantContext;
  issues?: TaxIssue[];
  onClose?: () => void;
}

const QUICK_PROMPTS = [
  { label: "Explain This Field", prompt: "Explain what this field is asking for, why it's required, and where to find the information.", icon: HelpCircle },
  { label: "Why Is This Required?", prompt: "Why is this field or section required, and how does it affect my tax return?", icon: Sparkles },
  { label: "Where Do I Find This?", prompt: "Where do I find the information needed for this field? Which document or record should I look at?", icon: Lightbulb },
  { label: "Show Missing Items", prompt: "What information or documents am I still missing before I can continue?", icon: AlertTriangle },
  { label: "Fix My Blockers", prompt: "Show me all current blockers and help me fix them one by one.", icon: AlertTriangle },
  { label: "Review My Uploaded Documents", prompt: "Review the documents I have uploaded and tell me what data was extracted and what's still needed.", icon: HelpCircle },
];

const DISCLAIMER = "AI guidance is provided to help organize and prepare your information. Tax returns and financial data should be reviewed for accuracy and compliance before submission.";

const STATUS_MESSAGES = {
  noDocs: "No tax documents have been uploaded yet. I can still explain fields, but my guidance will be more accurate once documents are added.",
  noWarnings: "No active blockers or warnings found in this section right now.",
  ready: "This section looks ready for review.",
  nearComplete: "You're close to completion. I found a few items worth reviewing before you move forward.",
};

export default function TaxAIAssistantPanel({ context, issues, onClose }: Props) {
  const { messages, isLoading, error, sendMessage, clearChat, setContext, setMode } = useTaxAssistant();
  const { helpMode } = useTaxHelp();
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speak, stop: stopSpeech, speaking } = useTextToSpeech();

  const handleVoiceResult = (text: string) => {
    setInput(text);
  };
  const { start: startListening, stop: stopListening, listening, transcript, isSupported: voiceSupported } = useSpeechToText(handleVoiceResult);

  // Sync context & mode
  useEffect(() => {
    if (context) setContext({ ...context, errors: issues });
  }, [context, issues, setContext]);

  useEffect(() => { setMode(helpMode); }, [helpMode, setMode]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const readAloud = (text: string) => {
    if (speaking) stopSpeech();
    else speak(text);
  };

  if (!expanded) {
    return (
      <Button
        onClick={() => setExpanded(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full h-14 w-14 shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="flex flex-col h-full border-l shadow-lg bg-background">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b space-y-0">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-sm font-semibold">AI Tax Assistant</CardTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">Guidance based on your current tax file, uploaded documents, and draft data</p>
          </div>
          <Badge variant="secondary" className="text-[10px]">{helpMode === "professional" ? "Professional Mode" : "Simple Mode"}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearChat} title="Clear chat">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(false)}>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b">
        {QUICK_PROMPTS.map(qp => (
          <Button
            key={qp.label}
            variant="outline"
            size="sm"
            className="text-xs h-7 gap-1"
            disabled={isLoading}
            onClick={() => sendMessage(qp.prompt)}
          >
            <qp.icon className="h-3 w-3" />
            {qp.label}
          </Button>
        ))}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm space-y-2">
              <Bot className="h-10 w-10 mx-auto opacity-40" />
              <p className="font-medium">Ask me anything about your tax filing</p>
              <p className="text-xs">
                {helpMode === "professional"
                  ? "Concise tax-prep guidance with review-focused detail"
                  : "Plain-language explanations with examples"}
              </p>
              {context && (
                <p className="text-xs mt-2 text-muted-foreground/80">
                  {!context.uploadedDocs?.length ? STATUS_MESSAGES.noDocs
                    : !issues?.length ? STATUS_MESSAGES.noWarnings
                    : (issues?.length ?? 0) <= 2 ? STATUS_MESSAGES.nearComplete
                    : null}
                </p>
              )}
              <p className="text-[10px] italic mt-4 max-w-xs mx-auto text-muted-foreground/70">{DISCLAIMER}</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] mt-1 gap-1 opacity-60 hover:opacity-100"
                      onClick={() => readAloud(msg.content)}
                    >
                      <Volume2 className="h-3 w-3" />
                      {speaking ? "Stop" : "Read This Aloud"}
                    </Button>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="text-xs text-destructive bg-destructive/10 rounded p-2">{error}</div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Listening indicator */}
      {listening && (
        <div className="px-3 py-1 text-xs text-primary flex items-center gap-1 border-t bg-primary/5">
          <Mic className="h-3 w-3 animate-pulse" /> {transcript ? `Listening: ${transcript}` : "Understanding your question…"}
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3 space-y-2">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this section, this field, your uploaded documents, or current warnings…"
            className="min-h-[40px] max-h-[100px] text-sm resize-none"
            rows={1}
          />
          <div className="flex flex-col gap-1">
            {voiceSupported && (
              <div className="flex flex-col items-center gap-0.5">
                <Button
                  variant={listening ? "destructive" : "outline"}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => listening ? stopListening() : startListening()}
                >
                  {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <span className="text-[9px] text-muted-foreground">{listening ? "Listening…" : "Use Voice"}</span>
              </div>
            )}
            <Button
              size="icon"
              className="h-9 w-9"
              disabled={!input.trim() || isLoading}
              onClick={handleSend}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
