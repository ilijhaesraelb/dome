import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Globe, Shield, FileText, Users, Heart, Scale, Briefcase,
  ArrowRight, CheckCircle2, Building2, GraduationCap
} from "lucide-react";
import domeLogo from "@/assets/dome-logo.png";
import LegalEntityNotice from "@/components/LegalEntityNotice";
import { useT } from "@/hooks/useT";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const AboutUs = () => {
  const t = useT();

  const values = [
    { icon: Shield, titleKey: "about.securityFirst", descKey: "about.securityFirstDesc" },
    { icon: Heart, titleKey: "about.immigrantCentered", descKey: "about.immigrantCenteredDesc" },
    { icon: Scale, titleKey: "about.noLegalAdvice", descKey: "about.noLegalAdviceDesc" },
    { icon: Globe, titleKey: "about.multilingual", descKey: "about.multilingualDesc" },
  ];

  const whoWeHelp = [
    { icon: Users, labelKey: "about.helpImmigrants", descKey: "about.helpImmigrantsDesc" },
    { icon: Scale, labelKey: "about.helpAttorneys", descKey: "about.helpAttorneysDesc" },
    { icon: Building2, labelKey: "about.helpGov", descKey: "about.helpGovDesc" },
    { icon: Briefcase, labelKey: "about.helpNonprofits", descKey: "about.helpNonprofitsDesc" },
    { icon: GraduationCap, labelKey: "about.helpConsultants", descKey: "about.helpConsultantsDesc" },
  ];

  const isItems = ["about.isItem1","about.isItem2","about.isItem3","about.isItem4","about.isItem5","about.isItem6"];
  const isNotItems = ["about.isNotItem1","about.isNotItem2","about.isNotItem3","about.isNotItem4","about.isNotItem5"];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">D.O.M.E.</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="compact" />
            <Link to="/"><Button variant="ghost" size="sm">{t("common.home")}</Button></Link>
            <Link to="/contact"><Button variant="ghost" size="sm">{t("common.contact")}</Button></Link>
            <Link to="/login"><Button variant="ghost" size="sm">{t("common.signIn")}</Button></Link>
            <Link to="/signup"><Button size="sm" className="bg-secondary hover:bg-secondary/90">{t("common.getStarted")}</Button></Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/85" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center text-primary-foreground">
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">{t("about.title")}</h1>
          <p className="mt-4 text-xl text-primary-foreground/70 max-w-2xl mx-auto">{t("about.subtitle")}</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12"><h2 className="font-display text-3xl font-bold">{t("about.missionTitle")}</h2></div>
        <div className="prose prose-lg max-w-3xl mx-auto text-muted-foreground leading-relaxed space-y-4">
          <p>{t("about.mission1")}</p>
          <p>{t("about.mission2")}</p>
          <p>{t("about.mission3")}</p>
        </div>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-center mb-12">{t("about.whoWeHelp")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {whoWeHelp.map(item => (
              <Card key={item.labelKey} className="border-2 hover:border-secondary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-secondary" />
                  </div>
                  <h3 className="font-semibold text-sm">{t(item.labelKey)}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t(item.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-3xl font-bold text-center mb-12">{t("about.valuesTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {values.map(v => (
            <div key={v.titleKey} className="flex items-start gap-4 p-5 rounded-xl bg-card border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <v.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t(v.titleKey)}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t(v.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold text-center mb-12">{t("about.whatIsTitle")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-2 border-secondary/30">
              <CardContent className="p-6">
                <h3 className="font-display font-bold text-lg mb-4 text-secondary">{t("about.domeIs")}</h3>
                <ul className="space-y-2">
                  {isItems.map(key => (
                    <li key={key} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2 border-destructive/30">
              <CardContent className="p-6">
                <h3 className="font-display font-bold text-lg mb-4 text-destructive">{t("about.domeIsNot")}</h3>
                <ul className="space-y-2">
                  {isNotItems.map(key => (
                    <li key={key} className="flex items-start gap-2 text-sm">
                      <span className="w-4 h-4 rounded-full border-2 border-destructive/40 shrink-0 mt-0.5" />
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl font-bold">{t("common.readyToGetStarted")}</h2>
          <p className="mt-4 text-primary-foreground/70 text-lg">{t("about.joinDome")}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup">
              <Button size="lg" className="gap-2 bg-secondary hover:bg-secondary/90 px-8 py-6 rounded-xl">
                {t("common.createFreeAccount")} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline-light" className="px-8 py-6 rounded-xl">
                {t("common.contactUs")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-card border-t">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={domeLogo} alt="D.O.M.E." className="w-6 h-6 object-contain" />
            <span className="text-sm font-medium">D.O.M.E. — {t("common.domeFullName")}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap justify-center">
            <Link to="/about" className="hover:text-foreground">{t("common.aboutUs")}</Link>
            <Link to="/contact" className="hover:text-foreground">{t("common.contact")}</Link>
            <Link to="/pricing" className="hover:text-foreground">{t("common.pricing")}</Link>
            <Link to="/terms" className="hover:text-foreground">{t("common.terms")}</Link>
            <Link to="/privacy" className="hover:text-foreground">{t("common.privacy")}</Link>
            <span>© {new Date().getFullYear()} D.O.M.E.</span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-6 space-y-1">
          <p className="text-xs text-muted-foreground/60 text-center">{t("common.disclaimerLong")}</p>
          <LegalEntityNotice />
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;
