import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, ArrowRight, Loader2, Building2 } from "lucide-react";
import domeLogo from "@/assets/dome-logo.png";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/hooks/useT";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Contact = () => {
  const t = useT();
  const [searchParams] = useSearchParams();
  const [department, setDepartment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [callerType, setCallerType] = useState("");
  const [urgency, setUrgency] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const departments = [
    { value: "info", labelKey: "contact.generalInfo", email: "Info@domeai.org" },
    { value: "support", labelKey: "contact.techSupport", email: "Support@domeai.org" },
    { value: "referral", labelKey: "contact.referralsPartnerships", email: "Referral@domeai.org" },
    { value: "billing", labelKey: "contact.billingSubscriptions", email: "Billing@domeai.org" },
    { value: "donation", labelKey: "contact.donationsContributions", email: "Donation@domeai.org" },
  ];

  const urgencyLevels = [
    { value: "low", labelKey: "contact.lowUrgency" },
    { value: "medium", labelKey: "contact.medUrgency" },
    { value: "urgent", labelKey: "contact.urgentUrgency" },
  ];

  const callerTypes = [
    { value: "client", labelKey: "contact.callerClient" },
    { value: "ar_doj", labelKey: "contact.callerArDoj" },
    { value: "attorney", labelKey: "contact.callerAttorney" },
    { value: "government", labelKey: "contact.callerGov" },
    { value: "nonprofit", labelKey: "contact.callerNonprofit" },
    { value: "accountant", labelKey: "contact.callerAccountant" },
    { value: "consultant", labelKey: "contact.callerConsultant" },
  ];

  useEffect(() => {
    const dept = searchParams.get("dept");
    if (dept && departments.some(d => d.value === dept)) setDepartment(dept);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !callerType || !urgency) {
      toast({ title: t("contact.missingFields"), description: t("contact.fillRequired"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const selectedDept = departments.find(d => d.value === department);
    const { error } = await supabase.from("demo_requests").insert({
      organization_name: callerType,
      contact_name: name,
      email: replyEmail || email,
      role_title: callerTypes.find(c => c.value === callerType)?.labelKey || callerType,
      program_interest: `${t(selectedDept?.labelKey || "")} | Urgency: ${t(urgencyLevels.find(u => u.value === urgency)?.labelKey || "")}`,
      notes: `Subject: ${subject}\n\nMessage: ${message}\n\nDepartment: ${selectedDept?.email}\nReply to: ${replyEmail || email}`,
      status: urgency === "urgent" ? "urgent" : "pending",
    });

    if (error) {
      toast({ title: t("common.error"), description: t("contact.failedSend"), variant: "destructive" });
    } else {
      toast({ title: t("contact.messageSent"), description: t("contact.messageSentDesc", { dept: t(selectedDept?.labelKey || ""), email: replyEmail || email }) });
      setName(""); setEmail(""); setReplyEmail(""); setSubject(""); setMessage("");
      setDepartment(""); setCallerType(""); setUrgency("");
    }
    setLoading(false);
  };

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
            <Link to="/about"><Button variant="ghost" size="sm">{t("common.aboutUs")}</Button></Link>
            <Link to="/login"><Button variant="ghost" size="sm">{t("common.signIn")}</Button></Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-bold">{t("contact.title")}</h1>
          <p className="mt-3 text-primary-foreground/70 text-lg max-w-2xl mx-auto">{t("contact.subtitle")}</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold mb-4">{t("contact.directory")}</h2>
          {departments.map(dept => (
            <Card key={dept.value} className="border hover:border-secondary/40 transition-colors cursor-pointer" onClick={() => setDepartment(dept.value)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-secondary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{t(dept.labelKey)}</p>
                  <p className="text-xs text-muted-foreground truncate">{dept.email}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="border-2 border-primary/20 mt-6">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> {t("contact.headquarters")}
              </h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> Info@domeai.org</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl">{t("contact.sendMessage")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("common.department")} *</label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger><SelectValue placeholder={t("contact.selectDepartment")} /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.value} value={d.value}>{t(d.labelKey)} — {d.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("contact.iAmA")} *</label>
                  <Select value={callerType} onValueChange={setCallerType}>
                    <SelectTrigger><SelectValue placeholder={t("contact.selectRole")} /></SelectTrigger>
                    <SelectContent>
                      {callerTypes.map(c => (
                        <SelectItem key={c.value} value={c.value}>{t(c.labelKey)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("contact.urgencyLevel")} *</label>
                  <Select value={urgency} onValueChange={setUrgency}>
                    <SelectTrigger><SelectValue placeholder={t("contact.selectUrgency")} /></SelectTrigger>
                    <SelectContent>
                      {urgencyLevels.map(u => (
                        <SelectItem key={u.value} value={u.value}>{t(u.labelKey)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("common.fullName")} *</label>
                    <Input placeholder={t("common.fullName")} value={name} onChange={e => setName(e.target.value)} required maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("contact.yourEmail")} *</label>
                    <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required maxLength={255} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("contact.replyToEmail")} <span className="text-muted-foreground font-normal">({t("contact.ifDifferent")})</span></label>
                  <Input type="email" placeholder="reply@example.com" value={replyEmail} onChange={e => setReplyEmail(e.target.value)} maxLength={255} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("common.subject")} *</label>
                  <Input placeholder={t("contact.briefSubject")} value={subject} onChange={e => setSubject(e.target.value)} required maxLength={200} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("common.message")} *</label>
                  <Textarea placeholder={t("contact.describeQuestion")} value={message} onChange={e => setMessage(e.target.value)} required maxLength={2000} rows={5} />
                </div>

                <Button type="submit" disabled={loading} className="w-full gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground h-11">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t("common.sendMessage")} <ArrowRight className="w-4 h-4" /></>}
                </Button>

                <p className="text-xs text-muted-foreground text-center">{t("common.disclaimerLong")}</p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="bg-card border-t">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={domeLogo} alt="D.O.M.E." className="w-6 h-6 object-contain" />
            <span className="text-sm font-medium">D.O.M.E.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap justify-center">
            <Link to="/about" className="hover:text-foreground">{t("common.aboutUs")}</Link>
            <Link to="/pricing" className="hover:text-foreground">{t("common.pricing")}</Link>
            <Link to="/terms" className="hover:text-foreground">{t("common.terms")}</Link>
            <Link to="/privacy" className="hover:text-foreground">{t("common.privacy")}</Link>
            <span>© {new Date().getFullYear()} D.O.M.E.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
