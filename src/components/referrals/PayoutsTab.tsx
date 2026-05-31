import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, DollarSign, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const PayoutsTab = () => {
  const queryClient = useQueryClient();

  const { data: payouts, isLoading } = useQuery({
    queryKey: ["affiliate-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_payouts")
        .select("*, affiliates(display_name, affiliate_code)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updatePayout = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: any = { status };
      if (status === "paid") update.paid_at = new Date().toISOString();
      const { error } = await supabase
        .from("affiliate_payouts")
        .update(update)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliate-payouts"] });
      toast.success("Payout updated");
    },
  });

  const statusIcon = (s: string) => {
    if (s === "paid") return <CheckCircle className="w-3.5 h-3.5 text-green-600" />;
    if (s === "approved") return <Clock className="w-3.5 h-3.5 text-blue-600" />;
    if (s === "held" || s === "disputed") return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
    return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  const statusColor = (s: string) => {
    if (s === "paid") return "bg-green-100 text-green-800";
    if (s === "approved") return "bg-blue-100 text-blue-800";
    if (s === "held") return "bg-amber-100 text-amber-800";
    if (s === "disputed") return "bg-red-100 text-red-800";
    return "bg-muted text-muted-foreground";
  };

  const filterByStatus = (status?: string) =>
    payouts?.filter(p => !status || p.status === status) || [];

  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="approved">Approved</TabsTrigger>
        <TabsTrigger value="paid">Paid</TabsTrigger>
        <TabsTrigger value="held">Held</TabsTrigger>
      </TabsList>

      {["all", "pending", "approved", "paid", "held"].map(tab => (
        <TabsContent key={tab} value={tab}>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filterByStatus(tab === "all" ? undefined : tab).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No {tab === "all" ? "" : tab} payouts yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filterByStatus(tab === "all" ? undefined : tab).map(payout => (
                <Card key={payout.id}>
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {statusIcon(payout.status)}
                          <h3 className="font-semibold text-sm">{(payout as any).affiliates?.display_name}</h3>
                          <Badge className={`text-xs ${statusColor(payout.status)}`}>{payout.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="font-mono">{(payout as any).affiliates?.affiliate_code}</span>
                          <span>{format(new Date(payout.payout_period_start), "MMM d")} – {format(new Date(payout.payout_period_end), "MMM d, yyyy")}</span>
                          <span className="font-semibold text-foreground">${Number(payout.total_amount).toFixed(2)}</span>
                        </div>
                      </div>
                      {payout.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => updatePayout.mutate({ id: payout.id, status: "approved" })}>
                            Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updatePayout.mutate({ id: payout.id, status: "held" })}>
                            Hold
                          </Button>
                        </div>
                      )}
                      {payout.status === "approved" && (
                        <Button size="sm" onClick={() => updatePayout.mutate({ id: payout.id, status: "paid" })}>
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default PayoutsTab;
