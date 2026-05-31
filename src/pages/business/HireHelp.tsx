import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Scale, Landmark, Heart, FileText, DollarSign, Send } from "lucide-react";
import BackButton from "@/components/BackButton";
import domeLogo from "@/assets/dome-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useT } from "@/hooks/useT";

const handoffTypes = [
  { value: "review_draft", label: "Review My Draft", icon: FileText, desc: "Have a professional review your formation documents before filing." },
  { value: "complete_filing", label: "Complete Filing For Me", icon: Shield, desc: "Hire help to handle the entire filing process." },
  { value: "consultation", label: "Schedule Consultation", icon: Scale, desc: "Speak with an attorney or accredited representative." },
  { value: "nonprofit_review", label: "Nonprofit Readiness Review", icon: Heart, desc: "Review your nonprofit formation and 501(c)(3) readiness." },
  { value: "eb5_review", label: "EB-5 Structure Review", icon: DollarSign, desc: "Review your EB-5 investment structure with a qualified professional." },
  { value: "tax_setup", label: "Tax Setup Assistance", icon: Landmark, desc: "Get help with EIN, tax classification, and business tax setup." },
];

const HireHelp = () => {
  const t = useT();
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected) { toast.error(t("hireHelp.selectService")); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error(t("hireHelp.signInFirst")); return; }

      const { error } = await supabase.from("professional_handoffs").insert({
        user_id: user.id,
        handoff_type: selected as any,
        message: message || null,
        preferred_contact: contact || null,
      });
      if (error) throw error;
      toast.success(t("hireHelp.submitted"));
      setSelected("");
      setMessage("");
      setContact("");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/business" className="flex items-center gap-2.5">
            <img src={domeLogo} alt="D.O.M.E." className="w-8 h-8 object-contain" />
            <span className="font-display font-bold text-lg">D.O.M.E.</span>
          </Link>
          <BackButton />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-secondary" />
          <h1 className="font-display text-2xl font-bold">{t("hireHelp.title")}</h1>
        </div>
        <p className="text-muted-foreground">{t("hireHelp.subtitle")}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {handoffTypes.map(ht => (
            <div
              key={ht.value}
              onClick={() => setSelected(ht.value)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                selected === ht.value ? "border-secondary bg-secondary/5" : "border-border hover:border-secondary/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <ht.icon className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="font-medium text-sm">{ht.label}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{ht.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label>{t("hireHelp.tellUsMore")}</Label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={t("hireHelp.describeSituation")} />
              </div>
              <div>
                <Label>{t("hireHelp.preferredContact")}</Label>
                <Input value={contact} onChange={e => setContact(e.target.value)} placeholder={t("hireHelp.contactPlaceholder")} />
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2 bg-secondary hover:bg-secondary/90">
                <Send className="w-4 h-4" /> {submitting ? t("hireHelp.submitting") : t("hireHelp.submitRequest")}
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground text-center">{t("hireHelp.disclaimer")}</p>
      </div>
    </div>
  );
};

export default HireHelp;
