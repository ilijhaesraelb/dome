import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mic, MicOff, CheckCircle2, Edit, Save,
  Loader2, Keyboard, Volume2, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import BackButton from "@/components/BackButton";
import type { Tables } from "@/integrations/supabase/types";

type FormInstance = Tables<"form_instances">;

/* ── Validation ── */
type ValidationRule = {
  required?: boolean;
  pattern?: RegExp;
  message?: string;
  maxLength?: number;
};

const DATE_RE = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}$/;
const SSN_RE = /^\d{3}-\d{2}-\d{4}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;
const PHONE_RE = /^[\d\s()+-]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALIEN_RE = /^A?\d{7,9}$/i;
const I94_RE = /^[A-Z0-9]{9,11}$/i;
const STATE_RE = /^[A-Za-z]{2}$/;

/** Map field keys (or key suffixes) to validation rules */
const fieldValidationRules: Record<string, ValidationRule> = {
  // Names — required, letters only, max 50
  petitioner_first_name: { required: true, maxLength: 50 },
  petitioner_last_name:  { required: true, maxLength: 50 },
  beneficiary_first_name:{ required: true, maxLength: 50 },
  beneficiary_last_name: { required: true, maxLength: 50 },
  first_name:            { required: true, maxLength: 50 },
  last_name:             { required: true, maxLength: 50 },
  middle_name:           { maxLength: 50 },

  // Dates
  petitioner_dob:        { required: true, pattern: DATE_RE, message: "Use MM/DD/YYYY format" },
  beneficiary_dob:       { required: true, pattern: DATE_RE, message: "Use MM/DD/YYYY format" },
  date_of_birth:         { required: true, pattern: DATE_RE, message: "Use MM/DD/YYYY format" },
  date_became_resident:  { required: true, pattern: DATE_RE, message: "Use MM/DD/YYYY format" },
  date_of_last_entry:    { required: true, pattern: DATE_RE, message: "Use MM/DD/YYYY format" },

  // SSN
  petitioner_ssn:        { required: true, pattern: SSN_RE, message: "Use XXX-XX-XXXX format" },
  ssn:                   { pattern: SSN_RE, message: "Use XXX-XX-XXXX format" },

  // Address
  petitioner_address:    { required: true, maxLength: 200 },
  current_address:       { required: true, maxLength: 200 },
  address:               { required: true, maxLength: 200 },
  petitioner_city:       { required: true, maxLength: 100 },
  city:                  { required: true, maxLength: 100 },
  petitioner_state:      { required: true, pattern: STATE_RE, message: "Use 2-letter state code (e.g. CA)" },
  state:                 { required: true, pattern: STATE_RE, message: "Use 2-letter state code (e.g. CA)" },
  petitioner_zip:        { required: true, pattern: ZIP_RE, message: "Use 5-digit or 5+4 ZIP code" },
  zip:                   { required: true, pattern: ZIP_RE, message: "Use 5-digit or 5+4 ZIP code" },

  // Other
  phone:                 { pattern: PHONE_RE, message: "Enter a valid phone number" },
  email:                 { pattern: EMAIL_RE, message: "Enter a valid email address" },
  alien_number:          { pattern: ALIEN_RE, message: "Enter a valid A-Number (e.g. A123456789)" },
  i94_number:            { pattern: I94_RE, message: "Enter a valid I-94 number" },
  relationship:          { required: true, maxLength: 50 },
  country_of_birth:      { required: true, maxLength: 100 },
  petitioner_country_of_birth: { required: true, maxLength: 100 },
  beneficiary_country_of_birth:{ required: true, maxLength: 100 },
  nationality:           { maxLength: 100 },
  immigration_status:    { maxLength: 50 },
  marital_status:        { maxLength: 30 },
  employer:              { maxLength: 100 },
  occupation:            { maxLength: 100 },
};

function validateField(key: string, value: string): string | null {
  const rule = fieldValidationRules[key];
  if (!rule) return null;
  const trimmed = value.trim();
  if (rule.required && !trimmed) return "This field is required";
  if (!trimmed) return null; // optional and empty is fine
  if (rule.maxLength && trimmed.length > rule.maxLength) return `Maximum ${rule.maxLength} characters`;
  if (rule.pattern && !rule.pattern.test(trimmed)) return rule.message || "Invalid format";
  return null;
}

/* ── Form field definitions per form type ── */
const formFieldDefinitions: Record<string, { key: string; label: string; placeholder: string }[]> = {
  "I-130": [
    { key: "petitioner_first_name", label: "Petitioner First Name", placeholder: "e.g. Maria" },
    { key: "petitioner_last_name", label: "Petitioner Last Name", placeholder: "e.g. Santos" },
    { key: "petitioner_dob", label: "Petitioner Date of Birth", placeholder: "MM/DD/YYYY" },
    { key: "petitioner_country_of_birth", label: "Petitioner Country of Birth", placeholder: "e.g. Mexico" },
    { key: "petitioner_ssn", label: "Petitioner SSN", placeholder: "XXX-XX-XXXX" },
    { key: "petitioner_address", label: "Petitioner Current Address", placeholder: "Full street address" },
    { key: "petitioner_city", label: "City", placeholder: "e.g. Los Angeles" },
    { key: "petitioner_state", label: "State", placeholder: "e.g. CA" },
    { key: "petitioner_zip", label: "ZIP Code", placeholder: "e.g. 90001" },
    { key: "beneficiary_first_name", label: "Beneficiary First Name", placeholder: "e.g. Juan" },
    { key: "beneficiary_last_name", label: "Beneficiary Last Name", placeholder: "e.g. Santos" },
    { key: "beneficiary_dob", label: "Beneficiary Date of Birth", placeholder: "MM/DD/YYYY" },
    { key: "beneficiary_country_of_birth", label: "Beneficiary Country of Birth", placeholder: "e.g. Mexico" },
    { key: "relationship", label: "Relationship to Beneficiary", placeholder: "e.g. Spouse, Parent, Child" },
  ],
  "I-485": [
    { key: "first_name", label: "First Name", placeholder: "Legal first name" },
    { key: "middle_name", label: "Middle Name", placeholder: "Middle name (if any)" },
    { key: "last_name", label: "Last Name", placeholder: "Legal last name" },
    { key: "date_of_birth", label: "Date of Birth", placeholder: "MM/DD/YYYY" },
    { key: "country_of_birth", label: "Country of Birth", placeholder: "e.g. Philippines" },
    { key: "nationality", label: "Nationality", placeholder: "e.g. Filipino" },
    { key: "alien_number", label: "Alien Registration Number", placeholder: "A-Number (if any)" },
    { key: "ssn", label: "Social Security Number", placeholder: "XXX-XX-XXXX" },
    { key: "current_address", label: "Current Address", placeholder: "Street address" },
    { key: "city", label: "City", placeholder: "City" },
    { key: "state", label: "State", placeholder: "State" },
    { key: "zip", label: "ZIP Code", placeholder: "ZIP" },
    { key: "date_of_last_entry", label: "Date of Last Entry to U.S.", placeholder: "MM/DD/YYYY" },
    { key: "i94_number", label: "I-94 Number", placeholder: "I-94 arrival/departure number" },
    { key: "immigration_status", label: "Current Immigration Status", placeholder: "e.g. F-1, H-1B" },
  ],
  "N-400": [
    { key: "first_name", label: "First Name", placeholder: "Legal first name" },
    { key: "last_name", label: "Last Name", placeholder: "Legal last name" },
    { key: "date_of_birth", label: "Date of Birth", placeholder: "MM/DD/YYYY" },
    { key: "country_of_birth", label: "Country of Birth", placeholder: "Country" },
    { key: "date_became_resident", label: "Date Became Permanent Resident", placeholder: "MM/DD/YYYY" },
    { key: "alien_number", label: "Alien Registration Number", placeholder: "A-Number" },
    { key: "ssn", label: "Social Security Number", placeholder: "XXX-XX-XXXX" },
    { key: "current_address", label: "Current Address", placeholder: "Street address" },
    { key: "city", label: "City", placeholder: "City" },
    { key: "state", label: "State", placeholder: "State" },
    { key: "zip", label: "ZIP Code", placeholder: "ZIP" },
    { key: "marital_status", label: "Marital Status", placeholder: "e.g. Married, Single" },
    { key: "employer", label: "Current Employer", placeholder: "Employer name" },
    { key: "occupation", label: "Occupation", placeholder: "Job title" },
  ],
};

const defaultFields = [
  { key: "first_name", label: "First Name", placeholder: "Legal first name" },
  { key: "last_name", label: "Last Name", placeholder: "Legal last name" },
  { key: "date_of_birth", label: "Date of Birth", placeholder: "MM/DD/YYYY" },
  { key: "country_of_birth", label: "Country of Birth", placeholder: "Country" },
  { key: "address", label: "Current Address", placeholder: "Street address" },
  { key: "city", label: "City", placeholder: "City" },
  { key: "state", label: "State", placeholder: "State" },
  { key: "zip", label: "ZIP Code", placeholder: "ZIP" },
  { key: "phone", label: "Phone Number", placeholder: "(XXX) XXX-XXXX" },
  { key: "email", label: "Email Address", placeholder: "email@example.com" },
];

/* ── Waveform visualizer ── */
const Waveform = ({ active }: { active: boolean }) => {
  const [, tick] = useState(0);
  const ref = useRef<number>();
  useEffect(() => {
    if (active) {
      const loop = () => { tick(p => p + 1); ref.current = requestAnimationFrame(loop); };
      ref.current = requestAnimationFrame(loop);
    }
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [active]);

  return (
    <div className="flex items-center justify-center gap-[2px] h-6">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className={cn("w-[3px] rounded-full transition-all duration-75", active ? "bg-secondary/60" : "bg-muted")}
          style={{ height: active ? `${6 + Math.sin(i * 0.8 + Date.now() * 0.005) * 10}px` : "4px" }}
        />
      ))}
    </div>
  );
};

/* ── Main Component ── */
const FormFiller = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState<FormInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [values, setValues] = useState<Record<string, string>>({});
  const [confirmedKeys, setConfirmedKeys] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Voice
  const [inputMode, setInputMode] = useState<"type" | "voice">("type");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isVoiceSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const fieldDefs = form
    ? formFieldDefinitions[form.form_type] || defaultFields
    : [];

  /* ── Load form instance + existing field_values ── */
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const { data: fi } = await supabase
        .from("form_instances")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!fi) { setLoading(false); return; }
      setForm(fi);

      const { data: fv } = await supabase
        .from("field_values")
        .select("*")
        .eq("form_instance_id", id);
      if (fv) {
        const map: Record<string, string> = {};
        fv.forEach(f => { if (f.field_value) map[f.field_key] = f.field_value; });
        setValues(map);
        setConfirmedKeys(new Set(Object.keys(map)));
      }
      setLoading(false);
    };
    load();
  }, [id]);

  /* ── Inline validation on value change ── */
  const handleValueChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  /* ── Validate + confirm a field ── */
  const confirmField = (key: string) => {
    const val = values[key] || "";
    const err = validateField(key, val);
    if (err) {
      setErrors(prev => ({ ...prev, [key]: err }));
      return;
    }
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    setConfirmedKeys(prev => new Set(prev).add(key));
    setEditingKey(null);
  };

  /* ── Voice helpers ── */
  const startFieldVoice = useCallback((fieldKey: string) => {
    if (!isVoiceSupported) {
      toast({ title: "Not supported", description: "Voice input is not available in this browser." });
      return;
    }
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setTranscript(text);
      setValues(prev => ({ ...prev, [fieldKey]: text.trim() }));
      if (errors[fieldKey]) {
        setErrors(prev => { const n = { ...prev }; delete n[fieldKey]; return n; });
      }
    };
    rec.onend = () => { setListening(false); setActiveVoiceField(null); };
    rec.onerror = () => { setListening(false); setActiveVoiceField(null); };

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
    setActiveVoiceField(fieldKey);
    setTranscript("");
  }, [isVoiceSupported, toast, errors]);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setActiveVoiceField(null);
  }, []);

  /* ── Save to DB with full validation ── */
  const handleSave = async () => {
    if (!id || !form) return;

    // Validate all fields before saving
    const newErrors: Record<string, string> = {};
    for (const def of fieldDefs) {
      const err = validateField(def.key, values[def.key] || "");
      if (err) newErrors[def.key] = err;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const reqCount = Object.values(newErrors).filter(e => e === "This field is required").length;
      const formatCount = Object.keys(newErrors).length - reqCount;
      toast({
        title: "Validation errors",
        description: `${reqCount ? `${reqCount} required field(s)` : ""}${reqCount && formatCount ? " and " : ""}${formatCount ? `${formatCount} format issue(s)` : ""} need attention.`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const entries = Object.entries(values).filter(([, v]) => v.trim());

      if (entries.length > 0) {
        const { error: fieldValuesError } = await supabase
          .from("field_values")
          .upsert(
            entries.map(([field_key, field_value]) => ({
              form_instance_id: id,
              field_key,
              field_value,
            })),
            { onConflict: "form_instance_id,field_key" }
          );

        if (fieldValuesError) throw fieldValuesError;
      }

      const filledCount = entries.length;
      const totalCount = fieldDefs.length || 1;
      const progress = Math.min(Math.round((filledCount / totalCount) * 100), 100);
      const newStatus = progress === 100 ? "completed" as const : progress > 0 ? "in_progress" as const : "not_started" as const;

      const { error: formUpdateError } = await supabase
        .from("form_instances")
        .upsert(
          {
            id: form.id,
            case_id: form.case_id,
            form_type: form.form_type,
            form_name: form.form_name,
            assigned_to: form.assigned_to,
            populated_at: form.populated_at,
            progress,
            status: newStatus,
          },
          { onConflict: "id" }
        );

      if (formUpdateError) throw formUpdateError;

      setForm((prev) => prev ? { ...prev, progress, status: newStatus } : prev);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["case-forms"] }),
        queryClient.invalidateQueries({ queryKey: ["my-case"] }),
      ]);

      toast({ title: "Saved!", description: `${form.form_name} progress saved (${progress}%).` });
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err.message || "We couldn't save your form progress.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ── Derived state ── */
  const filledCount = Object.values(values).filter(v => v.trim()).length;
  const progress = fieldDefs.length ? Math.round((filledCount / fieldDefs.length) * 100) : 0;
  const errorCount = Object.keys(errors).length;

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center space-y-3">
        <p className="text-lg font-semibold text-foreground">Form not found</p>
        <p className="text-sm text-muted-foreground">This form instance may have been deleted or you don't have access.</p>
        <Button variant="outline" onClick={() => navigate("/portal")}>Back to Portal</Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-2 space-y-5 pb-8">
      {/* Header */}
      <div>
        <BackButton />
        <h1 className="text-xl font-display font-bold text-foreground mt-1">{form.form_name}</h1>
        <p className="text-sm text-muted-foreground">{form.form_type} — Fill in your information below</p>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Completion</span>
            <div className="flex items-center gap-2">
              {errorCount > 0 && (
                <Badge variant="outline" className="border-destructive/30 text-destructive text-[10px] px-1.5 py-0 gap-1">
                  <AlertCircle className="w-2.5 h-2.5" /> {errorCount} error{errorCount > 1 ? "s" : ""}
                </Badge>
              )}
              <span className="text-sm font-bold text-secondary">{progress}%</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">
            {filledCount} of {fieldDefs.length} fields filled
          </p>
        </CardContent>
      </Card>

      {/* Input Mode Toggle */}
      <div className="flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant={inputMode === "type" ? "default" : "outline"}
          onClick={() => setInputMode("type")}
          className="gap-1.5"
        >
          <Keyboard className="w-3.5 h-3.5" />
          Type
        </Button>
        <Button
          size="sm"
          variant={inputMode === "voice" ? "default" : "outline"}
          onClick={() => setInputMode("voice")}
          className="gap-1.5"
        >
          <Volume2 className="w-3.5 h-3.5" />
          Voice
        </Button>
      </div>

      {/* Voice active indicator */}
      {inputMode === "voice" && listening && (
        <Card className="border-secondary/40">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-medium text-foreground">Listening…</span>
              <Button size="sm" variant="ghost" onClick={stopVoice} className="ml-auto h-7 px-2 text-xs">
                <MicOff className="w-3 h-3 mr-1" /> Stop
              </Button>
            </div>
            <Waveform active={true} />
            {transcript && (
              <p className="text-sm text-muted-foreground italic">"{transcript}"</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fields */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {fieldDefs.map((def) => {
              const val = values[def.key] || "";
              const isConfirmed = confirmedKeys.has(def.key);
              const isEditing = editingKey === def.key;
              const isVoiceActive = activeVoiceField === def.key && listening;
              const error = errors[def.key];
              const rule = fieldValidationRules[def.key];
              const isRequired = rule?.required;

              return (
                <div key={def.key} className={cn("px-4 py-3.5", error && "bg-destructive/5")}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-muted-foreground font-medium">
                      {def.label}
                      {isRequired && <span className="text-destructive ml-0.5">*</span>}
                    </label>
                    {isConfirmed && !isEditing && !error && (
                      <Badge className="bg-success/10 text-success border-0 text-[10px] px-1.5 py-0">
                        ✓ Saved
                      </Badge>
                    )}
                  </div>

                  {(isEditing || !isConfirmed || inputMode === "type") ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Input
                          value={val}
                          onChange={(e) => handleValueChange(def.key, e.target.value)}
                          placeholder={def.placeholder}
                          className={cn(
                            "h-9 text-sm flex-1",
                            error && "border-destructive focus-visible:ring-destructive/30"
                          )}
                          autoFocus={isEditing}
                          onFocus={() => setEditingKey(def.key)}
                          onKeyDown={(e) => { if (e.key === "Enter") confirmField(def.key); }}
                          maxLength={rule?.maxLength ? rule.maxLength + 10 : undefined}
                        />
                        {inputMode === "voice" && (
                          <Button
                            size="icon"
                            variant={isVoiceActive ? "destructive" : "outline"}
                            className="h-9 w-9 shrink-0"
                            onClick={() => isVoiceActive ? stopVoice() : startFieldVoice(def.key)}
                          >
                            {isVoiceActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          </Button>
                        )}
                        {val.trim() && (
                          <Button
                            size="icon"
                            className="h-9 w-9 shrink-0 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                            onClick={() => confirmField(def.key)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      {error && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          {error}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{val}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => {
                          setEditingKey(def.key);
                          setConfirmedKeys(prev => { const s = new Set(prev); s.delete(def.key); return s; });
                        }}
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving || filledCount === 0}
        className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl shadow-md gap-2"
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
        ) : (
          <><Save className="w-4 h-4" /> Save Progress</>
        )}
      </Button>
    </div>
  );
};

export default FormFiller;
