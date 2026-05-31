import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Copy, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import CreateAffiliateDialog from "./CreateAffiliateDialog";

const AffiliatesTab = () => {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: affiliates, isLoading } = useQuery({
    queryKey: ["affiliates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("affiliates")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
      toast.success("Affiliate updated");
    },
  });

  const filtered = affiliates?.filter(a =>
    a.display_name.toLowerCase().includes(search.toLowerCase()) ||
    a.affiliate_code.toLowerCase().includes(search.toLowerCase())
  );

  const payoutModelLabel = (m: string) => {
    if (m === "export_only") return "Export Only";
    if (m === "subscription_only") return "Subscription Only";
    return "Hybrid";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search affiliates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Create Affiliate
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : !filtered?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No affiliates yet. Create your first partner.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(aff => (
            <Card key={aff.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{aff.display_name}</h3>
                      <Badge variant={aff.is_active ? "default" : "secondary"} className="text-xs">
                        {aff.is_active ? "Active" : "Paused"}
                      </Badge>
                      {aff.fraud_hold && <Badge variant="destructive" className="text-xs">Fraud Hold</Badge>}
                      <Badge variant="outline" className="text-xs">{payoutModelLabel(aff.payout_model)}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-mono bg-muted px-2 py-0.5 rounded">{aff.affiliate_code}</span>
                      <span>Export: {aff.export_commission_pct}%</span>
                      <span>Sub: {aff.subscription_commission_pct}%</span>
                      <span>{aff.payout_term_months}mo term</span>
                      <span>{aff.attribution_window_days}d attribution</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/r/${aff.affiliate_code}`);
                      toast.success("Link copied!");
                    }}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive.mutate({ id: aff.id, is_active: !aff.is_active })}>
                      {aff.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateAffiliateDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
};

export default AffiliatesTab;
