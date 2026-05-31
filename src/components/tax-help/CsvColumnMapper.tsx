/**
 * CsvColumnMapper — UI to map spreadsheet/CSV columns onto tax categories.
 *
 * Flow:
 *   1. User pastes/uploads CSV (or just headers + sample rows).
 *   2. We call `tax-csv-suggest-mapping` for AI suggestions.
 *   3. User confirms/edits column → category mapping.
 *   4. User can save the mapping as a template (csv_mapping_templates) for next year.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Save } from "lucide-react";

interface Props {
  filingType: string;
  userId: string;
  onSaved?: (templateId: string) => void;
}

function parseCsv(input: string): { headers: string[]; rows: string[][] } {
  const lines = input.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const split = (line: string) => line.split(",").map(c => c.trim().replace(/^"(.*)"$/, "$1"));
  return { headers: split(lines[0]), rows: lines.slice(1).map(split) };
}

export default function CsvColumnMapper({ filingType, userId, onSaved }: Props) {
  const [csvText, setCsvText] = useState("");
  const [templateName, setTemplateName] = useState("My bookkeeping export");
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [confidenceMap, setConfidenceMap] = useState<Record<string, number>>({});
  const [allowed, setAllowed] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAnalyze = async () => {
    const { headers: h, rows } = parseCsv(csvText);
    if (h.length === 0) {
      toast({ title: "No CSV detected", description: "Paste at least one header row.", variant: "destructive" });
      return;
    }
    setHeaders(h);
    setSampleRows(rows.slice(0, 8));
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("tax-csv-suggest-mapping", {
        body: { headers: h, sampleRows: rows.slice(0, 8), filingType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setColumnMap(data.column_map || {});
      setConfidenceMap(data.column_confidence || {});
      setAllowed(data.allowed_categories || []);
      toast({ title: "Mapping suggested", description: `Review and edit before saving.` });
    } catch (e: any) {
      toast({ title: "Suggestion failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("csv_mapping_templates")
        .insert({
          user_id: userId,
          filing_type: filingType,
          template_name: templateName,
          column_map: columnMap,
          category_rules: [],
        })
        .select()
        .single();
      if (error) throw error;
      toast({ title: "Template saved", description: "You can reuse it next year." });
      onSaved?.(data.id);
    } catch (e: any) {
      toast({ title: "Could not save", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Spreadsheet column mapping</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="csv-input">Paste CSV (header row + first few rows)</Label>
          <Textarea
            id="csv-input"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Date,Description,Amount,Category&#10;2025-01-12,Stripe payout,1240.00,Revenue"
            className="font-mono text-xs min-h-[120px]"
          />
        </div>
        <Button onClick={handleAnalyze} disabled={loading || !csvText.trim()}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Suggest mapping
        </Button>

        {headers.length > 0 && allowed.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="text-sm font-medium">Mapping ({headers.length} columns)</div>
            <div className="rounded-md border divide-y">
              {headers.map((h) => (
                <div key={h} className="grid grid-cols-12 items-center gap-2 px-3 py-2">
                  <div className="col-span-5 truncate text-sm" title={h}>{h}</div>
                  <div className="col-span-5">
                    <Select
                      value={columnMap[h] ?? "ignore"}
                      onValueChange={(v) => setColumnMap(prev => ({ ...prev, [h]: v }))}
                    >
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {allowed.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground text-right">
                    {confidenceMap[h] != null ? `${Math.round(confidenceMap[h])}%` : "—"}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name"
                className="max-w-xs"
              />
              <Button onClick={handleSaveTemplate} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save as template
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
