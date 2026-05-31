/**
 * FinancialsCsvImport — paste or upload P&L / Balance Sheet rows and map
 * them into the FinancialsEditor table.
 *
 * Accepts:
 *  - Pasted CSV / TSV text
 *  - .csv or .tsv file upload
 *
 * Expected columns (any order; header row required):
 *  - label  | description | account | name      → line label
 *  - amount | value       | total   | balance   → numeric amount
 *  - category | type      | bucket             → optional category hint
 *
 * Each parsed row is auto-mapped to the closest category in the supplied
 * catalog using keyword heuristics. Reviewers can override per-row before
 * importing.
 */
import { useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, ClipboardPaste, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface CategoryOption {
  value: string;
  label: string;
  side: string;
}

export interface ImportedLine {
  category: string;
  label: string;
  amount: number;
  source: string;
}

interface ParsedRow {
  label: string;
  amountRaw: string;
  amount: number;
  hint: string;
  category: string; // resolved category
}

interface Props {
  open: boolean;
  onClose: () => void;
  catalog: CategoryOption[];
  /** Called with the mapped rows the user confirmed. */
  onImport: (lines: ImportedLine[]) => void;
}

/* ------------------------------------------------------------------ */
/* CSV parsing                                                         */
/* ------------------------------------------------------------------ */

/** Minimal CSV/TSV splitter — handles quoted fields and commas/tabs. */
function splitDelimited(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim().length > 0);
  if (!lines.length) return [];
  const delim = lines[0].includes("\t") ? "\t" : ",";
  const out: string[][] = [];
  for (const raw of lines) {
    const cells: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (ch === '"' ) {
        if (inQuote && raw[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === delim && !inQuote) {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    out.push(cells.map((c) => c.trim()));
  }
  return out;
}

const LABEL_KEYS = ["label", "description", "account", "name", "line", "item"];
const AMOUNT_KEYS = ["amount", "value", "total", "balance", "debit", "credit", "net"];
const CATEGORY_KEYS = ["category", "type", "bucket", "class", "group"];

function findHeaderIndex(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  for (const c of candidates) {
    const idx = lower.findIndex((h) => h === c || h.includes(c));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  // Handle parentheses negatives: (1,234.50) → -1234.50
  const negative = /^\(.*\)$/.test(raw.trim());
  const cleaned = raw.replace(/[()$,\s]/g, "").replace(/^-/, "-");
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) return 0;
  return negative ? -Math.abs(n) : n;
}

/* ------------------------------------------------------------------ */
/* Category auto-mapping                                               */
/* ------------------------------------------------------------------ */

/** Keyword → category-value substring map. Order matters (first match wins). */
const KEYWORD_RULES: Array<{ kw: RegExp; match: string }> = [
  // P&L revenue
  { kw: /grant/i,                              match: "revenue.grants" },
  { kw: /donat|contribut|gift/i,               match: "revenue.contributions" },
  { kw: /interest|dividend|invest/i,           match: "revenue.investment" },
  { kw: /program|service revenue|fee income/i, match: "revenue.program" },
  { kw: /sales|revenue|income/i,               match: "revenue.other" },
  // P&L expenses
  { kw: /salar|wage|payroll(?! tax)/i,         match: "expense.salaries" },
  { kw: /benefit|payroll tax|insurance/i,      match: "expense.benefits" },
  { kw: /rent|lease|occupanc/i,                match: "expense.rent" },
  { kw: /utilit|electric|water|gas bill/i,     match: "expense.utilities" },
  { kw: /supplies|stationery|materials/i,      match: "expense.supplies" },
  { kw: /legal|accounting|professional|consult/i, match: "expense.professional" },
  { kw: /travel|mileage|airfare|lodging/i,     match: "expense.travel" },
  { kw: /depreciat|amortiz/i,                  match: "expense.depreciation" },
  // Balance sheet — assets
  { kw: /cash|checking|savings/i,              match: "asset.cash" },
  { kw: /receivable|a\/r/i,                    match: "asset.receivable" },
  { kw: /inventory|stock on hand/i,            match: "asset.inventory" },
  { kw: /equipment|furniture|building|land|fixed/i, match: "asset.fixed" },
  // Liabilities / equity
  { kw: /payable|a\/p/i,                       match: "liability.payable" },
  { kw: /loan|note payable|mortgage/i,         match: "liability.loans" },
  { kw: /retained earning/i,                   match: "equity.retained" },
  { kw: /contributed|paid-in|capital stock/i,  match: "equity.contributed" },
  { kw: /net asset|fund balance/i,             match: "equity.net_assets" },
];

function suggestCategory(
  label: string,
  hint: string,
  catalog: CategoryOption[],
  amount: number,
): string {
  const haystack = `${label} ${hint}`.trim();

  // 1) Exact value match against the catalog (when CSV already has a category col).
  if (hint) {
    const exact = catalog.find((c) => c.value.toLowerCase() === hint.toLowerCase());
    if (exact) return exact.value;
  }

  // 2) Keyword rules.
  for (const rule of KEYWORD_RULES) {
    if (rule.kw.test(haystack)) {
      const hit = catalog.find((c) => c.value === rule.match);
      if (hit) return hit.value;
    }
  }

  // 3) Fallback by sign: negative → expense bucket on a P&L; otherwise revenue/asset.
  const hasExpense = catalog.find((c) => c.value === "expense.other");
  const hasRevenue = catalog.find((c) => c.value === "revenue.other");
  const hasAsset = catalog.find((c) => c.value === "asset.other");
  if (amount < 0 && hasExpense) return hasExpense.value;
  if (hasRevenue) return hasRevenue.value;
  if (hasAsset) return hasAsset.value;
  return catalog[0]?.value ?? "";
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export const FinancialsCsvImport = ({ open, onClose, catalog, onImport }: Props) => {
  const [pasted, setPasted] = useState("");
  const [sourceName, setSourceName] = useState<string>("paste");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setPasted("");
    setRows([]);
    setSourceName("paste");
  };

  const parseInto = (text: string, label: string) => {
    const matrix = splitDelimited(text);
    if (matrix.length < 2) {
      toast.error("Need a header row plus at least one data row.");
      setRows([]);
      return;
    }
    const [headers, ...body] = matrix;
    const labelIdx = findHeaderIndex(headers, LABEL_KEYS);
    const amountIdx = findHeaderIndex(headers, AMOUNT_KEYS);
    const categoryIdx = findHeaderIndex(headers, CATEGORY_KEYS);

    if (labelIdx < 0 || amountIdx < 0) {
      toast.error(`Couldn't find required columns. Need a "label" and an "amount" header. Found: ${headers.join(", ") || "(none)"}`);
      setRows([]);
      return;
    }

    const parsed: ParsedRow[] = body
      .map((cells) => {
        const lab = (cells[labelIdx] ?? "").trim();
        const amtRaw = (cells[amountIdx] ?? "").trim();
        const hint = categoryIdx >= 0 ? (cells[categoryIdx] ?? "").trim() : "";
        if (!lab && !amtRaw) return null;
        const amount = parseAmount(amtRaw);
        return {
          label: lab || "(unlabeled)",
          amountRaw: amtRaw,
          amount,
          hint,
          category: suggestCategory(lab, hint, catalog, amount),
        } satisfies ParsedRow;
      })
      .filter((r): r is ParsedRow => r !== null);

    setRows(parsed);
    setSourceName(label);
    toast.success(`Parsed ${parsed.length} row${parsed.length === 1 ? "" : "s"} — review and import.`);
  };

  const onFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("File too large (max 5MB).");
    const text = await file.text();
    parseInto(text, file.name);
  };

  const updateRow = (i: number, patch: Partial<ParsedRow>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const totals = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of rows) {
      const side = r.category.split(".")[0] || "other";
      acc[side] = (acc[side] ?? 0) + (Number.isFinite(r.amount) ? r.amount : 0);
    }
    return acc;
  }, [rows]);

  const confirmImport = () => {
    if (!rows.length) return toast.error("Nothing to import.");
    const lines: ImportedLine[] = rows.map((r) => ({
      category: r.category,
      label: r.label,
      amount: r.amount,
      source: `csv:${sourceName}`,
    }));
    onImport(lines);
    toast.success(`Imported ${lines.length} line${lines.length === 1 ? "" : "s"} into the editor.`);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Import lines from CSV / TSV</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="paste" className="w-full">
          <TabsList>
            <TabsTrigger value="paste"><ClipboardPaste className="mr-1 h-3.5 w-3.5" /> Paste</TabsTrigger>
            <TabsTrigger value="upload"><Upload className="mr-1 h-3.5 w-3.5" /> Upload file</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Paste CSV or TSV with a header row. Required columns: <code>label</code> and <code>amount</code>.
              Optional: <code>category</code>.
            </p>
            <Textarea
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              rows={6}
              placeholder={"label,amount,category\nProgram Service Revenue,12345.00,revenue.program\nSalaries & Wages,(4500.00),expense.salaries"}
              className="font-mono text-xs"
            />
            <Button size="sm" variant="outline" onClick={() => parseInto(pasted, "paste")}>
              <ArrowRight className="mr-1 h-3.5 w-3.5" /> Parse
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-2">
            <p className="text-xs text-muted-foreground">Upload a .csv or .tsv export from your bookkeeping tool.</p>
            <Input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,text/csv,text/tab-separated-values,text/plain"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Preview & remap */}
        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Preview · {rows.length} row{rows.length === 1 ? "" : "s"} · source: {sourceName}
              </p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(totals).map(([k, v]) => (
                  <Badge key={k} variant="outline" className="text-[10px] capitalize">
                    {k}: ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="max-h-[40vh] overflow-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-[11px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 text-left">Label</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2 text-left">Mapped category</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="px-2 py-1.5">
                        <Input
                          value={r.label}
                          onChange={(e) => updateRow(i, { label: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <Input
                          type="number"
                          step="0.01"
                          value={Number.isFinite(r.amount) ? r.amount : 0}
                          onChange={(e) => updateRow(i, { amount: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-right text-xs"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Select value={r.category} onValueChange={(v) => updateRow(i, { category: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-72">
                            {catalog.map((c) => (
                              <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeRow(i)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={confirmImport} disabled={!rows.length}>
            Import {rows.length || ""} line{rows.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialsCsvImport;