/**
 * Screen 15 — Payment Selection (Real Stripe Checkout + Server-Side Verification)
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Download, FileText, Shield, Briefcase, Star, Loader2 } from "lucide-react";
import TaxFlowLayout from "@/components/tax-help/TaxFlowLayout";
import PageLoader from "@/components/PageLoader";

const SERVICES = [
  { id: "self_prep_export", label: "Self-Prep Export", price: "$29", priceId: "price_1TKmZlBeeH6hPmEXFkMGpuCH", desc: "Download draft package.", includes: ["Draft return data", "Summary PDF", "Checklist"], icon: Download },
  { id: "draft_package", label: "Draft Tax Package", price: "$49", priceId: "price_1TKmZmBeeH6hPmEXu5mlcXyP", desc: "Guided prep with export.", includes: ["Guided preparation", "AI analysis", "Draft PDF", "Error detection"], icon: FileText, popular: true },
  { id: "financial_statements", label: "Financial Statements", price: "$39", priceId: "price_1TKmZnBeeH6hPmEX3AJW71ij", desc: "Generate P&L, Balance Sheet.", includes: ["P&L", "Balance Sheet", "Summaries"], icon: Briefcase },
  { id: "professional_review", label: "CPA Review", price: "$99", priceId: "price_1TKmZoBeeH6hPmEXxCOGCMvP", desc: "CPA reviews before filing.", includes: ["Full review", "Error correction", "Priority support"], icon: Shield },
  { id: "full_service", label: "Full Service", price: "$149", priceId: "price_1TKmZpBeeH6hPmEXCK2fRB6h", desc: "We handle everything.", includes: ["Document collection", "Full preparation", "CPA review", "Filing support"], icon: Star },
];

const TaxPaymentSelection = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Server-side payment verification on return from Stripe
  const verifyPayment = useCallback(async (sessionId: string) => {
    if (!id) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-tax-payment", {
        body: { session_id: sessionId, tax_file_id: id },
      });

      if (error) throw error;

      if (data?.verified) {
        toast({ title: "✅ Payment verified!", description: "Your tax service is now active." });
        navigate(`/tax/file/${id}/post-payment`, { replace: true });
      } else {
        toast({
          title: "Payment not confirmed",
          description: "Your payment could not be verified. Please contact support if you were charged.",
          variant: "destructive",
        });
        setVerifying(false);
      }
    } catch (err: any) {
      console.error("Payment verification error:", err);
      toast({
        title: "Verification error",
        description: "Could not verify payment. Please try refreshing or contact support.",
        variant: "destructive",
      });
      setVerifying(false);
    }
  }, [id, navigate, toast]);

  // On return from Stripe, verify server-side — NEVER trust URL params alone
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (searchParams.get("success") === "true" && sessionId && id) {
      verifyPayment(sessionId);
    }
    if (searchParams.get("canceled") === "true") {
      toast({ title: "Payment canceled", description: "No charges were made.", variant: "destructive" });
    }
  }, [searchParams, id, verifyPayment]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("tax_files").select("*").eq("id", id).single();
      setFile(data);
      setLoading(false);
    })();
  }, [id]);

  const handlePurchase = async () => {
    if (!selected) { toast({ title: "Select a service", variant: "destructive" }); return; }
    const svc = SERVICES.find(s => s.id === selected);
    if (!svc) return;

    setProcessing(true);
    try {
      await supabase.from("tax_files").update({ service_mode: selected } as any).eq("id", id);

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          price_id: svc.priceId,
          mode: "payment",
          tax_file_id: id,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({ title: "Payment error", description: err.message || "Could not start checkout. Please try again.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!file) return <div className="p-8 text-center text-muted-foreground">Not found.</div>;

  // Verifying payment state
  if (verifying) {
    return (
      <TaxFlowLayout currentStep={11} title="Verifying Payment" taxFileId={id}>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
          <h1 className="text-2xl font-display font-bold">Verifying Your Payment…</h1>
          <p className="text-muted-foreground">We're confirming your payment with Stripe. This usually takes a few seconds.</p>
        </div>
      </TaxFlowLayout>
    );
  }

  // Already paid
  if (file.payment_status === "paid") {
    return (
      <TaxFlowLayout currentStep={11} title="Payment Complete" taxFileId={id}
        onNext={() => navigate(`/tax/file/${id}/post-payment`)} nextLabel="Continue">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
          <h1 className="text-2xl font-display font-bold">Payment Already Completed</h1>
          <p className="text-muted-foreground">This tax file has already been paid for.</p>
          <Button onClick={() => navigate(`/tax/file/${id}/post-payment`)}>Continue to Next Step</Button>
        </div>
      </TaxFlowLayout>
    );
  }

  return (
    <TaxFlowLayout currentStep={11} title="Service & Payment" taxFileId={id}
      onNext={handlePurchase} nextLabel={processing ? "Redirecting to Checkout…" : "Pay & Continue"}
      nextDisabled={!selected || processing} onBack={() => navigate(`/tax/file/${id}/review`)}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">Choose Your Service</h1>
          <p className="text-sm text-muted-foreground mt-1">For your <span className="capitalize font-medium">{file.filing_type?.replace(/_/g, " ")}</span> (TY{file.tax_year})</p>
        </div>
        <div className="space-y-3">
          {SERVICES.map(svc => (
            <Card key={svc.id} className={`cursor-pointer transition-all ${selected === svc.id ? "border-2 border-primary shadow-md" : "border hover:border-primary/30"}`} onClick={() => setSelected(svc.id)}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${selected === svc.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}><svc.icon className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{svc.label}</p>
                      {svc.popular && <Badge className="bg-secondary text-secondary-foreground text-[10px]">Popular</Badge>}
                      <span className="ml-auto font-bold text-lg">{svc.price}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{svc.desc}</p>
                    <div className="flex flex-wrap gap-1.5">{svc.includes.map(i => <span key={i} className="flex items-center gap-1 text-[11px] text-muted-foreground"><CheckCircle2 className="w-3 h-3 text-green-600" /> {i}</span>)}</div>
                  </div>
                  {selected === svc.id && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </TaxFlowLayout>
  );
};

export default TaxPaymentSelection;
