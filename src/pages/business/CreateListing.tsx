import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, AlertTriangle, Send } from "lucide-react";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useT } from "@/hooks/useT";

const CATEGORIES = [
  { value: "startup_investor", label: "Startup Seeking Investor" },
  { value: "expansion_capital", label: "Expansion Capital Needed" },
  { value: "real_estate", label: "Real Estate Development" },
  { value: "immigrant_business", label: "Immigrant-Owned Business" },
  { value: "nonprofit_partnership", label: "Nonprofit Partnership" },
  { value: "franchise_acquisition", label: "Franchise / Acquisition" },
  { value: "affordable_housing", label: "Affordable Housing / Community" },
  { value: "other", label: "Other" },
];

const CreateListing = () => {
  const t = useT();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: "", state: "", industry: "", summary: "",
    business_stage: "", amount_sought: "", use_of_funds: "",
    founder_overview: "", traction: "", website: "", contact_method: "",
    category: "other",
  });
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!form.company_name || !form.state || !form.industry || !form.summary) {
      toast.error(t("createListing.fillRequired")); return;
    }
    if (!disclaimerAccepted) {
      toast.error(t("createListing.acceptDisclosure")); return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error(t("createListing.signIn")); return; }

      const { error } = await supabase.from("business_listings").insert({
        user_id: user.id,
        company_name: form.company_name,
        state: form.state,
        industry: form.industry,
        summary: form.summary,
        business_stage: form.business_stage || null,
        amount_sought: form.amount_sought ? Number(form.amount_sought) : null,
        use_of_funds: form.use_of_funds || null,
        founder_overview: form.founder_overview || null,
        traction: form.traction || null,
        website: form.website || null,
        contact_method: form.contact_method || null,
        category: form.category as any,
        disclaimer_accepted: true,
        status: "pending_review" as any,
      });
      if (error) throw error;
      toast.success(t("createListing.submitted"));
      navigate("/business/marketplace");
    } catch (e: any) {
      toast.error(e.message || "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/business/marketplace" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">D.O.M.E.</span>
          </Link>
          <BackButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Store className="w-6 h-6 text-secondary" />
          <h1 className="font-display text-2xl font-bold">{t("createListing.title")}</h1>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>{t("createListing.companyName")} *</Label><Input value={form.company_name} onChange={e => update("company_name", e.target.value)} /></div>
              <div><Label>{t("createListing.state")} *</Label><Input value={form.state} onChange={e => update("state", e.target.value)} placeholder="e.g., CA" /></div>
              <div><Label>{t("createListing.industry")} *</Label><Input value={form.industry} onChange={e => update("industry", e.target.value)} /></div>
              <div>
                <Label>{t("createListing.category")} *</Label>
                <Select value={form.category} onValueChange={v => update("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div><Label>{t("createListing.summary")} *</Label><Textarea value={form.summary} onChange={e => update("summary", e.target.value)} placeholder="Brief description of the opportunity..." /></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>{t("createListing.businessStage")}</Label><Input value={form.business_stage} onChange={e => update("business_stage", e.target.value)} placeholder="e.g., Pre-revenue, Growth" /></div>
              <div><Label>{t("createListing.amountSought")}</Label><Input type="number" value={form.amount_sought} onChange={e => update("amount_sought", e.target.value)} /></div>
            </div>

            <div><Label>{t("createListing.useOfFunds")}</Label><Textarea value={form.use_of_funds} onChange={e => update("use_of_funds", e.target.value)} /></div>
            <div><Label>{t("createListing.founderOverview")}</Label><Textarea value={form.founder_overview} onChange={e => update("founder_overview", e.target.value)} /></div>
            <div><Label>{t("createListing.traction")}</Label><Textarea value={form.traction} onChange={e => update("traction", e.target.value)} /></div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>{t("createListing.website")}</Label><Input value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://" /></div>
              <div><Label>{t("createListing.preferredContact")}</Label><Input value={form.contact_method} onChange={e => update("contact_method", e.target.value)} placeholder="Email, phone, etc." /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> {t("createListing.disclosureTitle")}
            </div>
            <p className="text-xs text-muted-foreground">{t("createListing.disclosureText")}</p>
            <div className="flex items-center gap-2" onClick={() => setDisclaimerAccepted(!disclaimerAccepted)}>
              <Checkbox checked={disclaimerAccepted} />
              <span className="text-sm cursor-pointer">{t("createListing.acceptTerms")}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2 bg-secondary hover:bg-secondary/90">
            <Send className="w-4 h-4" /> {submitting ? t("hireHelp.submitting") : t("createListing.submitForReview")}
          </Button>
          <p className="text-xs text-muted-foreground self-center">{t("createListing.listingPrice")}</p>
        </div>
      </div>
    </div>
  );
};

export default CreateListing;
