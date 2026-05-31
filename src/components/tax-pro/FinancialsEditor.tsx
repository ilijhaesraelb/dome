/**
 * FinancialsEditor — professional-grade editor for a single generated
 * financial statement (P&L or Balance Sheet).
 *
 * Capabilities:
 *  - Inspect every line as a structured table (no raw JSON for reviewers)
 *  - Edit amount or category mapping inline
 *  - Add new lines (e.g. an unmapped expense category)
 *  - Remove lines flagged as duplicates
 *  - Recalculate totals client-side
 *  - Save back to `tax_financial_statements.statement_data_json`
 *  - Trigger "regenerate" lifecycle event for downstream re-build
 *  - Export the statement package (writes a `tax_exports` row)
 *
 * Data shape (statement_data_json) — backwards-compatible:
 *   {
 *     "lines": [
 *       { "category": "revenue.program",    "label": "Program Service Revenue", "amount": 12345.00, "source": "csv:bookkeeping_2024.csv" },
 *       { "category": "expense.salaries",   "label": "Salaries & Wages",        "amount":  4500.00 }
 *     ],
 *     "totals": { "revenue": 12345.00, "expense": 4500.00, "net": 7845.00 }
 *   }
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Save, Trash2, RefreshCcw, Download, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { recordLifecycleEvent } from "@/lib/tax-pro/lifecycle";
import FinancialsCsvImport, { type ImportedLine } from "@/components/tax-pro/FinancialsCsvImport";

/* ------------------------------------------------------------------ */
/* Category catalog                                                    */
/* ------------------------------------------------------------------ */

const PL_CATEGORIES = [
  // Revenue
  { value: "revenue.program",        label: "Revenue · Program Service",  side: "revenue" as const },
  { value: "revenue.contributions",  label: "Revenue · Contributions",    side: "revenue" as const },
  { value: "revenue.grants",         label: "Revenue · Grants",           side: "revenue" as const },
  { value: "revenue.investment",     label: "Revenue · Investment",       side: "revenue" as const },
  { value: "revenue.other",          label: "Revenue · Other",            side: "revenue" as const },
  // Expenses
  { value: "expense.salaries",       label: "Expense · Salaries & Wages", side: "expense" as const },
  { value: "expense.benefits",       label: "Expense · Benefits & Payroll Taxes", side: "expense" as const },
  { value: "expense.rent",           label: "Expense · Rent / Occupancy", side: "expense" as const },
  { value: "expense.utilities",      label: "Expense · Utilities",        side: "expense" as const },
  { value: "expense.supplies",       label: "Expense · Office Supplies",  side: "expense" as const },
  { value: "expense.professional",   label: "Expense · Professional Fees", side: "expense" as const },
  { value: "expense.travel",         label: "Expense · Travel",           side: "expense" as const },
  { value: "expense.depreciation",   label: "Expense · Depreciation",     side: "expense" as const },
  { value: "expense.other",          label: "Expense · Other",            side: "expense" as const },
];

const BS_CATEGORIES = [
  { value: "asset.cash",             label: "Asset · Cash & Equivalents", side: "asset" as const },
  { value: "asset.receivable",       label: "Asset · Accounts Receivable", side: "asset" as const },
  { value: "asset.inventory",        label: "Asset · Inventory",          side: "asset" as const },
  { value: "asset.fixed",            label: "Asset · Fixed Assets",       side: "asset" as const },
  { value: "asset.other",            label: "Asset · Other",              side: "asset" as const },
  { value: "liability.payable",      label: "Liability · Accounts Payable", side: "liability" as const },
  { value: "liability.loans",        label: "Liability · Loans / Notes",   side: "liability" as const },
  { value: "liability.other",        label: "Liability · Other",          side: "liability" as const },
  { value: "equity.retained",        label: "Equity · Retained Earnings", side: "equity" as const },
  { value: "equity.contributed",     label: "Equity · Contributed Capital", side: "equity" as const },
  { value: "equity.net_assets",      label: "Net Assets",                  side: "equity" as const },
];

interface Line {
  category: string;
  label: string;
  amount: number;
  source?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  statement: any;
  caps: any;
  onSaved?: () => void;
}

/* ------------------------------------------------------------------ */

export const FinancialsEditor = ({ open, onClose, statement, caps, onSaved }: Props) => {
  const isBalanceSheet = String(statement?.statement_type ?? "").includes("balance");
  const catalog = isBalanceSheet ? BS_CATEGORIES : PL_CATEGORIES;

  const [lines, setLines] = useState<Line[]>([]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Load lines when dialog opens or statement changes.
  useEffect(() => {
    if (!open) return;
    const data = statement?.statement_data_json ?? {};
    const initial: Line[] = Array.isArray(data.lines) ? data.lines : [];
    setLines(
      initial.map((l) => ({
        category: String(l.category ?? "expense.other"),
        label: String(l.label ?? ""),
        amount: Number(l.amount ?? 0),
        source: l.source ?? null,
      })),
    );
  }, [open, statement?.id]);

  /* -------- derived totals -------- */
  const totals = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const l of lines) {
      const side = l.category.split(".")[0];
      acc[side] = (acc[side] ?? 0) + (Number.isFinite(l.amount) ? l.amount : 0);
    }
    if (!isBalanceSheet) {
      acc.net = (acc.revenue ?? 0) - (acc.expense ?? 0);
    } else {
      acc.balance_check = (acc.asset ?? 0) - ((acc.liability ?? 0) + (acc.equity ?? 0));
    }
    return acc;
  }, [lines, isBalanceSheet]);

  /* -------- mutations -------- */
  const updateLine = (idx: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const removeLine = (idx: number) => setLines((ls) => ls.filter((_, i) => i !== idx));
  const addLine = () =>
    setLines((ls) => [
      ...ls,
      { category: catalog[0].value, label: "New line", amount: 0, source: "manual" },
    ]);

  const handleCsvImport = (imported: ImportedLine[]) => {
    // Merge rather than replace — pros usually layer CSVs on top.
    setLines((ls) => [...ls, ...imported.map((l) => ({ ...l }))]);
  };

  /* -------- persistence -------- */
  const save = async () => {
    if (!caps?.canReview) return toast.error("You don't have permission to edit financial statements.");
    setSaving(true);
    const payload = { lines, totals };
    const { error } = await supabase
      .from("tax_financial_statements")
      .update({ statement_data_json: payload as any, status: "edited" })
      .eq("id", statement.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await recordLifecycleEvent(statement.tax_file_id, "financial_statement_edited", {
      statement_id: statement.id,
      statement_type: statement.statement_type,
      line_count: lines.length,
    });
    toast.success("Financial statement saved");
    onSaved?.();
  };

  const regenerate = async () => {
    if (!caps?.canReview) return;
    setRegenerating(true);
    const { error } = await supabase
      .from("tax_financial_statements")
      .update({ status: "regenerating" })
      .eq("id", statement.id);
    setRegenerating(false);
    if (error) return toast.error(error.message);
    await recordLifecycleEvent(statement.tax_file_id, "financial_statement_regenerate_requested", {
      statement_id: statement.id,
    });
    toast.success("Regeneration queued — backend will rebuild from latest source data.");
    onSaved?.();
  };

  const exportPackage = async () => {
    if (!caps?.canExport) return toast.error("You don't have export permission.");
    setExporting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("tax_exports").insert({
      tax_file_id: statement.tax_file_id,
      export_type: "financial_statement",
      included_forms_json: { statement_type: statement.statement_type, year: statement.statement_year } as any,
      included_documents_json: { source: "financials-editor" } as any,
      export_status: "queued",
      created_by: user?.id ?? null,
    } as any);
    setExporting(false);
    if (error) return toast.error(error.message);
    await recordLifecycleEvent(statement.tax_file_id, "financial_statement_export_queued", {
      statement_id: statement.id,
    });
    toast.success("Statement package export queued");
  };

  /* -------- render -------- */
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="capitalize">{String(statement?.statement_type ?? "").replace(/_/g, " ")}</span>
            <Badge variant="outline">{statement?.statement_year}</Badge>
            <Badge variant="secondary" className="capitalize">{statement?.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
          {caps?.canReview && (
            <Button size="sm" variant="outline" onClick={addLine}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add line
            </Button>
          )}
          {caps?.canReview && (
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet className="mr-1 h-3.5 w-3.5" /> Import CSV
            </Button>
          )}
          {caps?.canReview && (
            <Button size="sm" variant="outline" onClick={regenerate} disabled={regenerating}>
              {regenerating ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="mr-1 h-3.5 w-3.5" />}
              Regenerate
            </Button>
          )}
          {caps?.canExport && (
            <Button size="sm" variant="outline" onClick={exportPackage} disabled={exporting}>
              {exporting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1 h-3.5 w-3.5" />}
              Export package
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="max-h-[55vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-2 py-2 text-left">Category</th>
                <th className="px-2 py-2 text-left">Label</th>
                <th className="px-2 py-2 text-right">Amount</th>
                <th className="px-2 py-2 text-left">Source</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No lines yet. Add one or regenerate.</td></tr>
              )}
              {lines.map((l, i) => (
                <tr key={i} className="border-t border-border/50">
                  <td className="px-2 py-1.5">
                    <Select
                      value={l.category}
                      onValueChange={(v) => updateLine(i, { category: v })}
                      disabled={!caps?.canReview}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {catalog.map((c) => (
                          <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      value={l.label}
                      onChange={(e) => updateLine(i, { label: e.target.value })}
                      disabled={!caps?.canReview}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <Input
                      type="number"
                      step="0.01"
                      value={Number.isFinite(l.amount) ? l.amount : 0}
                      onChange={(e) => updateLine(i, { amount: parseFloat(e.target.value) || 0 })}
                      disabled={!caps?.canReview}
                      className="h-8 text-right text-xs"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-[11px] text-muted-foreground">{l.source ?? "—"}</td>
                  <td className="px-2 py-1.5">
                    {caps?.canReview && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeLine(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm md:grid-cols-4">
          {Object.entries(totals).map(([k, v]) => (
            <div key={k} className="rounded-md border border-border bg-muted/30 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">{k.replace(/_/g, " ")}</p>
              <p className="font-semibold">${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {caps?.canReview && (
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
              Save
            </Button>
          )}
        </DialogFooter>

        <FinancialsCsvImport
          open={importOpen}
          onClose={() => setImportOpen(false)}
          catalog={catalog}
          onImport={handleCsvImport}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FinancialsEditor;