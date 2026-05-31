/**
 * ExportVerificationPanel
 *
 * Runs sample data through every UFE-wired target form
 * (I-765, N-400, I-751, I-693) and surfaces any field that lands
 * outside its official widget rect. Read-only — designed for the
 * Review screen and admin tooling.
 */
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  verifyTargetForms,
  type VerificationReport,
  type VerificationField,
} from "@/lib/ufe/export-verification";
import FieldDrilldownDialog from "./FieldDrilldownDialog";

const STATUS_META: Record<
  VerificationField["status"],
  { label: string; icon: typeof CheckCircle2; cls: string }
> = {
  ok: { label: "OK", icon: CheckCircle2, cls: "text-success" },
  warning: { label: "Warn", icon: AlertTriangle, cls: "text-warning" },
  error: { label: "Fail", icon: XCircle, cls: "text-destructive" },
  unmapped: {
    label: "Unmapped",
    icon: CircleDashed,
    cls: "text-muted-foreground",
  },
};

const ExportVerificationPanel = () => {
  const reports = useMemo<VerificationReport[]>(() => verifyTargetForms(), []);
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showOnlyIssues, setShowOnlyIssues] = useState(true);
  const [drilldown, setDrilldown] = useState<
    { formCode: string; field: VerificationField } | null
  >(null);

  const totals = useMemo(
    () =>
      reports.reduce(
        (acc, r) => ({
          ok: acc.ok + r.okCount,
          warn: acc.warn + r.warningCount,
          err: acc.err + r.errorCount,
          unmapped: acc.unmapped + r.unmappedCount,
        }),
        { ok: 0, warn: 0, err: 0, unmapped: 0 },
      ),
    [reports],
  );

  return (
    <Card className="border-primary/20">
      <CardHeader className="py-3 px-5">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between text-left"
        >
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Export Verification Checklist
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] gap-1">
              <CheckCircle2 className="w-3 h-3 text-success" /> {totals.ok}
            </Badge>
            <Badge variant="outline" className="text-[10px] gap-1">
              <AlertTriangle className="w-3 h-3 text-warning" /> {totals.warn}
            </Badge>
            <Badge variant="outline" className="text-[10px] gap-1">
              <XCircle className="w-3 h-3 text-destructive" /> {totals.err}
            </Badge>
            {open ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>
        </button>
      </CardHeader>

      {open && (
        <CardContent className="px-5 pb-4 pt-0 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Sample answers are stamped through the same renderer used at
              export. Any field whose paint box escapes the official widget
              rect is flagged below.
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs shrink-0"
              onClick={() => setShowOnlyIssues(!showOnlyIssues)}
            >
              {showOnlyIssues ? "Show all fields" : "Only show issues"}
            </Button>
          </div>

          {reports.map((r) => {
            const isOpen = expanded[r.formCode] ?? false;
            const visible = showOnlyIssues
              ? r.fields.filter(
                  (f) => f.status === "warning" || f.status === "error",
                )
              : r.fields;
            return (
              <div
                key={r.formCode}
                className="border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpanded((e) => ({ ...e, [r.formCode]: !isOpen }))
                  }
                  className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 text-left"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                    {r.formCode}
                    <span className="text-muted-foreground font-normal">
                      ({r.mapped}/{r.totalQuestions} mapped)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="w-3 h-3 text-success" />
                      {r.okCount}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1",
                        r.warningCount > 0 && "border-warning/40",
                      )}
                    >
                      <AlertTriangle className="w-3 h-3 text-warning" />
                      {r.warningCount}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1",
                        r.errorCount > 0 && "border-destructive/40",
                      )}
                    >
                      <XCircle className="w-3 h-3 text-destructive" />
                      {r.errorCount}
                    </Badge>
                  </div>
                </button>

                {isOpen && (
                  <div className="divide-y">
                    {visible.length === 0 ? (
                      <div className="px-3 py-3 text-[11px] text-muted-foreground text-center">
                        No issues — all sample stamps land within widget bounds.
                      </div>
                    ) : (
                      visible.map((f) => {
                        const meta = STATUS_META[f.status];
                        const Icon = meta.icon;
                        return (
                          <button
                            key={f.key}
                            type="button"
                            onClick={() =>
                              setDrilldown({ formCode: r.formCode, field: f })
                            }
                            className="w-full px-3 py-2 grid grid-cols-12 gap-2 text-[11px] items-center text-left hover:bg-muted/40 transition-colors"
                          >
                            <div className="col-span-4 flex items-center gap-1.5 min-w-0">
                              <Icon
                                className={cn("w-3 h-3 shrink-0", meta.cls)}
                              />
                              <span className="truncate">{f.label}</span>
                            </div>
                            <div className="col-span-2 text-muted-foreground">
                              {f.page ? `Pg ${f.page}` : "—"}
                            </div>
                            <div className="col-span-3 font-mono text-[10px] text-muted-foreground truncate">
                              {f.widgetName ?? "—"}
                            </div>
                            <div className="col-span-3 text-[10px] text-muted-foreground">
                              {f.message}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {totals.err > 0 && (
            <div className="text-[11px] text-destructive bg-destructive/5 border border-destructive/20 rounded p-2">
              {totals.err} field{totals.err === 1 ? "" : "s"} would land outside
              the official widget on export. Adjust coordinates before
              releasing this form.
            </div>
          )}
        </CardContent>
      )}
      <FieldDrilldownDialog
        open={!!drilldown}
        onOpenChange={(v) => !v && setDrilldown(null)}
        formCode={drilldown?.formCode ?? null}
        field={drilldown?.field ?? null}
      />
    </Card>
  );
};

export default ExportVerificationPanel;