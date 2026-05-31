/**
 * Nonprofit Filing Landing Page — Public-facing entry point
 */
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, FileText, Upload, UserCheck, ArrowRight,
  Shield, Lock, ShieldCheck, Heart, CheckCircle2, Clock,
  HelpCircle, DollarSign,
} from "lucide-react";
import BackButton from "@/components/BackButton";

const TRUST_CARDS = [
  { icon: DollarSign, title: "Flat-Fee Pricing", desc: "Know your cost upfront — no surprise fees." },
  { icon: HelpCircle, title: "Guided Questions", desc: "Plain-language questions, not raw IRS forms." },
  { icon: Lock, title: "Save & Resume Anytime", desc: "Come back where you left off." },
  { icon: Shield, title: "Secure Uploads", desc: "Encrypted document storage." },
  { icon: Building2, title: "Built for Nonprofits", desc: "Designed for organizations like yours." },
];

const PRICING = [
  { label: "990-N (e-Postcard)", price: "$29", desc: "Gross receipts ≤ $50,000", popular: false },
  { label: "990-EZ Guided Prep", price: "$75", desc: "Receipts < $200K, assets < $500K", popular: true },
  { label: "990 Full Prep", price: "$149", desc: "Larger organizations", popular: false },
  { label: "Extension (8868)", price: "$25", desc: "Need more time to file?", popular: false },
];

const NonprofitLanding = () => (
  <div className="min-h-screen bg-background">
    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/85" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center text-primary-foreground">
        <div className="absolute top-4 left-4"><BackButton /></div>
        <Badge className="bg-secondary/20 text-secondary border-0 mb-4">Nonprofit Filing</Badge>
        <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight">
          Affordable Nonprofit Filing,<br className="hidden sm:block" /> Guided Step by Step
        </h1>
        <p className="mt-5 text-base sm:text-lg text-primary-foreground/70 max-w-2xl mx-auto leading-relaxed">
          Prepare your annual nonprofit filing with a simple, flat-fee workflow designed for organizations that need clarity, speed, and affordability.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/tax/nonprofit/start">
            <Button size="lg" className="gap-2 bg-secondary hover:bg-secondary/90 text-base px-8 py-6 rounded-xl shadow-lg w-full sm:w-auto">
              <Building2 className="w-5 h-5" /> Start Nonprofit Filing <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/tax/nonprofit">
            <Button size="lg" variant="outline" className="text-base px-8 py-6 rounded-xl w-full sm:w-auto gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <HelpCircle className="w-5 h-5" /> Check What I Need to File
            </Button>
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          <Link to="/tax/990n">
            <Button variant="ghost" className="gap-2 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <FileText className="w-4 h-4" /> 990-N Quick Start
            </Button>
          </Link>
          <Link to="/tax/990ez">
            <Button variant="ghost" className="gap-2 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <FileText className="w-4 h-4" /> 990-EZ Guided Filing
            </Button>
          </Link>
          <Link to="/tax/8868">
            <Button variant="ghost" className="gap-2 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <Clock className="w-4 h-4" /> File an Extension
            </Button>
          </Link>
          <Link to="/tax/documents">
            <Button variant="ghost" className="gap-2 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <Upload className="w-4 h-4" /> Upload Tax Documents
            </Button>
          </Link>
          <Link to="/tax/review">
            <Button variant="ghost" className="gap-2 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <UserCheck className="w-4 h-4" /> Request Professional Review
            </Button>
          </Link>
        </div>
      </div>
    </section>

    {/* Trust Cards */}
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <h2 className="font-display text-2xl font-bold text-center mb-8">Why Nonprofits Choose D.O.M.E.</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {TRUST_CARDS.map(c => (
          <Card key={c.title} className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <c.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">{c.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>

    {/* Pricing */}
    <section className="bg-muted/50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-center mb-3">Flat-Fee Pricing</h2>
        <p className="text-center text-muted-foreground mb-8">No hidden costs. Know your price before you start.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PRICING.map(p => (
            <Card key={p.label} className={p.popular ? "border-2 border-secondary shadow-lg" : ""}>
              <CardContent className="p-6 text-center space-y-3">
                {p.popular && <Badge className="bg-secondary text-secondary-foreground">Most Common</Badge>}
                <p className="text-3xl font-bold">{p.price}</p>
                <p className="font-semibold text-sm">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link to="/tax/nonprofit/start">
            <Button className="gap-2 bg-secondary hover:bg-secondary/90">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>

    {/* How it works */}
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <h2 className="font-display text-2xl font-bold text-center mb-8">How It Works</h2>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {[
          { step: "1", title: "Quick Intake", desc: "Answer a few questions about your organization." },
          { step: "2", title: "Filing Recommendation", desc: "We tell you which form you likely need." },
          { step: "3", title: "Guided Workspace", desc: "Complete your filing step by step." },
          { step: "4", title: "Review & Export", desc: "Review, pay, and get your filing package." },
        ].map(s => (
          <div key={s.step} className="text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground font-bold text-lg flex items-center justify-center mx-auto">
              {s.step}
            </div>
            <h3 className="font-semibold text-sm">{s.title}</h3>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Disclaimer */}
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
      <p className="text-xs text-muted-foreground leading-relaxed">
        D.O.M.E. provides workflow, preparation, and filing support tools. Tax filings and recommendations should be reviewed for accuracy. D.O.M.E. does not provide legal or tax advice unless separately supported by a qualified professional.
      </p>
    </section>
  </div>
);

export default NonprofitLanding;
