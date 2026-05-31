import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Gift, Users, BarChart3, DollarSign } from "lucide-react";
import TrialReferralsTab from "@/components/referrals/TrialReferralsTab";
import AffiliatesTab from "@/components/referrals/AffiliatesTab";
import ReferralAnalyticsTab from "@/components/referrals/ReferralAnalyticsTab";
import PayoutsTab from "@/components/referrals/PayoutsTab";
import { useT } from "@/hooks/useT";

const AdminReferrals = () => {
  const t = useT();
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{t("adminRef.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("adminRef.subtitle")}</p>
      </div>

      <Tabs defaultValue="trials" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="trials" className="gap-2">
            <Gift className="w-4 h-4" />
            {t("adminRef.accessReferrals")}
          </TabsTrigger>
          <TabsTrigger value="affiliates" className="gap-2">
            <Users className="w-4 h-4" />
            {t("adminRef.partnerEarnings")}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            {t("adminRef.analytics")}
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-2">
            <DollarSign className="w-4 h-4" />
            {t("adminRef.payouts")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trials">
          <TrialReferralsTab />
        </TabsContent>
        <TabsContent value="affiliates">
          <AffiliatesTab />
        </TabsContent>
        <TabsContent value="analytics">
          <ReferralAnalyticsTab />
        </TabsContent>
        <TabsContent value="payouts">
          <PayoutsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReferrals;
