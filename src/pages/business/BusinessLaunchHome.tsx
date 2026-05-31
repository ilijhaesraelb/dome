import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Landmark, Heart, DollarSign, Store, ArrowRight, Shield } from "lucide-react";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSiteTranslations } from "@/i18n/siteTranslations";
import { useT } from "@/hooks/useT";

const moduleIcons = [Building2, Heart, DollarSign, Store, Landmark];

const BusinessLaunchHome = () => {
  const t = useT();
  const { locale } = useLanguage();
  const copy = getSiteTranslations(locale).businessHome;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">D.O.M.E.</span>
          </Link>
          <BackButton />
        </div>
      </header>

      <section className="bg-primary text-primary-foreground py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            {copy.heroTitleLine1}<br />
            <span className="text-secondary">{copy.heroTitleLine2}</span>
          </h1>
          <p className="mt-4 text-primary-foreground/70 text-lg max-w-2xl mx-auto">{copy.heroDescription}</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {copy.modules.map((moduleItem, index) => {
            const Icon = moduleIcons[index];
            return (
              <Link key={moduleItem.href} to={moduleItem.href}>
                <Card className="h-full hover:border-secondary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-secondary transition-colors">
                        {moduleItem.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">{moduleItem.description}</p>
                    </div>
                    <div className="mt-auto flex items-center gap-1 text-secondary text-sm font-medium">
                      {t("common.getStarted")} <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="font-display font-semibold text-xl text-foreground">{t("biz.needHelp")}</h3>
              <p className="text-muted-foreground mt-1">{t("biz.needHelpDesc")}</p>
            </div>
            <Link to="/business/hire-help">
              <Button className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground whitespace-nowrap">
                <Shield className="w-4 h-4" /> {t("biz.hireHelp")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="border-t bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">{t("biz.disclaimer")}</p>
        </div>
      </section>
    </div>
  );
};

export default BusinessLaunchHome;
