import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const DURATION_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "21", label: "21 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "6 months" },
  { value: "365", label: "1 year" },
];

const REFERRAL_TYPES = [
  { value: "customer", label: "Customer" },
  { value: "attorney", label: "Attorney" },
  { value: "accredited_representative", label: "Accredited Representative" },
  { value: "organization", label: "Organization" },
  { value: "general_public", label: "General Public" },
];

const ACTIVATION_MODES = [
  { value: "instant", label: "Instant activate" },
  { value: "approval_required", label: "Approval required" },
  { value: "invite_only", label: "Invite-only organization" },
];

const FEATURE_KEYS = [
  { key: "case_creation", label: "Case Creation" },
  { key: "voice_intake", label: "Voice-Assisted Intake" },
  { key: "document_uploads", label: "Document Uploads" },
  { key: "packet_building", label: "Packet Building" },
  { key: "tracking_dashboard", label: "Tracking Dashboard" },
  { key: "unlimited_exports", label: "Unlimited Exports" },
  { key: "premium_review", label: "Premium Review" },
  { key: "attorney_tools", label: "Attorney Submission Tools" },
  { key: "api_access", label: "API Access" },
  { key: "white_label", label: "White-Label Tools" },
  { key: "staff_seats", label: "Staff Seat Creation" },
  { key: "unlimited_storage", label: "Unlimited Storage" },
  { key: "premium_ai", label: "Premium AI" },
  { key: "attorney_collaboration", label: "Attorney Collaboration" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateTrialReferralDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [referralType, setReferralType] = useState("general_public");
  const [activationMode, setActivationMode] = useState("instant");
  const [durationDays, setDurationDays] = useState("30");
  const [maxUses, setMaxUses] = useState("");
  const [maxOrgs, setMaxOrgs] = useState("");
  const [maxUsersPerOrg, setMaxUsersPerOrg] = useState("");
  const [autoExpire, setAutoExpire] = useState(true);
  const [notes, setNotes] = useState("");
  const [features, setFeatures] = useState<Record<string, { enabled: boolean; limit?: number }>>(() => {
    const init: Record<string, { enabled: boolean; limit?: number }> = {};
    FEATURE_KEYS.forEach(f => {
      init[f.key] = { enabled: ["case_creation", "voice_intake", "document_uploads", "packet_building", "tracking_dashboard"].includes(f.key) };
    });
    return init;
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!name || !code || !user) throw new Error("Missing required fields");

      const { data: trial, error } = await supabase
        .from("trial_referrals")
        .insert({
          name,
          code: code.toUpperCase().replace(/\s/g, "-"),
          referral_type: referralType as any,
          activation_mode: activationMode as any,
          duration_days: parseInt(durationDays),
          max_uses: maxUses ? parseInt(maxUses) : null,
          max_orgs: maxOrgs ? parseInt(maxOrgs) : null,
          max_users_per_org: maxUsersPerOrg ? parseInt(maxUsersPerOrg) : null,
          auto_expire: autoExpire,
          notes: notes || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert feature rules
      const featureRows = Object.entries(features).map(([key, val]) => ({
        trial_referral_id: trial.id,
        feature_key: key,
        is_enabled: val.enabled,
        usage_limit: val.limit || null,
      }));

      const { error: featErr } = await supabase
        .from("trial_referral_feature_rules")
        .insert(featureRows);

      if (featErr) throw featErr;
      return trial;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trial-referrals"] });
      toast.success("Trial referral created!");
      onOpenChange(false);
      // Reset form
      setName(""); setCode(""); setNotes("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Access Referral</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Referral Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="30-Day Attorney Trial" />
            </div>
            <div className="space-y-2">
              <Label>Referral Code</Label>
              <Input value={code} onChange={e => setCode(e.target.value)} placeholder="ATTORNEY30-NY" className="font-mono uppercase" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Referral Type</Label>
              <Select value={referralType} onValueChange={setReferralType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REFERRAL_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Activation Mode</Label>
              <Select value={activationMode} onValueChange={setActivationMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVATION_MODES.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trial Length</Label>
              <Select value={durationDays} onValueChange={setDurationDays}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Unlimited" />
            </div>
            <div className="space-y-2">
              <Label>Max Organizations</Label>
              <Input type="number" value={maxOrgs} onChange={e => setMaxOrgs(e.target.value)} placeholder="Unlimited" />
            </div>
            <div className="space-y-2">
              <Label>Max Users/Org</Label>
              <Input type="number" value={maxUsersPerOrg} onChange={e => setMaxUsersPerOrg(e.target.value)} placeholder="Unlimited" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={autoExpire} onCheckedChange={setAutoExpire} />
            <Label>Auto-expire on end date</Label>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Allowed Features</Label>
            <div className="grid grid-cols-2 gap-2">
              {FEATURE_KEYS.map(f => (
                <div key={f.key} className="flex items-center gap-2 rounded-lg border p-2">
                  <Switch
                    checked={features[f.key]?.enabled || false}
                    onCheckedChange={checked => setFeatures(prev => ({ ...prev, [f.key]: { ...prev[f.key], enabled: checked } }))}
                  />
                  <span className="text-sm flex-1">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal memo..." rows={2} />
          </div>

          <Button onClick={() => create.mutate()} disabled={!name || !code || create.isPending} className="w-full">
            {create.isPending ? "Creating..." : "Create Referral"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTrialReferralDialog;
