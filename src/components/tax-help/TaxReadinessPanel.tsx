/**
 * TaxReadinessPanel — Global readiness + issues overview for tax workflows.
 */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle, CheckCircle2, XCircle, Info, Bot,
  ChevronRight, FileWarning, Shield,
} from "lucide-react";
import { type TaxIssue, type IssueSeverity, SEVERITY_CONFIG, getIssueSummary } from "@/lib/tax-error-engine";

interface Props {
  issues: TaxIssue[];
  readinessScore?: number;
  missingDocsCount?: number;
  onFixBlockers?: () => void;
  onAskAI?: (question: string) => void;
  onIssueClick?: (issue: TaxIssue) => void;
  onOverrideIssue?: (issue: TaxIssue, note: string) => void;
  showOverride?: boolean;
}

const SEVERITY_ICONS: Record<IssueSeverity, typeof AlertTriangle> = {
  critical: XCircle,
  high: AlertTriangle,
  medium: FileWarning,
  info: Info,
};

const SEVERITY_BADGE_VARIANT: Record<IssueSeverity, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  info: "outline",
};

export default function TaxReadinessPanel({
  issues, readinessScore = 0, missingDocsCount = 0,
  onFixBlockers, onAskAI, onIssueClick, onOverrideIssue, showOverride,
}: Props) {
  const summary = getIssueSummary(issues);
  const unresolved = issues.filter(i => !i.resolved);

  const scoreColor = readinessScore >= 90 ? "text-green-600" : readinessScore >= 70 ? "text-blue-600" : readinessScore >= 40 ? "text-amber-600" : "text-red-600";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          Tax Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${scoreColor}`}>{readinessScore}%</div>
            <div className="text-xs text-muted-foreground">Ready</div>
          </div>
          <div className="flex-1 space-y-1">
            <Progress value={readinessScore} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{summary.blockers} blocker{summary.blockers !== 1 ? "s" : ""}</span>
              <span>{summary.total} issue{summary.total !== 1 ? "s" : ""}</span>
              <span>{missingDocsCount} missing doc{missingDocsCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* Severity summary badges */}
        <div className="flex flex-wrap gap-2">
          {summary.critical > 0 && <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />{summary.critical} Critical</Badge>}
          {summary.high > 0 && <Badge variant="destructive" className="gap-1 bg-orange-600"><AlertTriangle className="h-3 w-3" />{summary.high} High</Badge>}
          {summary.medium > 0 && <Badge variant="secondary" className="gap-1"><FileWarning className="h-3 w-3" />{summary.medium} Medium</Badge>}
          {summary.info > 0 && <Badge variant="outline" className="gap-1"><Info className="h-3 w-3" />{summary.info} Info</Badge>}
          {summary.total === 0 && <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50"><CheckCircle2 className="h-3 w-3" />All clear</Badge>}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {summary.blockers > 0 && onFixBlockers && (
            <Button size="sm" variant="destructive" className="gap-1" onClick={onFixBlockers}>
              <XCircle className="h-3.5 w-3.5" /> Fix Blockers ({summary.blockers})
            </Button>
          )}
          {onAskAI && (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => onAskAI("Summarize all current issues and help me fix them.")}>
              <Bot className="h-3.5 w-3.5" /> Ask AI
            </Button>
          )}
        </div>

        {/* Issues list */}
        {unresolved.length > 0 && (
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {unresolved.map(issue => {
                const Icon = SEVERITY_ICONS[issue.severity];
                const cfg = SEVERITY_CONFIG[issue.severity];
                return (
                  <div
                    key={issue.id}
                    className={`rounded-md border p-2.5 cursor-pointer hover:shadow-sm transition-shadow ${cfg.color}`}
                    onClick={() => onIssueClick?.(issue)}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{issue.title}</span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        </div>
                        <p className="text-xs mt-0.5 opacity-80">{issue.explanation}</p>
                        <p className="text-[10px] mt-0.5 font-medium opacity-70">{cfg.message}</p>
                        <p className="text-xs mt-1 opacity-60">Fix: {issue.howToFix}</p>
                        {showOverride && onOverrideIssue && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] mt-1"
                            onClick={e => { e.stopPropagation(); onOverrideIssue(issue, "Reviewed and accepted"); }}
                          >
                            Override with note
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground italic border-t pt-2">
          AI guidance is provided to help organize and prepare your information. Tax returns and financial data should be reviewed for accuracy and compliance before submission.
        </p>
      </CardContent>
    </Card>
  );
}
