/**
 * Screen 4+5 — Document Upload + AI Analysis
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, FileText, Bot, CheckCircle2, AlertTriangle, ArrowRight,
  Loader2, Trash2, Sparkles, Clock,
} from "lucide-react";
import TaxFlowLayout from "@/components/tax-help/TaxFlowLayout";

const DOC_CATEGORIES = [
  { value: "w2", label: "W-2 (Wage Statement)" },
  { value: "1099_nec", label: "1099-NEC" }, { value: "1099_misc", label: "1099-MISC" },
  { value: "1099_int", label: "1099-INT" }, { value: "1099_div", label: "1099-DIV" },
  { value: "1099_k", label: "1099-K" }, { value: "1099_r", label: "1099-R" },
  { value: "1099_g", label: "1099-G" },
  { value: "prior_1040", label: "Prior Year 1040" },
  { value: "prior_1120", label: "Prior Year 1120 / 1120-S" },
  { value: "prior_1065", label: "Prior Year 1065" },
  { value: "prior_990", label: "Prior Year 990 / 990-EZ / 990-N" },
  { value: "schedule_k1", label: "Schedule K-1" },
  { value: "irs_notice", label: "IRS Notice / Letter" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "bookkeeping_export", label: "Bookkeeping Export" },
  { value: "excel_csv", label: "Excel / CSV" },
  { value: "profit_loss", label: "Profit & Loss" },
  { value: "balance_sheet", label: "Balance Sheet" },
  { value: "payroll_report", label: "Payroll Report" },
  { value: "expense_report", label: "Expense Report" },
  { value: "revenue_report", label: "Revenue Report" },
  { value: "other", label: "Other" },
];

const TaxDocumentUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const taxFileId = searchParams.get("file");
  const [docs, setDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("other");
  const [taxYear, setTaxYear] = useState(String(new Date().getFullYear() - 1));
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!taxFileId) return;
    (async () => {
      const { data } = await supabase.from("tax_file_documents")
        .select("id, name, category, file_type, file_size, extraction_status, ai_classification, created_at")
        .eq("tax_file_id", taxFileId).order("created_at", { ascending: false });
      setDocs((data as any[]) || []);
    })();
  }, [taxFileId]);

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files?.length || !user || !taxFileId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = `tax/${user.id}/${taxFileId}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("case-documents").upload(path, file);
        if (uploadErr) { toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" }); continue; }
        const { data: doc, error: insertErr } = await supabase.from("tax_file_documents").insert({
          tax_file_id: taxFileId, uploaded_by: user.id, name: file.name, category: selectedCategory,
          file_path: path, file_type: file.type, file_size: file.size,
          tax_year: parseInt(taxYear), extraction_status: "pending",
        } as any).select("id, name, category, file_type, file_size, extraction_status, ai_classification, created_at").single();
        if (insertErr) { toast({ title: "Failed to save document", description: insertErr.message, variant: "destructive" }); continue; }
        if (doc) setDocs(prev => [doc as any, ...prev]);
      }
      toast({ title: `${files.length} document(s) uploaded` });
    } catch (err: any) {
      toast({ title: "Upload error", description: err.message, variant: "destructive" });
    } finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }, [user, taxFileId, selectedCategory, taxYear, toast]);

  const runAnalysis = async () => {
    if (!taxFileId || docs.length === 0) return;
    setAnalyzing(true);
    try {
      const resp = await supabase.functions.invoke("tax-document-analysis", {
        body: { taxFileId, documentIds: docs.map(d => d.id) },
      });
      if (resp.error) throw resp.error;
      setAnalysisResult(resp.data);
      const { data } = await supabase.from("tax_file_documents")
        .select("id, name, category, file_type, file_size, extraction_status, ai_classification, created_at")
        .eq("tax_file_id", taxFileId).order("created_at", { ascending: false });
      setDocs((data as any[]) || []);
      toast({ title: "Analysis complete" });
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    } finally { setAnalyzing(false); }
  };

  const removeDoc = async (docId: string) => {
    await supabase.from("tax_file_documents").delete().eq("id", docId);
    setDocs(prev => prev.filter(d => d.id !== docId));
  };

  if (!taxFileId) {
    return (
      <TaxFlowLayout currentStep={3} title="Upload Documents" hideStepNav>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
          <h1 className="text-2xl font-bold">Upload Tax Documents</h1>
          <p className="text-muted-foreground">To upload documents, start a tax filing first.</p>
          <Button onClick={() => navigate("/tax/start")} className="gap-2">Start New Filing <ArrowRight className="w-4 h-4" /></Button>
        </div>
      </TaxFlowLayout>
    );
  }

  return (
    <TaxFlowLayout
      currentStep={3}
      title="Upload Documents"
      taxFileId={taxFileId}
      onNext={() => {
        if (analysisResult) navigate(`/tax/file/${taxFileId}/recommendation`);
        else if (docs.length > 0) runAnalysis();
        else toast({ title: "Upload at least one document first" });
      }}
      nextLabel={analysisResult ? "Continue to Recommendation" : docs.length > 0 ? "Run AI Analysis" : "Upload Documents First"}
      nextDisabled={docs.length === 0 && !analysisResult}
    >
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">Upload Your Tax Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">Upload W-2s, 1099s, prior returns, spreadsheets. AI will analyze them.</p>
        </div>

        {/* Upload Area */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Document Type</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DOC_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tax Year</Label>
                <Select value={taxYear} onValueChange={setTaxYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[0, 1, 2, 3].map(o => { const y = String(new Date().getFullYear() - 1 - o); return <SelectItem key={y} value={y}>{y}</SelectItem>; })}</SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.doc,.docx" className="hidden" onChange={e => handleUpload(e.target.files)} />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full gap-2">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? "Uploading…" : "Choose Files"}
                </Button>
              </div>
            </div>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("border-primary"); }}
              onDragLeave={e => e.currentTarget.classList.remove("border-primary")}
              onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("border-primary"); handleUpload(e.dataTransfer.files); }}
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Drag & drop files here, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, images, Excel, CSV, Word accepted</p>
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Documents */}
        {docs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Uploaded ({docs.length})</span>
                <Button size="sm" onClick={runAnalysis} disabled={analyzing} className="gap-2">
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {analyzing ? "Analyzing…" : "Run AI Analysis"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {docs.map(d => (
                  <div key={d.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{d.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{d.category?.replace(/_/g, " ")}</span>
                          {d.file_size && <span>· {(d.file_size / 1024).toFixed(0)} KB</span>}
                          {d.ai_classification && <Badge variant="secondary" className="text-[10px]"><Bot className="w-3 h-3 mr-0.5" /> {d.ai_classification}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {d.extraction_status === "complete" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                      {d.extraction_status === "pending" && <Clock className="w-4 h-4 text-amber-500" />}
                      {d.extraction_status === "error" && <AlertTriangle className="w-4 h-4 text-destructive" />}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeDoc(d.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis Result */}
        {analysisResult && (
          <Card className="border-primary/30">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bot className="w-5 h-5 text-primary" /> AI Analysis Results</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {analysisResult.recommendation && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="font-semibold text-sm mb-1">Recommended Filing Path</p>
                  <p className="text-sm capitalize">{analysisResult.recommendation.filing_type?.replace(/_/g, " ")}</p>
                  {analysisResult.recommendation.confidence && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Confidence</span><span>{Math.round(analysisResult.recommendation.confidence)}%</span>
                      </div>
                      <Progress value={analysisResult.recommendation.confidence} className="h-2" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{analysisResult.recommendation.explanation}</p>
                </div>
              )}
              {analysisResult.warnings?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-semibold flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-amber-500" /> Warnings</p>
                  {analysisResult.warnings.map((w: string, i: number) => <p key={i} className="text-xs text-muted-foreground pl-5">• {w}</p>)}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </TaxFlowLayout>
  );
};

export default TaxDocumentUpload;
