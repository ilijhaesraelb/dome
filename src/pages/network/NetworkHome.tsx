import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import {
  Globe, Briefcase, Building2, Heart, GraduationCap, Home,
  Users, ArrowRight, Shield, MapPin, AlertTriangle
} from "lucide-react";
import { useT } from "@/hooks/useT";

const NetworkHome = () => {
  const t = useT();

  const categories = [
    { icon: Globe, titleKey: "netHome.catImmigration", descKey: "netHome.catImmigrationDesc", href: "/network/directory?category=immigration_opportunity", color: "bg-primary/10 text-primary" },
    { icon: Briefcase, titleKey: "netHome.catEmployment", descKey: "netHome.catEmploymentDesc", href: "/network/directory?category=employment_sponsorship", color: "bg-secondary/10 text-secondary" },
    { icon: Building2, titleKey: "netHome.catBusiness", descKey: "netHome.catBusinessDesc", href: "/network/directory?category=business_opportunity", color: "bg-accent-foreground/10 text-accent-foreground" },
    { icon: Heart, titleKey: "netHome.catNonprofit", descKey: "netHome.catNonprofitDesc", href: "/network/directory?category=nonprofit_program", color: "bg-success/10 text-success" },
    { icon: GraduationCap, titleKey: "netHome.catEducation", descKey: "netHome.catEducationDesc", href: "/network/directory?category=education_scholarship", color: "bg-warning/10 text-warning" },
    { icon: Home, titleKey: "netHome.catHousing", descKey: "netHome.catHousingDesc", href: "/network/directory?category=housing_relocation", color: "bg-destructive/10 text-destructive" },
    { icon: Users, titleKey: "netHome.catProfessional", descKey: "netHome.catProfessionalDesc", href: "/network/directory?category=professional_service", color: "bg-primary/10 text-primary" },
  ];

  const quickLinks = [
    { labelKey: "netHome.communityStories", href: "/network/community", icon: Heart },
    { labelKey: "netHome.successMap", href: "/network/map", icon: MapPin },
    { labelKey: "netHome.postListing", href: "/network/create", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">D.O.M.E.</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/"><Button variant="ghost" size="sm">{t("common.home")}</Button></Link>
            <Link to="/login"><Button variant="ghost" size="sm">{t("common.signIn")}</Button></Link>
            <Link to="/signup"><Button size="sm" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">{t("netHome.join")}</Button></Link>
          </div>
        </div>
      </header>

      <section className="bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <Globe className="w-4 h-4" />
            {t("netHome.badge")}
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold leading-tight max-w-3xl mx-auto">{t("netHome.heroTitle")}</h1>
          <p className="text-primary-foreground/70 mt-4 text-lg max-w-2xl mx-auto">{t("netHome.heroSubtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link to="/network/directory">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 px-8">
                {t("netHome.exploreNetwork")} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/network/create">
              <Button size="lg" variant="outline-light" className="px-8">{t("netHome.postListing")}</Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6"><BackButton /></div>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-2">{t("netHome.browseCategory")}</h2>
        <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">{t("netHome.browseDesc")}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <Link key={cat.titleKey} to={cat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full border-2 hover:border-secondary/30">
                <CardContent className="pt-6 pb-5 px-6 flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center shrink-0`}>
                    <cat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg">{t(cat.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t(cat.descKey)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-muted/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="font-display text-2xl font-bold text-center mb-8">{t("netHome.exploreMore")}</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {quickLinks.map((link) => (
              <Link key={link.labelKey} to={link.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer text-center">
                  <CardContent className="pt-8 pb-6 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <link.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg">{t(link.labelKey)}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6 flex gap-4">
            <AlertTriangle className="w-6 h-6 text-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display font-semibold mb-2">{t("netHome.importantNotice")}</h3>
              <p className="text-sm text-muted-foreground">{t("netHome.noticeText")}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="bg-card border-t">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={domeLogo} alt="D.O.M.E." className="w-6 h-6 object-contain" />
            <span className="text-sm font-medium">D.O.M.E. — {t("netHome.badge")}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <Link to="/" className="hover:text-foreground transition-colors">{t("common.home")}</Link>
            <Link to="/business" className="hover:text-foreground transition-colors">{t("common.business")}</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">{t("common.pricing")}</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">{t("common.terms")}</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">{t("common.privacy")}</Link>
            <span>© {new Date().getFullYear()} D.O.M.E.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NetworkHome;
