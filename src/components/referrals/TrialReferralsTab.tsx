import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Copy, Pause, Play, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import CreateTrialReferralDialog from "./CreateTrialReferralDialog";
import TrialApprovalsQueue from "./TrialApprovalsQueue";

const TrialReferralsTab = () => {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const queryClient = useQueryClient();

  const { data: trials, isLoading } = useQuery({
    queryKey: ["trial-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_referrals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pendingCount } = useQuery({
    queryKey: ["trial-pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("trial_referral_redemptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("trial_referrals")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trial-referrals"] });
      toast.success("Referral updated");
    },
  });

  const filtered = trials?.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.code.toLowerCase().includes(search.toLowerCase())
  );

  const durationLabel = (days: number) => {
    if (days <= 7) return "7 days";
    if (days <= 21) return "21 days";
    if (days <= 30) return "30 days";
    if (days <= 60) return "60 days";
    if (days <= 90) return "90 days";
    if (days <= 180) return "6 months";
    return "1 year";
  };

  const typeColor = (type: string) => {
    const map: Record<string, string> = {
      customer: "bg-blue-100 text-blue-800",
      attorney: "bg-purple-100 text-purple-800",
      accredited_representative: "bg-indigo-100 text-indigo-800",
      organization: "bg-amber-100 text-amber-800",
      general_public: "bg-green-100 text-green-800",
    };
    return map[type] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search referrals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowApprovals(true)} className="relative">
            Approvals
            {pendingCount && pendingCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
                {pendingCount}
              </Badge>
            )}
          </Button>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Referral
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : !filtered?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No trial referrals yet. Create your first one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map(trial => (
            <Card key={trial.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{trial.name}</h3>
                      <Badge variant={trial.is_active ? "default" : "secondary"} className="text-xs">
                        {trial.is_active ? "Active" : "Paused"}
                      </Badge>
                      <Badge className={`text-xs ${typeColor(trial.referral_type)}`}>
                        {trial.referral_type.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="font-mono bg-muted px-2 py-0.5 rounded">{trial.code}</span>
                      <span>{durationLabel(trial.duration_days)}</span>
                      <span>{trial.activation_mode === "approval_required" ? "Approval Required" : trial.activation_mode === "invite_only" ? "Invite Only" : "Instant"}</span>
                      {trial.max_uses && <span>Max: {trial.max_uses} uses</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/r/${trial.code}`);
                        toast.success("Link copied!");
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleActive.mutate({ id: trial.id, is_active: !trial.is_active })}
                    >
                      {trial.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTrialReferralDialog open={showCreate} onOpenChange={setShowCreate} />
      <TrialApprovalsQueue open={showApprovals} onOpenChange={setShowApprovals} />
    </div>
  );
};

export default TrialReferralsTab;
