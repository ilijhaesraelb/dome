import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save, ChevronRight, Loader2 } from "lucide-react";

export interface StickyActionBarProps {
  onBack?: () => void;
  onSave?: () => void;
  onNext?: () => void;
  backLabel?: string;
  saveLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  saving?: boolean;
  extra?: ReactNode;
  className?: string;
}

export function StickyActionBar({
  onBack, onSave, onNext, backLabel = "Back", saveLabel = "Save Draft",
  nextLabel = "Next Step", nextDisabled, saving, extra, className,
}: StickyActionBarProps) {
  return (
    <div className={cn(
      "sticky bottom-0 z-30 border-t bg-background/95 backdrop-blur-sm safe-bottom",
      "px-4 py-3 flex items-center justify-between gap-2",
      className,
    )}>
      <div className="flex items-center gap-2">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> {backLabel}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {extra}
        {onSave && (
          <Button variant="outline" size="sm" onClick={onSave} disabled={saving} className="gap-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saveLabel}
          </Button>
        )}
        {onNext && (
          <Button size="sm" onClick={onNext} disabled={nextDisabled} className="gap-1">
            {nextLabel} <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
