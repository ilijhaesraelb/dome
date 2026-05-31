import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Loader2, Lightbulb, AlertTriangle, BookOpen, X, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import VoiceInput from "./VoiceInput";

interface ExplainPanelProps {
  question?: string;
  formType?: string;
  fieldKey?: string;
  onVoiceConfirm?: (fieldId: string, value: string) => void;
  className?: string;
  mode?: "panel" | "sheet"; // panel=docked right, sheet=bottom sheet
  onClose?: () => void;
}

const ExplainPanel = ({
  question,
  formType,
  fieldKey,
  onVoiceConfirm,
  className,
  mode = "panel",
  onClose,
}: ExplainPanelProps) => {
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = useCallback(async () => {
    if (!question) return;
    setLoading(true);
    setError(null);
    setExplanation("");

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/explain-question`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ question, formType, fieldKey }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setExplanation(fullText);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get explanation");
    } finally {
      setLoading(false);
    }
  }, [question, formType, fieldKey]);

  const containerClass = mode === "sheet"
    ? "fixed bottom-0 left-0 right-0 z-50 bg-card border-t rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto"
    : "h-full overflow-y-auto";

  return (
    <div className={cn(containerClass, className)}>
      {/* Sheet drag handle */}
      {mode === "sheet" && (
        <div className="flex items-center justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
      )}

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-secondary" />
            Helper Panel
          </h3>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Current question context */}
        {question && (
          <Card className="border-secondary/20 bg-secondary/5">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Current Question</p>
              <p className="text-sm font-medium">{question}</p>
              {formType && (
                <Badge variant="outline" className="mt-1.5 text-xs">{formType}</Badge>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9 text-xs"
            onClick={fetchExplanation}
            disabled={loading || !question}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <HelpCircle className="w-3 h-3" />
            )}
            Explain Simply
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9 text-xs"
            onClick={fetchExplanation}
            disabled={loading || !question}
          >
            <BookOpen className="w-3 h-3" />
            Show Examples
          </Button>
        </div>

        {/* Voice input */}
        {fieldKey && onVoiceConfirm && (
          <VoiceInput
            fieldId={fieldKey}
            fieldLabel={question || fieldKey}
            onConfirm={(value) => onVoiceConfirm(fieldKey, value)}
          />
        )}

        {/* Explanation content */}
        {(explanation || loading || error) && (
          <Card>
            <CardContent className="p-3">
              {error ? (
                <div className="flex items-start gap-2 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                  {explanation}
                  {loading && (
                    <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExplainPanel;
