import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import { toast } from "sonner";
import { AlertTriangle, Send } from "lucide-react";
import { Link } from "react-router-dom";

const CATEGORIES = [
  { value: "immigration_opportunity", label: "Immigration Opportunity" },
  { value: "employment_sponsorship", label: "Employment & Sponsorship" },
  { value: "business_opportunity", label: "Business Opportunity" },
  { value: "nonprofit_program", label: "Nonprofit & Community" },
  { value: "education_scholarship", label: "Education & Scholarship" },
  { value: "housing_relocation", label: "Housing & Relocation" },
  { value: "professional_service", label: "Professional Service" },
];

const PROFESSIONAL_TYPES = [
  { value: "immigration_attorney", label: "Immigration Attorney" },
  { value: "accredited_representative", label: "DOJ Accredited Representative" },
  { value: "tax_professional", label: "Tax Professional" },
  { value: "nonprofit_advisor", label: "Nonprofit Advisor" },
  { value: "business_consultant", label: "Business Consultant" },
  { value: "translator", label: "Translator" },
  { value: "relocation_advisor", label: "Relocation Advisor" },
];

const CreateNetworkListing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    category: "",
    organization_name: "",
    title: "",
    summary: "",
    location: "",
    state: "",
    requirements: "",
    contact_method: "",
    website: "",
    application_link: "",
    salary_range: "",
    sponsorship_type: "",
    professional_type: "",
    credentials: "",
    disclaimer_accepted: false,
  });

  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!user) { toast.error("Please sign in first"); return; }
    if (!form.category || !form.organization_name || !form.title || !form.summary) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!form.disclaimer_accepted) {
      toast.error("You must accept the compliance disclosure");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("network_listings").insert({
        user_id: user.id,
        category: form.category as any,
        status: "pending_review" as any,
        organization_name: form.organization_name,
        title: form.title,
        summary: form.summary,
        location: form.location || null,
        state: form.state || null,
        requirements: form.requirements || null,
        contact_method: form.contact_method || null,
        website: form.website || null,
        application_link: form.application_link || null,
        salary_range: form.salary_range || null,
        sponsorship_type: form.sponsorship_type || null,
        professional_type: form.professional_type ? (form.professional_type as any) : null,
        credentials: form.credentials || null,
        disclaimer_accepted: true,
      });

      if (error) throw error;
      toast.success("Listing submitted for review!");
      navigate("/network/directory");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit listing");
    } finally {
      setLoading(false);
    }
  };

  const isProfessional = form.category === "professional_service";
  const isEmployment = form.category === "employment_sponsorship";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/network" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">Network</span>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <BackButton />

        <h1 className="font-display text-2xl font-bold mt-4 mb-6">Post a Network Listing</h1>

        <Card>
          <CardHeader>
            <CardTitle>Listing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => update("category", v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Organization Name *</Label>
                <Input value={form.organization_name} onChange={(e) => update("organization_name", e.target.value)} placeholder="Your organization" />
              </div>
              <div>
                <Label>Listing Title *</Label>
                <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Opportunity title" />
              </div>
            </div>

            <div>
              <Label>Summary *</Label>
              <Textarea value={form.summary} onChange={(e) => update("summary", e.target.value)} rows={4} placeholder="Describe the opportunity..." />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="City" />
              </div>
              <div>
                <Label>State</Label>
                <Input value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="e.g. CA, NY" />
              </div>
            </div>

            <div>
              <Label>Requirements</Label>
              <Textarea value={form.requirements} onChange={(e) => update("requirements", e.target.value)} rows={3} placeholder="Qualifications or eligibility requirements" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Contact Method</Label>
                <Input value={form.contact_method} onChange={(e) => update("contact_method", e.target.value)} placeholder="Email or phone" />
              </div>
              <div>
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div>
              <Label>Application Link</Label>
              <Input value={form.application_link} onChange={(e) => update("application_link", e.target.value)} placeholder="https://..." />
            </div>

            {isEmployment && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Salary Range</Label>
                  <Input value={form.salary_range} onChange={(e) => update("salary_range", e.target.value)} placeholder="$60,000 - $90,000" />
                </div>
                <div>
                  <Label>Sponsorship Type</Label>
                  <Input value={form.sponsorship_type} onChange={(e) => update("sponsorship_type", e.target.value)} placeholder="H-1B, EB-3, etc." />
                </div>
              </div>
            )}

            {isProfessional && (
              <>
                <div>
                  <Label>Professional Type</Label>
                  <Select value={form.professional_type} onValueChange={(v) => update("professional_type", v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {PROFESSIONAL_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Credentials</Label>
                  <Input value={form.credentials} onChange={(e) => update("credentials", e.target.value)} placeholder="Bar number, certifications, etc." />
                </div>
              </>
            )}

            {/* Compliance Disclosure */}
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="pt-4 pb-3">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground space-y-2">
                    <p>By submitting this listing, you acknowledge that:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>You are responsible for the accuracy of all information provided.</li>
                      <li>D.O.M.E. does not endorse or guarantee any listing.</li>
                      <li>Securities offerings must comply with applicable laws.</li>
                      <li>All listings are subject to admin moderation before publication.</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Checkbox
                    id="disclaimer"
                    checked={form.disclaimer_accepted}
                    onCheckedChange={(v) => update("disclaimer_accepted", !!v)}
                  />
                  <label htmlFor="disclaimer" className="text-sm font-medium">I accept the compliance disclosure *</label>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
              size="lg"
            >
              <Send className="w-4 h-4" />
              {loading ? "Submitting..." : "Submit for Review"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateNetworkListing;
