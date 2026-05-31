/**
 * TaxSectionHelpPanel — Collapsible help panel at the top of a tax section.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, AlertCircle, Lightbulb, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTaxHelp } from "@/contexts/TaxHelpContext";
import type { TaxSectionHelpEntry } from "@/data/taxFieldHelp";

interface Props {
  section: TaxSectionHelpEntry;
  className?: string;
}

const TaxSectionHelpPanel = ({ section, className }: Props) => {
  const [open, setOpen] = useState(false);
  const { helpMode, showHelp } = useTaxHelp();

  if (!showHelp) return null;

  return (
    <div className={cn("border border-border rounded-lg bg-card overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <BookOpen className="w-4 h-4 text-primary/70" />
          About this section: {section.title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-150">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {helpMode === "beginner" ? section.beginner.summary : section.professional.summary}
          </p>

          {helpMode === "beginner" ? (
            <>
              {/* Required documents checklist */}
              <div>
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary/60" />
                  Documents you'll need
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {section.beginner.checklist.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common mistakes */}
              <div>
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive/60" />
                  Common mistakes
                </p>
                <ul className="space-y-1">
                  {section.beginner.commonMistakes.map((item, i) => (
                    <li key={i} className="text-xs text-destructive/70 flex items-start gap-1.5">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-destructive/40 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tips */}
              <div>
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-secondary" />
                  Quick tips
                </p>
                <ul className="space-y-1">
                  {section.beginner.tips.map((item, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-secondary/40 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">References</p>
              <div className="flex flex-wrap gap-1.5">
                {section.professional.references.map((ref, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] font-mono">
                    {ref}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaxSectionHelpPanel;
