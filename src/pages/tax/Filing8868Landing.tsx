/**
 * Form 8868 (Extension) Landing Page — Urgent, fast-completion positioning.
 */
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, CheckCircle2, Clock, DollarSign, FileText,
  Heart, Lock, Save, Shield, Zap, AlertTriangle,
} from "lucide-react";
import BackButton from "@/components/BackButton";

const TRUST_CARDS = [
  { icon: Zap, title: "Fast Completion", desc: "Finish in under 5 minutes." },
  { icon: DollarSign, title: "Flat-Fee Pricing", desc: "One affordable price, no surprises." },
  { icon: Clock, title: "Deadline-Aware", desc: "Don't miss your filing window." },
  { icon: Save, title: "Save & Resume", desc: "Come back anytime." },
  { icon: Heart, title: "Built for Nonprofits", desc: "Designed for real organizations." },
];

const STEPS = [
  { num: "1", title: "Quick Check", desc: "Confirm you likely need an extension." },
  { num: "2", title: "Enter Key Info", desc: "Org name, EIN, officer, and tax year — that's it." },
  { num: "3", title: "Review & Pay", desc: "Verify, pay a flat fee, and move to filing support." },
];

const Filing8868Landing = () => (
  <div className="min-h-screen bg-background">
    {/* Hero */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/85" />
      <div className="relative max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center text-primary-foreground">
        <div className="absolute top-4 left-4"><BackButton /></div>
        <Badge className="bg-warning/20 text-warning border-0 mb-4 text-xs gap-1">
          <Clock className="w-3 h-3" /> Deadline Approaching?
        </Badge>
        <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight">
          Need More Time to File?<br className="hidden sm:block" /> Get Your Extension Done Fast
        </h1>
        <p className="mt-5 text-base sm:text-lg text-primary-foreground/70 max-w-2xl mx-auto leading-relaxed">
          If your nonprofit isn't ready to file, request an extension in minutes with a simple, guided workflow.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/tax/8868/eligibility">
            <Button size="lg" className="gap-2 bg-secondary hover:bg-secondary/90 text-base px-8 py-6 rounded-xl shadow-lg w-full sm:w-auto">
              <Zap className="w-5 h-5" /> File Extension Now <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/tax/8868/workspace">
            <Button size="lg" variant="outline" className="text-base px-8 py-6 rounded-xl w-full sm:w-auto gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <FileText className="w-5 h-5" /> I Know I Need an Extension
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-xs text-primary-foreground/40 max-w-lg mx-auto">
          D.O.M.E. provides guided preparation tools — not legal or tax advice.
        </p>
      </div>
    </section>

    {/* Urgency Banner */}
    <section className="bg-warning/10 border-y border-warning/20">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
        <p className="text-sm">
          <span className="font-semibold">Don't risk late-filing penalties.</span>{" "}
          <span className="text-muted-foreground">Submitting an extension request can help protect your organization's tax-exempt status.</span>
        </p>
      </div>
    </section>

    {/* How It Works */}
    <section className="max-w-4xl mx-auto px-4 py-16">
      <h2 className="text-2xl font-display font-bold text-center mb-10">How It Works</h2>
      <div className="grid sm:grid-cols-3 gap-6">
        {STEPS.map(s => (
          <Card key={s.num} className="text-center border-2 hover:border-secondary/40 transition-colors">
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary font-bold text-lg flex items-center justify-center mx-auto mb-3">
                {s.num}
              </div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>

    {/* Trust Cards */}
    <section className="bg-muted/30 py-16">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-display font-bold text-center mb-10">Why Nonprofits Choose D.O.M.E.</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {TRUST_CARDS.map(c => (
            <Card key={c.title} className="text-center">
              <CardContent className="p-4">
                <c.icon className="w-6 h-6 mx-auto mb-2 text-secondary" />
                <p className="text-xs font-semibold">{c.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{c.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>

    {/* Pricing Preview */}
    <section className="max-w-md mx-auto px-4 py-16 text-center">
      <Badge className="bg-secondary/10 text-secondary border-0 mb-3">Flat Fee</Badge>
      <h2 className="text-2xl font-display font-bold mb-2">$25</h2>
      <p className="text-sm text-muted-foreground mb-6">
        One price. Guided extension preparation and filing support included.
      </p>
      <Link to="/tax/8868/eligibility">
        <Button size="lg" className="gap-2 bg-secondary hover:bg-secondary/90 w-full sm:w-auto">
          Get Started <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </section>

    {/* Disclaimer */}
    <div className="border-t py-6">
      <p className="text-[10px] text-muted-foreground text-center max-w-2xl mx-auto px-4">
        D.O.M.E. provides workflow, preparation, and filing support tools. Filing obligations should be reviewed for accuracy. D.O.M.E. does not provide legal or tax advice.
      </p>
    </div>
  </div>
);

export default Filing8868Landing;
