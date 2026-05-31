/**
 * Screen 3 — Tax Profile Setup
 */
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { User, Building2, Heart, HelpCircle } from "lucide-react";
import TaxFlowLayout from "@/components/tax-help/TaxFlowLayout";

const FILING_STATUSES = [
  { value: "single", label: "Single" },
  { value: "married_filing_jointly", label: "Married Filing Jointly" },
  { value: "married_filing_separately", label: "Married Filing Separately" },
  { value: "head_of_household", label: "Head of Household" },
  { value: "qualifying_widow", label: "Qualifying Surviving Spouse" },
];

const ORG_TYPES = [
  { value: "501c3", label: "501(c)(3)" }, { value: "501c4", label: "501(c)(4)" },
  { value: "501c6", label: "501(c)(6)" }, { value: "other_exempt", label: "Other Exempt" },
  { value: "llc", label: "LLC" }, { value: "s_corp", label: "S-Corporation" },
  { value: "c_corp", label: "C-Corporation" }, { value: "partnership", label: "Partnership" },
  { value: "sole_proprietor", label: "Sole Proprietor" },
];

const TaxProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const taxFileId = searchParams.get("file");
  const profileType = searchParams.get("type") || "individual";
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [clientId, setClientId] = useState<string | null>(null);
  const [form, setForm] = useState({
    legal_first_name: "", legal_last_name: "", dob: "", email: user?.email || "",
    phone: "", address_street: "", address_city: "", address_state: "", address_zip: "",
    filing_status: "single", dependents_count: "0", has_prior_return: false,
    organization_name: "", ein: "", organization_type: "", officer_name: "", officer_title: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: tc } = await supabase.from("tax_clients").select("*").eq("user_id", user.id).maybeSingle();
      if (tc) {
        setClientId(tc.id);
        setForm(prev => ({
          ...prev,
          legal_first_name: tc.legal_first_name || "", legal_last_name: tc.legal_last_name || "",
          dob: tc.date_of_birth || "", email: tc.email || user.email || "",
          phone: tc.phone || "", address_street: tc.address_street || "",
          address_city: tc.address_city || "", address_state: tc.address_state || "",
          address_zip: tc.address_zip || "", filing_status: tc.filing_status || "single",
          dependents_count: String(tc.dependents_count || 0),
          organization_name: tc.organization_name || "", ein: tc.ein_encrypted || "",
          organization_type: tc.organization_type || "", officer_name: tc.officer_name || "",
        }));
      }
    })();
  }, [user]);

  const set = (k: string, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setSaveStatus("saving");
    try {
      const payload: any = {
        legal_first_name: form.legal_first_name, legal_last_name: form.legal_last_name,
        date_of_birth: form.dob || null, email: form.email, phone: form.phone || null,
        address_street: form.address_street || null, address_city: form.address_city || null,
        address_state: form.address_state || null, address_zip: form.address_zip || null,
        filing_status: form.filing_status || null, dependents_count: parseInt(form.dependents_count) || 0,
        organization_name: form.organization_name || null, ein_encrypted: form.ein || null,
        organization_type: form.organization_type || null, officer_name: form.officer_name || null,
      };
      if (clientId) {
        await supabase.from("tax_clients").update(payload).eq("id", clientId);
      } else {
        const { data, error } = await supabase.from("tax_clients").insert({
          ...payload, user_id: user!.id,
          tax_user_type: profileType.startsWith("nonprofit") ? "nonprofit" : profileType === "small_business" ? "small_business" : "individual",
        }).select("id").single();
        if (error) throw error;
        setClientId(data.id);
      }
      setSaveStatus("saved");
      toast({ title: "Profile saved!" });
    } catch (err: any) {
      setSaveStatus("idle");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleNext = async () => {
    await handleSave();
    if (taxFileId) navigate(`/tax/documents/upload?file=${taxFileId}`);
    else navigate("/tax/dashboard");
  };

  const isIndividual = profileType === "individual" || profileType === "small_business";
  const isNonprofit = profileType.startsWith("nonprofit");
  const isBusiness = ["small_business", "corporate_1120", "partnership_1065"].includes(profileType);

  const SectionHeader = ({ icon: Icon, label }: { icon: any; label: string }) => (
    <div className="flex items-center gap-2 mb-3 pt-2">
      <Icon className="w-4 h-4 text-primary" />
      <p className="font-semibold text-sm">{label}</p>
      <button className="ml-auto text-muted-foreground hover:text-primary"><HelpCircle className="w-3.5 h-3.5" /></button>
    </div>
  );

  return (
    <TaxFlowLayout
      currentStep={2}
      title={`${isNonprofit ? "Nonprofit" : isBusiness ? "Business" : "Individual"} Tax Profile`}
      subtitle="Complete your profile before uploading documents."
      taxFileId={taxFileId || undefined}
      onNext={handleNext}
      onSave={handleSave}
      nextLabel="Save & Continue to Documents"
      nextDisabled={saving}
      saveStatus={saveStatus}
    >
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-display font-bold">
            {isNonprofit ? "Nonprofit" : isBusiness ? "Business" : "Individual"} Tax Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Complete your profile before uploading documents.</p>
        </div>

        {/* Personal Info */}
        {(isIndividual || !isNonprofit) && (
          <Card>
            <CardContent className="p-5">
              <SectionHeader icon={User} label="Personal Information" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label>Legal First Name *</Label><Input value={form.legal_first_name} onChange={e => set("legal_first_name", e.target.value)} /></div>
                <div><Label>Legal Last Name *</Label><Input value={form.legal_last_name} onChange={e => set("legal_last_name", e.target.value)} /></div>
                <div><Label>Date of Birth</Label><Input type="date" value={form.dob} onChange={e => set("dob", e.target.value)} /></div>
                <div><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
                {isIndividual && !isBusiness && (
                  <div>
                    <Label>Filing Status</Label>
                    <Select value={form.filing_status} onValueChange={v => set("filing_status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{FILING_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                {isIndividual && !isBusiness && (
                  <div><Label>Number of Dependents</Label><Input type="number" value={form.dependents_count} onChange={e => set("dependents_count", e.target.value)} min="0" /></div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organization Info */}
        {(isNonprofit || isBusiness) && (
          <Card>
            <CardContent className="p-5">
              <SectionHeader icon={isNonprofit ? Heart : Building2} label={`${isNonprofit ? "Organization" : "Business"} Information`} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2"><Label>{isNonprofit ? "Organization" : "Business"} Legal Name *</Label><Input value={form.organization_name} onChange={e => set("organization_name", e.target.value)} /></div>
                <div><Label>EIN</Label><Input value={form.ein} onChange={e => set("ein", e.target.value)} placeholder="XX-XXXXXXX" /></div>
                <div>
                  <Label>{isNonprofit ? "Organization" : "Entity"} Type</Label>
                  <Select value={form.organization_type} onValueChange={v => set("organization_type", v)}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{ORG_TYPES.filter(t => isNonprofit ? t.value.startsWith("501") || t.value === "other_exempt" : !t.value.startsWith("501")).map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Principal Officer Name</Label><Input value={form.officer_name} onChange={e => set("officer_name", e.target.value)} /></div>
                <div><Label>Officer Title</Label><Input value={form.officer_title} onChange={e => set("officer_title", e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Address */}
        <Card>
          <CardContent className="p-5">
            <SectionHeader icon={User} label="Address" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><Label>Street</Label><Input value={form.address_street} onChange={e => set("address_street", e.target.value)} /></div>
              <div><Label>City</Label><Input value={form.address_city} onChange={e => set("address_city", e.target.value)} /></div>
              <div><Label>State</Label><Input value={form.address_state} onChange={e => set("address_state", e.target.value)} /></div>
              <div><Label>ZIP</Label><Input value={form.address_zip} onChange={e => set("address_zip", e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        {/* Prior Return */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Do you have a prior year tax return?</p>
                <p className="text-xs text-muted-foreground">Upload it in the next step for AI analysis</p>
              </div>
              <Switch checked={form.has_prior_return} onCheckedChange={v => set("has_prior_return", v)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </TaxFlowLayout>
  );
};

export default TaxProfileSetup;
