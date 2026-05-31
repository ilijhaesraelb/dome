/**
 * Screen 9 — Spreadsheet Mapping
 */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Table2, Save, FileSpreadsheet, Loader2, ArrowRight } from "lucide-react";
import TaxFlowLayout from "@/components/tax-help/TaxFlowLayout";
import PageLoader from "@/components/PageLoader";

const COLUMN_ROLES = [
  { value: "ignore", label: "Ignore" }, { value: "date", label: "Date" },
  { value: "description", label: "Description" }, { value: "amount", label: "Amount" },
  { value: "debit", label: "Debit" }, { value: "credit", label: "Credit" },
  { value: "category", label: "Category" }, { value: "account", label: "Account" },
  { value: "revenue", label: "Revenue" }, { value: "expense", label: "Expense" },
  { value: "tax_amount", label: "Tax Amount" }, { value: "payee", label: "Payee" },
  { value: "reference", label: "Reference" },
];

const TaxSpreadsheetMapping = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [spreadsheetDocs, setSpreadsheetDocs] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [columns, setColumns] = useState<{ index: number; header: string; role: string; sample: string }[]>([]);
  const [saveTemplate, setSaveTemplate] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("tax_file_documents").select("*").eq("tax_file_id", id)
        .in("category", ["excel_csv", "bookkeeping_export", "profit_loss", "balance_sheet", "expense_report", "revenue_report", "payroll_report"]);
      setSpreadsheetDocs(data || []);
      if (data?.length) {
        setSelectedDoc(data[0].id);
        setColumns([
          { index: 0, header: "Date", role: "date", sample: "01/15/2025" },
          { index: 1, header: "Description", role: "description", sample: "Office Supplies" },
          { index: 2, header: "Amount", role: "amount", sample: "$234.50" },
          { index: 3, header: "Category", role: "category", sample: "Supplies" },
          { index: 4, header: "Account", role: "account", sample: "Checking" },
        ]);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const mapping = columns.reduce((acc, c) => ({ ...acc, [c.header]: c.role }), {});
      await supabase.from("tax_spreadsheet_mappings").upsert({ tax_file_id: id, document_id: selectedDoc, column_mapping: mapping, is_template: saveTemplate } as any, { onConflict: "tax_file_id,document_id" as any });
      toast({ title: "Mapping saved!" });
      navigate(`/tax/file/${id}/errors`);
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;

  return (
    <TaxFlowLayout
      currentStep={7}
      title="Spreadsheet Mapping"
      taxFileId={id}
      onNext={spreadsheetDocs.length > 0 ? handleSave : () => navigate(`/tax/file/${id}/errors`)}
      nextLabel={spreadsheetDocs.length > 0 ? (saving ? "Saving…" : "Save & Continue") : "Skip to Error Review"}
      nextDisabled={saving}
      onBack={() => navigate(`/tax/file/${id}/extracted`)}
    >
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">Map Your Spreadsheet Columns</h1>
          <p className="text-sm text-muted-foreground mt-1">Tell us what each column represents.</p>
        </div>

        {spreadsheetDocs.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No spreadsheet uploads found</p>
            <p className="text-xs mt-1">Upload Excel or CSV files, or skip this step.</p>
          </CardContent></Card>
        ) : (
          <>
            {spreadsheetDocs.length > 1 && (
              <Select value={selectedDoc} onValueChange={setSelectedDoc}>
                <SelectTrigger><SelectValue placeholder="Select spreadsheet…" /></SelectTrigger>
                <SelectContent>{spreadsheetDocs.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Table2 className="w-4 h-4" /> Column Mapping</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {columns.map(col => (
                  <div key={col.index} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="flex-1"><p className="text-sm font-medium">{col.header}</p><p className="text-xs text-muted-foreground">Sample: {col.sample}</p></div>
                    <Select value={col.role} onValueChange={v => setColumns(prev => prev.map(c => c.index === col.index ? { ...c, role: v } : c))}>
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>{COLUMN_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card><CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Save as mapping template?</p><p className="text-xs text-muted-foreground">Reuse next year</p></div>
                <Switch checked={saveTemplate} onCheckedChange={setSaveTemplate} />
              </div>
            </CardContent></Card>
          </>
        )}
      </div>
    </TaxFlowLayout>
  );
};

export default TaxSpreadsheetMapping;
