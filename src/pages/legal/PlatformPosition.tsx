import { Link } from "react-router-dom";
import { Scale, Shield, Users, Briefcase, Heart, Building2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import LegalEntityNotice from "@/components/LegalEntityNotice";
import domeLogo from "@/assets/dome-logo.png";
import { useT } from "@/hooks/useT";

const PlatformPosition = () => {
  const t = useT();
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
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">{t("legal.positionTitle")}</h1>
        <p className="text-muted-foreground text-sm mb-10">{t("legal.positionSubtitle")}</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/90">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-secondary" />
              <h2 className="font-display text-xl font-semibold text-foreground m-0">{t("legal.responsibleEntityTitle")}</h2>
            </div>
            <p>{t("legal.responsibleEntityText")}</p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-secondary" />
              <h2 className="font-display text-xl font-semibold text-foreground m-0">{t("legal.missionTitle")}</h2>
            </div>
            <p>{t("legal.missionText1")}</p>
            <p className="font-medium">{t("legal.missionText2")}</p>
            <p>{t("legal.missionText3")}</p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-5 h-5 text-secondary" />
              <h2 className="font-display text-xl font-semibold text-foreground m-0">{t("legal.legalPositionTitle")}</h2>
            </div>
            <p className="font-medium">{t("legal.legalPositionText1")}</p>
            <p>{t("legal.legalPositionText2")}</p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-5 h-5 text-secondary" />
              <h2 className="font-display text-xl font-semibold text-foreground m-0">{t("legal.commitmentTitle")}</h2>
            </div>
            <p>{t("legal.commitmentText1")}</p>
            <p>{t("legal.commitmentText2")}</p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-secondary" />
              <h2 className="font-display text-xl font-semibold text-foreground m-0">{t("legal.protectionTitle")}</h2>
            </div>
            <p>{t("legal.protectionText")}</p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-secondary" />
              <h2 className="font-display text-xl font-semibold text-foreground m-0">{t("legal.userProtTitle")}</h2>
            </div>
            <p>{t("legal.userProtText")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">{t("legal.ethicalTitle")}</h2>
            <p>{t("legal.ethicalText")}</p>
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

export default PlatformPosition;
