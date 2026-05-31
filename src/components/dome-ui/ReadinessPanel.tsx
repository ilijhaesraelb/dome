import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, FileWarning, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface ReadinessPanelProps {
  score: number;
  blockers?: number;
  warnings?: number;
  missingDocs?: number;
  onFixBlockers?: () => void;
  onReviewWarnings?: () => void;
  onAskAI?: () => void;
  className?: string;
}

export function ReadinessPanel({
  score, blockers = 0, warnings = 0, missingDocs = 0,
  onFixBlockers, onReviewWarnings, onAskAI, className,
}: ReadinessPanelProps) {
  const color = score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";

  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Filing Readiness</h4>
        <span className={cn("text-2xl font-bold font-display", color)}>{score}%</span>
      </div>
      <Progress value={score} className="h-2" />

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-md bg-destructive/10 p-2">
          <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-destructive" />
          <span className="font-semibold text-destructive">{blockers}</span>
          <p className="text-muted-foreground">Blockers</p>
        </div>
        <div className="rounded-md bg-warning/10 p-2">
          <FileWarning className="h-4 w-4 mx-auto mb-1 text-warning" />
          <span className="font-semibold text-warning-foreground">{warnings}</span>
          <p className="text-muted-foreground">Warnings</p>
        </div>
        <div className="rounded-md bg-info/10 p-2">
          <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-info" />
          <span className="font-semibold text-info">{missingDocs}</span>
          <p className="text-muted-foreground">Missing</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {blockers > 0 && onFixBlockers && (
          <Button variant="destructive" size="sm" onClick={onFixBlockers} className="gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> Fix Blockers
          </Button>
        )}
        {warnings > 0 && onReviewWarnings && (
          <Button variant="outline" size="sm" onClick={onReviewWarnings} className="gap-1">
            <FileWarning className="h-3.5 w-3.5" /> Review Warnings
          </Button>
        )}
        {onAskAI && (
          <Button variant="outline" size="sm" onClick={onAskAI} className="gap-1">
            <Bot className="h-3.5 w-3.5" /> Ask AI
          </Button>
        )}
      </div>
    </div>
  );
}
