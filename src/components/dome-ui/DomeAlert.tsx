import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CheckCircle2, Info, AlertTriangle, XCircle, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const alertVariants = cva(
  "rounded-lg border p-4 flex gap-3 items-start",
  {
    variants: {
      severity: {
        success:    "bg-success/5 border-success/30",
        info:       "bg-info/5 border-info/30",
        warning:    "bg-warning/5 border-warning/30",
        error:      "bg-destructive/5 border-destructive/30",
        blocked:    "bg-destructive/10 border-destructive/40",
        compliance: "bg-primary/5 border-primary/30",
      },
    },
    defaultVariants: { severity: "info" },
  }
);

const ICONS = {
  success: CheckCircle2, info: Info, warning: AlertTriangle,
  error: XCircle, blocked: XCircle, compliance: ShieldAlert,
};
const ICON_COLORS = {
  success: "text-success", info: "text-info", warning: "text-warning",
  error: "text-destructive", blocked: "text-destructive", compliance: "text-primary",
};

export interface DomeAlertProps extends VariantProps<typeof alertVariants> {
  title: string;
  message?: string;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function DomeAlert({ severity, title, message, action, onDismiss, className }: DomeAlertProps) {
  const s = severity ?? "info";
  const Icon = ICONS[s];
  return (
    <div className={cn(alertVariants({ severity }), className)}>
      <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", ICON_COLORS[s])} />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        {action && <div className="pt-1">{action}</div>}
      </div>
      {onDismiss && (
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onDismiss}>
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
