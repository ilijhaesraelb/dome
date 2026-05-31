import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TrialApprovalsQueue = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pending, isLoading } = useQuery({
    queryKey: ["trial-pending-approvals"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_referral_redemptions")
        .select("*, trial_referrals(name, code, duration_days)")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: any = { status };
      if (status === "active") update.approved_by = user?.id;
      const { error } = await supabase
        .from("trial_referral_redemptions")
        .update(update)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trial-pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["trial-pending-count"] });
      toast.success("Request updated");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pending Approval Requests</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-center py-4 text-muted-foreground">Loading...</p>
        ) : !pending?.length ? (
          <p className="text-center py-8 text-muted-foreground">No pending requests</p>
        ) : (
          <div className="space-y-3">
            {pending.map(req => (
              <Card key={req.id}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{(req as any).trial_referrals?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Code: {(req as any).trial_referrals?.code} · Requested {format(new Date(req.created_at), "MMM d, yyyy")}
                      </p>
                      {req.organization_id && (
                        <p className="text-xs text-muted-foreground">Org: {req.organization_id}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-600 hover:text-green-700"
                        onClick={() => updateStatus.mutate({ id: req.id, status: "active" })}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => updateStatus.mutate({ id: req.id, status: "denied" })}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TrialApprovalsQueue;
