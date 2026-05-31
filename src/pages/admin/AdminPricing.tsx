/**
 * Admin Pricing Configuration Page — Manage all D.O.M.E. product prices.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign, Save, Loader2, CheckCircle2, Tag, Building2, Users, Briefcase,
} from "lucide-react";
import BackButton from "@/components/BackButton";

interface PricingRow {
  id: string;
  product_key: string;
  display_name: string;
  description: string | null;
  price_cents: number;
  category: string;
  is_active: boolean;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
}

const CATEGORY_META: Record<string, { label: string; icon: typeof DollarSign; color: string }> = {
  individual: { label: "Individual", icon: Users, color: "bg-primary/10 text-primary" },
  nonprofit: { label: "Nonprofit", icon: Building2, color: "bg-secondary/10 text-secondary" },
  professional: { label: "Professional", icon: Briefcase, color: "bg-accent text-accent-foreground" },
};

const AdminPricing = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [edits, setEdits] = useState<Record<string, Partial<PricingRow>>>({});

  const { data: pricing, isLoading } = useQuery({
    queryKey: ["admin-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_pricing")
        .select("*")
        .order("category")
        .order("price_cents");
      if (error) throw error;
      return (data || []) as PricingRow[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (row: PricingRow) => {
      const updates = edits[row.id] || {};
      const { error } = await supabase
        .from("product_pricing")
        .update({
          display_name: updates.display_name ?? row.display_name,
          price_cents: updates.price_cents ?? row.price_cents,
          is_active: updates.is_active ?? row.is_active,
          stripe_price_id: updates.stripe_price_id ?? row.stripe_price_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: (_, row) => {
      setEdits(prev => { const n = { ...prev }; delete n[row.id]; return n; });
      queryClient.invalidateQueries({ queryKey: ["admin-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["product-pricing"] });
      toast({ title: "Price updated", description: `${row.display_name} saved.` });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const getEdited = (row: PricingRow) => ({
    ...row,
    ...edits[row.id],
  });

  const setEdit = (id: string, field: string, value: any) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const hasChanges = (id: string) => !!edits[id] && Object.keys(edits[id]).length > 0;

  const grouped = (pricing || []).reduce<Record<string, PricingRow[]>>((acc, row) => {
    (acc[row.category] = acc[row.category] || []).push(row);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Tag className="w-6 h-6 text-secondary" /> Pricing Configuration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set prices for all D.O.M.E. products. Changes take effect immediately.
          </p>
        </div>
      </div>

      {Object.entries(grouped).map(([category, rows]) => {
        const meta = CATEGORY_META[category] || { label: category, icon: DollarSign, color: "bg-muted text-muted-foreground" };
        const Icon = meta.icon;
        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge className={`${meta.color} border-0 gap-1`}>
                  <Icon className="w-3.5 h-3.5" /> {meta.label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {rows.map(row => {
                  const edited = getEdited(row);
                  const changed = hasChanges(row.id);
                  return (
                    <div key={row.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <Input
                          value={edited.display_name}
                          onChange={e => setEdit(row.id, "display_name", e.target.value)}
                          className="font-semibold text-sm h-8 border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:border-b focus-visible:border-primary"
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{row.product_key}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={(edited.price_cents / 100).toFixed(2)}
                            onChange={e => setEdit(row.id, "price_cents", Math.round(parseFloat(e.target.value || "0") * 100))}
                            className="w-24 h-8 text-sm text-right"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Active</span>
                          <Switch
                            checked={edited.is_active}
                            onCheckedChange={v => setEdit(row.id, "is_active", v)}
                          />
                        </div>

                        <Button
                          size="sm"
                          variant={changed ? "default" : "ghost"}
                          disabled={!changed || saveMutation.isPending}
                          onClick={() => saveMutation.mutate(row)}
                          className="h-8 gap-1"
                        >
                          {saveMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : changed ? (
                            <><Save className="w-3.5 h-3.5" /> Save</>
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card className="bg-muted/30">
        <CardContent className="p-4 text-xs text-muted-foreground">
          <p><strong>Note:</strong> Price changes apply to new transactions only. Existing subscriptions are managed through Stripe. To connect a product to Stripe, add the Stripe Price ID and Product ID to the corresponding row.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPricing;
