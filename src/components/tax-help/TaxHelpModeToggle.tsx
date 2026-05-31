/**
 * TaxHelpModeToggle — Global toggle between Simple/Professional help + on/off.
 */
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaxHelp } from "@/contexts/TaxHelpContext";

interface Props {
  className?: string;
  compact?: boolean;
}

const TaxHelpModeToggle = ({ className, compact = false }: Props) => {
  const { helpMode, setHelpMode, showHelp, toggleHelp } = useTaxHelp();

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <button
          type="button"
          onClick={toggleHelp}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title={showHelp ? "Hide help" : "Show help"}
        >
          {showHelp ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        {showHelp && (
          <div className="flex bg-muted rounded-full p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setHelpMode("beginner")}
              className={cn(
                "px-2 py-0.5 rounded-full transition-colors",
                helpMode === "beginner" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Simple
            </button>
            <button
              type="button"
              onClick={() => setHelpMode("professional")}
              className={cn(
                "px-2 py-0.5 rounded-full transition-colors",
                helpMode === "professional" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pro
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-4 p-3 bg-card border border-border rounded-lg", className)}>
      <div className="flex items-center gap-2">
        <Switch checked={showHelp} onCheckedChange={toggleHelp} />
        <span className="text-xs text-muted-foreground">{showHelp ? "Help visible" : "Help hidden"}</span>
      </div>

      {showHelp && (
        <div className="flex bg-muted rounded-full p-0.5">
          <button
            type="button"
            onClick={() => setHelpMode("beginner")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              helpMode === "beginner" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Simple Mode
          </button>
          <button
            type="button"
            onClick={() => setHelpMode("professional")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              helpMode === "professional" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Professional Mode
          </button>
        </div>
      )}
    </div>
  );
};

export default TaxHelpModeToggle;
