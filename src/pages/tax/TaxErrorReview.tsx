/**
 * Screen 12 — Error / Warning Review
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import TaxFlowLayout from "@/components/tax-help/TaxFlowLayout";
import PageLoader from "@/components/PageLoader";

const SEV = {
  blocker: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/30", label: "Blocker" },
  high: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/20", label: "High" },
  medium: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/20", label: "Medium" },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/20", label: "Info" },
};

const TaxErrorReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [fRes, dRes] = await Promise.all([
        supabase.from("tax_files").select("*, tax_clients(*)").eq("id", id).single(),
        supabase.from("tax_file_documents").select("*").eq("tax_file_id", id),
      ]);
      setFile(fRes.data); setClient(fRes.data?.tax_clients); setDocs(dRes.data || []); setLoading(false);
    })();
  }, [id]);

  const warnings = useMemo(() => {
    if (!file || !client) return [];
    const w: any[] = [];
    if (!client.legal_first_name && !client.organization_name) w.push({ id: "name", severity: "blocker", title: "Missing name", description: "Legal name required.", howToFix: "Update Tax Profile." });
    if (!client.ein_encrypted && file.filing_type !== "individual") w.push({ id: "ein", severity: "blocker", title: "Missing EIN", description: "EIN required for business/nonprofit.", howToFix: "Update Tax Profile." });
    if (docs.length === 0) w.push({ id: "docs", severity: "high", title: "No documents", description: "Upload source documents.", howToFix: "Go to Upload step." });
    if (!file.filing_confirmed) w.push({ id: "unconfirmed", severity: "blocker", title: "Filing type not confirmed", description: "Confirm before preparation.", howToFix: "Go to Confirm Filing step." });
    if (!client.address_street) w.push({ id: "addr", severity: "medium", title: "Missing address", description: "Address needed for most returns.", howToFix: "Update Tax Profile." });
    w.push({ id: "tip", severity: "info", title: "Review all values", description: "Double-check names and amounts.", howToFix: "Use Extracted Data Review." });
    return w;
  }, [file, client, docs]);

  if (loading) return <PageLoader />;
  if (!file) return <div className="p-8 text-center text-muted-foreground">Not found.</div>;

  const blockers = warnings.filter((w: any) => w.severity === "blocker");

  return (
    <TaxFlowLayout currentStep={9} title="Error Review" taxFileId={id}
      onNext={() => navigate(`/tax/file/${id}/review`)} nextLabel={blockers.length ? "Fix Blockers First" : "Continue to Review"}
      nextDisabled={blockers.length > 0} onBack={() => navigate(`/tax/file/${id}/spreadsheet`)}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">Review Issues</h1>
          <p className="text-sm text-muted-foreground mt-1">Fix blockers before continuing.</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {(["blocker", "high", "medium", "info"] as const).map(s => {
            const count = warnings.filter((w: any) => w.severity === s).length;
            const cfg = SEV[s];
            return <Card key={s}><CardContent className="p-3 text-center"><cfg.icon className={`w-5 h-5 mx-auto mb-1 ${cfg.color}`} /><p className="text-lg font-bold">{count}</p><p className="text-[10px] text-muted-foreground">{cfg.label}</p></CardContent></Card>;
          })}
        </div>
        <div className="space-y-3">
          {warnings.map((w: any) => {
            const cfg = SEV[w.severity as keyof typeof SEV];
            return (
              <Card key={w.id} className={`border ${cfg.bg}`}><CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <cfg.icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><p className="text-sm font-semibold">{w.title}</p><Badge variant="outline" className="text-[10px]">{cfg.label}</Badge></div>
                    <p className="text-xs text-muted-foreground mb-2">{w.description}</p>
                    <div className="p-2 rounded bg-background/50 text-xs"><span className="font-medium">Fix: </span>{w.howToFix}</div>
                  </div>
                </div>
              </CardContent></Card>
            );
          })}
        </div>
        {warnings.length === 0 && <Card className="border-green-200 bg-green-50/30"><CardContent className="p-6 text-center"><CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" /><p className="font-semibold">No issues!</p></CardContent></Card>}
      </div>
    </TaxFlowLayout>
  );
};

export default TaxErrorReview;
