/**
 * Screen 16 — Post-Payment
 */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Download, Shield, ArrowRight, MessageSquare, Calendar, FolderOpen } from "lucide-react";
import TaxFlowLayout from "@/components/tax-help/TaxFlowLayout";
import PageLoader from "@/components/PageLoader";

const TaxPostPayment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!id) return; (async () => { const { data } = await supabase.from("tax_files").select("*").eq("id", id).single(); setFile(data); setLoading(false); })(); }, [id]);

  if (loading) return <PageLoader />;
  if (!file) return <div className="p-8 text-center text-muted-foreground">Not found.</div>;

  const isPro = ["professional_review", "full_service", "ccgvs_assisted", "cpa_review"].includes(file.service_mode || "");

  return (
    <TaxFlowLayout currentStep={12} title="Complete" taxFileId={id} hideBottomBar hideStepNav>
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-green-600" /></div>
          <Badge className="bg-green-100 text-green-700 border-0 mb-2">Service Selected</Badge>
          <h1 className="text-2xl font-display font-bold">{isPro ? "Your File Is Being Reviewed" : "Your Tax Package Is Ready"}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{isPro ? "A professional will review your file. You'll be notified." : "Download your package or continue to finalization."}</p>
        </div>
        <div className="space-y-3">
          {[
            { icon: isPro ? Shield : Download, label: isPro ? "Track Review" : "Download Package", desc: isPro ? "Monitor review status." : "Get your draft return.", color: isPro ? "bg-indigo-100 text-indigo-600" : "bg-primary/10 text-primary", to: `/tax/file/${id}` },
            { icon: MessageSquare, label: "Send a Message", desc: "Communicate with your preparer.", color: "bg-cyan-100 text-cyan-600", to: `/tax/file/${id}` },
            { icon: FolderOpen, label: "Tax Dashboard", desc: "View all tax files.", color: "bg-purple-100 text-purple-600", to: "/tax/dashboard" },
            { icon: Calendar, label: "Prepare Next Year", desc: "History carries forward.", color: "bg-emerald-100 text-emerald-600", to: "/tax/start" },
          ].map(item => (
            <Card key={item.label} className="cursor-pointer hover:shadow-md transition" onClick={() => navigate(item.to)}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}><item.icon className="w-5 h-5" /></div>
                <div className="flex-1"><p className="font-semibold text-sm">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </TaxFlowLayout>
  );
};

export default TaxPostPayment;
