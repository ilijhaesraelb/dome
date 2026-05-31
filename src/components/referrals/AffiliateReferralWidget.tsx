import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, DollarSign, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const AffiliateReferralWidget = () => {
  const { user } = useAuth();

  const { data: isAffiliate } = useQuery({
    queryKey: ["is-affiliate", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("affiliates")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return (count || 0) > 0;
    },
    enabled: !!user,
  });

  // Don't show if user is already an affiliate
  if (isAffiliate) return null;

  return (
    <Card className="border-2 border-dashed border-secondary/30 bg-gradient-to-r from-secondary/5 to-transparent hover:border-secondary/50 transition-colors">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
          <DollarSign className="w-6 h-6 text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Earn Money Referring Others</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Share D.O.M.E. and earn up to 30% commission on every referral.
          </p>
        </div>
        <Link to="/affiliate">
          <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-1.5 shrink-0">
            <Rocket className="w-3.5 h-3.5" /> Join <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default AffiliateReferralWidget;
