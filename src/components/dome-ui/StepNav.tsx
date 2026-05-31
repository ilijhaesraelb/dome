import { cn } from "@/lib/utils";
import { Check, LucideIcon } from "lucide-react";

export interface StepDef {
  label: string;
  icon?: LucideIcon;
  status: "completed" | "current" | "upcoming";
}

/* ── Horizontal compact bar (mobile / top) ── */
export function StepProgressBar({ steps, className }: { steps: StepDef[]; className?: string }) {
  const currentIdx = steps.findIndex(s => s.status === "current");
  const pct = steps.length > 1 ? ((currentIdx < 0 ? steps.length : currentIdx) / (steps.length - 1)) * 100 : 0;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Step {Math.max(currentIdx + 1, 1)} of {steps.length}</span>
        <span>{Math.round(pct)}% complete</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── Vertical sidebar nav (desktop) ── */
export function StepSidebar({ steps, onSelect, className }: {
  steps: StepDef[];
  onSelect?: (idx: number) => void;
  className?: string;
}) {
  return (
    <nav className={cn("space-y-1", className)}>
      {steps.map((step, idx) => {
        const Icon = step.icon;
        return (
          <button
            key={idx}
            onClick={() => step.status !== "upcoming" && onSelect?.(idx)}
            disabled={step.status === "upcoming"}
            className={cn(
              "w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-left transition-colors",
              step.status === "current" && "bg-primary/10 text-primary font-medium",
              step.status === "completed" && "text-muted-foreground hover:bg-muted/50",
              step.status === "upcoming" && "text-muted-foreground/50 cursor-not-allowed",
            )}
          >
            <span className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold shrink-0",
              step.status === "completed" && "bg-success/15 text-success",
              step.status === "current" && "bg-primary text-primary-foreground",
              step.status === "upcoming" && "bg-muted text-muted-foreground",
            )}>
              {step.status === "completed" ? <Check className="h-3.5 w-3.5" /> : (
                Icon ? <Icon className="h-3.5 w-3.5" /> : idx + 1
              )}
            </span>
            <span className="truncate">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
