import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, MousePointer, ArrowRightLeft, DollarSign, TrendingUp } from "lucide-react";

const ReferralAnalyticsTab = () => {
  const { data: trialCount } = useQuery({
    queryKey: ["analytics-trial-count"],
    queryFn: async () => {
      const { count } = await supabase.from("trial_referrals").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: redemptionCount } = useQuery({
    queryKey: ["analytics-redemption-count"],
    queryFn: async () => {
      const { count } = await supabase.from("trial_referral_redemptions").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: affiliateCount } = useQuery({
    queryKey: ["analytics-affiliate-count"],
    queryFn: async () => {
      const { count } = await supabase.from("affiliates").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: clickCount } = useQuery({
    queryKey: ["analytics-click-count"],
    queryFn: async () => {
      const { count } = await supabase.from("affiliate_clicks").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: commissionTotal } = useQuery({
    queryKey: ["analytics-commission-total"],
    queryFn: async () => {
      const { data } = await supabase.from("affiliate_commissions").select("commission_amount");
      return data?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;
    },
  });

  const { data: attributionCount } = useQuery({
    queryKey: ["analytics-attribution-count"],
    queryFn: async () => {
      const { count } = await supabase.from("affiliate_attributions").select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const stats = [
    { label: "Active Trial Referrals", value: trialCount, icon: Users, color: "text-blue-600" },
    { label: "Total Redemptions", value: redemptionCount, icon: ArrowRightLeft, color: "text-green-600" },
    { label: "Active Affiliates", value: affiliateCount, icon: TrendingUp, color: "text-purple-600" },
    { label: "Total Clicks", value: clickCount, icon: MousePointer, color: "text-amber-600" },
    { label: "Attributed Users", value: attributionCount, icon: BarChart3, color: "text-indigo-600" },
    { label: "Total Commissions", value: `$${(commissionTotal || 0).toFixed(2)}`, icon: DollarSign, color: "text-emerald-600" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Detailed conversion analytics (trial→paid, clicks→signups, export revenue by source) will populate as referral activity grows.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralAnalyticsTab;
