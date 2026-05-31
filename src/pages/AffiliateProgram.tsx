import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Rocket, DollarSign, Users, BarChart3, Shield, CheckCircle2,
  ArrowRight, Globe, CreditCard, Percent, Clock, Gift, Share2,
  FileText, Loader2, Trophy, Star, Crown, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import domeLogo from "@/assets/dome-logo.png";

const AffiliateProgram = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: user?.email || "",
    country: "",
    paypalEmail: "",
    taxStatus: "",
    agreedTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreedTerms) {
      toast.error("Please agree to the affiliate terms.");
      return;
    }
    if (!user) {
      toast.info("Please sign up or log in first, then become an affiliate.");
      navigate("/signup");
      return;
    }

    setLoading(true);
    try {
      const code = form.fullName.replace(/\s+/g, "").toUpperCase().slice(0, 8) +
        Math.random().toString(36).slice(2, 6).toUpperCase();

      const { error } = await supabase.from("affiliates").insert({
        user_id: user.id,
        display_name: form.fullName,
        email: form.email,
        affiliate_code: code,
        type: "individual",
        payment_method: `paypal:${form.paypalEmail}`,
        notes: `Country: ${form.country}, Tax: ${form.taxStatus}`,
        subscription_commission_pct: 20,
        export_commission_pct: 15,
        cookie_duration_days: 90,
        attribution_window_days: 90,
        min_payout_amount: 50,
        payout_term_months: 12,
      });

      if (error) throw error;
      toast.success("Welcome! Your affiliate account is now active.");
      navigate("/affiliate/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to create affiliate account.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { icon: Users, title: "Sign Up", desc: "Create your free affiliate account in seconds." },
    { icon: Share2, title: "Share Your Link", desc: "Get a unique referral link and share it with your network." },
    { icon: Gift, title: "Both Sides Win", desc: "New users get 30 days free. You earn recurring commissions." },
    { icon: DollarSign, title: "Get Paid", desc: "Request payouts via PayPal once you reach $50." },
  ];

  const commissionTiers = [
    { type: "Subscriptions", rate: "20%", example: "$10/mo → you earn $2/mo", icon: Percent },
    { type: "Document Exports", rate: "15%", example: "$100 export → you earn $15", icon: FileText },
    { type: "Cookie Duration", rate: "90 days", example: "Attribution lasts 90 days after click", icon: Clock },
    { type: "Min Payout", rate: "$50", example: "Request payout anytime after $50", icon: Gift },
  ];

  const affiliateLevels = [
    { level: "Level 1", name: "Affiliate", commission: "20%", requirement: "Sign up", icon: Star, color: "text-secondary" },
    { level: "Level 2", name: "Partner", commission: "25%", requirement: "50+ referrals", icon: Trophy, color: "text-warning" },
    { level: "Level 3", name: "Ambassador", commission: "30%", requirement: "200+ referrals", icon: Crown, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-foreground">D.O.M.E.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-1.5"
              onClick={() => setShowSignup(true)}>
              <Rocket className="w-4 h-4" /> Become an Affiliate
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, hsl(38 92% 50% / 0.3), transparent 50%), radial-gradient(circle at 80% 20%, hsl(22 76% 53% / 0.2), transparent 40%)"
        }} />
        <div className="relative max-w-4xl mx-auto px-4 py-20 sm:py-28 text-center text-primary-foreground">
          <Badge className="bg-warning/20 text-warning border-warning/30 mb-6 text-sm px-4 py-1">
            <DollarSign className="w-4 h-4 mr-1" /> Earn While You Share
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            D.O.M.E. Affiliate Program
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-primary-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Share D.O.M.E. with your network and earn commissions whenever someone signs up and subscribes through your referral link. New users get <strong>30 days free!</strong>
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg"
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg px-10 py-7 rounded-xl shadow-lg gap-2"
              onClick={() => setShowSignup(true)}>
              <Rocket className="w-5 h-5" /> Become an Affiliate <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Two-Sided Reward */}
      <section className="py-12 bg-secondary/5 border-y border-secondary/20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-secondary/30 bg-gradient-to-br from-secondary/5 to-transparent">
              <CardContent className="p-6 text-center">
                <Gift className="w-10 h-10 text-secondary mx-auto mb-3" />
                <h3 className="font-display text-lg font-bold text-foreground">Your Friend Gets</h3>
                <p className="text-3xl font-bold text-secondary mt-2">30 Days Free</p>
                <p className="text-sm text-muted-foreground mt-2">Full platform access at no cost</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-display text-lg font-bold text-foreground">You Earn</h3>
                <p className="text-3xl font-bold text-primary mt-2">Up to 30%</p>
                <p className="text-sm text-muted-foreground mt-2">Recurring commission on every payment</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">How It Works</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Four simple steps to start earning</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <Card key={step.title} className="relative overflow-hidden border-2 hover:border-secondary/40 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="absolute top-3 right-3 text-4xl font-bold text-muted/20">{i + 1}</div>
                  <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-7 h-7 text-secondary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Affiliate Levels */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Affiliate Levels</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">The more you refer, the more you earn</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {affiliateLevels.map((tier) => (
              <Card key={tier.name} className="border-2 hover:shadow-lg transition-shadow text-center">
                <CardContent className="p-8">
                  <tier.icon className={`w-12 h-12 ${tier.color} mx-auto mb-4`} />
                  <Badge variant="outline" className="mb-2 text-xs">{tier.level}</Badge>
                  <h3 className="font-display text-xl font-bold text-foreground">{tier.name}</h3>
                  <p className="text-4xl font-bold text-secondary mt-3">{tier.commission}</p>
                  <p className="text-xs text-muted-foreground mt-1">recurring commission</p>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">{tier.requirement}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Commission Structure</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Generous rates, transparent tracking</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {commissionTiers.map((tier) => (
              <Card key={tier.type} className="border-2">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <tier.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{tier.type}</h3>
                    <p className="text-2xl font-bold text-secondary mt-1">{tier.rate}</p>
                    <p className="text-xs text-muted-foreground mt-1">{tier.example}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Payout Methods */}
      <section className="py-16 sm:py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">Payout Methods</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "PayPal", status: "Active", icon: CreditCard },
              { name: "Stripe Connect", status: "Coming Soon", icon: CreditCard },
              { name: "Wire Transfer", status: "Coming Soon", icon: Globe },
            ].map(m => (
              <Card key={m.name} className={m.status === "Active" ? "border-secondary/50 border-2" : "opacity-60"}>
                <CardContent className="p-5 text-center">
                  <m.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">{m.name}</h3>
                  <Badge variant={m.status === "Active" ? "default" : "outline"} className="mt-2 text-xs">
                    {m.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Terms & Eligibility */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-foreground text-center mb-8">Terms & Eligibility</h2>
          <div className="space-y-3">
            {[
              "Open to individuals, organizations, attorneys, and partners worldwide.",
              "Self-referrals are not allowed and will result in account suspension.",
              "Commissions are tracked for 90 days after a referral click.",
              "Minimum payout threshold is $50. Payouts are processed monthly.",
              "U.S. affiliates earning over $600/year must provide a W-9 for 1099 reporting.",
              "D.O.M.E. reserves the right to suspend accounts for fraudulent activity.",
              "Commission rates may be adjusted with 30 days notice.",
              "New users referred via your link receive 30 days of free access.",
            ].map((term, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{term}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Form */}
      {showSignup && (
        <section id="signup" className="py-16 sm:py-20 bg-muted/30">
          <div className="max-w-md mx-auto px-4">
            <Card className="border-2 border-secondary/30 shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <Rocket className="w-10 h-10 text-secondary mx-auto mb-3" />
                  <h2 className="font-display text-2xl font-bold text-foreground">Become an Affiliate</h2>
                  <p className="text-sm text-muted-foreground mt-1">Fill out the form below to get started</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Full Name *</label>
                    <Input required value={form.fullName}
                      onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                      placeholder="John Doe" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Email *</label>
                    <Input required type="email" value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="john@example.com" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Country *</label>
                    <Input required value={form.country}
                      onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                      placeholder="United States" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">PayPal Email (for payouts) *</label>
                    <Input required type="email" value={form.paypalEmail}
                      onChange={e => setForm(p => ({ ...p, paypalEmail: e.target.value }))}
                      placeholder="paypal@example.com" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Tax Status *</label>
                    <Select value={form.taxStatus} onValueChange={v => setForm(p => ({ ...p, taxStatus: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us_resident">U.S. Resident (W-9 required if &gt;$600)</SelectItem>
                        <SelectItem value="non_us">Non-U.S. Resident</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-start gap-2 pt-2">
                    <Checkbox checked={form.agreedTerms}
                      onCheckedChange={(v) => setForm(p => ({ ...p, agreedTerms: !!v }))} id="terms" />
                    <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      I agree to the D.O.M.E. Affiliate Program Terms & Conditions, including the commission structure, payout policies, and fraud prevention guidelines.
                    </label>
                  </div>
                  <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2" size="lg" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                    {loading ? "Creating Account..." : "Create Affiliate Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Final CTA */}
      {!showSignup && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/90" />
          <div className="relative max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center text-primary-foreground">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Ready to Start Earning?</h2>
            <p className="mt-4 text-lg text-primary-foreground/70 max-w-xl mx-auto">
              Join hundreds of affiliates already earning with D.O.M.E. Your friends get 30 days free — you get paid.
            </p>
            <Button size="lg" className="mt-8 bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg px-10 py-7 rounded-xl shadow-lg gap-2"
              onClick={() => setShowSignup(true)}>
              <Rocket className="w-5 h-5" /> Become an Affiliate <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-card border-t py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={domeLogo} alt="D.O.M.E." className="w-5 h-5 object-contain" />
            <span className="text-xs text-muted-foreground">D.O.M.E. Affiliate Program</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <span>© {new Date().getFullYear()} D.O.M.E.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AffiliateProgram;
