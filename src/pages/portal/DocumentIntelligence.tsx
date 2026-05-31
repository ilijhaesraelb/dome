import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Sparkles, FileText, CheckCircle2, AlertTriangle,
  XCircle, Loader2, RefreshCw, Upload, ShieldCheck
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useT } from "@/hooks/useT";
import { logPlatformError } from "@/lib/error-logger";

interface DocAnalysis {
  name: string;
  status: "good" | "needs_attention" | "missing";
  notes: string;
}

interface MissingDoc {
  name: string;
  reason: string;
  priority: "required" | "recommended";
}

interface AnalysisResult {
  analyses: DocAnalysis[];
  missing_documents: MissingDoc[];
  recommendations: string[];
  overall_score: number;
}

const DocumentIntelligence = () => {
  const t = useT();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchDocs = async () => {
      const { data: participants } = await supabase
        .from("case_participants")
        .select("case_id")
        .eq("user_id", user.id)
        .limit(1);

      if (!participants?.length) { setLoading(false); return; }

      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("case_id", participants[0].case_id)
        .order("created_at", { ascending: false });

      setDocuments(data || []);
      setLoading(false);
    };
    fetchDocs();
  }, [user]);

  const runAnalysis = async () => {
    if (documents.length === 0) {
      toast({ title: "No documents", description: "Upload documents first to analyze them." });
      return;
    }

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("document-intelligence", {
        body: {
          documents: documents.map(d => ({
            name: d.name,
            category: d.category,
            file_type: d.file_type,
            file_size: d.file_size,
            status: d.status,
          }))
        }
      });

      if (error) throw error;
      setResult(data as AnalysisResult);
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message || "Please try again.", variant: "destructive" });
      logPlatformError({
        type: "ocr_failure",
        severity: "high",
        message: err?.message || "Document intelligence analysis failed",
        details: { documentCount: documents.length },
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "good": return <CheckCircle2 className="w-5 h-5 text-primary" />;
      case "needs_attention": return <AlertTriangle className="w-5 h-5 text-secondary" />;
      case "missing": return <XCircle className="w-5 h-5 text-destructive" />;
      default: return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "good": return { text: t("docIntel.good"), cls: "bg-primary/10 text-primary" };
      case "needs_attention": return { text: t("docIntel.needsAttention"), cls: "bg-secondary/10 text-secondary" };
      case "missing": return { text: t("docIntel.missing"), cls: "bg-destructive/10 text-destructive" };
      default: return { text: "Unknown", cls: "bg-muted text-muted-foreground" };
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-2 space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/portal/documents" className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">{t("docIntel.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("docIntel.subtitle")}</p>
        </div>
        <Sparkles className="w-5 h-5 text-secondary" />
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </div>
      ) : documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <Upload className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <h3 className="font-display font-bold">{t("docIntel.noDocsYet")}</h3>
            <p className="text-sm text-muted-foreground">{t("docIntel.noDocsDesc")}</p>
            <Button onClick={() => navigate("/portal/documents")} className="gap-2 bg-secondary hover:bg-secondary/90">
              <Upload className="w-4 h-4" /> {t("docIntel.goToDocs")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Document count & analyze button */}
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{t("docIntel.docsUploaded", { count: documents.length })}</p>
                <p className="text-xs text-muted-foreground">{t("docIntel.readyForAnalysis")}</p>
              </div>
              <Button
                size="sm"
                className="gap-1.5 bg-secondary hover:bg-secondary/90"
                onClick={runAnalysis}
                disabled={analyzing}
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {analyzing ? t("docIntel.analyzing") : result ? t("docIntel.reAnalyze") : t("docIntel.analyze")}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Overall Score */}
              <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
                <CardContent className="p-5 text-center space-y-3">
                  <h2 className="font-display text-lg font-bold">{t("docIntel.readinessScore")}</h2>
                  <div className="text-4xl font-bold text-secondary">{result.overall_score}%</div>
                  <Progress value={result.overall_score} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {result.overall_score >= 80 ? "Your documents look strong!" :
                     result.overall_score >= 50 ? "Some documents need attention." :
                     "Several documents are missing or need improvement."}
                  </p>
                </CardContent>
              </Card>

              {/* Individual Analyses */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground">{t("docIntel.docAnalysis")}</h3>
                {result.analyses.map((doc, i) => {
                  const s = statusLabel(doc.status);
                  return (
                    <Card key={i}>
                      <CardContent className="p-3 flex items-start gap-3">
                        {statusIcon(doc.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate">{doc.name}</span>
                            <Badge className={cn("text-[9px] border-0", s.cls)}>{s.text}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{doc.notes}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Missing Documents */}
              {result.missing_documents.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-secondary" /> {t("docIntel.missingDocs")}
                  </h3>
              {result.missing_documents.map((doc, i) => (
                    <Card key={i} className="border-secondary/20">
                      <CardContent className="p-3 flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{doc.name}</span>
                            <Badge variant="outline" className="text-[9px]">
                              {doc.priority === "required" ? "Required" : "Recommended"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{doc.reason}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" /> {t("docIntel.recommendations")}
                  </h3>
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      {result.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">{rec}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/portal/documents")}>
                <Upload className="w-4 h-4" /> {t("docIntel.uploadMore")}
              </Button>
            </div>
          )}
        </>
      )}

      <p className="text-[10px] text-muted-foreground/60 text-center pb-4">
        {t("common.disclaimer")}
      </p>
    </div>
  );
};

export default DocumentIntelligence;
