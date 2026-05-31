/**
 * Screen 2 — Tax Service Mode Selection: user type + service mode.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Building2, Briefcase, CheckCircle2, Heart } from "lucide-react";
import TaxFlowLayout from "@/components/tax-help/TaxFlowLayout";

const USER_TYPES = [
  { value: "individual", label: "Individual", desc: "Personal income tax filing", icon: User },
  { value: "small_business", label: "Business / Organization", desc: "LLC, S-Corp, C-Corp, Partnership", icon: Building2 },
  { value: "nonprofit", label: "Nonprofit", desc: "990-N, 990-EZ, exempt organizations", icon: Heart },
];

const SERVICE_MODES = [
  { value: "self_prepare", label: "Self-Prepare", desc: "Complete on your own with guided tools", icon: "📝" },
  { value: "guided_self_service", label: "Guided Self-Service", desc: "Step-by-step guidance with AI", icon: "🧭" },
  { value: "ccgvs_assisted", label: "CCGVS / AREI Assisted", desc: "Our team helps prepare your return", icon: "🤝" },
  { value: "cpa_review", label: "CPA Review", desc: "Prepare yourself, CPA reviews before filing", icon: "🔍" },
];

const FILING_TYPES: Record<string, { value: string; label: string }[]> = {
  individual: [{ value: "individual", label: "Individual Tax Return (1040)" }],
  small_business: [
    { value: "small_business", label: "Small Business Return" },
    { value: "corporate_1120", label: "Corporate Return (1120/1120-S)" },
    { value: "partnership_1065", label: "Partnership Return (1065)" },
  ],
  nonprofit: [
    { value: "nonprofit_990n", label: "990-N (e-Postcard)" },
    { value: "nonprofit_990ez", label: "990-EZ" },
    { value: "nonprofit_8868", label: "Extension (8868)" },
  ],
};

const TaxServiceStart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [userType, setUserType] = useState("individual");
  const [filingType, setFilingType] = useState("individual");
  const [serviceMode, setServiceMode] = useState("self_prepare");
  const [taxYear, setTaxYear] = useState(String(new Date().getFullYear() - 1));
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!user?.id) { navigate("/tax/signup"); return; }
    setLoading(true);
    try {
      let { data: tc } = await supabase.from("tax_clients").select("id").eq("user_id", user.id).maybeSingle();
      if (!tc) {
        const { data: created, error } = await supabase.from("tax_clients").insert({
          user_id: user.id, email: user.email,
          tax_user_type: userType === "nonprofit" ? "nonprofit" : userType === "small_business" ? "small_business" : "individual",
        }).select("id").single();
        if (error) throw error;
        tc = created;
      }
      const { data: tf, error: tfErr } = await supabase.from("tax_files").insert({
        tax_client_id: tc!.id, tax_year: parseInt(taxYear),
        filing_type: filingType, service_mode: serviceMode as any, status: "new_intake",
      }).select("id").single();
      if (tfErr) throw tfErr;
      toast({ title: "Tax return started!" });
      navigate(`/tax/profile?file=${tf!.id}&type=${filingType}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <TaxFlowLayout
      currentStep={1}
      title="Choose Filing Path"
      onNext={handleStart}
      nextLabel={loading ? "Creating…" : "Start Filing"}
      nextDisabled={loading}
    >
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold">Choose Your Filing Path</h1>
          <p className="text-sm text-muted-foreground mt-1">Select what you're filing and how you'd like to work.</p>
        </div>

        {/* Tax Year */}
        <div>
          <Label className="font-semibold text-sm">Tax Year</Label>
          <Select value={taxYear} onValueChange={setTaxYear}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[0, 1, 2].map(o => {
                const y = String(new Date().getFullYear() - 1 - o);
                return <SelectItem key={y} value={y}>{y}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Who is this for? */}
        <div>
          <Label className="font-semibold text-sm mb-2 block">Who is this for?</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {USER_TYPES.map(ut => (
              <Card
                key={ut.value}
                className={`cursor-pointer transition-all ${userType === ut.value ? "border-2 border-primary shadow-md" : "border hover:border-primary/30"}`}
                onClick={() => { setUserType(ut.value); setFilingType(FILING_TYPES[ut.value]?.[0]?.value || ut.value); }}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <ut.icon className={`w-8 h-8 mx-auto ${userType === ut.value ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="font-semibold text-sm">{ut.label}</p>
                  <p className="text-[11px] text-muted-foreground">{ut.desc}</p>
                  {userType === ut.value && <CheckCircle2 className="w-4 h-4 text-primary mx-auto" />}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Filing Type */}
        {(FILING_TYPES[userType]?.length || 0) > 1 && (
          <div>
            <Label className="font-semibold text-sm mb-2 block">What are you filing?</Label>
            <div className="space-y-2">
              {FILING_TYPES[userType]?.map(ft => (
                <button key={ft.value} onClick={() => setFilingType(ft.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition ${
                    filingType === ft.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <Briefcase className={`w-5 h-5 ${filingType === ft.value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium">{ft.label}</span>
                  {filingType === ft.value && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Service Mode */}
        <div>
          <Label className="font-semibold text-sm mb-2 block">How do you want to proceed?</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SERVICE_MODES.map(sm => (
              <Card
                key={sm.value}
                className={`cursor-pointer transition-all ${serviceMode === sm.value ? "border-2 border-primary shadow-md" : "border hover:border-primary/30"}`}
                onClick={() => setServiceMode(sm.value)}
              >
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{sm.icon}</span>
                    <p className="font-semibold text-sm">{sm.label}</p>
                    {serviceMode === sm.value && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{sm.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </TaxFlowLayout>
  );
};

export default TaxServiceStart;
