/**
 * Screen 7 — Confirm Filing Type
 */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Bot, FileText, AlertTriangle, User, Building2, Briefcase, HelpCircle, Loader2 } from "lucide-react";
import TaxFlowLayout from "@/components/tax-help/TaxFlowLayout";
import PageLoader from "@/components/PageLoader";

const FILING_OPTIONS = [
  { value: "individual", label: "Individual Tax Return (1040)", icon: User, desc: "Personal income tax filing" },
  { value: "nonprofit_990n", label: "Nonprofit 990-N (e-Postcard)", icon: Building2, desc: "Gross receipts ≤ $50,000" },
  { value: "nonprofit_990ez", label: "Nonprofit 990-EZ", icon: Building2, desc: "Receipts < $200K, assets < $500K" },
  { value: "nonprofit_8868", label: "Extension (Form 8868)", icon: Briefcase, desc: "Request automatic extension" },
  { value: "small_business", label: "Small Business Return", icon: Briefcase, desc: "Sole proprietor, LLC, S-Corp" },
  { value: "corporate_1120", label: "Corporate Return (1120/1120-S)", icon: Building2, desc: "C-Corp or S-Corp" },
  { value: "partnership_1065", label: "Partnership Return (1065)", icon: Briefcase, desc: "Partnership or multi-member LLC" },
  { value: "unsure", label: "I'm Not Sure", icon: HelpCircle, desc: "Let AI recommend" },
];

const TaxFilingConfirmation = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [file, setFile] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [fileRes, recsRes, docsRes] = await Promise.all([
        supabase.from("tax_files").select("*").eq("id", id).single(),
        supabase.from("tax_filing_recommendations").select("*").eq("tax_file_id", id).order("created_at", { ascending: false }).limit(1),
        supabase.from("tax_file_documents").select("id, name, category, ai_classification").eq("tax_file_id", id),
      ]);
      setFile(fileRes.data);
      if (recsRes.data?.[0]) { setRecommendation(recsRes.data[0]); setSelectedType(recsRes.data[0].detected_filing_type || fileRes.data?.filing_type || ""); }
      else setSelectedType(fileRes.data?.filing_type || "");
      setDocs(docsRes.data || []); setLoading(false);
    })();
  }, [id]);

  const handleConfirm = async () => {
    if (!selectedType || selectedType === "unsure") { toast({ title: "Select a filing type", variant: "destructive" }); return; }
    setConfirming(true);
    try {
      await supabase.from("tax_files").update({ filing_type: selectedType, filing_confirmed: true, filing_confirmed_at: new Date().toISOString() } as any).eq("id", id);
      if (recommendation) await supabase.from("tax_filing_recommendations").update({ user_confirmed: true, confirmed_filing_type: selectedType, confirmed_at: new Date().toISOString(), confirmed_by: user?.id }).eq("id", recommendation.id);
      toast({ title: "Filing type confirmed!" });
      navigate(`/tax/file/${id}/extracted`);
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setConfirming(false); }
  };

  if (loading) return <PageLoader />;
  if (!file) return <div className="p-8 text-center text-muted-foreground">Tax file not found.</div>;

  return (
    <TaxFlowLayout
      currentStep={5}
      title="Confirm Filing Type"
      taxFileId={id}
      onNext={handleConfirm}
      nextLabel={confirming ? "Confirming…" : "Confirm Filing Type"}
      nextDisabled={confirming || !selectedType || selectedType === "unsure"}
      onBack={() => navigate(`/tax/file/${id}/recommendation`)}
    >
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">What Are We Preparing?</h1>
          <p className="text-sm text-muted-foreground mt-1">Review the recommendation and confirm your filing type.</p>
        </div>

        {recommendation && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                <p className="font-semibold text-sm">AI Recommendation</p>
                {recommendation.confidence_score && <Badge variant="secondary" className="text-xs">{Math.round(recommendation.confidence_score)}%</Badge>}
              </div>
              <p className="text-sm capitalize font-medium">{recommendation.detected_filing_type?.replace(/_/g, " ")}</p>
              {recommendation.recommendation_text && <p className="text-xs text-muted-foreground">{recommendation.recommendation_text}</p>}
            </CardContent>
          </Card>
        )}

        {docs.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Documents ({docs.length})</CardTitle></CardHeader>
            <CardContent><div className="flex flex-wrap gap-2">{docs.map(d => <Badge key={d.id} variant="outline" className="text-xs"><FileText className="w-3 h-3 mr-1" /> {d.name}</Badge>)}</div></CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Select Filing Type</CardTitle></CardHeader>
          <CardContent>
            <RadioGroup value={selectedType} onValueChange={setSelectedType} className="space-y-2">
              {FILING_OPTIONS.map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${selectedType === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                  <RadioGroupItem value={opt.value} className="mt-0.5" />
                  <opt.icon className={`w-5 h-5 shrink-0 mt-0.5 ${selectedType === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                  <div><p className="text-sm font-medium">{opt.label}</p><p className="text-xs text-muted-foreground">{opt.desc}</p></div>
                  {selectedType === opt.value && <CheckCircle2 className="w-4 h-4 text-primary ml-auto mt-0.5" />}
                </label>
              ))}
            </RadioGroup>
            {selectedType === "unsure" && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400"><AlertTriangle className="w-4 h-4" /><p className="text-sm font-medium">Not sure?</p></div>
                <p className="text-xs text-muted-foreground mt-1">Upload documents and run AI analysis, or request a professional review.</p>
              </div>
            )}
            <div className="mt-4">
              <p className="text-sm font-medium mb-1">Additional Notes (optional)</p>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes…" rows={2} />
            </div>
          </CardContent>
        </Card>
      </div>
    </TaxFlowLayout>
  );
};

export default TaxFilingConfirmation;
