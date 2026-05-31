import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, Shield, Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import FlagsWatermark from "@/components/FlagsWatermark";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/hooks/useT";

const amounts = [1, 5, 10, 25];

const Contribution = () => {
  const t = useT();
  const [selected, setSelected] = useState(1);
  const [custom, setCustom] = useState("");
  const [processing, setProcessing] = useState(false);
  const { isPractitioner } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const finalAmount = custom ? Number(custom) : selected;

  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      toast({ title: t("contribution.canceled"), description: t("contribution.canceledDesc") });
    }
  }, [searchParams]);

  const handleContribute = async () => {
    if (finalAmount < 1) {
      toast({ title: t("contribution.invalidAmount"), description: t("contribution.atLeast1"), variant: "destructive" });
      return;
    }
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { donation_amount: finalAmount, mode: "payment" },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message || "Could not start checkout. Please try again.", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = () => navigate(isPractitioner ? "/dashboard" : "/portal");

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative">
      <div className="absolute top-4 left-4 z-10"><BackButton /></div>
      <FlagsWatermark />
      <Card className="w-full max-w-lg relative z-10 bg-card/95 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <img src={domeLogo} alt="D.O.M.E." className="w-24 h-auto" />
          </div>
          <div className="mx-auto w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
            <Heart className="w-7 h-7 text-secondary" />
          </div>
          <CardTitle className="font-display text-2xl">{t("contribution.title")}</CardTitle>
          <CardDescription className="text-base mt-2 max-w-sm mx-auto">{t("contribution.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3 text-center">{t("contribution.suggestedAmount")}</p>
            <div className="grid grid-cols-4 gap-2">
              {amounts.map(amt => (
                <button key={amt} onClick={() => { setSelected(amt); setCustom(""); }}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                    selected === amt && !custom ? "bg-secondary text-secondary-foreground shadow-md scale-105" : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}>
                  ${amt}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <input type="number" min="1" placeholder={t("contribution.customAmount")} value={custom} onChange={e => setCustom(e.target.value)}
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm text-center placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50" />
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("contribution.contributionHelps")}</p>
            <ul className="text-sm space-y-1.5 text-foreground">
              <li className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-secondary shrink-0" />{t("contribution.staff")}</li>
              <li className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-secondary shrink-0" />{t("contribution.infrastructure")}</li>
              <li className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-secondary shrink-0" />{t("contribution.outreach")}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button className="w-full gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground h-12 text-base font-semibold" onClick={handleContribute} disabled={processing || finalAmount < 1}>
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t("contribution.contribute")} ${finalAmount} <ArrowRight className="w-4 h-4" /></>}
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">{t("common.or")}</span><div className="h-px flex-1 bg-border" />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={handleSkip}>{t("contribution.skipForNow")}</Button>
              <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={handleSkip}>{t("contribution.requestWaiver")}</Button>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">{t("contribution.taxDeductible")}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Contribution;
