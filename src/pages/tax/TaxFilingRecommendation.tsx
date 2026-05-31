/**
 * Screen 6 — Filing Path Recommendation
 */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, ArrowRight, FileText, AlertTriangle, HelpCircle, Loader2, Sparkles } from "lucide-react";
import TaxFlowLayout from "@/components/tax-help/TaxFlowLayout";
import PageLoader from "@/components/PageLoader";

const TaxFilingRecommendation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [fRes, rRes, dRes] = await Promise.all([
        supabase.from("tax_files").select("*").eq("id", id).single(),
        supabase.from("tax_filing_recommendations").select("*").eq("tax_file_id", id).order("created_at", { ascending: false }).limit(1),
        supabase.from("tax_file_documents").select("id, name, category, ai_classification").eq("tax_file_id", id),
      ]);
      setFile(fRes.data); setRecommendation(rRes.data?.[0] || null); setDocs(dRes.data || []);
      setLoading(false);
    })();
  }, [id]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const resp = await supabase.functions.invoke("tax-document-analysis", { body: { taxFileId: id, documentIds: docs.map(d => d.id) } });
      if (resp.error) throw resp.error;
      const { data } = await supabase.from("tax_filing_recommendations").select("*").eq("tax_file_id", id).order("created_at", { ascending: false }).limit(1);
      setRecommendation(data?.[0] || null);
    } catch { /* handled */ }
    setAnalyzing(false);
  };

  if (loading) return <PageLoader />;
  if (!file) return <div className="p-8 text-center text-muted-foreground">Tax file not found.</div>;

  return (
    <TaxFlowLayout
      currentStep={4}
      title="Filing Recommendation"
      taxFileId={id}
      onNext={() => navigate(`/tax/file/${id}/confirm`)}
      nextLabel={recommendation ? "Confirm Filing Type" : "Choose Filing Type"}
      onBack={() => navigate(`/tax/documents/upload?file=${id}`)}
    >
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">What Should You File?</h1>
          <p className="text-sm text-muted-foreground mt-1">Based on your documents and profile, here's our recommendation.</p>
        </div>

        {!recommendation && (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground opacity-30" />
              <p className="font-semibold">No recommendation yet</p>
              <p className="text-sm text-muted-foreground">
                {docs.length === 0 ? "Upload documents first." : "Run AI analysis on your documents."}
              </p>
              {docs.length > 0 && (
                <Button onClick={runAnalysis} disabled={analyzing} className="gap-2">
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {analyzing ? "Analyzing…" : "Run AI Analysis"}
                </Button>
              )}
              {docs.length === 0 && (
                <Button onClick={() => navigate(`/tax/documents/upload?file=${id}`)} className="gap-2">Upload Documents <ArrowRight className="w-4 h-4" /></Button>
              )}
            </CardContent>
          </Card>
        )}

        {recommendation && (
          <>
            <Card className="border-primary/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg capitalize">{recommendation.detected_filing_type?.replace(/_/g, " ")}</p>
                    <p className="text-sm text-muted-foreground">AI-Recommended Filing Path</p>
                  </div>
                  {recommendation.confidence_score && (
                    <Badge className="ml-auto bg-primary/10 text-primary border-0 text-sm">{Math.round(recommendation.confidence_score)}%</Badge>
                  )}
                </div>
                {recommendation.confidence_score && <Progress value={recommendation.confidence_score} className="h-2.5" />}
                {recommendation.recommendation_text && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-semibold mb-1">Why this recommendation?</p>
                    <p className="text-sm text-muted-foreground">{recommendation.recommendation_text}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {recommendation.evidence_summary?.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Notes</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {recommendation.evidence_summary.map((e: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm"><AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /><span className="text-muted-foreground">{e}</span></div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-base">Documents Analyzed ({docs.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {docs.map(d => (
                    <Badge key={d.id} variant="outline" className="text-xs gap-1">
                      <FileText className="w-3 h-3" /> {d.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </TaxFlowLayout>
  );
};

export default TaxFilingRecommendation;
