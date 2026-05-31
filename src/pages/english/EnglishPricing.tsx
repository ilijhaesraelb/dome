import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";
import { ENGLISH_PLANS } from "@/lib/english-plans";
import { Check, Star, Zap, Crown } from "lucide-react";
import { useT } from "@/hooks/useT";

const PLAN_ICONS: Record<string, any> = { free: Star, basic: Zap, pro: Crown, premium: Crown };

const EnglishPricing = () => {
  const t = useT();
  const { session } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planKey: string) => {
    const plan = ENGLISH_PLANS[planKey as keyof typeof ENGLISH_PLANS];
    if (!plan.price_id || !session) return;

    setLoading(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: plan.price_id, mode: "subscription" },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8">
      <BackButton />

      <div className="text-center">
        <h1 className="text-3xl font-display font-bold">{t("engPricing.title")}</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          {t("engPricing.subtitle")}
        </p>
      </div>

      {/* Subscription Plans */}
      <div className="grid md:grid-cols-4 gap-4">
        {Object.entries(ENGLISH_PLANS).map(([key, plan]) => {
          const Icon = PLAN_ICONS[key] || Star;
          const isPopular = key === "pro";
          return (
            <Card key={key} className={`relative ${isPopular ? "border-secondary shadow-lg" : ""}`}>
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground">{t("engPricing.mostPopular")}</Badge>
              )}
              <CardContent className="p-6 text-center space-y-4">
                <Icon className={`w-8 h-8 mx-auto ${isPopular ? "text-secondary" : "text-muted-foreground"}`} />
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className="text-3xl font-bold">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                  {plan.price > 0 && <span className="text-sm text-muted-foreground font-normal">/mo</span>}
                </p>
                <ul className="space-y-2 text-sm text-left">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.price === 0 ? (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/portal/english">{t("engPricing.getStartedFree")}</Link>
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${isPopular ? "" : ""}`}
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handleSubscribe(key)}
                    disabled={loading === key}
                  >
                    {loading === key ? t("common.loading") : t("engPricing.subscribe")}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* One-Time Courses */}
      <div>
        <h2 className="text-2xl font-display font-bold text-center mb-4">{t("engPricing.oneTimeCourses")}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "Citizenship Preparation Program", price: "$99", desc: "Complete civics and interview prep for the naturalization test.", priceId: "price_1TBGksBeeH6hPmEX4s8MOnTb" },
            { name: "English for Work Intensive", price: "$69", desc: "Job interviews, workplace vocab, and professional speaking skills.", priceId: "price_1TBGkuBeeH6hPmEXamQjSrZ4" },
            { name: "Immigration Interview Prep", price: "$69", desc: "Practice answering immigration interview questions with confidence.", priceId: "price_1TBGkvBeeH6hPmEXwfcOtH42" },
          ].map((course, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold">{course.name}</h3>
                <p className="text-sm text-muted-foreground">{course.desc}</p>
                <p className="text-2xl font-bold text-secondary">{course.price}</p>
                <Button className="w-full" variant="outline" onClick={async () => {
                  if (!session) return;
                  setLoading(course.name);
                  const { data } = await supabase.functions.invoke("create-checkout", {
                    body: { priceId: course.priceId, mode: "payment" },
                  });
                  if (data?.url) window.open(data.url, "_blank");
                  setLoading(null);
                }} disabled={loading === course.name}>
                  {loading === course.name ? t("common.loading") : t("engPricing.buyCourse")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Private Lessons */}
      <div>
        <h2 className="text-2xl font-display font-bold text-center mb-4">{t("engPricing.privateLessons")}</h2>
        <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto">
          {[
            { name: "30-minute Private Lesson", price: "$20", priceId: "price_1TBGkwBeeH6hPmEXqwoWdpRq" },
            { name: "60-minute Private Lesson", price: "$40", priceId: "price_1TBGkxBeeH6hPmEXNmQXdfXL" },
          ].map((lesson, i) => (
            <Card key={i}>
              <CardContent className="p-6 text-center space-y-3">
                <h3 className="font-semibold">{lesson.name}</h3>
                <p className="text-2xl font-bold text-secondary">{lesson.price}</p>
                <Button className="w-full" asChild>
                  <Link to="/portal/english/lessons">{t("engPricing.bookNow")}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Enterprise */}
      <Card className="bg-gradient-to-br from-secondary/10 to-primary/5">
        <CardContent className="p-8">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h2 className="text-2xl font-display font-bold">{t("engPricing.forEmployers")}</h2>
              <p className="text-muted-foreground mt-2">
                {t("engPricing.forEmployersDesc")}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary" />10, 25, 50, or 100+ seats</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary" />Progress reports for managers</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary" />Dedicated teacher assignment</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary" />Custom pricing available</li>
              </ul>
            </div>
            <EnterpriseInquiryForm />
          </div>
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground/70 text-center">
        {t("engHome.disclaimer")}
      </p>
    </div>
  );
};

const EnterpriseInquiryForm = () => {
  const [form, setForm] = useState({ organization_name: "", contact_name: "", contact_email: "", package_type: "employer", seats: 10, notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.organization_name || !form.contact_email || !form.contact_name) return;
    setSubmitting(true);
    const { error } = await supabase.from("english_enterprise_packages").insert(form);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Inquiry submitted!", description: "We'll contact you within 24 hours." });
      setForm({ organization_name: "", contact_name: "", contact_email: "", package_type: "employer", seats: 10, notes: "" });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-3 bg-card rounded-xl p-4">
      <h3 className="font-semibold text-sm">Request Group Training</h3>
      <Input placeholder="Organization Name" value={form.organization_name} onChange={e => setForm(p => ({ ...p, organization_name: e.target.value }))} />
      <Input placeholder="Your Name" value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} />
      <Input placeholder="Email" type="email" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} />
      <Select value={form.package_type} onValueChange={v => setForm(p => ({ ...p, package_type: v }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="employer">Employer Training</SelectItem>
          <SelectItem value="nonprofit">Nonprofit Sponsorship</SelectItem>
        </SelectContent>
      </Select>
      <Select value={String(form.seats)} onValueChange={v => setForm(p => ({ ...p, seats: Number(v) }))}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10 learners</SelectItem>
          <SelectItem value="25">25 learners</SelectItem>
          <SelectItem value="50">50 learners</SelectItem>
          <SelectItem value="100">100+ learners</SelectItem>
        </SelectContent>
      </Select>
      <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Inquiry"}
      </Button>
    </div>
  );
};

export default EnglishPricing;
