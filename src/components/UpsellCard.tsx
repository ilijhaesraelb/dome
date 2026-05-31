/**
 * UpsellCard — Contextual upsell prompt shown at key workflow moments.
 */
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";
import { useProductPrice } from "@/hooks/useProductPricing";

interface UpsellCardProps {
  productKey: string;
  headline: string;
  description: string;
  ctaLabel?: string;
  onAction?: () => void;
  variant?: "inline" | "banner";
}

const UpsellCard = ({
  productKey,
  headline,
  description,
  ctaLabel = "Learn More",
  onAction,
  variant = "inline",
}: UpsellCardProps) => {
  const { price, isLoading } = useProductPrice(productKey);

  if (isLoading) return null;

  if (variant === "banner") {
    return (
      <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-3 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-secondary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">{headline}</p>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
        {price !== null && (
          <Badge className="bg-secondary/10 text-secondary border-0 shrink-0">${price}</Badge>
        )}
        {onAction && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0" onClick={onAction}>
            {ctaLabel} <ArrowRight className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-secondary" />
          <span className="text-sm font-semibold">{headline}</span>
          {price !== null && (
            <Badge className="bg-secondary/10 text-secondary border-0 ml-auto">${price}</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {onAction && (
          <Button size="sm" className="w-full gap-1 bg-secondary hover:bg-secondary/90 h-8 text-xs" onClick={onAction}>
            {ctaLabel} <ArrowRight className="w-3 h-3" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default UpsellCard;
