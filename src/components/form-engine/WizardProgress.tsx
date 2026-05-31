/**
 * WizardProgress — Animated step progress bar for the form wizard.
 * Shows current step, total steps, and section completion status.
 */
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardProgressProps {
  sections: { id: string; title: string }[];
  activeSection: number;
  completions: number[];
  onSectionClick: (index: number) => void;
}

const WizardProgress = ({ sections, activeSection, completions, onSectionClick }: WizardProgressProps) => {
  return (
    <div className="space-y-3">
      {/* Top progress line */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-semibold text-foreground">
          Step {activeSection + 1} of {sections.length}
        </span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden ml-2">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((activeSection + 1) / sections.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Section list — desktop sidebar */}
      <div className="hidden md:block space-y-0.5">
        {sections.map((s, i) => {
          const isReview = s.id === "review";
          const pct = completions[i] ?? 0;
          const isCurrent = i === activeSection;
          const isPast = i < activeSection;

          return (
            <button
              key={s.id}
              onClick={() => onSectionClick(i)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-2 group",
                isCurrent && "bg-primary text-primary-foreground font-medium shadow-sm",
                !isCurrent && "hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold transition-all duration-200",
                isCurrent && "bg-primary-foreground/20 text-primary-foreground",
                !isCurrent && pct === 100 && "bg-success/15 text-success",
                !isCurrent && pct < 100 && "bg-muted text-muted-foreground"
              )}>
                {isReview ? "✓" : pct === 100 ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              <span className="truncate flex-1">
                {s.title.replace(/Part \d+\/?\d* — /, "")}
              </span>
              {!isReview && pct === 100 && !isCurrent && (
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgress;
