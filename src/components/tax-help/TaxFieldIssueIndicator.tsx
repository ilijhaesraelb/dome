/**
 * TaxFieldIssueIndicator — Inline issue badge shown next to fields with errors.
 */
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, XCircle, Info, FileWarning } from "lucide-react";
import { type TaxIssue, SEVERITY_CONFIG } from "@/lib/tax-error-engine";

interface Props {
  issues: TaxIssue[];
  onAskAI?: (question: string) => void;
}

const ICONS = {
  critical: XCircle,
  high: AlertTriangle,
  medium: FileWarning,
  info: Info,
} as const;

export default function TaxFieldIssueIndicator({ issues, onAskAI }: Props) {
  if (!issues.length) return null;

  const worst = issues.reduce((a, b) => {
    const order = ["critical", "high", "medium", "info"];
    return order.indexOf(a.severity) <= order.indexOf(b.severity) ? a : b;
  });

  const Icon = ICONS[worst.severity];
  const cfg = SEVERITY_CONFIG[worst.severity];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 text-xs rounded px-1.5 py-0.5 border cursor-help ${cfg.color}`}>
            <Icon className="h-3 w-3" />
            {issues.length > 1 ? `${issues.length} issues` : worst.title}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            {issues.map(issue => (
              <div key={issue.id} className="text-xs">
                <div className="font-medium">{SEVERITY_CONFIG[issue.severity].icon} {issue.title}</div>
                <p className="opacity-80">{issue.explanation}</p>
                <p className="opacity-70 font-medium mt-0.5">{SEVERITY_CONFIG[issue.severity].message}</p>
                <p className="opacity-60 mt-0.5">Fix: {issue.howToFix}</p>
              </div>
            ))}
            {onAskAI && (
              <button
                className="text-xs text-primary underline"
                onClick={() => onAskAI(`Why is the field flagged: ${worst.title}`)}
              >
                Ask AI to explain
              </button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
