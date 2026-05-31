import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Copy, DollarSign, TrendingUp, UserPlus, Wallet, CheckCircle2, Info, Rocket, ArrowRight, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import domeLogo from "@/assets/dome-logo.png";
import { useT } from "@/hooks/useT";

const PortalReferralDashboard = () => {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);

  const { data: affiliate, isLoading } = useQuery({
    queryKey: ["my-affiliate-portal"],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: commissions } = useQuery({
    queryKey: ["my-commissions-portal", affiliate?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_commissions")
        .select("*")
        .eq("affiliate_id", affiliate!.id);
      return data || [];
    },
    enabled: !!affiliate,
  });

  const { data: attributionCount } = useQuery({
    queryKey: ["my-attrs-portal", affiliate?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("affiliate_attributions")
        .select("*", { count: "exact", head: true })
        .eq("affiliate_id", affiliate!.id);
      return count || 0;
    },
    enabled: !!affiliate,
  });

  if (isLoading) return <div className="p-4 text-center text-muted-foreground">Loading...</div>;

  // No affiliate account yet
  if (!affiliate) {
    return (
      <div className="px-4 py-2 max-w-lg mx-auto space-y-5">
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-display font-bold text-foreground">Referral Dashboard</h1>
          <div className="w-16 h-0.5 bg-secondary mx-auto rounded-full" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Earn rewards for referring friends and clients to D.O.M.E.
          </p>
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-6 text-center space-y-4">
          <Rocket className="w-12 h-12 text-secondary mx-auto" />
          <h2 className="text-lg font-semibold text-foreground">Become an Affiliate</h2>
          <p className="text-sm text-muted-foreground">Sign up for the affiliate program to get your unique referral link and start earning commissions.</p>
          <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2" onClick={() => navigate("/affiliate")}>
            <Rocket className="w-4 h-4" /> Join Affiliate Program <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-4 space-y-3">
          <h2 className="text-base font-display font-semibold text-foreground">Referral Benefits</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <span>Earn 20% commission on subscription payments</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <span>Earn 15% on one-time purchases like exports</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <span>90-day cookie tracking ensures you get credit</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/60 text-center pb-4">
          Referral rewards are subject to program terms. D.O.M.E. does not provide legal advice.
        </p>
      </div>
    );
  }

  // Has affiliate account
  const totalEarned = commissions?.reduce((s, c) => s + Number(c.commission_amount), 0) || 0;
  const referralLink = `${window.location.origin}/r/${affiliate.affiliate_code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link copied!");
  };

  return (
    <div className="px-4 py-2 max-w-lg mx-auto space-y-5">
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-display font-bold text-foreground">Referral Dashboard</h1>
        <div className="w-16 h-0.5 bg-secondary mx-auto rounded-full" />
        <p className="text-sm text-muted-foreground leading-relaxed">Track your earnings and share your link</p>
      </div>

      {/* Stats */}
      <div className="relative bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Total Earned</p>
            <p className="text-3xl font-bold text-foreground">${totalEarned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {attributionCount} Referrals
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            className="flex-1 h-9 text-sm font-semibold border-secondary text-secondary hover:bg-secondary/10"
            onClick={() => navigate("/affiliate/dashboard")}
          >
            <TrendingUp className="w-4 h-4 mr-1.5" /> Full Dashboard
          </Button>
          <Button
            className="flex-1 h-9 text-sm font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            onClick={handleCopy}
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Invite Friends
          </Button>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-4 space-y-3">
        <h2 className="text-base font-display font-semibold text-foreground">Your Referral Link</h2>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-sm text-muted-foreground font-mono truncate">
            {referralLink}
          </div>
          <Button onClick={handleCopy} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold px-4">
            <Copy className="w-4 h-4 mr-1.5" /> Copy
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowQR(!showQR)} className="gap-1.5 w-full">
          <Share2 className="w-3.5 h-3.5" /> {showQR ? "Hide" : "Show"} QR Code
        </Button>
        {showQR && (
          <div className="flex justify-center py-3">
            <div className="bg-white p-3 rounded-xl shadow-sm border">
              <QRCodeSVG value={referralLink} size={140} level="H"
                imageSettings={{ src: domeLogo, x: undefined, y: undefined, height: 28, width: 28, excavate: true }} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-4 space-y-3">
        <h2 className="text-base font-display font-semibold text-foreground">Referral Benefits</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>20% commission on subscriptions</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>15% commission on one-time purchases</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>90-day cookie tracking</span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center pb-4">
        Referral rewards are subject to program terms. D.O.M.E. does not provide legal advice.
      </p>
    </div>
  );
};

export default PortalReferralDashboard;
