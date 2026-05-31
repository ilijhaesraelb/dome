import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_LANGUAGES, getLangFlag, getLangLabel } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import BackButton from "@/components/BackButton";

const PRICING_MODES = [
  { value: "free_nonprofit", label: "Free (Nonprofit-Sponsored)" },
  { value: "employer_sponsored", label: "Employer-Sponsored" },
  { value: "subscription_included", label: "Included in Subscription" },
  { value: "paid_onetime", label: "Paid One-Time Booking" },
  { value: "scholarship", label: "Scholarship / Waived" },
];

const BookLanguageSupport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedInterpreter = searchParams.get("interpreter");

  const [interpreters, setInterpreters] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    interpreter_id: preselectedInterpreter || "",
    scheduled_date: "",
    scheduled_time: "09:00",
    duration_minutes: "30",
    language_from: "en",
    language_to: "es",
    support_type: "live_interpreter",
    meeting_type: "general",
    case_id: "",
    pricing_mode: "free_nonprofit",
    notes: "",
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  useEffect(() => {
    const load = async () => {
      const [interpRes, casesRes] = await Promise.all([
        supabase.from("interpreters" as any).select("id, full_name, languages, role").eq("is_active", true).order("full_name"),
        user ? supabase.from("cases").select("id, case_number, case_type").eq("created_by", user.id).order("created_at", { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
      ]);
      setInterpreters((interpRes.data as any[]) || []);
      setCases((casesRes.data as any[]) || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleBook = async () => {
    if (!user || !form.interpreter_id || !form.scheduled_date) {
      toast({ title: "Missing fields", description: "Please select an interpreter and date.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const scheduledAt = new Date(`${form.scheduled_date}T${form.scheduled_time}`).toISOString();
    const languagePair = `${getLangLabel(form.language_from)} → ${getLangLabel(form.language_to)}`;

    const { error } = await supabase.from("interpreter_bookings" as any).insert({
      interpreter_id: form.interpreter_id,
      user_id: user.id,
      scheduled_at: scheduledAt,
      duration_minutes: parseInt(form.duration_minutes),
      language_pair: languagePair,
      support_type: form.support_type,
      meeting_type: form.meeting_type,
      case_id: form.case_id || null,
      notes: form.notes || null,
    } as any);

    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSuccess(true);
      toast({ title: "Booking Confirmed", description: "Your language support session has been booked." });
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
        <h2 className="font-display text-2xl font-bold">Booking Confirmed!</h2>
        <p className="text-muted-foreground text-sm">Your session has been scheduled. You'll receive a reminder before the session.</p>
        <Button onClick={() => navigate("/portal/language-support")}>Back to Language Support Center</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <BackButton />

      <div className="bg-primary rounded-xl p-6 text-primary-foreground">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" /> Book Language Support
        </h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Schedule a session with an interpreter or translator</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-1.5">
              <Label>Select Interpreter *</Label>
              <Select value={form.interpreter_id} onValueChange={(v) => update("interpreter_id", v)}>
                <SelectTrigger><SelectValue placeholder="Choose an interpreter" /></SelectTrigger>
                <SelectContent>
                  {interpreters.map((i: any) => (
                    <SelectItem key={i.id} value={i.id}>{i.full_name} ({i.languages?.join(", ")})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.scheduled_date} onChange={(e) => update("scheduled_date", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Time *</Label>
                <Input type="time" value={form.scheduled_time} onChange={(e) => update("scheduled_time", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Select value={form.duration_minutes} onValueChange={(v) => update("duration_minutes", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Support Type</Label>
                <Select value={form.support_type} onValueChange={(v) => update("support_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live_interpreter">Live Interpreter</SelectItem>
                    <SelectItem value="phone_interpretation">Phone Interpretation</SelectItem>
                    <SelectItem value="video_interpretation">Video Interpretation</SelectItem>
                    <SelectItem value="case_communication">Case Communication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>From Language</Label>
                <Select value={form.language_from} onValueChange={(v) => update("language_from", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>To Language</Label>
                <Select value={form.language_to} onValueChange={(v) => update("language_to", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Meeting Type</Label>
                <Select value={form.meeting_type} onValueChange={(v) => update("meeting_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client_attorney">Client & Attorney</SelectItem>
                    <SelectItem value="client_organization">Client & Organization</SelectItem>
                    <SelectItem value="intake">Intake Appointment</SelectItem>
                    <SelectItem value="interview_prep">Interview Preparation</SelectItem>
                    <SelectItem value="document_review">Document Review</SelectItem>
                    <SelectItem value="general">General Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Service Mode</Label>
                <Select value={form.pricing_mode} onValueChange={(v) => update("pricing_mode", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRICING_MODES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Any details about the session..." rows={3} />
            </div>

            <Button onClick={handleBook} disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
              Confirm Booking
            </Button>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50 border">
              <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground">
                Interpreter and translation support are provided for communication access. D.O.M.E. does not provide legal advice.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookLanguageSupport;
