import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import {
  Heart, Users, BarChart3, BookOpen, ArrowRight, CheckCircle, Award,
} from "lucide-react";
import { useT } from "@/hooks/useT";

const PACKAGES = [
  { seats: 25, label: "Community", price: "$399/mo" },
  { seats: 50, label: "Organization", price: "$699/mo" },
  { seats: 100, label: "Institution", price: "Custom" },
];

const EnglishNonprofitAccess = () => {
  const t = useT();
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-8 pb-24">
      <BackButton />

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-rose-600 to-rose-500 p-6 md:p-10 text-white">
        <Badge className="bg-white/20 text-white mb-3">
          <Heart className="w-3 h-3 mr-1" /> Nonprofit Access
        </Badge>
        <h1 className="text-2xl md:text-3xl font-display font-bold">
          {t("engNonprofit.title")}
        </h1>
        <p className="text-white/80 mt-2 max-w-xl text-sm">
          Purchase bulk seats to provide English education for immigrants in your community.
          Monitor attendance, track progress, and sponsor scholarships.
        </p>
        <Button asChild size="lg" className="mt-6 bg-white text-rose-600 hover:bg-white/90">
          <Link to="/contact">
            Request Nonprofit Access <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Users, title: "Bulk Seats", desc: "25–100+ learners" },
          { icon: BookOpen, title: "Assign Students", desc: "Easy enrollment" },
          { icon: BarChart3, title: "Progress Reports", desc: "Attendance & scores" },
          { icon: Award, title: "Scholarships", desc: "Sponsor access" },
        ].map((f) => (
          <Card key={f.title}>
            <CardContent className="p-4 text-center space-y-2">
              <f.icon className="w-6 h-6 mx-auto text-rose-500" />
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-[10px] text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Packages */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Sponsored Learning Packages</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PACKAGES.map((pkg) => (
            <Card key={pkg.seats} className="border-rose-200">
              <CardContent className="p-5 text-center space-y-3">
                <p className="text-3xl font-bold text-rose-500">{pkg.seats}</p>
                <p className="text-xs text-muted-foreground">sponsored learners</p>
                <p className="text-sm font-semibold">{pkg.label}</p>
                <p className="text-lg font-bold">{pkg.price}</p>
                <ul className="text-xs text-muted-foreground space-y-1 text-left">
                  {[
                    "Full course access for learners",
                    "Live group classes",
                    "Voice AI practice",
                    "Attendance monitoring",
                    "Progress reports for sponsor",
                    "Completion certificates",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-rose-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white" asChild>
                  <Link to="/contact">Request Access</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How it works */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-center">How Sponsorship Works</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            {[
              { step: "1", title: "Request Access", desc: "Contact our team" },
              { step: "2", title: "Purchase Seats", desc: "Choose your package" },
              { step: "3", title: "Assign Learners", desc: "Enroll your community" },
              { step: "4", title: "Track Progress", desc: "Monitor & report" },
            ].map((s) => (
              <div key={s.step}>
                <div className="w-8 h-8 mx-auto rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold text-sm mb-1">
                  {s.step}
                </div>
                <p className="font-medium text-xs">{s.title}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground/70 text-center italic">
        D.O.M.E. provides English language learning support and communication training.
        These courses are not accredited academic degree programs.
      </p>
    </div>
  );
};

export default EnglishNonprofitAccess;
