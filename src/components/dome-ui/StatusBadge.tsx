import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      status: {
        draft:       "bg-muted text-muted-foreground",
        "in-progress": "bg-info/15 text-info",
        "missing":   "bg-warning/15 text-warning-foreground",
        "needs-review": "bg-warning/15 text-warning-foreground",
        ready:       "bg-success/15 text-success",
        "ready-payment": "bg-secondary/15 text-secondary",
        paid:        "bg-success/15 text-success",
        verified:    "bg-success/15 text-success",
        exported:    "bg-primary/15 text-primary",
        finalized:   "bg-primary/15 text-primary",
        locked:      "bg-muted text-muted-foreground",
        error:       "bg-destructive/15 text-destructive",
        warning:     "bg-warning/15 text-warning-foreground",
        pending:     "bg-muted text-muted-foreground",
        info:        "bg-info/15 text-info",
      },
    },
    defaultVariants: { status: "draft" },
  }
);

const DOT: Record<string, string> = {
  draft: "bg-muted-foreground", "in-progress": "bg-info", missing: "bg-warning",
  "needs-review": "bg-warning", ready: "bg-success", "ready-payment": "bg-secondary",
  paid: "bg-success", verified: "bg-success", exported: "bg-primary",
  finalized: "bg-primary", locked: "bg-muted-foreground", error: "bg-destructive",
  warning: "bg-warning", pending: "bg-muted-foreground", info: "bg-info",
};

export interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  label: string;
  className?: string;
  dot?: boolean;
}

export function StatusBadge({ status, label, className, dot = true }: StatusBadgeProps) {
  const s = status ?? "draft";
  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT[s])} />}
      {label}
    </span>
  );
}
