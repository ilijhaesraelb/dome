/**
 * Screen 8 — Extracted Data Review
 */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, AlertTriangle, Eye, Bot, ArrowRight } from "lucide-react";
import TaxFlowLayout from "@/components/tax-help/TaxFlowLayout";
import PageLoader from "@/components/PageLoader";

interface ExtractedField {
  id: string; field_key: string; field_label: string; extracted_value: string;
  confirmed_value: string; source_document: string; confidence: number;
  status: "accepted" | "edited" | "rejected" | "needs_review";
}

const TaxExtractedDataReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<ExtractedField[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [fRes, dRes] = await Promise.all([
        supabase.from("tax_files").select("*, tax_clients(*)").eq("id", id).single(),
        supabase.from("tax_file_documents").select("*").eq("tax_file_id", id),
      ]);
      setFile(fRes.data);
      const extracted: ExtractedField[] = [];
      const c = fRes.data?.tax_clients;
      if (c) {
        const add = (key: string, label: string, val: string) => {
          if (val) extracted.push({ id: key, field_key: key, field_label: label, extracted_value: val, confirmed_value: val, source_document: "Profile", confidence: 100, status: "accepted" });
        };
        add("legal_name", "Legal Name", `${c.legal_first_name || ""} ${c.legal_last_name || ""}`.trim());
        add("email", "Email", c.email || ""); add("ein", "EIN", c.ein_encrypted || "");
        add("org_name", "Organization", c.organization_name || "");
        add("address", "Address", [c.address_street, c.address_city, c.address_state, c.address_zip].filter(Boolean).join(", "));
        add("filing_status", "Filing Status", c.filing_status || "");
      }
      (dRes.data || []).forEach((d: any) => {
        if (d.ai_classification) extracted.push({
          id: `doc_${d.id}`, field_key: `doc_${d.category}`, field_label: `${d.ai_classification} (from ${d.name})`,
          extracted_value: d.ai_classification, confirmed_value: d.ai_classification,
          source_document: d.name, confidence: 85, status: "needs_review",
        });
      });
      setFields(extracted); setLoading(false);
    })();
  }, [id]);

  const updateField = (fid: string, val: string) => setFields(prev => prev.map(f => f.id === fid ? { ...f, confirmed_value: val, status: val !== f.extracted_value ? "edited" : "accepted" } : f));
  const setFieldStatus = (fid: string, status: ExtractedField["status"]) => setFields(prev => prev.map(f => f.id === fid ? { ...f, status } : f));

  const handleContinue = () => {
    const unreviewed = fields.filter(f => f.status === "needs_review");
    if (unreviewed.length > 0) { toast({ title: `${unreviewed.length} field(s) still need review`, variant: "destructive" }); return; }
    navigate(`/tax/file/${id}/spreadsheet`);
  };

  if (loading) return <PageLoader />;
  if (!file) return <div className="p-8 text-center text-muted-foreground">Tax file not found.</div>;

  const acceptedCount = fields.filter(f => f.status === "accepted" || f.status === "edited").length;

  return (
    <TaxFlowLayout
      currentStep={6}
      title="Review Extracted Data"
      taxFileId={id}
      onNext={handleContinue}
      nextLabel="Continue to Spreadsheet Mapping"
      nextDisabled={fields.length === 0}
      onBack={() => navigate(`/tax/file/${id}/confirm`)}
    >
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">Confirm Your Data</h1>
          <p className="text-sm text-muted-foreground mt-1">Review values from your profile and documents.</p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{acceptedCount}/{fields.length} confirmed</span>
          <Button variant="ghost" size="sm" onClick={() => setFields(prev => prev.map(f => ({ ...f, status: "accepted" })))}>Accept All</Button>
        </div>

        {fields.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No extracted data yet</p>
            <Button onClick={() => navigate(`/tax/documents/upload?file=${id}`)} className="mt-4 gap-2">Upload Documents <ArrowRight className="w-4 h-4" /></Button>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {fields.map(f => (
              <Card key={f.id} className={`transition ${f.status === "needs_review" ? "border-amber-300 bg-amber-50/30 dark:bg-amber-950/10" : f.status === "rejected" ? "border-destructive/30 opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{f.field_label}</p>
                        <Badge variant="outline" className="text-[10px]">{f.source_document}</Badge>
                        {f.confidence < 90 && <Badge variant="secondary" className="text-[10px]"><Bot className="w-3 h-3 mr-0.5" /> {f.confidence}%</Badge>}
                      </div>
                      <Input value={f.confirmed_value} onChange={e => updateField(f.id, e.target.value)} className="h-8 text-sm" disabled={f.status === "rejected"} />
                      {f.confirmed_value !== f.extracted_value && <p className="text-[11px] text-muted-foreground">Original: {f.extracted_value}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant={f.status === "accepted" || f.status === "edited" ? "default" : "outline"} className="h-7 w-7" onClick={() => setFieldStatus(f.id, "accepted")}><CheckCircle2 className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant={f.status === "needs_review" ? "secondary" : "outline"} className="h-7 w-7" onClick={() => setFieldStatus(f.id, "needs_review")}><AlertTriangle className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </TaxFlowLayout>
  );
};

export default TaxExtractedDataReview;
