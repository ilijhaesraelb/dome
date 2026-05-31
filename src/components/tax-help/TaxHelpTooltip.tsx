/**
 * TaxHelpTooltip — Context-aware tooltip for tax fields.
 * Shows ?, !, or ℹ icon with beginner/professional content.
 */
import { useState } from "react";
import { HelpCircle, AlertTriangle, Info, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTaxHelp } from "@/contexts/TaxHelpContext";
import type { TaxFieldHelpEntry } from "@/data/taxFieldHelp";

interface TaxHelpTooltipProps {
  help: TaxFieldHelpEntry;
  className?: string;
}

const ICON_MAP = {
  info: HelpCircle,
  warning: AlertTriangle,
  tip: Info,
} as const;

const ICON_COLOR = {
  info: "text-primary/60 hover:text-primary",
  warning: "text-warning hover:text-warning",
  tip: "text-muted-foreground hover:text-primary",
} as const;

const TaxHelpTooltip = ({ help, className }: TaxHelpTooltipProps) => {
  const { helpMode, showHelp } = useTaxHelp();
  const [expanded, setExpanded] = useState(false);

  if (!showHelp) return null;

  const Icon = ICON_MAP[help.type];
  const content = helpMode === "beginner" ? help.beginner : help.professional;

  return (
    <span className={cn("inline-flex items-center", className)}>
      {/* Hover tooltip — brief */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setExpanded(!expanded); }}
              className={cn(
                "inline-flex items-center justify-center rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                ICON_COLOR[help.type],
              )}
              aria-label="Field help"
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
            <p>{helpMode === "beginner" ? help.beginner.explanation : help.professional.explanation}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Expanded panel on click */}
      {expanded && (
        <div className="absolute left-0 right-0 top-full mt-1 z-40">
          <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] font-normal">
                {helpMode === "beginner" ? "Simple Mode" : "Professional Mode"}
              </Badge>
              <button type="button" onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </div>

            {helpMode === "beginner" ? (
              <>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">What this is</p>
                  <p className="text-muted-foreground">{help.beginner.explanation}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Why it matters</p>
                  <p className="text-muted-foreground">{help.beginner.why}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-0.5">Where to find it</p>
                  <p className="text-muted-foreground">{help.beginner.howToFind}</p>
                </div>
                <div className="bg-muted/50 rounded px-2 py-1.5">
                  <p className="font-semibold text-foreground mb-0.5">Example</p>
                  <p className="font-mono text-foreground">{help.beginner.example}</p>
                </div>
                {help.beginner.warning && (
                  <div className="flex items-start gap-1.5 bg-destructive/5 border border-destructive/20 rounded px-2 py-1.5 text-destructive/80">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    <p>{help.beginner.warning}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <p className="text-muted-foreground">{help.professional.explanation}</p>
                </div>
                {help.professional.reference && (
                  <div className="bg-muted/50 rounded px-2 py-1.5">
                    <p className="font-semibold text-foreground mb-0.5">Reference</p>
                    <p className="font-mono text-foreground">{help.professional.reference}</p>
                  </div>
                )}
                {help.professional.warning && (
                  <div className="flex items-start gap-1.5 bg-destructive/5 border border-destructive/20 rounded px-2 py-1.5 text-destructive/80">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    <p>{help.professional.warning}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </span>
  );
};

export default TaxHelpTooltip;
