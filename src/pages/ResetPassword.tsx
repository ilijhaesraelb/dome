import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/hooks/useT";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const ResetPassword = () => {
  const t = useT();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setIsRecovery(true);
  }, []);

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("reset.sent"), description: t("reset.resetLinkSent") });
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("reset.passwordUpdated"), description: t("reset.passwordUpdatedDesc") });
      navigate("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="absolute top-3 right-3 z-10"><LanguageSwitcher variant="compact" /></div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Globe className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="font-display text-2xl">
            {isRecovery ? t("reset.setNew") : t("reset.title")}
          </CardTitle>
          <CardDescription>
            {isRecovery ? t("reset.enterNew") : t("reset.enterEmail")}
          </CardDescription>
        </CardHeader>
        <form onSubmit={isRecovery ? handleUpdatePassword : handleSendReset}>
          <CardContent className="space-y-4">
            {isRecovery ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("reset.newPassword")}</label>
                <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("common.email")}</label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            )}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isRecovery ? t("reset.updatePassword") : t("reset.sendResetLink")}
            </Button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> {t("reset.backToLogin")}
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
