import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy, MousePointer, Users, DollarSign, TrendingUp, Clock, CheckCircle,
  Share2, QrCode, Twitter, Facebook, Linkedin, Mail, Download, Loader2,
  Rocket, ArrowRight, Wallet, Trophy, Star, Crown, MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { Link, useNavigate } from "react-router-dom";
import domeLogo from "@/assets/dome-logo.png";

/* ─── helpers ─── */
function getAffiliateTier(referralCount: number) {
  if (referralCount >= 200) return { name: "Ambassador", level: 3, icon: Crown, commission: 30, color: "text-primary", next: null };
  if (referralCount >= 50) return { name: "Partner", level: 2, icon: Trophy, commission: 25, color: "text-warning", next: { name: "Ambassador", need: 200 } };
  return { name: "Affiliate", level: 1, icon: Star, commission: 20, color: "text-secondary", next: { name: "Partner", need: 50 } };
}

const AffiliateDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showQR, setShowQR] = useState(false);

  const { data: affiliate, isLoading } = useQuery({
    queryKey: ["my-affiliate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: clicks } = useQuery({
    queryKey: ["my-clicks", affiliate?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("affiliate_clicks")
        .select("*", { count: "exact", head: true })
        .eq("affiliate_id", affiliate!.id);
      return count || 0;
    },
    enabled: !!affiliate,
  });

  const { data: attributions } = useQuery({
    queryKey: ["my-attributions", affiliate?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("affiliate_attributions")
        .select("*", { count: "exact", head: true })
        .eq("affiliate_id", affiliate!.id);
      return count || 0;
    },
    enabled: !!affiliate,
  });

  const { data: commissions } = useQuery({
    queryKey: ["my-commissions", affiliate?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_commissions")
        .select("*")
        .eq("affiliate_id", affiliate!.id)
        .order("earned_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!affiliate,
  });

  const { data: payouts } = useQuery({
    queryKey: ["my-payouts", affiliate?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliate_payouts")
        .select("*")
        .eq("affiliate_id", affiliate!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!affiliate,
  });

  /* ─── leaderboard: top 10 affiliates by attribution count ─── */
  const { data: leaderboard } = useQuery({
    queryKey: ["affiliate-leaderboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("affiliates")
        .select("id, display_name, affiliate_code")
        .eq("is_active", true)
        .limit(50);
      if (!data?.length) return [];

      // get attribution counts per affiliate
      const counts: { id: string; name: string; referrals: number }[] = [];
      for (const a of data) {
        const { count } = await supabase
          .from("affiliate_attributions")
          .select("*", { count: "exact", head: true })
          .eq("affiliate_id", a.id);
        counts.push({ id: a.id, name: a.display_name, referrals: count || 0 });
      }
      return counts.sort((a, b) => b.referrals - a.referrals).slice(0, 10);
    },
    enabled: !!affiliate,
    staleTime: 60_000,
  });

  const requestPayoutMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { error } = await supabase.from("affiliate_payouts").insert({
        affiliate_id: affiliate!.id,
        total_amount: pendingEarnings,
        payout_period_start: periodStart.toISOString().split("T")[0],
        payout_period_end: periodEnd.toISOString().split("T")[0],
        status: "pending" as any,
        notes: "Payout requested by affiliate",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payout requested! Admin will review shortly.");
      queryClient.invalidateQueries({ queryKey: ["my-payouts"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  if (!affiliate) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center space-y-6 mt-12">
        <Rocket className="w-16 h-16 text-secondary mx-auto" />
        <h1 className="text-2xl font-display font-bold">Join the D.O.M.E. Affiliate Program</h1>
        <p className="text-muted-foreground">You don't have an affiliate account yet. Sign up to start earning commissions.</p>
        <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2" size="lg"
          onClick={() => navigate("/affiliate")}>
          <Rocket className="w-4 h-4" /> Become an Affiliate <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  const totalEarned = commissions?.reduce((s, c) => s + Number(c.commission_amount), 0) || 0;
  const pendingEarnings = commissions?.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.commission_amount), 0) || 0;
  const referralLink = `${window.location.origin}/r/${affiliate.affiliate_code}`;
  const tier = getAffiliateTier(attributions || 0);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link copied!");
  };

  const shareUrl = encodeURIComponent(referralLink);
  const shareText = encodeURIComponent("Try D.O.M.E. to organize immigration documents and discover your pathway. Get 30 days free using my link! 🚀");

  const emailTemplate = `Subject: Try D.O.M.E. — Get 30 Days Free!

Hi there,

I've been using D.O.M.E. and thought you might find it helpful. It's a platform that makes immigration processes easier with smart forms, document management, and AI assistance.

Sign up with my link and get 30 days of free access: ${referralLink}

Best regards`;

  const socialPost = `🚀 D.O.M.E. is changing how immigration works! Smart forms, AI assistance, and document management all in one place. Get 30 days FREE: ${referralLink} #immigration #DOME`;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Affiliate Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {affiliate.display_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-xs">
            <tier.icon className={`w-3.5 h-3.5 ${tier.color}`} />
            {tier.name} — {tier.commission}%
          </Badge>
          <Badge variant={affiliate.is_active ? "default" : "destructive"} className="text-xs">
            {affiliate.is_active ? "Active" : "Suspended"}
          </Badge>
        </div>
      </div>

      {/* Tier progress */}
      {tier.next && (
        <Card className="border-dashed border-secondary/40">
          <CardContent className="p-4 flex items-center gap-3 text-sm">
            <Trophy className="w-5 h-5 text-warning shrink-0" />
            <span className="text-muted-foreground">
              <strong>{tier.next.need - (attributions || 0)}</strong> more referrals to reach <strong>{tier.next.name}</strong> level and unlock <strong>{tier.commission + 5}%</strong> commissions.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Clicks", value: clicks, icon: MousePointer, color: "text-blue-600" },
          { label: "Referred Users", value: attributions, icon: Users, color: "text-purple-600" },
          { label: "Pending Earnings", value: `$${pendingEarnings.toFixed(2)}`, icon: Clock, color: "text-amber-600" },
          { label: "Total Earned", value: `$${totalEarned.toFixed(2)}`, icon: DollarSign, color: "text-green-600" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-xl font-bold">{stat.value ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="link" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="link" className="gap-1.5 text-xs sm:text-sm">
            <Share2 className="w-3.5 h-3.5" /> Link
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5 text-xs sm:text-sm">
            <TrendingUp className="w-3.5 h-3.5" /> Activity
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-1.5 text-xs sm:text-sm">
            <Wallet className="w-3.5 h-3.5" /> Payouts
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-1.5 text-xs sm:text-sm">
            <Trophy className="w-3.5 h-3.5" /> Leaders
          </TabsTrigger>
          <TabsTrigger value="promo" className="gap-1.5 text-xs sm:text-sm">
            <Rocket className="w-3.5 h-3.5" /> Promo
          </TabsTrigger>
        </TabsList>

        {/* Referral Link Tab */}
        <TabsContent value="link" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Your Referral Link</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted/50 rounded-lg px-4 py-3 text-sm font-mono truncate">{referralLink}</code>
                <Button onClick={copyLink} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shrink-0 gap-1.5">
                  <Copy className="w-4 h-4" /> Copy
                </Button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setShowQR(!showQR)} className="gap-1.5">
                  <QrCode className="w-4 h-4" /> {showQR ? "Hide" : "Show"} QR Code
                </Button>
                <a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noopener">
                  <Button variant="outline" size="icon" className="w-9 h-9" title="WhatsApp"><MessageCircle className="w-4 h-4" /></Button>
                </a>
                <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noopener">
                  <Button variant="outline" size="icon" className="w-9 h-9" title="Twitter/X"><Twitter className="w-4 h-4" /></Button>
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener">
                  <Button variant="outline" size="icon" className="w-9 h-9" title="Facebook"><Facebook className="w-4 h-4" /></Button>
                </a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noopener">
                  <Button variant="outline" size="icon" className="w-9 h-9" title="LinkedIn"><Linkedin className="w-4 h-4" /></Button>
                </a>
                <a href={`mailto:?subject=Try D.O.M.E. — 30 Days Free!&body=${encodeURIComponent(`Check out D.O.M.E. and get 30 days free: ${referralLink}`)}`}>
                  <Button variant="outline" size="icon" className="w-9 h-9" title="Email"><Mail className="w-4 h-4" /></Button>
                </a>
              </div>

              {showQR && (
                <div className="flex justify-center py-4">
                  <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <QRCodeSVG value={referralLink} size={180} level="H"
                      imageSettings={{ src: domeLogo, x: undefined, y: undefined, height: 36, width: 36, excavate: true }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Commission Terms</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ["Subscription Commission", `${tier.commission}%`],
                ["Export Commission", `${Math.max(15, tier.commission - 5)}%`],
                ["Cookie Duration", `${affiliate.cookie_duration_days} days`],
                ["Commission Term", `${affiliate.payout_term_months} months`],
                ["Min Payout", `$${Number(affiliate.min_payout_amount).toFixed(2)}`],
                ["Current Tier", tier.name],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Commissions</CardTitle></CardHeader>
            <CardContent>
              {!commissions?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">No commissions yet. Share your link to start earning!</p>
              ) : (
                <div className="space-y-2">
                  {commissions.map(c => (
                    <div key={c.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{c.revenue_type}</Badge>
                        <span className="text-muted-foreground">{format(new Date(c.earned_at), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${Number(c.commission_amount).toFixed(2)}</span>
                        <Badge className={`text-xs ${
                          c.status === "paid" ? "bg-green-100 text-green-800" :
                          c.status === "pending" ? "bg-amber-100 text-amber-800" :
                          "bg-muted text-muted-foreground"
                        }`}>{c.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Request Payout</CardTitle>
              <Button
                size="sm"
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-1.5"
                disabled={pendingEarnings < Number(affiliate.min_payout_amount) || requestPayoutMutation.isPending}
                onClick={() => requestPayoutMutation.mutate()}
              >
                {requestPayoutMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                Request Payout
              </Button>
            </CardHeader>
            <CardContent>
              {pendingEarnings < Number(affiliate.min_payout_amount) ? (
                <p className="text-sm text-muted-foreground">
                  You need at least ${Number(affiliate.min_payout_amount).toFixed(2)} in pending earnings to request a payout.
                  Current pending: <strong>${pendingEarnings.toFixed(2)}</strong>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You have <strong>${pendingEarnings.toFixed(2)}</strong> available for payout.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Payout History</CardTitle></CardHeader>
            <CardContent>
              {!payouts?.length ? (
                <p className="text-sm text-muted-foreground text-center py-6">No payouts yet.</p>
              ) : (
                <div className="space-y-2">
                  {payouts.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                      <span>{format(new Date(p.payout_period_start), "MMM d")} – {format(new Date(p.payout_period_end), "MMM d, yyyy")}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${Number(p.total_amount).toFixed(2)}</span>
                        <Badge className={`text-xs ${
                          p.status === "paid" ? "bg-green-100 text-green-800" :
                          p.status === "pending" ? "bg-amber-100 text-amber-800" :
                          "bg-muted text-muted-foreground"
                        }`}>{p.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" /> Top Community Ambassadors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!leaderboard?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">No leaderboard data yet. Be the first to climb the ranks!</p>
              ) : (
                <div className="space-y-1">
                  {leaderboard.map((entry, i) => {
                    const entryTier = getAffiliateTier(entry.referrals);
                    const isMe = affiliate?.id === entry.id;
                    return (
                      <div key={entry.id} className={`flex items-center justify-between text-sm py-3 px-3 rounded-lg ${isMe ? "bg-secondary/10 border border-secondary/30" : i % 2 === 0 ? "bg-muted/30" : ""}`}>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-lg w-8 text-center ${i === 0 ? "text-warning" : i === 1 ? "text-muted-foreground" : i === 2 ? "text-orange-600" : "text-muted-foreground"}`}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                          </span>
                          <div>
                            <span className="font-medium text-foreground">{entry.name}{isMe && " (You)"}</span>
                            <div className="flex items-center gap-1.5">
                              <entryTier.icon className={`w-3 h-3 ${entryTier.color}`} />
                              <span className="text-xs text-muted-foreground">{entryTier.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-foreground">{entry.referrals}</span>
                          <p className="text-xs text-muted-foreground">referrals</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promo Tools Tab */}
        <TabsContent value="promo" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Pre-Written Social Post</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap">{socialPost}</div>
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(socialPost);
                toast.success("Social post copied!");
              }} className="gap-1.5">
                <Copy className="w-3.5 h-3.5" /> Copy Post
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Email Template</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">{emailTemplate}</div>
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(emailTemplate);
                toast.success("Email template copied!");
              }} className="gap-1.5">
                <Copy className="w-3.5 h-3.5" /> Copy Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Quick Share</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noopener">
                  <Button variant="outline" className="gap-2"><MessageCircle className="w-4 h-4" /> WhatsApp</Button>
                </a>
                <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noopener">
                  <Button variant="outline" className="gap-2"><Twitter className="w-4 h-4" /> Twitter / X</Button>
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noopener">
                  <Button variant="outline" className="gap-2"><Facebook className="w-4 h-4" /> Facebook</Button>
                </a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noopener">
                  <Button variant="outline" className="gap-2"><Linkedin className="w-4 h-4" /> LinkedIn</Button>
                </a>
                <a href={`mailto:?subject=Try D.O.M.E. — 30 Days Free!&body=${encodeURIComponent(`Get 30 days free on D.O.M.E.: ${referralLink}`)}`}>
                  <Button variant="outline" className="gap-2"><Mail className="w-4 h-4" /> Email</Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AffiliateDashboard;
