import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check, Loader2, Shield, BookOpen, ArrowRight,
  Globe, Building2, Scale, Briefcase, Heart, TrendingUp,
  Store, Users, Crown, Star, Zap, Landmark, Handshake,
  AlertTriangle,
} from "lucide-react";
import domeLogo from "@/assets/dome-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  CLIENT_PLANS, BUSINESS_PLANS, NONPROFIT_PLANS, EB5_PLANS,
  MARKETPLACE_PLANS, PROFESSIONAL_PLANS,
  type StripePlan,
} from "@/lib/stripe-plans";

/* ── icon lookup ─────────────────────────────────────────── */
const sectionIcons: Record<string, any> = {
  onboarding: Zap, standard: Star, pro: Crown,
  "biz-starter": Building2, "biz-builder": Briefcase, "biz-pro": Handshake,
  "np-starter": Heart, "np-builder": Globe, "np-pro": Landmark,
  "eb5-readiness": TrendingUp, "eb5-prep": Scale, "eb5-handoff": Briefcase,
  "listing-standard": Store, "listing-featured": Star, "listing-org": Users,
  "attorney-ar": Scale, professional: Briefcase, enterprise: Building2,
};

/* ── PlanCard ────────────────────────────────────────────── */
const PlanCard = ({
  plan, onSelect, loading,
}: {
  plan: StripePlan; onSelect: (p: StripePlan) => void; loading: boolean;
}) => {
  const Icon = sectionIcons[plan.id] || Star;

  return (
    <Card className={`relative flex flex-col h-full ${plan.popular ? "shadow-lg ring-1 ring-secondary/30" : ""}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-secondary text-secondary-foreground shadow-md px-3">Most Popular</Badge>
        </div>
      )}
      {plan.badge && !plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="outline" className="shadow-sm px-3 bg-card">{plan.badge}</Badge>
        </div>
      )}
      <CardHeader className="pb-3 pt-6">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <CardTitle className="font-display text-lg">{plan.name}</CardTitle>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold">{plan.priceLabel || `$${plan.price}`}</span>
          {!plan.priceLabel && plan.interval && <span className="text-sm text-muted-foreground">/{plan.interval}</span>}
          {!plan.priceLabel && !plan.interval && <span className="text-sm text-muted-foreground">one-time</span>}
        </div>
        {plan.includesFrom && (
          <p className="text-xs text-muted-foreground mt-1">Everything in {plan.includesFrom} plus:</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <ul className="space-y-2 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-secondary" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Button
          className={`w-full ${plan.popular ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground" : ""}`}
          variant={plan.popular ? "default" : "outline"}
          disabled={loading}
          onClick={() => onSelect(plan)}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : plan.cta || "Get Started"}
        </Button>
      </CardContent>
    </Card>
  );
};

/* ── Section wrapper ─────────────────────────────────────── */
const PricingSection = ({
  id, icon: Icon, title, subtitle, plans, onSelect, loadingPlan, note,
}: {
  id: string;
  icon: any;
  title: string;
  subtitle?: string;
  plans: StripePlan[];
  onSelect: (p: StripePlan) => void;
  loadingPlan: string | null;
  note?: string;
}) => (
  <section id={id} className="scroll-mt-24 space-y-6">
    <div className="text-center space-y-2">
      <div className="flex justify-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold">{title}</h2>
      {subtitle && <p className="text-muted-foreground max-w-xl mx-auto text-sm">{subtitle}</p>}
    </div>
    <div className={`grid gap-6 ${plans.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto" : "grid-cols-1 md:grid-cols-3"}`}>
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} onSelect={onSelect} loading={loadingPlan === plan.id} />
      ))}
    </div>
    {note && <p className="text-xs text-muted-foreground text-center max-w-lg mx-auto">{note}</p>}
  </section>
);

/* ── Main Page ───────────────────────────────────────────── */
const Pricing = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (plan: StripePlan) => {
    if (plan.cta === "Contact Sales") {
      toast({ title: "Enterprise", description: "Please email us at sales@domeplatform.com for enterprise pricing." });
      return;
    }
    if (plan.price_id.startsWith("REPLACE_")) {
      toast({ title: "Coming Soon", description: "This plan will be available once payment processing is configured." });
      return;
    }
    if (!session) {
      toast({ title: "Sign in required", description: "Please create an account first." });
      navigate("/signup");
      return;
    }
    setLoadingPlan(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: plan.price_id, mode: plan.mode },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not start checkout.", variant: "destructive" });
    } finally {
      setLoadingPlan(null);
    }
  };

  const sections = [
    { id: "immigration", icon: Globe, title: "Immigration Platform Access", plans: CLIENT_PLANS, note: "Exporting a completed case packet may include a small processing fee depending on the application type." },
    { id: "business", icon: Building2, title: "Start a Business in the United States", subtitle: "Guided workflows help you understand how to form an LLC, corporation, or nonprofit in any state.", plans: BUSINESS_PLANS },
    { id: "nonprofit", icon: Heart, title: "Start a Nonprofit Organization", subtitle: "Launch your mission-driven organization with guided formation and IRS readiness tools.", plans: NONPROFIT_PLANS },
    { id: "eb5", icon: TrendingUp, title: "EB-5 Investor Preparation", subtitle: "Organize your documents and understand the EB-5 immigration investment process.", plans: EB5_PLANS },
    { id: "marketplace", icon: Store, title: "List Business Opportunities", subtitle: "Connect with potential investors and partners.", plans: MARKETPLACE_PLANS },
    { id: "professional", icon: Scale, title: "For Attorneys, Organizations & Enterprise Teams", subtitle: "Powerful tools for immigration professionals and large organizations.", plans: PROFESSIONAL_PLANS },
  ];

  const jumpLinks = [
    { id: "immigration", label: "Immigration" },
    { id: "business", label: "Business" },
    { id: "nonprofit", label: "Nonprofit" },
    { id: "eb5", label: "EB-5" },
    { id: "marketplace", label: "Marketplace" },
    { id: "professional", label: "Professional" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center space-y-5">
          <div className="flex items-center justify-between">
            <BackButton />
            <img src={domeLogo} alt="D.O.M.E." className="w-14 h-14 rounded-full" />
            <div className="w-10" />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold max-w-3xl mx-auto leading-tight">
            Simple Pricing for Your Immigration and Business Journey
          </h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-base sm:text-lg">
            Affordable tools to help you prepare immigration cases, launch businesses, build nonprofits, and explore opportunities in the United States.
          </p>
          <p className="text-primary-foreground/60 max-w-xl mx-auto text-sm">
            D.O.M.E. was designed to make immigration and entrepreneurship easier. Our pricing is transparent and accessible so individuals, organizations, and professionals can use the platform confidently.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              size="lg"
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold"
              onClick={() => navigate("/signup")}
            >
              Start for $1
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline-light"
              onClick={() => document.getElementById("immigration")?.scrollIntoView({ behavior: "smooth" })}
            >
              Explore Plans
            </Button>
          </div>
        </div>
      </div>

      {/* ── Jump Navigation ─────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1 py-2 min-w-max">
            {jumpLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth" })}
                className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pricing Sections ────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
        {sections.map((section) => (
          <PricingSection
            key={section.id}
            id={section.id}
            icon={section.icon}
            title={section.title}
            subtitle={section.subtitle}
            plans={section.plans}
            onSelect={handleSelectPlan}
            loadingPlan={loadingPlan}
            note={section.note}
          />
        ))}

        {/* ── Trust & Disclosures ────────────────────────────── */}
        <section className="space-y-6 pt-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <h3 className="font-display text-lg font-bold">Important Notice</h3>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    D.O.M.E. provides educational tools, document organization services, and workflow guidance.
                    D.O.M.E. does not provide legal advice, tax advice, or investment advice.
                  </p>
                  <p>
                    Business opportunity and EB-5 materials are informational only and do not guarantee
                    investment results, funding, visa approval, or immigration outcomes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-secondary" />
              Bank-grade encryption
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <BookOpen className="w-4 h-4 text-secondary" />
              Transparent pricing
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground/60 max-w-lg mx-auto text-center">
            State filing rules, fees, and methods vary by state and entity type. Always review the official state filing office requirements before submission.
            Tax services and tax guidance are subject to applicable IRS rules. Pricing is subject to change. No hidden fees.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Pricing;
