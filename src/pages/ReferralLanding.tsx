import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Shield, Gift } from "lucide-react";
import { toast } from "sonner";
import domeLogo from "@/assets/dome-logo.png";

const ReferralLanding = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [redeeming, setRedeeming] = useState(false);

  // Try trial referral first
  const { data: trial, isLoading: trialLoading } = useQuery({
    queryKey: ["referral-landing", code],
    queryFn: async () => {
      const { data } = await supabase
        .from("trial_referrals")
        .select("*")
        .eq("code", code?.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
    enabled: !!code,
  });

  const { data: features } = useQuery({
    queryKey: ["referral-features", trial?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("trial_referral_feature_rules")
        .select("*")
        .eq("trial_referral_id", trial!.id);
      return data;
    },
    enabled: !!trial?.id,
  });

  // Track affiliate click
  const { data: affiliate } = useQuery({
    queryKey: ["affiliate-landing", code],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliates")
        .select("*")
        .eq("affiliate_code", code?.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
    enabled: !!code && !trial,
  });

  // Record affiliate click
  useEffect(() => {
    if (affiliate) {
      supabase.from("affiliate_clicks").insert({
        affiliate_id: affiliate.id,
        ip_hash: null,
        user_agent: navigator.userAgent,
        referrer_url: document.referrer || null,
      });
      // Store in localStorage for attribution
      localStorage.setItem("dome_affiliate_code", affiliate.affiliate_code);
      localStorage.setItem("dome_affiliate_id", affiliate.id);
      localStorage.setItem("dome_affiliate_click_at", new Date().toISOString());
    }
  }, [affiliate]);

  const durationLabel = (days: number) => {
    if (days <= 30) return `${days} Days`;
    if (days <= 90) return `${days} Days`;
    if (days <= 180) return "6 Months";
    return "1 Year";
  };

  const handleRedeem = async () => {
    if (!user) {
      // Redirect to signup with referral code stored
      localStorage.setItem("dome_referral_code", code?.toUpperCase() || "");
      navigate("/signup");
      return;
    }

    if (!trial) return;
    setRedeeming(true);

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + trial.duration_days);

      const status = trial.activation_mode === "instant" ? "active" : "pending";

      const { error } = await supabase.from("trial_referral_redemptions").insert({
        trial_referral_id: trial.id,
        user_id: user.id,
        expires_at: expiresAt.toISOString(),
        status: status as any,
      });

      if (error) throw error;

      if (status === "active") {
        toast.success("Trial activated! Welcome to D.O.M.E.");
        navigate("/dashboard");
      } else {
        toast.success("Access request submitted. You'll be notified once approved.");
        navigate("/portal");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to redeem referral");
    } finally {
      setRedeeming(false);
    }
  };

  const isLoading = trialLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Trial referral landing
  if (trial) {
    const included = features?.filter(f => f.is_enabled) || [];
    const excluded = features?.filter(f => !f.is_enabled) || [];

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-xl border-2">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img src={domeLogo} alt="D.O.M.E." className="w-16 h-16 object-contain" />
            </div>
            <div className="flex justify-center mb-3">
              <Badge className="bg-secondary text-secondary-foreground px-4 py-1 text-sm">
                <Gift className="w-4 h-4 mr-1" />
                Free Trial
              </Badge>
            </div>
            <CardTitle className="text-2xl font-display">
              Try D.O.M.E. Free for {durationLabel(trial.duration_days)}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {trial.referral_type !== "general_public"
                ? `Provided for ${trial.referral_type.replace("_", " ")}s`
                : "Open to everyone"}
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
            {included.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" /> Includes
                </h3>
                <ul className="space-y-1">
                  {included.map(f => (
                    <li key={f.id} className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {f.feature_key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                      {f.usage_limit && <span className="text-xs">(max {f.usage_limit})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {excluded.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground" /> Not Included
                </h3>
                <ul className="space-y-1">
                  {excluded.map(f => (
                    <li key={f.id} className="text-sm text-muted-foreground/60 flex items-center gap-2">
                      <XCircle className="w-3 h-3" />
                      {f.feature_key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {trial.end_at && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Offer expires {new Date(trial.end_at).toLocaleDateString()}
              </p>
            )}

            <Button onClick={handleRedeem} disabled={redeeming} className="w-full" size="lg">
              {redeeming
                ? "Processing..."
                : trial.activation_mode === "approval_required"
                  ? "Request Access"
                  : "Start Trial"}
            </Button>

            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> No credit card required
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Affiliate landing — redirect to signup with attribution
  if (affiliate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-xl border-2">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <img src={domeLogo} alt="D.O.M.E." className="w-16 h-16 object-contain" />
            </div>
            <CardTitle className="text-2xl font-display">
              Welcome to D.O.M.E.
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              You've been referred by <strong>{affiliate.display_name}</strong>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              D.O.M.E. helps immigrants and practitioners navigate the immigration process with voice-assisted intake, smart forms, and document management.
            </p>
            <Button onClick={() => navigate("/signup")} className="w-full" size="lg">
              Get Started
            </Button>
            <Button variant="outline" onClick={() => navigate("/login")} className="w-full">
              Already have an account? Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid code
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-12">
          <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Invalid Referral Code</h2>
          <p className="text-sm text-muted-foreground mb-6">This referral link is expired or doesn't exist.</p>
          <Button onClick={() => navigate("/login")}>Go to Login</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralLanding;
