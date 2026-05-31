/**
 * ExportPaymentGate — Strict payment gate. NO fail-open behavior.
 * Price is fetched from product_pricing table. Free preview is always allowed.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileDown, Loader2, Eye, Lock, Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProductPrice } from "@/hooks/useProductPricing";

interface ExportPaymentGateProps {
  formType: string;
  productKey?: string;
  onExportAllowed: () => void;
  onPreview: () => void;
  disabled?: boolean;
  exporting?: boolean;
}

const FALLBACK_PRICE = 3.0;

const ExportPaymentGate = ({
  formType,
  productKey = "form_export",
  onExportAllowed,
  onPreview,
  disabled,
  exporting,
}: ExportPaymentGateProps) => {
  const { user, subscription } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { price, isLoading: priceLoading } = useProductPrice(productKey);
  const displayPrice = price ?? FALLBACK_PRICE;

  // Pro subscribers get unlimited exports
  const isProSubscriber = subscription.subscribed && subscription.plan?.name?.toLowerCase().includes("pro");

  const handlePayAndExport = async () => {
    // Allow pro subscribers to bypass payment
    if (isProSubscriber) {
      onExportAllowed();
      return;
    }

    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to export.", variant: "destructive" });
      return;
    }

    setProcessing(true);
    setPaymentError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" });
        setProcessing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          price_id: productKey === "form_export" ? "price_export_single_form" : `price_${productKey}`,
          mode: "payment",
          metadata: { formType, userId: user.id },
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe checkout — export is NOT allowed until payment completes
        window.open(data.url, "_blank");
        toast({
          title: "Complete payment to download",
          description: "After payment, return here and click Export again. Your data is saved.",
        });
      } else {
        // No URL returned — payment system error, DO NOT allow export
        setPaymentError("Payment system is not configured. Please contact support.");
        toast({
          title: "Payment unavailable",
          description: "The payment system is not yet configured. Export requires payment.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      // STRICT: Do NOT allow export on payment failure
      console.error("Payment gate error:", err.message);
      setPaymentError("Payment could not be processed. Please try again.");
      toast({
        title: "Payment failed",
        description: "Could not connect to payment system. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 to-transparent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-secondary" />
            <span className="text-sm font-semibold">Export {formType}</span>
          </div>
          {isProSubscriber ? (
            <Badge className="bg-success/10 text-success border-0">Pro — Free</Badge>
          ) : (
            <Badge className="bg-secondary/10 text-secondary border-0">
              {priceLoading ? "..." : `$${displayPrice.toFixed(2)}`}
            </Badge>
          )}
        </div>

        {paymentError && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{paymentError}</span>
          </div>
        )}

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full gap-2 h-9"
            onClick={onPreview}
            disabled={disabled}
          >
            <Eye className="w-4 h-4" /> Free Preview
          </Button>

          <Button
            className="w-full gap-2 h-10 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            onClick={handlePayAndExport}
            disabled={disabled || exporting || processing}
          >
            {processing || exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isProSubscriber ? (
              <>
                <FileDown className="w-4 h-4" /> Export PDF
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Pay & Export PDF
              </>
            )}
          </Button>
        </div>

        <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
          <Shield className="w-3 h-3 shrink-0 mt-0.5" />
          <span>Preview is always free. Payment is required to download the final PDF. D.O.M.E. Pro subscribers get unlimited exports.</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportPaymentGate;
