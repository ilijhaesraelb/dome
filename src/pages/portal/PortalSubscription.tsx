import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard, Check, Lock, ShieldCheck, Crown, Star, Zap,
  Loader2, ExternalLink, RefreshCw, FileDown, Sparkles, Headphones,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { useT } from "@/hooks/useT";
import {
  CLIENT_PLANS, ADDON_SERVICES, EXPORT_PACKETS,
  type StripePlan,
} from "@/lib/stripe-plans";

const iconMap: Record<string, any> = {
  onboarding: Zap,
  standard: Star,
  pro: Crown,
  "ai-case-report": Sparkles,
  "priority-support": Headphones,
};

const PortalSubscription = () => {
  const t = useT();
  const { toast } = useToast();
  const { subscription, refreshSubscription, session } = useAuth();
  const [searchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Handle success/cancel redirects
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: t("portalSub.paymentSuccess"), description: t("portalSub.paymentSuccessDesc") });
      refreshSubscription();
    }
    if (searchParams.get("canceled") === "true") {
      toast({ title: t("portalSub.paymentCanceled"), description: t("portalSub.paymentCanceledDesc") });
    }
  }, [searchParams]);

  const handleCheckout = async (plan: StripePlan) => {
    if (plan.price_id.startsWith("REPLACE_")) {
      toast({ title: t("portalSub.comingSoon"), description: t("portalSub.comingSoonDesc") });
      return;
    }
    setLoadingPlan(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: plan.price_id, mode: plan.mode },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not start checkout.", variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not open billing portal.", variant: "destructive" });
    } finally {
      setLoadingPortal(false);
    }
  };

  const currentPlanId = subscription.plan?.id;

  return (
    <div className="px-4 py-2 max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-display font-bold text-foreground">{t("portalSub.title")}</h1>
        <div className="w-16 h-0.5 bg-secondary mx-auto rounded-full" />
        <p className="text-sm text-muted-foreground leading-relaxed">{t("portalSub.subtitle")}</p>
      </div>

      {/* Current Plan Status */}
      <Card className={`${subscription.subscribed ? "border-secondary/30 bg-gradient-to-br from-secondary/5 to-secondary/10" : ""}`}>
        <CardContent className="p-5">
          {subscription.loading ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t("portalSub.checkingSub")}</span>
            </div>
          ) : subscription.subscribed ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{subscription.plan?.name || t("portalSub.activePlan")}</p>
                    <p className="text-xs text-muted-foreground">
                      {subscription.subscriptionEnd
                        ? t("portalSub.renewsOn", { date: new Date(subscription.subscriptionEnd).toLocaleDateString() })
                        : t("portalSub.activeSub")}
                    </p>
                  </div>
                </div>
                <Badge className="bg-secondary/15 text-secondary border-0">{t("portalSub.active")}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleManageSubscription} disabled={loadingPortal} className="gap-1.5">
                  {loadingPortal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  {t("portalSub.manageBilling")}
                </Button>
                <Button variant="ghost" size="sm" onClick={refreshSubscription} className="gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t("portalSub.refresh")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 space-y-2">
              <p className="text-sm font-medium text-foreground">{t("portalSub.noSub")}</p>
              <p className="text-xs text-muted-foreground">{t("portalSub.choosePlan")}</p>
              <Button variant="ghost" size="sm" onClick={refreshSubscription} className="gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                {t("portalSub.refreshStatus")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="plans">{t("portalSub.plans")}</TabsTrigger>
          <TabsTrigger value="exports">{t("portalSub.exports")}</TabsTrigger>
          <TabsTrigger value="addons">{t("portalSub.addons")}</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-3">
          {CLIENT_PLANS.map((plan) => {
            const Icon = iconMap[plan.id] || Star;
            const isCurrent = currentPlanId === plan.id;
            return (
              <Card key={plan.id} className={`${isCurrent ? "ring-1 ring-secondary/40 border-secondary/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm">{plan.name}</p>
                        {plan.popular && <Badge className="bg-secondary/15 text-secondary text-[10px] border-0">{t("portalSub.popular")}</Badge>}
                        {isCurrent && <Badge className="bg-secondary text-secondary-foreground text-[10px]">{t("portalSub.yourPlan")}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">${plan.price}</p>
                      <p className="text-[10px] text-muted-foreground">{plan.interval ? `/${plan.interval}` : "one-time"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {plan.features.slice(0, 4).map((f) => (
                      <span key={f} className="text-[10px] bg-muted/50 text-muted-foreground rounded-full px-2 py-0.5">{f}</span>
                    ))}
                    {plan.features.length > 4 && (
                      <span className="text-[10px] text-secondary font-medium">+{plan.features.length - 4} more</span>
                    )}
                  </div>
                  {!isCurrent && (
                    <Button
                      className="w-full mt-3"
                      variant={plan.popular ? "default" : "outline"}
                      size="sm"
                      disabled={loadingPlan === plan.id}
                      onClick={() => handleCheckout(plan)}
                    >
                      {loadingPlan === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : plan.mode === "payment" ? "Pay $1" : `Subscribe – $${plan.price}/mo`}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="exports" className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">{t("portalSub.exportDesc")}</p>
          {EXPORT_PACKETS.map((pkt) => (
            <Card key={pkt.id}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileDown className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{pkt.name}</p>
                  <p className="text-xs text-muted-foreground">{t("portalSub.exportItemDesc")}</p>
                </div>
                <span className="text-lg font-bold">${pkt.price}</span>
              </CardContent>
            </Card>
          ))}
          {currentPlanId === "pro" && (
            <p className="text-xs text-secondary text-center font-medium">{t("portalSub.proExports")}</p>
          )}
        </TabsContent>

        <TabsContent value="addons" className="space-y-3">
          {ADDON_SERVICES.map((addon) => {
            const Icon = iconMap[addon.id] || Sparkles;
            return (
              <Card key={addon.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{addon.name}</p>
                      <p className="text-xs text-muted-foreground">{addon.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold">${addon.price}</p>
                      <p className="text-[10px] text-muted-foreground">{addon.interval ? `/${addon.interval}` : "one-time"}</p>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-3"
                    variant="outline"
                    size="sm"
                    disabled={loadingPlan === addon.id}
                    onClick={() => handleCheckout(addon)}
                  >
                    {loadingPlan === addon.id ? <Loader2 className="w-4 h-4 animate-spin" /> : addon.mode === "payment" ? `Buy – $${addon.price}` : `Subscribe – $${addon.price}/mo`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Security footer */}
      <div className="flex justify-center gap-6 pb-2">
        <div className="flex flex-col items-center gap-1">
          <Lock className="w-4 h-4 text-primary" />
          <span className="text-[10px] text-muted-foreground">{t("common.encrypted")}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-[10px] text-muted-foreground">{t("common.secure")}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <CreditCard className="w-4 h-4 text-primary" />
          <span className="text-[10px] text-muted-foreground">Stripe</span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center pb-4">{t("common.disclaimer")}</p>
    </div>
  );
};

export default PortalSubscription;
