import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Loader2, Lock, ShieldCheck, Shield, Building2, Scale, Compass, Rocket } from "lucide-react";
import BackButton from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import domeLogo from "@/assets/dome-logo.png";
import FlagsWatermark from "@/components/FlagsWatermark";
import { useT } from "@/hooks/useT";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type UserRole = "client" | "attorney" | "accredited_rep" | "government" | "organization";

const Signup = () => {
  const t = useT();
  const [searchParams] = useSearchParams();
  const preselectedRole = (searchParams.get("role") as UserRole) || "client";
  
  const [role, setRole] = useState<UserRole>(preselectedRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const r = searchParams.get("role") as UserRole;
    if (r && roleConfig[r]) setRole(r);
  }, [searchParams]);

  const roleConfig: Record<UserRole, { label: string; icon: React.ElementType; description: string; signupRole: string }> = {
    client: { label: t("signup.individual"), icon: Compass, description: t("signup.individualDesc"), signupRole: "client" },
    attorney: { label: t("signup.legalPro"), icon: Scale, description: t("signup.legalProDesc"), signupRole: "attorney" },
    accredited_rep: { label: t("signup.arDoj"), icon: Shield, description: t("signup.arDojDesc"), signupRole: "accredited_rep" },
    organization: { label: t("signup.organization"), icon: Building2, description: t("signup.organizationDesc"), signupRole: "government" },
    government: { label: t("signup.government"), icon: Building2, description: t("signup.governmentDesc"), signupRole: "government" },
  };

  const isOrgType = role === "government" || role === "organization";
  const config = roleConfig[role];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const metadata: Record<string, string> = {
      display_name: email.split("@")[0],
      requested_role: config.signupRole,
    };
    if (isOrgType && organizationName) {
      metadata.organization_name = organizationName;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });

    if (error) {
      toast({ title: t("signup.signupFailed"), description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data.user) {
      const affiliateId = localStorage.getItem("dome_affiliate_id");
      const affiliateCode = localStorage.getItem("dome_affiliate_code");
      const clickedAt = localStorage.getItem("dome_affiliate_click_at");
      if (affiliateId && clickedAt) {
        // Fraud prevention: check self-referral
        const { data: affData } = await supabase
          .from("affiliates")
          .select("user_id, email")
          .eq("id", affiliateId)
          .maybeSingle();

        const isSelfReferral =
          affData?.user_id === data.user.id ||
          (affData?.email && affData.email.toLowerCase() === email.toLowerCase());

        if (isSelfReferral) {
          console.warn("Self-referral blocked");
          localStorage.removeItem("dome_affiliate_code");
          localStorage.removeItem("dome_affiliate_id");
          localStorage.removeItem("dome_affiliate_click_at");
        } else {
          const clickDate = new Date(clickedAt);
          const now = new Date();
          const daysSinceClick = (now.getTime() - clickDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceClick <= 90) {
            const expiresAt = new Date(clickDate);
            expiresAt.setDate(expiresAt.getDate() + 90);
            await supabase.from("affiliate_attributions").insert({
              affiliate_id: affiliateId,
              user_id: data.user.id,
              attributed_at: now.toISOString(),
              attribution_expires_at: expiresAt.toISOString(),
              attribution_model: "last_click",
            });
          }
          localStorage.removeItem("dome_affiliate_code");
          localStorage.removeItem("dome_affiliate_id");
          localStorage.removeItem("dome_affiliate_click_at");
        }
      }
    }

    if (data.session) {
      toast({ title: t("signup.accountCreated"), description: t("signup.welcomeDome") });
      if (role === "client") navigate("/onboarding");
      else if (role === "government" || role === "organization") navigate("/gov/dashboard");
      else navigate("/dashboard");
    } else {
      toast({ title: t("signup.accountCreated"), description: t("signup.checkEmail") });
      navigate("/login");
    }
    setLoading(false);
  };

  const roleOptions: { key: UserRole; label: string }[] = [
    { key: "client", label: t("signup.roleIndividual") },
    { key: "attorney", label: t("signup.roleAttorney") },
    { key: "accredited_rep", label: t("signup.roleArDoj") },
    { key: "organization", label: t("signup.roleOrganization") },
    { key: "government", label: t("signup.roleGovernment") },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-3 py-6 sm:p-8 bg-background relative overflow-x-hidden">
      <div className="absolute top-3 left-3 z-10"><BackButton /></div>
      <div className="absolute top-3 right-3 z-10"><LanguageSwitcher variant="compact" /></div>
      <FlagsWatermark />
      <Card className="w-full max-w-md relative z-10 bg-card/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-2 px-4 sm:px-6">
          <div className="flex flex-col items-center gap-3 mb-3">
            <img src={domeLogo} alt="D.O.M.E. Logo" className="w-24 sm:w-32 h-auto" />
            <Link
              to="/affiliate"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-warning to-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground transition-all hover:scale-105 shadow-[0_0_10px_hsl(var(--warning)/0.6),0_0_20px_hsl(var(--secondary)/0.4)] animate-pulse"
            >
              <Rocket className="h-3.5 w-3.5" />
              Earn With D.O.M.E.
            </Link>
          </div>
          <CardTitle className="font-display text-xl sm:text-2xl">{t("signup.title")}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{t("signup.subtitle")}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent border border-border">
              <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                <config.icon className="w-4.5 h-4.5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{config.label}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">{config.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {roleOptions.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRole(r.key)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-colors ${
                    role === r.key
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {isOrgType && (
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-medium">{t("signup.orgName")} *</label>
                <Input
                  placeholder={t("signup.orgNamePlaceholder")}
                  value={organizationName}
                  onChange={e => setOrganizationName(e.target.value)}
                  required
                  className="text-sm h-10"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-medium">{t("common.email")} *</label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="text-sm h-10" />
            </div>

            <div className="space-y-1">
              <label className="text-xs sm:text-sm font-medium">{t("common.password")} *</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="text-sm h-10" />
            </div>

            <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
              {t("signup.agreeTerms")}{" "}
              <Link to="/terms" className="underline hover:text-foreground">{t("common.termsOfService")}</Link> {t("common.and")}{" "}
              <Link to="/privacy" className="underline hover:text-foreground">{t("common.privacyPolicy")}</Link>.
              {" "}{t("common.disclaimer")}
            </p>

            <Button className="w-full gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground h-11 sm:h-12 text-sm sm:text-base" type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("common.createAccount")} <ArrowRight className="w-4 h-4" /></>}
            </Button>

            <p className="text-center text-xs sm:text-sm text-muted-foreground">
              {t("common.alreadyHaveAccount")}{" "}
              <Link to="/login" className="text-foreground hover:underline font-semibold">
                {t("common.signIn")}
              </Link>
            </p>
          </CardContent>
        </form>

        <div className="flex justify-center gap-6 sm:gap-8 pb-3 pt-2 border-t mx-4 sm:mx-6">
          <div className="flex flex-col items-center gap-0.5">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground">{t("common.encrypted")}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground">{t("common.secure")}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground">{t("common.private")}</span>
          </div>
        </div>

        <div className="flex justify-center gap-3 text-[10px] sm:text-xs text-muted-foreground pb-3">
          <Link to="/privacy" className="hover:underline">{t("common.privacyPolicy")}</Link>
          <span>·</span>
          <Link to="/terms" className="hover:underline">{t("common.terms")}</Link>
        </div>
      </Card>
    </div>
  );
};

export default Signup;
