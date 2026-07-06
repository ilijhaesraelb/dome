import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Compass,
  Shield,
  FileText,
  Users,
  Globe,
  ArrowRight,
  CheckCircle2,
  Heart,
  Scale,
  Mail,
  ChevronDown,
  Phone,
  HelpCircle,
  Building2,
  Briefcase,
  Lock,
  ShieldCheck,
  Landmark,
  Mic,
  BarChart3,
  TrendingUp,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import domeLogo from "@/assets/dome-logo.png";
import LegalEntityNotice from "@/components/LegalEntityNotice";
import { useLanguage } from "@/contexts/LanguageContext";
import { getSiteTranslations } from "@/i18n/siteTranslations";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Rocket } from "lucide-react";

const portalStyles = [
  { color: "bg-secondary/10 text-secondary", borderColor: "hover:border-secondary/50" },
  { color: "bg-primary/10 text-primary", borderColor: "hover:border-primary/50" },
  { color: "bg-accent text-accent-foreground", borderColor: "hover:border-accent-foreground/30" },
  { color: "bg-primary/10 text-primary", borderColor: "hover:border-primary/30" },
];

const portalIcons = [Compass, Scale, Building2, Landmark];
const howIcons = [Compass, FileText, TrendingUp];
const featureIcons = [Compass, Shield, FileText, Mic, BarChart3];
const trustIcons = [ShieldCheck, Lock, Shield];
const securityIcons = [Lock, ShieldCheck, Eye, Shield];
const contactIcons = [HelpCircle, Phone, Users, Building2, Heart];

const LandingPage = () => {
  const { locale } = useLanguage();
  const copy = getSiteTranslations(locale).landing;
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">D.O.M.E.</span>
            <Link
              to="/affiliate"
              className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-warning to-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground transition-all hover:scale-105 shadow-[0_0_8px_hsl(var(--warning)/0.5),0_0_16px_hsl(var(--secondary)/0.3)] animate-pulse"
            >
              <Rocket className="h-3.5 w-3.5" />
              Earn With D.O.M.E.
            </Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">{copy.nav.home}</Button>
            </Link>
            <Link to="/about" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">{copy.nav.about}</Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">{copy.nav.contact}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs text-muted-foreground">{copy.contactMenu.label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {copy.contactMenu.departments.map((dept, index) => {
                  const Icon = contactIcons[index];
                  return (
                    <Link key={dept.to} to={dept.to}>
                      <DropdownMenuItem className="cursor-pointer">
                        <Icon className="w-4 h-4 mr-2 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{dept.title}</p>
                          <p className="text-xs text-muted-foreground">{dept.subtitle}</p>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  );
                })}
                <DropdownMenuSeparator />
                <Link to="/contact">
                  <DropdownMenuItem className="cursor-pointer font-medium">
                    <Mail className="w-4 h-4 mr-2" />
                    {copy.contactMenu.contactForm}
                    <ArrowRight className="w-3 h-3 ml-auto" />
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => { await signOut(); }}
                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm">{copy.nav.signIn}</Button>
              </Link>
            )}
            <Link to="/pathway-finder">
              <Button size="sm" className="gap-1.5 bg-secondary hover:bg-secondary/90">
                <Compass className="w-4 h-4" /> <span className="hidden sm:inline">{copy.nav.findPath}</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/85" />
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-20 right-10 w-96 h-96"><Globe className="w-full h-full" /></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center text-primary-foreground">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            Start Your Immigration Case<br className="hidden sm:block" /> with Confidence
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-primary-foreground/70 max-w-2xl mx-auto leading-relaxed">
            We guide you step by step, help organize your documents, and let you export completed forms when ready.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/pathway-finder">
              <Button size="lg" className="gap-2 bg-secondary hover:bg-secondary/90 text-base px-8 py-6 rounded-xl shadow-lg w-full sm:w-auto">
                <Compass className="w-5 h-5" /> Start My Case <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            {user ? (
              <Link to="/portal">
                <Button size="lg" variant="outline-light" className="text-base px-8 py-6 rounded-xl w-full sm:w-auto gap-2">
                  <ArrowRight className="w-4 h-4" /> Continue My Application
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg" variant="outline-light" className="text-base px-8 py-6 rounded-xl w-full sm:w-auto">
                  {copy.hero.secondaryCta}
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-12 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-4 sm:gap-8">
            {[
              { icon: ShieldCheck, text: "Secure Document Storage" },
              { icon: Lock, text: "Save & Resume Anytime" },
              { icon: Shield, text: "Guided Questions" },
              { icon: Globe, text: "Multi-language Support" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-primary-foreground/60">
                <item.icon className="w-4 h-4 text-secondary shrink-0" />
                <span className="font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">{copy.portals.heading}</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">{copy.portals.subheading}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {copy.portals.items.map((portal, index) => {
              const Icon = portalIcons[index];
              const style = portalStyles[index];

              return (
                <Link key={portal.to} to={portal.to}>
                  <Card className={`h-full border-2 transition-all duration-200 ${style.borderColor} hover:shadow-lg hover:-translate-y-0.5 cursor-pointer bg-card`}>
                    <CardContent className="p-5 sm:p-6 space-y-3 text-center">
                      <div className={`w-12 h-12 rounded-xl ${style.color} flex items-center justify-center mx-auto`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-display font-bold text-lg text-foreground">{portal.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{portal.description}</p>
                      <Button size="sm" className="gap-1.5 bg-secondary hover:bg-secondary/90 text-secondary-foreground w-full">
                        {portal.cta} <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-muted/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">{copy.howItWorks.heading}</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">{copy.howItWorks.subheading}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {copy.howItWorks.steps.map((item, index) => {
              const Icon = howIcons[index];
              return (
                <Card key={item.step} className="relative overflow-hidden border-2 hover:border-secondary/50 transition-colors">
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-lg">
                    {item.step}
                  </div>
                  <CardContent className="pt-8 pb-6 px-6">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">{copy.platformFeatures.heading}</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">{copy.platformFeatures.subheading}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {copy.platformFeatures.items.map((feature, index) => {
              const Icon = featureIcons[index];
              return (
                <div key={feature.title} className="flex items-start gap-4 p-5 rounded-xl bg-card border">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 flex flex-col sm:flex-row items-center gap-10">
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-3 py-1 text-xs font-medium mb-4">
              <Briefcase className="w-3.5 h-3.5" /> {copy.business.badge}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">{copy.business.title}</h2>
            <p className="mt-4 text-primary-foreground/70 max-w-lg leading-relaxed">{copy.business.description}</p>
            <ul className="mt-5 space-y-2 text-sm text-primary-foreground/80">
              {copy.business.bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0" /> {bullet}</li>
              ))}
            </ul>
          </div>
          <Link to="/business">
            <Button size="lg" className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-6 rounded-xl whitespace-nowrap shadow-lg">
              {copy.business.cta} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="bg-muted/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 flex flex-col sm:flex-row items-center gap-10">
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1 text-xs font-medium text-primary mb-4">
              <Landmark className="w-3.5 h-3.5" /> {copy.government.badge}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{copy.government.title}</h2>
            <p className="mt-4 text-muted-foreground max-w-lg leading-relaxed">{copy.government.description}</p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              {copy.government.bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0" /> {bullet}</li>
              ))}
            </ul>
          </div>
          <Link to="/gov/partnerships">
            <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-xl whitespace-nowrap shadow-lg">
              {copy.government.cta} <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ═══ Accounting & Tax Services ═══ */}
      <section className="bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 flex flex-col sm:flex-row items-center gap-10">
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 bg-secondary/10 rounded-full px-3 py-1 text-xs font-medium text-secondary mb-4">
              <Scale className="w-3.5 h-3.5" /> Accounting & Tax
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Affordable Guided Tax Filing</h2>
            <p className="mt-4 text-muted-foreground max-w-lg leading-relaxed">
              Organize your tax documents, understand what to file, and complete guided workflows for individuals and nonprofits.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              {["Individual & nonprofit filing support", "Form 990-series determination", "Flat-fee pricing", "Professional review available"].map((b) => (
                <li key={b} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary shrink-0" /> {b}</li>
              ))}
            </ul>
          </div>
          <Link to="/tax">
            <Button size="lg" className="gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-6 rounded-xl whitespace-nowrap shadow-lg">
              Tax Services <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="bg-muted/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4 mx-auto">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">{copy.security.heading}</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">{copy.security.subheading}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {copy.security.items.map((item, index) => {
              const Icon = securityIcons[index];
              return (
                <div key={item.title} className="flex items-start gap-4 p-5 rounded-xl bg-card border">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/90" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center text-primary-foreground">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">{copy.finalCta.title}</h2>
          <p className="mt-4 text-lg text-primary-foreground/70 max-w-xl mx-auto">{copy.finalCta.description}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/pathway-finder">
              <Button size="lg" className="gap-2 bg-secondary hover:bg-secondary/90 text-base px-8 py-6 rounded-xl shadow-lg w-full sm:w-auto">
                <Compass className="w-5 h-5" /> {copy.finalCta.primaryCta} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline-light" className="text-base px-8 py-6 rounded-xl w-full sm:w-auto">
                {copy.finalCta.secondaryCta}
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-primary-foreground/50 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> {copy.finalCta.freeLine}
          </p>
        </div>
      </section>

      <footer className="bg-card border-t">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={domeLogo} alt="D.O.M.E." className="w-6 h-6 object-contain" />
            <span className="text-sm font-medium">{copy.footer.tagline}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap justify-center">
            <Link to="/about" className="hover:text-foreground transition-colors">{copy.footer.links.about}</Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">{copy.footer.links.contact}</Link>
            <Link to="/network" className="hover:text-foreground transition-colors">{copy.footer.links.network}</Link>
            <Link to="/business" className="hover:text-foreground transition-colors">{copy.footer.links.business}</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">{copy.footer.links.pricing}</Link>
            <Link to="/gov/partnerships" className="hover:text-foreground transition-colors">{copy.footer.links.partnerships}</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">{copy.footer.links.terms}</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">{copy.footer.links.privacy}</Link>
            <Link to="/security" className="hover:text-foreground transition-colors">{copy.footer.links.security}</Link>
            <Link to="/platform-position" className="hover:text-foreground transition-colors">{copy.footer.links.platformPosition}</Link>
            <Link to="/affiliate" className="hover:text-foreground transition-colors font-medium text-secondary">Earn With D.O.M.E.</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">{copy.footer.links.signIn}</Link>
            <span>© {new Date().getFullYear()} D.O.M.E.</span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-6 space-y-1">
          <p className="text-xs text-muted-foreground/60 text-center">{copy.footer.disclaimer}</p>
          <div className="p-3 ">

          <LegalEntityNotice />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
