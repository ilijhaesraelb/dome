import { Link } from "react-router-dom";
import { Shield, Lock, Eye, Server, Database, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import LegalEntityNotice from "@/components/LegalEntityNotice";
import domeLogo from "@/assets/dome-logo.png";
import { useT } from "@/hooks/useT";

const SecurityPolicy = () => {
  const t = useT();

  const securityFeatures = [
    { icon: Lock, titleKey: "legal.secTLS", descKey: "legal.secTLSDesc" },
    { icon: Database, titleKey: "legal.secAES", descKey: "legal.secAESDesc" },
    { icon: Shield, titleKey: "legal.secMFA", descKey: "legal.secMFADesc" },
    { icon: Eye, titleKey: "legal.secRBAC", descKey: "legal.secRBACDesc" },
    { icon: Server, titleKey: "legal.secSOC", descKey: "legal.secSOCDesc" },
    { icon: AlertTriangle, titleKey: "legal.secThreat", descKey: "legal.secThreatDesc" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">D.O.M.E.</span>
          </Link>
          <BackButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">{t("legal.securityTitle")}</h1>
        <p className="text-muted-foreground text-sm mb-10">{t("legal.securitySubtitle")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {securityFeatures.map(f => (
            <Card key={f.titleKey} className="border-2">
              <CardContent className="p-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{t(f.titleKey)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t(f.descKey)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">{t("legal.responsibleEntityTitle")}</h2>
            <p>{t("legal.responsibleEntityText")}</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">{t("legal.secDocProtTitle")}</h2>
            <p>{t("legal.secDocProtText")}</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">{t("legal.secAuditTitle")}</h2>
            <p>{t("legal.secAuditText")}</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">{t("legal.secIsolationTitle")}</h2>
            <p>{t("legal.secIsolationText")}</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">{t("legal.secBackupTitle")}</h2>
            <p>{t("legal.secBackupText")}</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">{t("legal.secIncidentTitle")}</h2>
            <p>{t("legal.secIncidentText")}</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">{t("legal.secComplianceTitle")}</h2>
            <p>{t("legal.secComplianceText")}</p>
          </section>
        </div>
      </main>

      <footer className="border-t bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground">{t("common.terms")}</Link>
          <Link to="/privacy" className="hover:text-foreground">{t("common.privacy")}</Link>
          <Link to="/security" className="hover:text-foreground">{t("common.security")}</Link>
          <Link to="/platform-position" className="hover:text-foreground">{t("common.platformPosition")}</Link>
          <span>© {new Date().getFullYear()} D.O.M.E.</span>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-6">
          <LegalEntityNotice />
        </div>
      </footer>
    </div>
  );
};

export default SecurityPolicy;
