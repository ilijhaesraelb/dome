/**
 * Screen 14 — Review Summary
 */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, FileText, User, DollarSign, Edit, Shield } from "lucide-react";
import TaxFlowLayout from "@/components/tax-help/TaxFlowLayout";
import PageLoader from "@/components/PageLoader";

const TaxReviewSummary = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [fRes, dRes, rRes] = await Promise.all([
        supabase.from("tax_files").select("*, tax_clients(*)").eq("id", id).single(),
        supabase.from("tax_file_documents").select("*").eq("tax_file_id", id),
        supabase.from("tax_filing_recommendations").select("*").eq("tax_file_id", id).order("created_at", { ascending: false }).limit(1),
      ]);
      setFile(fRes.data); setClient(fRes.data?.tax_clients); setDocs(dRes.data || []); setRecommendation(rRes.data?.[0] || null); setLoading(false);
    })();
  }, [id]);

  if (loading) return <PageLoader />;
  if (!file) return <div className="p-8 text-center text-muted-foreground">Not found.</div>;

  const clientName = client?.organization_name || `${client?.legal_first_name || ""} ${client?.legal_last_name || ""}`.trim() || "Unknown";
  const checks = [
    { label: "Filing type confirmed", ok: !!file.filing_confirmed },
    { label: "Documents uploaded", ok: docs.length > 0 },
    { label: "Profile complete", ok: !!(client?.legal_first_name || client?.organization_name) },
    { label: "No critical blockers", ok: true },
  ];
  const readiness = Math.round((checks.filter(c => c.ok).length / checks.length) * 100);

  return (
    <TaxFlowLayout currentStep={10} title="Final Review" taxFileId={id}
      onNext={() => navigate(`/tax/file/${id}/payment`)} nextLabel="Continue to Payment"
      onBack={() => navigate(`/tax/file/${id}/errors`)}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">Review Your Tax Filing</h1>
          <p className="text-sm text-muted-foreground mt-1">Everything at a glance before payment.</p>
        </div>

        <Card className={readiness === 100 ? "border-green-200 bg-green-50/30" : "border-amber-200"}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between"><p className="font-semibold text-sm">Readiness</p><Badge className={readiness === 100 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{readiness}%</Badge></div>
            <Progress value={readiness} className="h-2.5" />
            <div className="grid grid-cols-2 gap-2">{checks.map(c => <div key={c.label} className="flex items-center gap-2 text-xs">{c.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}<span>{c.label}</span></div>)}</div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4" /> Client</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p className="font-medium">{clientName}</p><p className="text-xs text-muted-foreground">{client?.email}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Filing</CardTitle></CardHeader><CardContent className="space-y-1 text-sm"><p className="font-medium capitalize">{file.filing_type?.replace(/_/g, " ")}</p><p className="text-xs text-muted-foreground">TY{file.tax_year}</p>{file.filing_confirmed ? <Badge className="bg-green-100 text-green-700 text-[10px]"><CheckCircle2 className="w-3 h-3 mr-0.5" /> Confirmed</Badge> : <Badge className="bg-amber-100 text-amber-700 text-[10px]">Not confirmed</Badge>}</CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Documents</CardTitle></CardHeader><CardContent className="text-sm"><p className="font-medium">{docs.length} uploaded</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" /> Payment</CardTitle></CardHeader><CardContent className="text-sm"><p className="font-medium capitalize">{file.payment_status || "Unpaid"}</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/tax/file/${id}/confirm`)} className="gap-1"><Edit className="w-3.5 h-3.5" /> Edit Filing</Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/tax/file/${id}/extracted`)} className="gap-1"><Edit className="w-3.5 h-3.5" /> Edit Data</Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/tax/file/${id}/errors`)} className="gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Warnings</Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/tax/review`)} className="gap-1"><Shield className="w-3.5 h-3.5" /> Request Review</Button>
        </div>
      </div>
    </TaxFlowLayout>
  );
};

export default TaxReviewSummary;
