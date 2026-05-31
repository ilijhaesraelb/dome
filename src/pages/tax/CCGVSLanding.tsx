/**
 * CCGVS / AREI GROUP Tax & Accounting Services — Full Landing Page
 */
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calculator, FileText, Upload, Users, ArrowRight, Shield, Lock,
  ShieldCheck, Heart, Building2, UserCheck, Briefcase, CheckCircle2,
  MessageSquare, Clock, DollarSign, Star, Landmark, BookOpen,
  RefreshCw, Eye, Layers, ChevronRight, Globe, Wallet, PiggyBank,
  BarChart3, HandCoins, ClipboardCheck, Sparkles, UserPlus,
} from "lucide-react";

/* ─── Section 1: What We Help With ─── */
const HELP_WITH = [
  { icon: FileText, title: "Individual Tax Returns", desc: "W-2, 1099, Schedule C, and more — guided step by step." },
  { icon: Building2, title: "Nonprofit Annual Filings", desc: "990-N e-Postcard, 990-EZ, and extension requests." },
  { icon: BarChart3, title: "Financial Statements", desc: "Balance sheets, income statements, and cash-flow reports." },
  { icon: ClipboardCheck, title: "Tax Readiness Reviews", desc: "Free readiness checks so you know exactly what's needed." },
  { icon: Landmark, title: "Organization & Small Business", desc: "S-Corp, LLC, and partnership filing support." },
  { icon: HandCoins, title: "Extension Filings", desc: "File Form 8868 or individual extensions quickly." },
];

/* ─── Section 2: Choose Your Path ─── */
const PATH_CARDS = [
  {
    title: "File Taxes On My Own",
    desc: "Use our guided questions to self-prepare your return. Upload documents, review your data, and export when ready.",
    who: "Individuals comfortable doing their own taxes",
    mode: "Self-Service",
    to: "/tax/start",
    icon: Calculator,
  },
  {
    title: "Get CCGVS / AREI GROUP Assistance",
    desc: "Our experienced team handles the preparation. You upload your records — we do the rest.",
    who: "Anyone who wants professional help at an affordable price",
    mode: "Assisted",
    to: "/tax/ccgvs/intake",
    icon: UserCheck,
    featured: true,
  },
  {
    title: "Start Nonprofit Filing",
    desc: "Determine your filing requirement, complete the workspace, and export your 990-N, 990-EZ, or extension.",
    who: "Nonprofit organizations needing annual IRS filings",
    mode: "Self-Service or Assisted",
    to: "/tax/nonprofit/landing",
    icon: Building2,
  },
  {
    title: "Request Accountant / CPA Review",
    desc: "Have a CPA inspect your draft return or financial statements before you finalize.",
    who: "Anyone wanting a professional second look",
    mode: "Review Only",
    to: "/tax/review",
    icon: ShieldCheck,
  },
  {
    title: "Upload Existing Tax Records",
    desc: "Securely store W-2s, 1099s, bank statements, and prior returns for current or past years.",
    who: "Anyone organizing tax documents",
    mode: "Self-Service",
    to: "/tax/documents",
    icon: Upload,
  },
  {
    title: "Continue Existing Tax File",
    desc: "Pick up right where you left off. Your progress is saved automatically.",
    who: "Returning users with an active filing",
    mode: "Resume",
    to: "/tax/dashboard",
    icon: RefreshCw,
  },
];

/* ─── Section 6: How It Works ─── */
const HOW_STEPS = [
  { n: "1", title: "Choose Your Path", desc: "Self-prepare, get assistance, or request a professional review — each works independently." },
  { n: "2", title: "Upload Your Records", desc: "Securely upload W-2s, 1099s, financial statements, bank records, and more." },
  { n: "3", title: "Review & Prepare", desc: "Our guided system — or our team — organizes your data and prepares your filing." },
  { n: "4", title: "Pay & Receive", desc: "Flat-fee checkout with no surprises. Receive your completed package ready for filing." },
];

/* ─── Section 7: Why Clients Choose ─── */
const WHY_CHOOSE = [
  { icon: Star, title: "Experienced Internal Team", desc: "Tax preparers, accountants, and CPA reviewers dedicated to getting it right." },
  { icon: DollarSign, title: "Flat-Fee, No Surprises", desc: "Know exactly what you'll pay before you start — no hourly billing, no hidden fees." },
  { icon: Shield, title: "Secure & Auditable", desc: "Encrypted uploads, role-based access, and a full audit trail on every change." },
  { icon: Landmark, title: "Nonprofit Specialists", desc: "Deep expertise in 990-N, 990-EZ, extensions, and nonprofit financial reporting." },
  { icon: Globe, title: "Multilingual Support", desc: "Service available in English, Spanish, and additional languages." },
  { icon: Clock, title: "Save & Resume Anytime", desc: "Your progress is always saved. Come back whenever you're ready." },
  { icon: Heart, title: "Affordable for Everyone", desc: "Mission-driven pricing so quality tax services are within reach." },
  { icon: MessageSquare, title: "Direct Communication", desc: "Message your assigned team member. Request documents. Get updates in real time." },
];

/* ─── Section 8: Pricing ─── */
const PRICING = [
  { label: "Individual Tax Prep", price: "$49", desc: "Guided self-service filing for W-2 and 1099 earners." },
  { label: "990-N (e-Postcard)", price: "$29", desc: "For organizations with gross receipts ≤ $50,000." },
  { label: "990-EZ Guided Prep", price: "$75", desc: "Receipts < $200K, assets < $500K.", popular: true },
  { label: "Full-Service Prep", price: "$149+", desc: "We handle everything — upload, prep, review, and delivery." },
];

const CCGVSLanding = () => (
  <div className="min-h-screen bg-background">
    {/* ═══ HERO ═══ */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-secondary/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--secondary)/0.15),transparent_70%)]" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center text-primary-foreground">
        <Badge className="bg-secondary/20 text-secondary-foreground border-0 mb-5 text-xs tracking-wide uppercase font-semibold px-4 py-1.5">
          CCGVS / AREI GROUP Tax & Accounting Services
        </Badge>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
          Affordable Tax Preparation,{" "}
          <span className="text-secondary">Nonprofit Filing</span>,
          <br className="hidden sm:block" />
          and Financial Statement Support
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-primary-foreground/70 max-w-3xl mx-auto leading-relaxed">
          Work directly with the CCGVS&nbsp;/&nbsp;AREI&nbsp;GROUP team through a secure digital platform
          designed to help individuals, nonprofits, and organizations organize records, prepare returns,
          and move forward with confidence.
        </p>

        {/* Primary CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
          <Link to="/tax/ccgvs/intake">
            <Button size="lg" className="gap-2 bg-secondary hover:bg-secondary/90 text-base px-8 py-6 rounded-xl shadow-lg w-full sm:w-auto">
              <Briefcase className="w-5 h-5" /> Start Tax Preparation <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/tax/nonprofit/landing">
            <Button size="lg" variant="outline-light" className="text-base px-8 py-6 rounded-xl w-full sm:w-auto gap-2">
              <Building2 className="w-5 h-5" /> Start Nonprofit Filing
            </Button>
          </Link>
          <Link to="/tax/documents">
            <Button size="lg" variant="outline-light" className="text-base px-8 py-6 rounded-xl w-full sm:w-auto gap-2">
              <Upload className="w-5 h-5" /> Upload Tax Documents
            </Button>
          </Link>
          <Link to="/tax/start">
            <Button size="lg" variant="outline-light" className="text-base px-8 py-6 rounded-xl w-full sm:w-auto gap-2">
              <Users className="w-5 h-5" /> Work With Our Team
            </Button>
          </Link>
        </div>

        {/* Trust strip */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {[
            { icon: Lock, text: "Encrypted & Secure" },
            { icon: Clock, text: "Save & Resume" },
            { icon: DollarSign, text: "Flat-Fee Pricing" },
            { icon: Shield, text: "Audit-Tracked" },
            { icon: ShieldCheck, text: "No Immigration Signup Required" },
          ].map(t => (
            <div key={t.text} className="flex items-center gap-2 text-sm text-primary-foreground/60">
              <t.icon className="w-4 h-4 text-secondary shrink-0" />
              <span className="font-medium">{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ═══ 1. WHAT WE HELP WITH ═══ */}
    <section className="bg-card border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold">What We Help With</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto text-sm">
            From individual returns to nonprofit annual filings, CCGVS&nbsp;/&nbsp;AREI&nbsp;GROUP provides the tools
            and team support you need to stay compliant and organized.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {HELP_WITH.map(h => (
            <div key={h.title} className="flex gap-4 items-start p-4 rounded-xl bg-muted/40 border border-border">
              <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                <h.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{h.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ═══ 2. CHOOSE YOUR PATH ═══ */}
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="font-display text-2xl sm:text-3xl font-bold">Choose Your Path</h2>
        <p className="text-muted-foreground mt-2 text-sm max-w-xl mx-auto">
          Every path works independently. Pick the one that fits your situation — you can always change later.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {PATH_CARDS.map(s => (
          <Link key={s.title} to={s.to}>
            <Card className={`h-full hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer border-2 group ${s.featured ? "border-secondary shadow-md" : "hover:border-secondary/40"}`}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
                    <s.icon className="w-5 h-5 text-primary group-hover:text-secondary transition-colors" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium">{s.mode}</Badge>
                </div>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  {s.featured && <Badge className="bg-secondary text-secondary-foreground text-[10px] mt-1">Recommended</Badge>}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Best for:</span> {s.who}</p>
                <div className="flex items-center gap-1 text-secondary text-sm font-medium pt-1">
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>

    {/* ═══ 3. FOR INDIVIDUALS ═══ */}
    <section className="bg-muted/30 border-y border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <Badge className="bg-primary/10 text-primary border-0 mb-3">For Individuals</Badge>
            <h2 className="font-display text-2xl font-bold mb-4">Simple, Affordable Tax Filing for You and Your Family</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Whether you receive a W-2, 1099, or have self-employment income, our guided workflow walks you
              through every question. Upload your documents, review your data, and export your completed return
              — or let our team handle the preparation for you.
            </p>
            <ul className="space-y-3">
              {["Guided questions — no tax jargon", "W-2, 1099, Schedule C support", "Save progress and resume anytime", "Optional professional review before finalizing", "Flat fee — no percentage-based charges"].map(t => (
                <li key={t} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <Link to="/tax/start" className="inline-block mt-6">
              <Button className="gap-2"><Calculator className="w-4 h-4" /> Start My Tax Return <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
          <Card className="bg-card shadow-lg">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/10 flex items-center justify-center">
                <Calculator className="w-8 h-8 text-secondary" />
              </div>
              <p className="text-4xl font-bold">$49</p>
              <p className="font-semibold">Individual Tax Preparation</p>
              <p className="text-xs text-muted-foreground">Guided self-service filing. Professional review available as an add-on.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    {/* ═══ 4. FOR NONPROFITS ═══ */}
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <Card className="bg-card shadow-lg order-2 lg:order-1">
          <CardContent className="p-8 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold">Nonprofit Filing Options</h3>
            {[
              { form: "990-N (e-Postcard)", price: "$29", note: "Gross receipts ≤ $50,000" },
              { form: "990-EZ Guided Prep", price: "$75", note: "Receipts < $200K, assets < $500K" },
              { form: "Form 8868 Extension", price: "$25", note: "Buy time when you need it" },
              { form: "Full-Service Nonprofit Prep", price: "$149+", note: "We handle everything" },
            ].map(f => (
              <div key={f.form} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{f.form}</p>
                  <p className="text-xs text-muted-foreground">{f.note}</p>
                </div>
                <span className="font-bold text-sm">{f.price}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="order-1 lg:order-2">
          <Badge className="bg-primary/10 text-primary border-0 mb-3">For Nonprofits</Badge>
          <h2 className="font-display text-2xl font-bold mb-4">Stay Compliant Without the Complexity</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Annual IRS filings don't have to be stressful. Our platform determines which form you need,
            walks you through the required fields, and lets you export a completed filing — or have our team
            prepare it on your behalf.
          </p>
          <ul className="space-y-3">
            {["Automatic eligibility determination", "990-N, 990-EZ, and 8868 support", "Officer and financial data guided entry", "Export-ready filings", "Extension filing when you need more time"].map(t => (
              <li key={t} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <Link to="/tax/nonprofit/landing" className="inline-block mt-6">
            <Button className="gap-2"><Building2 className="w-4 h-4" /> Start Nonprofit Filing <ArrowRight className="w-4 h-4" /></Button>
          </Link>
        </div>
      </div>
    </section>

    {/* ═══ 5. FOR ORGANIZATIONS & SMALL BUSINESSES ═══ */}
    <section className="bg-muted/30 border-y border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <Badge className="bg-primary/10 text-primary border-0 mb-3">For Organizations & Small Businesses</Badge>
            <h2 className="font-display text-2xl font-bold mb-4">Organized Records, Accurate Filings, Clear Next Steps</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Whether you run an LLC, S-Corp, partnership, or community organization, CCGVS&nbsp;/&nbsp;AREI&nbsp;GROUP
              helps you organize financial records, prepare required filings, and generate the statements
              your stakeholders need.
            </p>
            <ul className="space-y-3">
              {["Business entity filing support", "Financial statement generation", "Multi-year record organization", "Dedicated team assignment for ongoing clients", "Secure document storage and audit trail"].map(t => (
                <li key={t} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <Link to="/tax/ccgvs/intake" className="inline-block mt-6">
              <Button className="gap-2"><Briefcase className="w-4 h-4" /> Get Started <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Layers, title: "Entity Filing", desc: "LLC, S-Corp, partnership support" },
              { icon: BarChart3, title: "Financial Reports", desc: "Balance sheet, P&L, cash flow" },
              { icon: Wallet, title: "Bookkeeping Prep", desc: "Organized records year-round" },
              { icon: Eye, title: "CPA Review", desc: "Professional review before filing" },
            ].map(c => (
              <Card key={c.title}>
                <CardContent className="p-5 text-center space-y-2">
                  <c.icon className="w-6 h-6 text-primary mx-auto" />
                  <h3 className="font-semibold text-xs">{c.title}</h3>
                  <p className="text-[11px] text-muted-foreground">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ═══ 6. HOW IT WORKS ═══ */}
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-3">How It Works</h2>
      <p className="text-center text-muted-foreground text-sm mb-10 max-w-xl mx-auto">
        Four simple steps from start to finish — whether you self-prepare or work with our team.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {HOW_STEPS.map((h, i) => (
          <div key={h.n} className="relative text-center space-y-3">
            {i < HOW_STEPS.length - 1 && (
              <div className="hidden lg:block absolute top-6 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
            )}
            <div className="w-12 h-12 mx-auto rounded-full bg-secondary/10 flex items-center justify-center relative z-10">
              <span className="text-lg font-bold text-secondary">{h.n}</span>
            </div>
            <h3 className="font-semibold text-sm">{h.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{h.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ═══ 7. WHY CLIENTS CHOOSE ═══ */}
    <section className="bg-primary/[0.03] border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <Badge className="bg-primary/10 text-primary border-0 mb-3">Why CCGVS / AREI GROUP</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">Why Clients Choose Us</h2>
          <p className="text-muted-foreground mt-2 text-sm max-w-2xl mx-auto">
            An experienced internal team focused on affordable, accurate tax and accounting services
            for individuals, nonprofits, and organizations of every size.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WHY_CHOOSE.map(f => (
            <Card key={f.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 text-center space-y-3">
                <f.icon className="w-7 h-7 text-secondary mx-auto" />
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>

    {/* ═══ 8. AFFORDABLE, CLEAR PRICING ═══ */}
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-3">Affordable, Clear Pricing</h2>
      <p className="text-center text-muted-foreground mb-10 text-sm max-w-xl mx-auto">
        No hidden costs, no hourly billing. Know your price before you start.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRICING.map(p => (
          <Card key={p.label} className={p.popular ? "border-2 border-secondary shadow-lg" : ""}>
            <CardContent className="p-6 text-center space-y-3">
              {p.popular && <Badge className="bg-secondary text-secondary-foreground">Most Popular</Badge>}
              <p className="text-3xl font-bold">{p.price}</p>
              <p className="font-semibold text-sm">{p.label}</p>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-6">
        CPA Review add-on available from $35. Extension filings from $25. Readiness checks are always free.
      </p>
    </section>

    {/* ═══ 9. SECURE DOCUMENT UPLOAD ═══ */}
    <section className="bg-muted/30 border-y border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <Badge className="bg-primary/10 text-primary border-0 mb-3">Security First</Badge>
            <h2 className="font-display text-2xl font-bold mb-4">Secure Document Upload</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Every document you upload is encrypted in transit and at rest. Our platform uses role-based
              access controls and a full audit trail so you always know who accessed your files and when.
            </p>
            <ul className="space-y-3">
              {["End-to-end encryption", "Role-based access control", "Full audit trail on every action", "Secure cloud storage", "Documents linked to your filing automatically"].map(t => (
                <li key={t} className="flex items-start gap-2 text-sm">
                  <Lock className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <Card className="bg-card shadow-lg">
            <CardContent className="p-8 text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold">Your Data Is Protected</h3>
              <p className="text-sm text-muted-foreground">
                We never share your information with third parties. Your tax records stay between you and
                your assigned team.
              </p>
              <Link to="/tax/documents">
                <Button variant="outline" className="gap-2 mt-2"><Upload className="w-4 h-4" /> Upload Documents</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    {/* ═══ 10. SELF-PREP OR TEAM ═══ */}
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-3">
        Prepare It Yourself or Work With Our Team
      </h2>
      <p className="text-center text-muted-foreground text-sm mb-10 max-w-2xl mx-auto">
        You're in control. Start on your own and upgrade to professional assistance at any time — or let
        us handle it from the beginning.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow border-2 hover:border-primary/30">
          <CardContent className="p-8 space-y-4">
            <Calculator className="w-10 h-10 text-primary" />
            <h3 className="font-semibold text-lg">Self-Prepare</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Answer guided questions, upload your documents, review your data, and export your
              completed return at your own pace.
            </p>
            <ul className="space-y-2 text-sm">
              {["Full control over your filing", "Save and resume anytime", "Add professional review later"].map(t => (
                <li key={t} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary" />{t}</li>
              ))}
            </ul>
            <Link to="/tax/start">
              <Button variant="outline" className="gap-2 w-full mt-2">Start Self-Prep <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow border-2 border-secondary shadow-md">
          <CardContent className="p-8 space-y-4">
            <UserCheck className="w-10 h-10 text-secondary" />
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Work With Our Team</h3>
              <Badge className="bg-secondary text-secondary-foreground text-[10px]">Recommended</Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload your records and let CCGVS&nbsp;/&nbsp;AREI&nbsp;GROUP handle the rest. You'll get a
              dedicated team member, direct messaging, and a fully reviewed return.
            </p>
            <ul className="space-y-2 text-sm">
              {["Dedicated preparer assigned", "Direct messaging with your team", "CPA review included in full-service"].map(t => (
                <li key={t} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary" />{t}</li>
              ))}
            </ul>
            <Link to="/tax/ccgvs/intake">
              <Button className="gap-2 w-full mt-2 bg-secondary hover:bg-secondary/90">Get Assistance <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </section>

    {/* ═══ 11. SAVE AND RESUME ═══ */}
    <section className="bg-card border-y border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary/10 flex items-center justify-center mb-5">
          <RefreshCw className="w-7 h-7 text-secondary" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-3">Save and Resume Anytime</h2>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto leading-relaxed mb-6">
          Life is busy. Your progress is automatically saved after every step. Close your browser,
          come back tomorrow, or pick up next week — your filing will be right where you left it.
        </p>
        <Link to="/tax/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowRight className="w-4 h-4" /> Continue My Tax File
          </Button>
        </Link>
      </div>
    </section>

    {/* ═══ 12. IMPORTANT INFORMATION / DISCLAIMER ═══ */}
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h3 className="font-semibold text-sm mb-3 text-center">Important Information</h3>
      <div className="bg-muted/50 rounded-xl p-6 text-xs text-muted-foreground leading-relaxed space-y-3">
        <p>
          CCGVS&nbsp;/&nbsp;AREI&nbsp;GROUP provides tax preparation, nonprofit filing support, financial statement
          generation, and document organization services through the D.O.M.E. platform. These services are
          designed to help you organize your records and prepare filings accurately.
        </p>
        <p>
          D.O.M.E. and CCGVS&nbsp;/&nbsp;AREI&nbsp;GROUP do not provide legal advice. Tax preparation services are
          not a substitute for advice from a licensed CPA, enrolled agent, or tax attorney when complex
          situations require professional guidance.
        </p>
        <p>
          All filings should be reviewed for accuracy before submission. By using this platform, you acknowledge
          that final responsibility for the accuracy of your filing rests with the taxpayer or authorized
          officer of the organization.
        </p>
      </div>
    </section>

    {/* ═══ 13. FINAL CTA ═══ */}
    <section className="bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Sparkles className="w-8 h-8 text-secondary mx-auto mb-4" />
        <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">Ready to Get Started?</h2>
        <p className="text-primary-foreground/70 mb-8 text-sm max-w-xl mx-auto">
          No immigration registration required. Create your tax account in under a minute and start
          filing today — on your own or with our team by your side.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/tax/ccgvs/intake">
            <Button size="lg" className="bg-secondary hover:bg-secondary/90 gap-2 px-8 py-6 rounded-xl shadow-lg">
              <Briefcase className="w-5 h-5" /> Start Tax Preparation <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/tax/signup">
            <Button size="lg" variant="outline-light" className="gap-2 px-8 py-6 rounded-xl">
              <UserPlus className="w-5 h-5" /> Create Tax Account
            </Button>
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default CCGVSLanding;
