/**
 * TaxGuidedField — Drop-in replacement for GuidedField that integrates
 * the TaxHelpTooltip system when a matching help entry exists.
 */
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import TaxHelpTooltip from "./TaxHelpTooltip";
import { TAX_FIELD_HELP } from "@/data/taxFieldHelp";
import type { FormFieldDef } from "@/data/formSections";

interface Props {
  field: FormFieldDef;
  value: string;
  error?: string;
  onChange: (key: string, value: string) => void;
  /** Override the help key lookup (defaults to field.key) */
  helpKey?: string;
}

const TaxGuidedField = ({ field, value, error, onChange, helpKey }: Props) => {
  const help = TAX_FIELD_HELP[helpKey ?? field.key];
  const isLongText = field.key.includes("summary") || field.key.includes("reasons") || field.key.includes("description");

  return (
    <div className={cn(
      "relative px-5 py-5 transition-all duration-200",
      error && "bg-destructive/5",
      !error && value.trim() && "bg-success/[0.03]"
    )}>
      {/* Label + help icon */}
      <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-0.5">
        {field.label}
        {field.required && <span className="text-destructive">*</span>}
        {help && <TaxHelpTooltip help={help} />}
      </label>

      {/* Plain explanation */}
      {field.help && (
        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{field.help.what}</p>
      )}

      {/* Example */}
      {field.help?.example && (
        <p className="text-[11px] text-muted-foreground/60 mb-2">
          Example: <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground">{field.help.example}</span>
        </p>
      )}

      {/* Input */}
      {field.type === "select" && field.options ? (
        <Select value={value} onValueChange={(v) => onChange(field.key, v)}>
          <SelectTrigger className={cn("h-11 text-sm bg-background", error && "border-destructive")}>
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : isLongText ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={5}
          className={cn("text-sm resize-y min-h-[100px] bg-background", error && "border-destructive")}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className={cn("h-11 text-sm bg-background", error && "border-destructive")}
        />
      )}

      {/* Error with contextual help trigger */}
      {error && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-destructive flex items-center gap-1.5 animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
          </p>
          {help && (
            <p className="text-[11px] text-muted-foreground">
              💡 Click the <span className="font-semibold">?</span> icon above for guidance on this field.
            </p>
          )}
        </div>
      )}

      {/* Warning from field definition */}
      {field.help?.warning && (
        <div className="mt-2 rounded-lg bg-destructive/5 border border-destructive/20 p-2.5 text-xs text-destructive/80 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{field.help.warning}</span>
        </div>
      )}
    </div>
  );
};

export default TaxGuidedField;
