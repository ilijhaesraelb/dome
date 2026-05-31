import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Loader2, Compass, Rocket } from "lucide-react";
import BackButton from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import domeLogo from "@/assets/dome-logo.png";
import FlagsWatermark from "@/components/FlagsWatermark";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/hooks/useT";

const Login = () => {
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: t("login.failed"), description: t("login.failedDesc"), variant: "destructive" });
      setLoading(false);
      return;
    }

    // Check roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    const roleList = roles?.map(r => r.role) ?? [];
    const isPractitioner = roleList.some(r => ["admin", "practitioner", "attorney", "paralegal"].includes(r));

    // Check the user's requested_role from metadata to distinguish government from A&R DOJ
    const requestedRole = data.user.user_metadata?.requested_role;

    // Check if user is an institution member → route to gov portal
    // Only route to gov if they signed up as government (not accredited_rep)
    if (requestedRole === "government") {
      const { data: instUser } = await supabase
        .from("institution_users")
        .select("id")
        .eq("user_id", data.user.id)
        .eq("is_active", true)
        .limit(1);

      if (instUser && instUser.length > 0) {
        navigate("/gov/dashboard");
      } else {
        // Government user without institution — still go to gov dashboard (will see access restricted)
        navigate("/gov/dashboard");
      }
    } else if (isPractitioner) {
      navigate("/dashboard");
    } else {
      navigate("/portal");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex relative overflow-x-hidden">
      <div className="absolute top-3 left-3 z-20"><BackButton /></div>
      <div className="absolute top-3 right-3 z-20"><LanguageSwitcher /></div>
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12 relative overflow-hidden">
        <FlagsWatermark />
        <div className="max-w-md text-primary-foreground relative z-10 text-center">
          <Link
            to="/affiliate"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-warning to-secondary px-4 py-1.5 text-xs font-semibold text-secondary-foreground transition-all hover:scale-105 shadow-[0_0_10px_hsl(var(--warning)/0.6),0_0_20px_hsl(var(--secondary)/0.4)] animate-pulse mb-6"
          >
            <Rocket className="h-3.5 w-3.5" />
            Earn With D.O.M.E.
          </Link>
          <img src={domeLogo} alt="D.O.M.E. Logo" className="w-56 h-auto mx-auto mb-8 drop-shadow-lg" />
          <h1 className="font-display text-4xl font-bold mb-4">
            {t("login.title")}
          </h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            {t("login.description")}
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:p-8 bg-background relative">
        <FlagsWatermark />
        <Card className="w-full max-w-md border-0 shadow-none relative z-10 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="lg:hidden flex flex-col items-center gap-3 mb-4">
              <img src={domeLogo} alt="D.O.M.E. Logo" className="w-32 h-auto" />
              <Link
                to="/affiliate"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-warning to-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground transition-all hover:scale-105 shadow-[0_0_10px_hsl(var(--warning)/0.6),0_0_20px_hsl(var(--secondary)/0.4)] animate-pulse"
              >
                <Rocket className="h-3.5 w-3.5" />
                Earn With D.O.M.E.
              </Link>
            </div>
            <CardTitle className="font-display text-2xl">{t("common.welcomeBack")}</CardTitle>
            <CardDescription>{t("common.signInToAccount")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("common.email")}</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">{t("common.password")}</label>
                  <Link to="/reset-password" className="text-sm text-secondary hover:underline">
                    {t("common.forgotPassword")}
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground" type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("common.signIn")} <ArrowRight className="w-4 h-4" /></>}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {t("common.dontHaveAccount")}{" "}
                <Link to="/signup" className="text-secondary hover:underline font-medium">
                  {t("common.signUp")}
                </Link>
              </p>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">{t("common.or")}</span></div>
              </div>
              <Link to="/pathway-finder">
                <Button variant="outline" className="w-full gap-2" type="button">
                  <Compass className="w-4 h-4" /> {t("common.findOptions")}
                </Button>
              </Link>
            </CardContent>
          </form>
          <div className="flex justify-center gap-3 text-xs text-muted-foreground pb-4 pt-2">
            <Link to="/privacy" className="hover:underline">{t("common.privacyPolicy")}</Link>
            <span>·</span>
            <Link to="/terms" className="hover:underline">{t("common.terms")}</Link>
            <span>·</span>
            <Link to="/security" className="hover:underline">{t("common.security")}</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
