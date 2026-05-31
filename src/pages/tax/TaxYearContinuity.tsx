/**
 * Screen 19 — Year-to-Year Continuity
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, FileText, Clock, RefreshCw, TrendingUp, Calendar, Database, ArrowRight } from "lucide-react";
import TaxFlowLayout from "@/components/tax-help/TaxFlowLayout";
import PageLoader from "@/components/PageLoader";

const TaxYearContinuity = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [priorFiles, setPriorFiles] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);
  const [carryForward, setCarryForward] = useState({ profile: true, filingType: true, documents: false, mappings: true });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: tc } = await supabase.from("tax_clients").select("*").eq("user_id", user.id).maybeSingle();
      setClient(tc);
      if (tc) { const { data } = await supabase.from("tax_files").select("*").eq("tax_client_id", tc.id).eq("status", "completed").order("tax_year", { ascending: false }); setPriorFiles(data || []); }
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <PageLoader />;
  const latestFile = priorFiles[0];

  return (
    <TaxFlowLayout currentStep={12} title="Year-to-Year" hideStepNav onNext={() => navigate("/tax/start")} nextLabel="Start New Tax Year">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">Start From Where You Left Off</h1>
          <p className="text-sm text-muted-foreground mt-1">Your history makes each year faster.</p>
        </div>
        {priorFiles.length > 0 ? (
          <>
            <Card className="border-primary/20 bg-primary/5"><CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2"><Database className="w-5 h-5 text-primary" /><p className="font-semibold text-sm">Filing History</p><Badge variant="secondary" className="text-xs">{priorFiles.length} year(s)</Badge></div>
              <div className="space-y-2">{priorFiles.map(f => <div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-background"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" /><div><p className="text-sm font-medium">TY{f.tax_year} — <span className="capitalize">{f.filing_type?.replace(/_/g, " ")}</span></p></div></div><Badge className="bg-green-100 text-green-700 text-[10px]">Completed</Badge></div>)}</div>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Carry Forward</CardTitle></CardHeader><CardContent className="space-y-4">
              {[{ key: "profile", label: "Tax Profile", desc: "Name, address, EIN" }, { key: "filingType", label: "Filing Type", desc: `Prior: ${latestFile?.filing_type?.replace(/_/g, " ")}` }, { key: "documents", label: "Prior Returns", desc: "Attach as reference" }, { key: "mappings", label: "Spreadsheet Mappings", desc: "Reuse column mappings" }].map(opt => (
                <div key={opt.key} className="flex items-center justify-between p-3 rounded-lg border"><div><p className="text-sm font-medium">{opt.label}</p><p className="text-xs text-muted-foreground">{opt.desc}</p></div><Switch checked={(carryForward as any)[opt.key]} onCheckedChange={v => setCarryForward(prev => ({ ...prev, [opt.key]: v }))} /></div>
              ))}
            </CardContent></Card>
          </>
        ) : (
          <Card><CardContent className="p-8 text-center text-muted-foreground"><Clock className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="font-semibold">No prior history</p><p className="text-xs mt-1">Complete your first filing to build your vault.</p></CardContent></Card>
        )}
      </div>
    </TaxFlowLayout>
  );
};

export default TaxYearContinuity;
