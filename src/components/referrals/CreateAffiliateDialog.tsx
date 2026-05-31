import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateAffiliateDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("individual");
  const [payoutModel, setPayoutModel] = useState("hybrid");
  const [exportPct, setExportPct] = useState("20");
  const [subPct, setSubPct] = useState("20");
  const [termMonths, setTermMonths] = useState("12");
  const [attributionDays, setAttributionDays] = useState("60");
  const [minPayout, setMinPayout] = useState("25");
  const [notes, setNotes] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      if (!displayName || !affiliateCode) throw new Error("Missing required fields");
      const { error } = await supabase
        .from("affiliates")
        .insert({
          display_name: displayName,
          affiliate_code: affiliateCode.toUpperCase().replace(/\s/g, "-"),
          email: email || null,
          type,
          payout_model: payoutModel as any,
          export_commission_pct: parseFloat(exportPct),
          subscription_commission_pct: parseFloat(subPct),
          payout_term_months: parseInt(termMonths),
          attribution_window_days: parseInt(attributionDays),
          min_payout_amount: parseFloat(minPayout),
          notes: notes || null,
          created_by: user?.id || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["affiliates"] });
      toast.success("Affiliate created!");
      onOpenChange(false);
      setDisplayName(""); setAffiliateCode(""); setEmail(""); setNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Partner Affiliate</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label>Affiliate Code</Label>
              <Input value={affiliateCode} onChange={e => setAffiliateCode(e.target.value)} placeholder="JANE-REF" className="font-mono uppercase" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="attorney">Attorney</SelectItem>
                  <SelectItem value="nonprofit">Nonprofit</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payout Model</Label>
            <Select value={payoutModel} onValueChange={setPayoutModel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hybrid">Hybrid (Export + Subscription)</SelectItem>
                <SelectItem value="export_only">Export Only</SelectItem>
                <SelectItem value="subscription_only">Subscription Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Export Commission %</Label>
              <Input type="number" value={exportPct} onChange={e => setExportPct(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subscription Commission %</Label>
              <Input type="number" value={subPct} onChange={e => setSubPct(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Term (months)</Label>
              <Input type="number" value={termMonths} onChange={e => setTermMonths(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Attribution (days)</Label>
              <Input type="number" value={attributionDays} onChange={e => setAttributionDays(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Min Payout ($)</Label>
              <Input type="number" value={minPayout} onChange={e => setMinPayout(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes..." rows={2} />
          </div>

          <Button onClick={() => create.mutate()} disabled={!displayName || !affiliateCode || create.isPending} className="w-full">
            {create.isPending ? "Creating..." : "Create Affiliate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAffiliateDialog;
