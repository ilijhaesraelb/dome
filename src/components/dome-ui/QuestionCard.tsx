import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HelpCircle, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface QuestionCardProps {
  label: string;
  explanation?: string;
  example?: string;
  required?: boolean;
  children: ReactNode;
  error?: string;
  verified?: boolean;
  onHelp?: () => void;
  onVoice?: () => void;
  className?: string;
}

export function QuestionCard({
  label, explanation, example, required, children,
  error, verified, onHelp, onVoice, className,
}: QuestionCardProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-5 space-y-3 transition-colors",
      error && "border-destructive/40 bg-destructive/5",
      verified && "border-success/40 bg-success/5",
      className,
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 flex-1">
          <label className="text-sm font-semibold text-card-foreground">
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          {explanation && <p className="text-xs text-muted-foreground">{explanation}</p>}
          {example && <p className="text-xs text-muted-foreground/70 italic">e.g. {example}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onVoice && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onVoice} aria-label="Voice input">
              <Mic className="h-4 w-4" />
            </Button>
          )}
          {onHelp && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onHelp} aria-label="Help">
              <HelpCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Input slot */}
      <div>{children}</div>

      {/* Validation */}
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      {verified && !error && <p className="text-xs text-success font-medium">✓ Verified</p>}
    </div>
  );
}
