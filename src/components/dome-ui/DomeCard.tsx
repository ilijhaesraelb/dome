import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

const cardVariants = cva(
  "rounded-lg border transition-all",
  {
    variants: {
      variant: {
        action:  "bg-card hover:shadow-md hover:border-primary/30 cursor-pointer",
        status:  "bg-card",
        metric:  "bg-card",
        record:  "bg-card",
        summary: "bg-muted/30 border-dashed",
        warning: "bg-warning/5 border-warning/30",
      },
    },
    defaultVariants: { variant: "status" },
  }
);

export interface DomeCardProps extends VariantProps<typeof cardVariants> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  badge?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  metric?: string | number;
  metricLabel?: string;
}

export function DomeCard({
  variant, icon: Icon, title, description, badge, footer,
  children, onClick, className, metric, metricLabel,
}: DomeCardProps) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      className={cn(cardVariants({ variant }), "text-left w-full", className)}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {Icon && (
              <div className="shrink-0 rounded-md bg-primary/10 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="space-y-1 min-w-0">
              <h3 className="font-semibold text-card-foreground leading-tight">{title}</h3>
              {description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}
            </div>
          </div>
          {badge}
        </div>

        {metric !== undefined && (
          <div className="pt-1">
            <p className="text-3xl font-bold font-display text-card-foreground">{metric}</p>
            {metricLabel && <p className="text-xs text-muted-foreground mt-0.5">{metricLabel}</p>}
          </div>
        )}

        {children}
      </div>

      {footer && (
        <div className="border-t px-5 py-3 bg-muted/20 rounded-b-lg">
          {footer}
        </div>
      )}
    </Wrapper>
  );
}
