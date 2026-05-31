import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import {
  Building2, Users, BarChart3, Calendar, Briefcase, ArrowRight, CheckCircle,
} from "lucide-react";
import { useT } from "@/hooks/useT";

const INDUSTRIES = [
  { name: "Construction", icon: "🏗️" },
  { name: "Hospitality", icon: "🏨" },
  { name: "Healthcare", icon: "🏥" },
  { name: "Retail", icon: "🛒" },
  { name: "Customer Service", icon: "📞" },
  { name: "Manufacturing", icon: "🏭" },
];

const PACKAGES = [
  { seats: 10, label: "Starter Team", price: "$199/mo" },
  { seats: 25, label: "Growing Team", price: "$449/mo" },
  { seats: 50, label: "Enterprise", price: "Custom" },
];

const EnglishEmployerTraining = () => {
  const t = useT();
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-8 pb-24">
      <BackButton />

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 md:p-10 text-primary-foreground">
        <Badge className="bg-secondary text-secondary-foreground mb-3">
          <Building2 className="w-3 h-3 mr-1" /> Employer Training
        </Badge>
        <h1 className="text-2xl md:text-3xl font-display font-bold">
          {t("engEmployer.title")}
        </h1>
        <p className="text-primary-foreground/80 mt-2 max-w-xl text-sm">
          Help your workforce communicate effectively with industry-specific English training programs.
          Group classes, custom scheduling, and progress reports for your team.
        </p>
        <Button asChild size="lg" className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/90">
          <Link to="/contact">
            Request Employer Training <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, title: "Group Training", desc: "10–50+ employees" },
          { icon: Briefcase, title: "Industry-Specific", desc: "Custom vocabulary" },
          { icon: Calendar, title: "Flexible Scheduling", desc: "Around work shifts" },
          { icon: BarChart3, title: "Progress Reports", desc: "Employee tracking" },
        ].map((f) => (
          <Card key={f.title}>
            <CardContent className="p-4 text-center space-y-2">
              <f.icon className="w-6 h-6 mx-auto text-secondary" />
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-[10px] text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Industries */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Industries We Serve</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {INDUSTRIES.map((ind) => (
            <Card key={ind.name}>
              <CardContent className="p-3 text-center">
                <p className="text-2xl mb-1">{ind.icon}</p>
                <p className="text-xs font-medium">{ind.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Packages */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Training Packages</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PACKAGES.map((pkg) => (
            <Card key={pkg.seats} className="border-secondary/20">
              <CardContent className="p-5 text-center space-y-3">
                <p className="text-3xl font-bold text-secondary">{pkg.seats}</p>
                <p className="text-sm font-semibold">{pkg.label}</p>
                <p className="text-lg font-bold">{pkg.price}</p>
                <ul className="text-xs text-muted-foreground space-y-1 text-left">
                  {[
                    "Group live classes",
                    "Industry vocabulary training",
                    "Employee progress dashboard",
                    "Flexible scheduling",
                    "Completion certificates",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-secondary shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" asChild>
                  <Link to="/contact">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground/70 text-center italic">
        D.O.M.E. provides English language learning support and communication training.
        These courses are not accredited academic degree programs.
      </p>
    </div>
  );
};

export default EnglishEmployerTraining;
