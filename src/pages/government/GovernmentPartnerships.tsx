import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield, GraduationCap, Scale, Heart, Briefcase, BarChart3, Lock, Globe,
  Users, FileCheck, Building2, ArrowRight, CheckCircle, Eye, Rocket,
  Smartphone, BookOpen, ClipboardCheck, Handshake, Monitor, Star, Zap
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

/* ─── SECTION 2: Institutional Use Cases ─── */
const useCases = [
  {
    icon: GraduationCap, title: "Citizenship Preparation Programs",
    desc: "Support naturalization readiness and civics education.",
    tools: ["Citizenship preparation modules", "Interview readiness tools", "N-400 document preparation support", "Participant progress tracking"],
  },
  {
    icon: Scale, title: "Legal Orientation Programs",
    desc: "Support educational legal orientation programs.",
    tools: ["Plain-language immigration process explanations", "Document organization", "Court preparation checklists", "Referral to accredited representatives"],
  },
  {
    icon: Heart, title: "Immigrant Integration Programs",
    desc: "Support community integration programs.",
    tools: ["Housing resources", "Employment readiness resources", "Education program links", "Community services directories"],
  },
  {
    icon: Briefcase, title: "Immigrant Entrepreneurship Programs",
    desc: "Support immigrant economic development.",
    tools: ["Business formation guidance", "Entrepreneur readiness tools", "Startup resource directories", "Nonprofit formation guidance"],
  },
];

/* ─── SECTION 3: Pilot Benefits ─── */
const pilotBenefits = [
  { icon: Zap, text: "Free access for a limited period" },
  { icon: BookOpen, text: "Training and onboarding support" },
  { icon: ClipboardCheck, text: "Dedicated feedback channel" },
  { icon: BarChart3, text: "Analytics and reporting included" },
];

/* ─── SECTION 6: Demo Steps ─── */
const demoSteps = [
  { step: 1, title: "Create a D.O.M.E. Account", desc: "Simple onboarding with role selection for clients and practitioners.", icon: Users },
  { step: 2, title: "Immigration Passport Profile", desc: "Participants build a comprehensive digital profile with case history.", icon: Globe },
  { step: 3, title: "Case Dashboard", desc: "Track all active cases, deadlines, and milestones in one place.", icon: Monitor },
  { step: 4, title: "Document Vault", desc: "Securely upload, organize, and manage required immigration documents.", icon: FileCheck },
  { step: 5, title: "Voice-Assisted Form Completion", desc: "Answer questions by voice and let D.O.M.E. populate form fields.", icon: Smartphone },
  { step: 6, title: "Pathway Finder System", desc: "AI-powered eligibility assessment across 20+ immigration pathways.", icon: Rocket },
  { step: 7, title: "Government Dashboard", desc: "Monitor participants, track outcomes, and generate program reports.", icon: BarChart3 },
];

/* ─── SECTION 4: Impact Metrics ─── */
const impactMetrics = [
  { label: "Immigrants Served", value: "2,400+", icon: Users },
  { label: "Cases Created", value: "1,850+", icon: ClipboardCheck },
  { label: "Document Completion Rate", value: "78%", icon: FileCheck },
  { label: "Citizenship Prep Participants", value: "620", icon: GraduationCap },
  { label: "Entrepreneur Participants", value: "340", icon: Briefcase },
  { label: "Attorney / Rep Referrals", value: "290", icon: Handshake },
  { label: "Avg Completion Time", value: "14 days", icon: Zap },
  { label: "Program Engagement", value: "91%", icon: Star },
];

/* ─── SECTION 9: Pricing ─── */
const plans = [
  { name: "Small Nonprofit", price: "$99", period: "/month", features: ["Up to 50 participants", "2 staff seats", "Basic reporting", "Email support"], cta: "Get Started" },
  { name: "Mid-Size Organization", price: "$299", period: "/month", features: ["Up to 200 participants", "10 staff seats", "Full analytics", "Priority support"], cta: "Get Started", featured: true },
  { name: "City / County Program", price: "$500", period: "/month", features: ["Up to 500 participants", "25 staff seats", "Multi-program support", "Dedicated success manager"], cta: "Get Started" },
  { name: "State / Enterprise", price: "Custom", period: "", features: ["Unlimited participants", "Custom integrations", "Annual contract", "SLA guarantee"], cta: "Contact Sales" },
];

/* ─── Who We Help ─── */
const whoWeHelp = [
  "Government agencies",
  "Nonprofit organizations",
  "Immigrant service providers",
  "DOJ accredited representatives",
  "Immigration attorneys",
  "Local integration offices",
  "Workforce development programs",
];

const GovernmentPartnerships = () => {
  /* Demo request form */
  const [demoForm, setDemoForm] = useState({
    org_name: "", contact_name: "", role_title: "", org_type: "", country: "US",
    email: "", phone: "", interest: "", expected_users: "",
  });
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  /* Pilot form */
  const [pilotForm, setPilotForm] = useState({
    org_name: "", org_type: "", location: "", clients_annually: "", program_type: "",
    contact_name: "", contact_email: "", contact_phone: "",
  });
  const [pilotSubmitting, setPilotSubmitting] = useState(false);
  const [pilotSubmitted, setPilotSubmitted] = useState(false);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.org_name || !demoForm.contact_name || !demoForm.email) {
      toast.error("Please fill in required fields"); return;
    }
    setDemoSubmitting(true);
    const { error } = await supabase.from("demo_requests").insert({
      organization_name: demoForm.org_name,
      contact_name: demoForm.contact_name,
      role_title: demoForm.role_title || null,
      organization_type: demoForm.org_type || null,
      country: demoForm.country || "US",
      email: demoForm.email,
      phone: demoForm.phone || null,
      program_interest: demoForm.interest || null,
      expected_users: demoForm.expected_users ? parseInt(demoForm.expected_users) : null,
    });
    setDemoSubmitting(false);
    if (error) { toast.error("Something went wrong. Please try again."); }
    else { setDemoSubmitted(true); toast.success("Demo request submitted!"); }
  };

  const handlePilotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilotForm.org_name || !pilotForm.contact_name || !pilotForm.contact_email) {
      toast.error("Please fill in required fields"); return;
    }
    setPilotSubmitting(true);
    const { error } = await supabase.from("pilot_applications").insert({
      organization_name: pilotForm.org_name,
      organization_type: pilotForm.org_type || null,
      location: pilotForm.location || null,
      clients_served_annually: pilotForm.clients_annually ? parseInt(pilotForm.clients_annually) : null,
      program_type: pilotForm.program_type || null,
      contact_name: pilotForm.contact_name,
      contact_email: pilotForm.contact_email,
      contact_phone: pilotForm.contact_phone || null,
    });
    setPilotSubmitting(false);
    if (error) { toast.error("Something went wrong. Please try again."); }
    else { setPilotSubmitted(true); toast.success("Pilot application submitted!"); }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ═══ SECTION 1: HERO ═══ */}
      <section className="relative bg-primary text-primary-foreground py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--gold)/0.12),transparent_60%)]" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Badge className="bg-[hsl(var(--gold))] text-primary mb-5 text-xs uppercase tracking-widest font-semibold px-4 py-1">
            Government & Institutional Partnerships
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-5">
            Digital Infrastructure for<br />Immigrant Integration
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-3xl mx-auto mb-4">
            Helping institutions deliver immigration support, entrepreneurship education, and document readiness tools through a secure digital platform.
          </p>
          <p className="text-sm text-primary-foreground/50 max-w-2xl mx-auto mb-10 italic">
            D.O.M.E. provides educational tools and document organization services and does not provide legal advice.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="#demo">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 px-8">
                Request a Demo <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <a href="#pilot">
              <Button size="lg" variant="outline-light" className="gap-2">
                <Rocket className="w-4 h-4" /> Join Pilot Program
              </Button>
            </a>
            <a href="#pricing">
              <Button size="lg" variant="outline-light">
                View Pricing
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ WHAT IS D.O.M.E. ═══ */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">What is D.O.M.E.?</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              D.O.M.E. (Digital Onboarding for Migration Ease) is a secure participant support system and service delivery platform
              that helps agencies manage citizenship readiness, legal orientation, entrepreneurship support, and integration programs — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto mb-12">
            {[
              "Digital infrastructure for immigrant integration",
              "Service delivery platform for agencies",
              "Secure participant support system",
              "Case readiness and document organization",
              "Grant and program reporting support",
              "Multi-tenant institutional architecture",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-[hsl(var(--success))] shrink-0" />
                {item}
              </div>
            ))}
          </div>

          {/* Who We Help */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-4">Who D.O.M.E. Helps</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {whoWeHelp.map((w) => (
                <Badge key={w} variant="outline" className="text-xs py-1.5 px-3">{w}</Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: USE CASES ═══ */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-4">Institutional Use Cases</h2>
          <p className="text-sm text-muted-foreground text-center mb-12">Four primary program areas designed for institutional adoption</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((uc) => (
              <Card key={uc.title} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                      <uc.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg mb-1">{uc.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{uc.desc}</p>
                      <ul className="space-y-1.5">
                        {uc.tools.map((t) => (
                          <li key={t} className="flex items-center gap-2 text-xs text-foreground">
                            <CheckCircle className="w-3 h-3 text-[hsl(var(--success))]" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4: IMPACT METRICS ═══ */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-4">Program Impact Metrics</h2>
          <p className="text-sm text-muted-foreground text-center mb-10">Trackable outcomes that support grant reporting and institutional accountability</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {impactMetrics.map((m) => (
              <Card key={m.label} className="border-border text-center hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <m.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{m.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wide">{m.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-6">
            Export reports in CSV, Excel, and PDF formats. Filter by date range, program type, and organization.
          </p>
        </div>
      </section>

      {/* ═══ SECTION 6: DEMO WALKTHROUGH ═══ */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-4">Platform Walkthrough</h2>
          <p className="text-sm text-muted-foreground text-center mb-12">A 3–5 minute guided tour of D.O.M.E.'s capabilities</p>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />
            <div className="space-y-6">
              {demoSteps.map((s) => (
                <div key={s.step} className="flex gap-5 md:ml-0">
                  <div className="relative z-10 shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-md">
                      {s.step}
                    </div>
                  </div>
                  <Card className="flex-1 border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-accent shrink-0">
                        <s.icon className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{s.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 8: SECURITY & TRUST ═══ */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Security & Privacy</h2>
            <p className="text-sm text-muted-foreground">Bank-grade security to protect sensitive participant data</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Lock, label: "Encrypted Document Storage", desc: "TLS 1.3 + AES-256" },
              { icon: Shield, label: "Permission-Based Access", desc: "Role-gated controls" },
              { icon: Users, label: "Tenant Isolation", desc: "Data separation by org" },
              { icon: Eye, label: "Audit Logging", desc: "Full action history" },
            ].map((s) => (
              <Card key={s.label} className="border-border text-center">
                <CardContent className="p-6">
                  <s.icon className="w-7 h-7 text-primary mx-auto mb-3" />
                  <p className="text-sm font-semibold text-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex gap-4 justify-center mt-8 text-xs text-muted-foreground">
            <Link to="/security" className="hover:text-foreground underline">Trust Center</Link>
            <Link to="/privacy" className="hover:text-foreground underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground underline">Terms of Service</Link>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: PILOT PARTNER PROGRAM ═══ */}
      <section id="pilot" className="py-20 px-4 bg-primary/[0.03]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Info */}
            <div>
              <Badge className="bg-[hsl(var(--gold))] text-primary mb-4 text-xs uppercase tracking-wider">Limited Availability</Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Pilot Partner Program</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Qualifying nonprofit organizations and institutions can test D.O.M.E. through our Pilot Partner Program.
                Get hands-on experience with the platform before committing to a full deployment.
              </p>
              <div className="space-y-4">
                {pilotBenefits.map((b) => (
                  <div key={b.text} className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[hsl(var(--success)/0.1)]">
                      <b.icon className="w-4 h-4 text-[hsl(var(--success))]" />
                    </div>
                    <span className="text-sm text-foreground font-medium">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pilot Application Form */}
            <div>
              {pilotSubmitted ? (
                <Card className="border-[hsl(var(--success))]">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-[hsl(var(--success))] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">Application Received!</h3>
                    <p className="text-sm text-muted-foreground mt-2">We'll review your application and reach out within 5 business days.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border">
                  <CardHeader><CardTitle className="text-base">Apply for Pilot Access</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={handlePilotSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Organization Name *</label>
                          <Input value={pilotForm.org_name} onChange={(e) => setPilotForm(f => ({ ...f, org_name: e.target.value }))} required maxLength={500} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Organization Type</label>
                          <Select value={pilotForm.org_type} onValueChange={(v) => setPilotForm(f => ({ ...f, org_type: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nonprofit">Nonprofit</SelectItem>
                              <SelectItem value="government">Government Agency</SelectItem>
                              <SelectItem value="city_county">City/County Office</SelectItem>
                              <SelectItem value="legal_services">Legal Services Org</SelectItem>
                              <SelectItem value="workforce">Workforce Program</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Location</label>
                          <Input placeholder="City, State" value={pilotForm.location} onChange={(e) => setPilotForm(f => ({ ...f, location: e.target.value }))} maxLength={255} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Clients Served Annually</label>
                          <Input type="number" placeholder="e.g. 500" value={pilotForm.clients_annually} onChange={(e) => setPilotForm(f => ({ ...f, clients_annually: e.target.value }))} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Program Type</label>
                          <Select value={pilotForm.program_type} onValueChange={(v) => setPilotForm(f => ({ ...f, program_type: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="citizenship">Citizenship Preparation</SelectItem>
                              <SelectItem value="legal_orientation">Legal Orientation</SelectItem>
                              <SelectItem value="integration">Immigrant Integration</SelectItem>
                              <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                              <SelectItem value="multiple">Multiple Programs</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Contact Name *</label>
                          <Input value={pilotForm.contact_name} onChange={(e) => setPilotForm(f => ({ ...f, contact_name: e.target.value }))} required maxLength={255} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Contact Email *</label>
                          <Input type="email" value={pilotForm.contact_email} onChange={(e) => setPilotForm(f => ({ ...f, contact_email: e.target.value }))} required maxLength={255} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Contact Phone</label>
                          <Input value={pilotForm.contact_phone} onChange={(e) => setPilotForm(f => ({ ...f, contact_phone: e.target.value }))} maxLength={20} />
                        </div>
                      </div>
                      <Button type="submit" disabled={pilotSubmitting} className="w-full bg-primary hover:bg-primary/90">
                        {pilotSubmitting ? "Submitting..." : "Submit Pilot Application"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 9: PRICING ═══ */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Institutional Plans</h2>
          <p className="text-sm text-muted-foreground mb-12">Scalable pricing for organizations of all sizes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan) => (
              <Card key={plan.name} className={`border-border relative ${plan.featured ? "ring-2 ring-secondary shadow-lg" : ""}`}>
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-secondary text-secondary-foreground text-[10px]">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-foreground text-sm">{plan.name}</h3>
                  <div className="mt-3 mb-5">
                    <span className="text-3xl font-bold text-primary">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <div className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--success))] shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <Button variant={plan.featured ? "default" : "outline"} size="sm" className="w-full text-xs">
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 10: POSITIONING ═══ */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[hsl(var(--success))]" /> D.O.M.E. Emphasizes
              </h3>
              <ul className="space-y-2.5">
                {["Education and workflow support", "Document organization and readiness", "Community support and integration", "Institutional collaboration tools", "Grant reporting and analytics"].map((i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-[hsl(var(--success))]" />{i}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-muted-foreground" /> D.O.M.E. Is Not
              </h3>
              <ul className="space-y-2.5">
                {["A legal service provider", "A law firm platform", "An immigration decision system", "A replacement for attorneys or accredited representatives", "An official adjudication platform"].map((i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-3.5 h-3.5 flex items-center justify-center text-muted-foreground text-xs">✕</span>{i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 11: MULTI-LANGUAGE ═══ */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Globe className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-3">Multi-Language Support</h2>
          <p className="text-sm text-muted-foreground mb-8">Institutions can configure default program language and participant language preferences</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {["English", "Spanish", "Portuguese", "French", "Mandarin Chinese", "Arabic", "Haitian Creole"].map((lang) => (
              <Badge key={lang} variant="outline" className="text-sm py-2 px-4">{lang}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5: DEMO REQUEST ═══ */}
      <section id="demo" className="py-20 px-4 bg-primary/[0.03]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-2">Request a Demo</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">See how D.O.M.E. can support your organization's mission</p>
          {demoSubmitted ? (
            <Card className="border-[hsl(var(--success))]">
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-[hsl(var(--success))] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Demo Request Received!</h3>
                <p className="text-sm text-muted-foreground mt-2">Our team will reach out within 2 business days to schedule your personalized demo.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border">
              <CardContent className="p-6">
                <form onSubmit={handleDemoSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Organization Name *</label>
                      <Input value={demoForm.org_name} onChange={(e) => setDemoForm(f => ({ ...f, org_name: e.target.value }))} required maxLength={500} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Contact Name *</label>
                      <Input value={demoForm.contact_name} onChange={(e) => setDemoForm(f => ({ ...f, contact_name: e.target.value }))} required maxLength={255} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Role / Title</label>
                      <Input placeholder="e.g. Program Director" value={demoForm.role_title} onChange={(e) => setDemoForm(f => ({ ...f, role_title: e.target.value }))} maxLength={255} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Agency / Nonprofit Type</label>
                      <Select value={demoForm.org_type} onValueChange={(v) => setDemoForm(f => ({ ...f, org_type: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="government">Government Agency</SelectItem>
                          <SelectItem value="nonprofit">Nonprofit</SelectItem>
                          <SelectItem value="city">City/County Office</SelectItem>
                          <SelectItem value="state">State Program</SelectItem>
                          <SelectItem value="legal_services">Legal Services</SelectItem>
                          <SelectItem value="workforce">Workforce Program</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Country</label>
                      <Input value={demoForm.country} onChange={(e) => setDemoForm(f => ({ ...f, country: e.target.value }))} maxLength={100} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Email *</label>
                      <Input type="email" value={demoForm.email} onChange={(e) => setDemoForm(f => ({ ...f, email: e.target.value }))} required maxLength={255} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Phone</label>
                      <Input value={demoForm.phone} onChange={(e) => setDemoForm(f => ({ ...f, phone: e.target.value }))} maxLength={20} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Program Interest</label>
                      <Select value={demoForm.interest} onValueChange={(v) => setDemoForm(f => ({ ...f, interest: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="citizenship">Citizenship Programs</SelectItem>
                          <SelectItem value="legal_orientation">Legal Orientation</SelectItem>
                          <SelectItem value="integration">Immigrant Integration</SelectItem>
                          <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                          <SelectItem value="full_platform">Full Platform</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Expected Number of Users</label>
                    <Input type="number" placeholder="e.g. 200" value={demoForm.expected_users} onChange={(e) => setDemoForm(f => ({ ...f, expected_users: e.target.value }))} />
                  </div>
                  <Button type="submit" disabled={demoSubmitting} className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                    {demoSubmitting ? "Submitting..." : "Request Demo"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* ═══ DISCLAIMER FOOTER ═══ */}
      <footer className="bg-primary text-primary-foreground py-8 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-3">
          <p className="text-xs text-primary-foreground/60">
            D.O.M.E. provides educational tools and document organization services and does not provide legal advice.
          </p>
          <p className="text-xs text-primary-foreground/50">
            Institutions remain responsible for their own program delivery and professional obligations.
            Any professional services shown on the platform must clearly identify the responsible provider.
          </p>
          <div className="flex gap-4 justify-center text-xs text-primary-foreground/40">
            <Link to="/privacy" className="hover:text-primary-foreground/70 underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary-foreground/70 underline">Terms of Service</Link>
            <Link to="/security" className="hover:text-primary-foreground/70 underline">Trust Center</Link>
            <Link to="/platform-position" className="hover:text-primary-foreground/70 underline">Platform Position</Link>
          </div>
          <p className="text-[10px] text-primary-foreground/30 mt-4">
            © {new Date().getFullYear()} AREI Group. D.O.M.E. — Digital Onboarding for Migration Ease. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default GovernmentPartnerships;
