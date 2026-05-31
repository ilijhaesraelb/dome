/**
 * CCGVS / AREI GROUP — Client Intake Form
 * Public-to-private handoff: client fills quick intake → file enters CCGVS queue.
 * Also usable by internal staff for manual creation.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, ArrowRight, Shield, Lock, CheckCircle2 } from "lucide-react";
import BackButton from "@/components/BackButton";

const SERVICE_MODES = [
  { value: "self_prepare_with_support", label: "Self-Prepare With Support", desc: "You prepare, we answer questions" },
  { value: "guided_tax_prep", label: "Guided Tax Prep", desc: "We walk you through every step" },
  { value: "ccgvs_assisted", label: "Full-Service Preparation", desc: "We handle everything" },
  { value: "nonprofit_filing", label: "Nonprofit Filing Service", desc: "990-N, 990-EZ, extensions" },
  { value: "financial_statement", label: "Financial Statement Build", desc: "Balance sheet, P&L generation" },
  { value: "extension_filing", label: "Extension Filing", desc: "IRS Form 8868" },
  { value: "cpa_review", label: "CPA Review Only", desc: "Professional second look" },
];

const CCGVSClientIntake = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    taxUserType: "individual",
    firstName: "", lastName: "", email: "", phone: "",
    orgName: "", ein: "", orgType: "",
    filingType: "individual", serviceMode: "ccgvs_assisted",
    taxYear: String(new Date().getFullYear() - 1),
    notes: "",
  });

  const isOrg = ["nonprofit", "small_business"].includes(form.taxUserType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) { toast({ title: "Email required", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { data: tc, error: tcErr } = await supabase.from("tax_clients").insert({
        tax_user_type: form.taxUserType as any,
        legal_first_name: isOrg ? null : form.firstName,
        legal_last_name: isOrg ? null : form.lastName,
        organization_name: isOrg ? form.orgName : null,
        ein_encrypted: isOrg ? form.ein : null,
        organization_type: isOrg ? form.orgType : null,
        email: form.email,
        phone: form.phone || null,
        notes: form.notes || null,
        created_by: user?.id,
      }).select("id").single();
      if (tcErr) throw tcErr;

      const { data: tf, error: tfErr } = await supabase.from("tax_files").insert({
        tax_client_id: tc!.id,
        tax_year: parseInt(form.taxYear),
        filing_type: form.filingType,
        service_mode: form.serviceMode as any,
        status: "new_intake",
        assigned_to: user?.id,
      }).select("id").single();
      if (tfErr) throw tfErr;

      toast({ title: "Intake submitted successfully!" });
      navigate(user ? `/tax/file/${tf!.id}` : "/tax/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-secondary/20 text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <div className="absolute top-4 left-4"><BackButton /></div>
          <Badge className="bg-secondary/20 text-secondary-foreground border-0 mb-3">CCGVS / AREI GROUP</Badge>
          <h1 className="font-display text-3xl font-bold">Start Your Tax Service</h1>
          <p className="text-primary-foreground/70 mt-2">Complete this quick form and our team will begin working on your file.</p>
          <div className="flex items-center justify-center gap-4 mt-6">
            {[
              { icon: Shield, text: "Secure & Encrypted" },
              { icon: Lock, text: "Private Portal" },
              { icon: CheckCircle2, text: "No Immigration Required" },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-1.5 text-xs text-primary-foreground/60">
                <t.icon className="w-3.5 h-3.5 text-secondary" />
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <Card className="shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Client Type */}
              <div>
                <Label className="text-sm font-semibold">What type of client are you?</Label>
                <Select value={form.taxUserType} onValueChange={v => set("taxUserType", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Taxpayer</SelectItem>
                    <SelectItem value="nonprofit">Nonprofit Organization</SelectItem>
                    <SelectItem value="small_business">Small Business / Organization</SelectItem>
                    <SelectItem value="internal_client">Internal Service Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Identity */}
              {!isOrg ? (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => set("firstName", e.target.value)} required /></div>
                  <div><Label>Last Name *</Label><Input value={form.lastName} onChange={e => set("lastName", e.target.value)} required /></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div><Label>Organization Name *</Label><Input value={form.orgName} onChange={e => set("orgName", e.target.value)} required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>EIN</Label><Input value={form.ein} onChange={e => set("ein", e.target.value)} placeholder="XX-XXXXXXX" /></div>
                    <div><Label>Org Type</Label><Input value={form.orgType} onChange={e => set("orgType", e.target.value)} placeholder="e.g. 501(c)(3)" /></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => set("email", e.target.value)} required /></div>
                <div><Label>Phone</Label><Input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
              </div>

              {/* Service Selection */}
              <div>
                <Label className="text-sm font-semibold">How would you like to work with us?</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {SERVICE_MODES.map(m => (
                    <button type="button" key={m.value}
                      className={`p-3 border rounded-lg text-left transition ${form.serviceMode === m.value ? "border-secondary bg-secondary/5 ring-1 ring-secondary" : "hover:border-primary/30"}`}
                      onClick={() => set("serviceMode", m.value)}
                    >
                      <p className="text-sm font-medium">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tax Year</Label>
                  <Select value={form.taxYear} onValueChange={v => set("taxYear", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2].map(o => { const y = String(new Date().getFullYear() - 1 - o); return <SelectItem key={y} value={y}>{y}</SelectItem>; })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Filing Type</Label>
                  <Select value={form.filingType} onValueChange={v => set("filingType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="nonprofit_990n">990-N</SelectItem>
                      <SelectItem value="nonprofit_990ez">990-EZ</SelectItem>
                      <SelectItem value="nonprofit_8868">8868 Extension</SelectItem>
                      <SelectItem value="small_business">Small Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Additional Notes</Label>
                <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Anything our team should know…" rows={3} />
              </div>

              <Button type="submit" className="w-full gap-2 py-6 text-base" disabled={loading}>
                {loading ? "Submitting…" : "Submit Intake & Start Service"} <ArrowRight className="w-4 h-4" />
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Your file will be assigned to our team. We'll reach out for any additional documents needed.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CCGVSClientIntake;
