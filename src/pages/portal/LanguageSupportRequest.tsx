import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Headphones, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLanguagePreferences } from "@/hooks/useLanguagePreferences";
import { SUPPORTED_LANGUAGES } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";

const SUPPORT_TYPES = [
  { value: "live_interpreter", label: "Live Interpreter for Meeting" },
  { value: "phone_interpretation", label: "Phone Interpretation" },
  { value: "video_interpretation", label: "Video Interpretation" },
  { value: "written_translation", label: "Written Translation Request" },
  { value: "case_communication", label: "Case Communication Support" },
  { value: "document_explanation", label: "Document Explanation Support" },
];

const URGENCY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "within_24_hours", label: "Within 24 Hours" },
  { value: "within_3_days", label: "Within 3 Days" },
  { value: "scheduled", label: "Scheduled in Advance" },
];

const MEETING_TYPES = [
  { value: "client_attorney", label: "Client & Attorney Meeting" },
  { value: "client_organization", label: "Client & Organization Meeting" },
  { value: "intake", label: "Intake Appointment" },
  { value: "interview_prep", label: "Interview Preparation" },
  { value: "document_review", label: "Document Review" },
  { value: "general", label: "General Support" },
];

const LanguageSupportRequest = () => {
  const { user } = useAuth();
  const { prefs } = useLanguagePreferences();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [cases, setCases] = useState<any[]>([]);

  const [form, setForm] = useState({
    preferred_language: prefs.preferred_language || "en",
    secondary_language: "",
    support_type: "live_interpreter",
    urgency: "within_3_days",
    meeting_type: "general",
    description: "",
    preferred_date: "",
    preferred_time: "",
    user_role: "",
    case_id: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("cases").select("id, case_number, case_type").eq("created_by", user.id).order("created_at", { ascending: false }).limit(20).then(({ data }) => {
      setCases((data as any[]) || []);
    });
  }, [user]);

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("language_support_requests" as any).insert({
      user_id: user.id,
      preferred_language: form.preferred_language,
      secondary_language: form.secondary_language || null,
      support_type: form.support_type,
      urgency: form.urgency,
      meeting_type: form.meeting_type,
      description: form.description || null,
      preferred_date: form.preferred_date ? new Date(form.preferred_date + "T" + (form.preferred_time || "09:00")).toISOString() : null,
      preferred_time: form.preferred_time || null,
      user_role: form.user_role || null,
      case_id: form.case_id || null,
    } as any);
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request Submitted", description: "Your language support request has been sent to the team." });
      navigate("/portal/language-support");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <BackButton />

      <div className="bg-primary rounded-xl p-6 text-primary-foreground">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Headphones className="w-6 h-6" /> Request Language Support
        </h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Tell us what kind of language help you need</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Preferred Language *</Label>
              <Select value={form.preferred_language} onValueChange={(v) => update("preferred_language", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Secondary Language (optional)</Label>
              <Select value={form.secondary_language} onValueChange={(v) => update("secondary_language", v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Type of Support *</Label>
            <Select value={form.support_type} onValueChange={(v) => update("support_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Urgency *</Label>
              <Select value={form.urgency} onValueChange={(v) => update("urgency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Meeting Type</Label>
              <Select value={form.meeting_type} onValueChange={(v) => update("meeting_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEETING_TYPES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Preferred Date</Label>
              <Input type="date" value={form.preferred_date} onChange={(e) => update("preferred_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Preferred Time</Label>
              <Input type="time" value={form.preferred_time} onChange={(e) => update("preferred_time", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Your Role</Label>
              <Select value={form.user_role} onValueChange={(v) => update("user_role", v)}>
                <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="attorney">Attorney</SelectItem>
                  <SelectItem value="accredited_rep">A&R DOJ Representative</SelectItem>
                  <SelectItem value="organization">Organization Staff</SelectItem>
                  <SelectItem value="government">Government / Institutional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {cases.length > 0 && (
              <div className="space-y-1.5">
                <Label>Link to Case (optional)</Label>
                <Select value={form.case_id} onValueChange={(v) => update("case_id", v)}>
                  <SelectTrigger><SelectValue placeholder="No case linked" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No case linked</SelectItem>
                    {cases.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.case_number} — {c.case_type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Description of Need</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe what you need help with..." rows={4} />
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Request
          </Button>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50 border">
            <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground">
              Interpreter and translation support are provided for communication access. D.O.M.E. does not provide legal advice.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LanguageSupportRequest;
