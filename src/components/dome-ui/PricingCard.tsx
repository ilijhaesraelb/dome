import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel?: string;
  onSelect?: () => void;
  className?: string;
}

export function PricingCard({
  title, price, period, features, highlighted, ctaLabel = "Select", onSelect, className,
}: PricingCardProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-6 flex flex-col transition-shadow",
      highlighted && "border-primary shadow-md ring-1 ring-primary/20",
      className,
    )}>
      {highlighted && (
        <span className="self-start rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground mb-3">
          Recommended
        </span>
      )}
      <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
      <div className="mt-2 mb-4">
        <span className="text-3xl font-bold font-display text-card-foreground">{price}</span>
        {period && <span className="text-sm text-muted-foreground ml-1">/{period}</span>}
      </div>
      <ul className="space-y-2 flex-1 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 mt-0.5 text-success shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button onClick={onSelect} variant={highlighted ? "default" : "outline"} className="w-full">
        {ctaLabel}
      </Button>
    </div>
  );
}
