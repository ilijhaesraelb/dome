import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2, Save, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, Eye, ArrowLeft,
  Shield, BookOpen, ClipboardCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logPlatformError } from "@/lib/error-logger";
import { useMyCase } from "@/hooks/useMyCase";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { FORM_SECTIONS, type FormFieldDef } from "@/data/formSections";
import GuidedField from "@/components/form-engine/GuidedField";
import WizardProgress from "@/components/form-engine/WizardProgress";
import ReviewScreen from "@/components/form-engine/ReviewScreen";
import { getUFEForm } from "@/lib/ufe/registry";
import ExportPaymentGate from "@/components/form-engine/ExportPaymentGate";
import {
  buildFormDraftStorageKey,
  buildFormUiStorageKey,
  buildLastVisitedFormStorageKey,
} from "@/lib/form-flow";
import {
  TEMPLATE_REGISTRY,
  fillPdfTemplate,
  generatePreviewPdf,
  buildCaseDataObject,
} from "@/lib/pdf-template-engine";
import type { Tables } from "@/integrations/supabase/types";
import { useIsMobile } from "@/hooks/use-mobile";

type FormInstance = Tables<"form_instances">;

function readStoredJson<T>(key: string | null): T | null {
  if (!key || typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/* ── Validation ── */
const DATE_RE = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}$/;
const SSN_RE = /^\d{3}-\d{2}-\d{4}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;

function validateField(key: string, value: string, required?: boolean): string | null {
  const trimmed = value.trim();
  if (required && !trimmed) return "This field is required";
  if (!trimmed) return null;
  if (key.includes("dob") || key.includes("date_of_birth") || key.includes("date_became") || key.includes("date_of_last") || key.includes("date_of_marriage") || key.includes("certificate_date") || key.includes("parent1_dob")) {
    if (!DATE_RE.test(trimmed)) return "Use MM/DD/YYYY format";
  }
  if (key.includes("ssn") && trimmed && !SSN_RE.test(trimmed)) return "Use XXX-XX-XXXX format";
  if (key.includes("zip") && trimmed && !ZIP_RE.test(trimmed)) return "Use 5-digit or 5+4 ZIP code";
  if ((key === "petitioner_state" || key === "petitioner_employer_state") && trimmed.length !== 2) return "Use 2-letter state code (e.g. CA)";
  return null;
}

type ViewMode = "edit" | "preview" | "review";

const FormWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: myCase } = useMyCase();
  const isMobile = useIsMobile();

  const [form, setForm] = useState<FormInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [exporting, setExporting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [uiHydrated, setUiHydrated] = useState(false);
  const uiRestoredRef = useRef(false);

  const sections = form ? (FORM_SECTIONS[form.form_type] || []) : [];
  const template = form ? TEMPLATE_REGISTRY[form.form_type] : null;
  const allFields = useMemo(() => sections.flatMap(s => s.fields), [sections]);
  const draftStorageKey = useMemo(() => (id ? buildFormDraftStorageKey(id) : null), [id]);
  const uiStorageKey = useMemo(() => (id ? buildFormUiStorageKey(id) : null), [id]);

  // ── Data queries ──
  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: persons } = useQuery({
    queryKey: ["case-persons", myCase?.id],
    queryFn: async () => {
      const { data } = await supabase.from("persons").select("*").eq("case_id", myCase!.id);
      return data;
    },
    enabled: !!myCase?.id,
  });

  const { data: addresses } = useQuery({
    queryKey: ["case-addresses", persons],
    queryFn: async () => {
      const personIds = (persons || []).map((p: any) => p.id);
      if (!personIds.length) return [];
      const { data } = await supabase.from("addresses").select("*").in("person_id", personIds);
      return data;
    },
    enabled: !!persons && persons.length > 0,
  });

  /* ── Load form + field values ── */
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const { data: fi } = await supabase.from("form_instances").select("*").eq("id", id).maybeSingle();
      if (!fi) { setLoading(false); return; }
      setForm(fi);
      const { data: fv } = await supabase.from("field_values").select("*").eq("form_instance_id", id);
      const persistedDraft = readStoredJson<{ values?: Record<string, string> }>(draftStorageKey);
      const dbValues: Record<string, string> = {};
      if (fv) {
        fv.forEach(f => { if (f.field_value) dbValues[f.field_key] = f.field_value; });
      }
      const mergedValues = { ...dbValues, ...(persistedDraft?.values || {}) };
      setValues(mergedValues);
      setIsDirty(Boolean(persistedDraft?.values && Object.keys(persistedDraft.values).length > 0));
      setDraftHydrated(true);
      setLoading(false);
    };
    load();
  }, [id, draftStorageKey]);

  useEffect(() => {
    if (!form?.id || !form.case_id || typeof window === "undefined") return;
    window.localStorage.setItem(buildLastVisitedFormStorageKey(form.case_id), form.id);
  }, [form?.id, form?.case_id]);

  useEffect(() => {
    if (uiRestoredRef.current || !uiStorageKey || sections.length === 0) return;

    const persistedUi = readStoredJson<{ activeSection?: number; viewMode?: ViewMode }>(uiStorageKey);
    if (persistedUi) {
      if (typeof persistedUi.activeSection === "number") {
        setActiveSection(Math.min(Math.max(persistedUi.activeSection, 0), sections.length - 1));
      }

      if (persistedUi.viewMode === "edit" || persistedUi.viewMode === "preview" || persistedUi.viewMode === "review") {
        setViewMode(persistedUi.viewMode);
      }
    }

    uiRestoredRef.current = true;
    setUiHydrated(true);
  }, [uiStorageKey, sections.length]);

  useEffect(() => {
    if (!draftHydrated || !draftStorageKey || typeof window === "undefined") return;

    const cleanedValues = Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim()));
    if (Object.keys(cleanedValues).length === 0) {
      window.localStorage.removeItem(draftStorageKey);
      return;
    }

    window.localStorage.setItem(
      draftStorageKey,
      JSON.stringify({ values: cleanedValues, savedAt: new Date().toISOString() }),
    );
  }, [draftHydrated, draftStorageKey, values]);

  useEffect(() => {
    if (!uiHydrated || !uiStorageKey || typeof window === "undefined") return;

    window.localStorage.setItem(
      uiStorageKey,
      JSON.stringify({ activeSection, viewMode }),
    );
  }, [uiHydrated, uiStorageKey, activeSection, viewMode]);

  /* ── Computed ── */
  const sectionCompletions = useMemo(() => {
    return sections.map(s => {
      const required = s.fields.filter(f => f.required);
      if (required.length === 0) return 100;
      const filled = required.filter(f => (values[f.key] || "").trim()).length;
      return Math.round((filled / required.length) * 100);
    });
  }, [sections, values]);

  const sectionMissing = useMemo(() => {
    return sections.map(s => s.fields.filter(f => f.required && !(values[f.key] || "").trim()).length);
  }, [sections, values]);

  const totalRequired = allFields.filter(f => f.required).length;
  const totalFilled = allFields.filter(f => f.required && (values[f.key] || "").trim()).length;
  const overallProgress = totalRequired > 0 ? Math.round((totalFilled / totalRequired) * 100) : 100;
  const totalFieldsFilled = allFields.filter(f => (values[f.key] || "").trim()).length;
  const totalMissing = totalRequired - totalFilled;

  const formStatus = useMemo(() => {
    if (totalFieldsFilled === 0) return "Not Started";
    if (totalMissing > 0) return "In Progress";
    if (Object.keys(errors).length > 0) return "Needs Review";
    return "Ready for Export";
  }, [totalFieldsFilled, totalMissing, errors]);

  const statusColor = useMemo(() => {
    switch (formStatus) {
      case "Not Started": return "bg-muted text-muted-foreground";
      case "In Progress": return "bg-secondary/15 text-secondary";
      case "Needs Review": return "bg-warning/15 text-warning-foreground";
      case "Ready for Export": return "bg-success/15 text-success";
      default: return "bg-muted text-muted-foreground";
    }
  }, [formStatus]);

  const handleValueChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setSaveStatus("idle");
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  /* ── Save ── */
  const handleSave = useCallback(async () => {
    if (!id || !form) return;
    setSaving(true);
    setSaveStatus("saving");
    try {
      const entries = Object.entries(values).filter(([, v]) => v.trim());
      if (entries.length > 0) {
        const { error } = await supabase.from("field_values").upsert(
          entries.map(([field_key, field_value]) => ({ form_instance_id: id, field_key, field_value })),
          { onConflict: "form_instance_id,field_key" }
        );
        if (error) throw error;
      }
      const progress = Math.min(Math.round((totalFieldsFilled / Math.max(allFields.length, 1)) * 100), 100);
      const status = overallProgress === 100 ? "completed" as const : totalFieldsFilled > 0 ? "in_progress" as const : "not_started" as const;
      await supabase.from("form_instances").upsert(
        { id: form.id, case_id: form.case_id, form_type: form.form_type, form_name: form.form_name, assigned_to: form.assigned_to, populated_at: form.populated_at, progress, status },
        { onConflict: "id" }
      );
      setForm(prev => prev ? { ...prev, progress, status } : prev);
      setLastSaved(new Date());
      setIsDirty(false);
      setSaveStatus("saved");
      if (draftStorageKey && typeof window !== "undefined") {
        window.localStorage.removeItem(draftStorageKey);
      }
      await queryClient.invalidateQueries({ queryKey: ["case-forms"] });
    } catch (err: any) {
      setSaveStatus("error");
      toast({ title: "Save failed", description: err.message || "Could not save.", variant: "destructive" });
      await logPlatformError({
        type: "save_failure", severity: "high",
        message: err.message || "Form save failed",
        caseId: myCase?.id,
        details: { formType: form?.form_type, formId: id },
      });
    } finally { setSaving(false); }
  }, [id, form, values, totalFieldsFilled, allFields.length, overallProgress, queryClient, toast, myCase?.id, draftStorageKey]);

  /* ── Debounced autosave ── */
  useEffect(() => {
    if (!isDirty || !form || !id) return;
    const timeout = setTimeout(() => handleSave(), 2000);
    return () => clearTimeout(timeout);
  }, [isDirty, values, handleSave, form, id]);

  const persistProgress = useCallback(() => {
    if (isDirty) {
      void handleSave();
    }
  }, [isDirty, handleSave]);

  /* ── Preview ── */
  const generatePreview = useCallback(async () => {
    if (!form?.form_type) {
      toast({ title: "Preview Error", description: "No form type found.", variant: "destructive" });
      return;
    }
    setPreviewLoading(true);
    try {
      // Build field values from current workspace state — this is the user's data
      const fieldValuesArr = Object.entries(values)
        .filter(([, v]) => v.trim())
        .map(([field_key, field_value]) => ({ field_key, field_value }));

      console.log(`[Preview] Building case data with ${fieldValuesArr.length} field values for ${form.form_type}`);

      const caseData = buildCaseDataObject(
        profile as Record<string, unknown> | null,
        (persons || []) as Record<string, unknown>[],
        (addresses || []) as Record<string, unknown>[],
        fieldValuesArr as Record<string, unknown>[],
      );
      const previewBytes = await generatePreviewPdf(form.form_type, caseData);
      const blob = new Blob([new Uint8Array(previewBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      console.log(`[Preview] Successfully generated preview for ${form.form_type}`);
    } catch (err: any) {
      console.error("Preview error:", err);
      toast({
        title: "Preview Error",
        description: err?.message || "Could not generate preview. Please try again.",
        variant: "destructive",
      });
    } finally { setPreviewLoading(false); }
  }, [form, values, profile, persons, addresses, toast, previewUrl]);

  /* ── Export ── */
  const handleExport = async () => {
    if (!form?.form_type) return;
    const newErrors: Record<string, string> = {};
    for (const field of allFields) {
      const err = validateField(field.key, values[field.key] || "", field.required);
      if (err) newErrors[field.key] = err;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({ title: "Please fix errors", description: `${Object.keys(newErrors).length} field(s) need attention.`, variant: "destructive" });
      const firstErrKey = Object.keys(newErrors)[0];
      const sIdx = sections.findIndex(s => s.fields.some(f => f.key === firstErrKey));
      if (sIdx >= 0) { setActiveSection(sIdx); setViewMode("edit"); }
      return;
    }
    setExporting(true);
    try {
      const fieldValuesArr = Object.entries(values).map(([field_key, field_value]) => ({ field_key, field_value }));
      const caseData = buildCaseDataObject(
        profile as Record<string, unknown> | null,
        (persons || []) as Record<string, unknown>[],
        (addresses || []) as Record<string, unknown>[],
        fieldValuesArr as Record<string, unknown>[],
      );
      const result = await fillPdfTemplate(form.form_type, caseData);
      const blob = new Blob([new Uint8Array(result.pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const petName = values.petitioner_last_name || values.last_name || "draft";
      const a = document.createElement("a");
      a.href = url;
      a.download = `DOME_${form.form_type}_${petName}_${myCase?.case_number || "case"}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (myCase?.id && user?.id) {
        await supabase.from("case_exports").insert({
          case_id: myCase.id, user_id: user.id, export_type: "template_form", status: "completed",
          file_name: a.download, forms_included: [form.form_type],
          metadata: { filled_fields: result.filledFields.length, missing_required: result.missingRequired, total_fields: result.totalFields },
        });
      }
      toast({ title: "✅ Export Complete", description: "Your form PDF has been downloaded." });
    } catch (err: any) {
      toast({ title: "Export Failed", description: err.message || "Could not export.", variant: "destructive" });
      await logPlatformError({
        type: "export_failure", severity: "critical",
        message: err.message || "Form export failed",
        caseId: myCase?.id,
        details: { formType: form?.form_type, formId: id },
      });
    } finally { setExporting(false); }
  };

  /* ── Navigation ── */
  const goNext = () => {
    const section = sections[activeSection];
    if (section) {
      const newErrors: Record<string, string> = {};
      for (const f of section.fields) {
        const err = validateField(f.key, values[f.key] || "", f.required);
        if (err) newErrors[f.key] = err;
      }
      if (Object.keys(newErrors).length > 0) setErrors(prev => ({ ...prev, ...newErrors }));
    }
      persistProgress();
      if (activeSection < sections.length - 1) setActiveSection(activeSection + 1);
  };
  const goPrev = () => {
    persistProgress();
    if (activeSection > 0) setActiveSection(activeSection - 1);
  };

  const jumpToMissing = () => {
    for (let i = 0; i < sections.length; i++) {
      const miss = sections[i].fields.find(f => f.required && !(values[f.key] || "").trim());
      if (miss) { setActiveSection(i); setViewMode("edit"); return; }
    }
  };

  /* ── Review data ── */
  const reviewGroups = useMemo(() => {
    return sections.filter(s => s.id !== "review").map((s) => ({
      title: s.title,
      sectionIndex: sections.indexOf(s),
      complete: sectionCompletions[sections.indexOf(s)] ?? 0,
      missing: sectionMissing[sections.indexOf(s)] ?? 0,
      fields: s.fields.map(f => ({
        label: f.label,
        value: values[f.key] || "",
        required: f.required,
        missing: f.required && !(values[f.key] || "").trim(),
      })),
    }));
  }, [sections, sectionCompletions, sectionMissing, values]);

  // ── Loading / Not found ──
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-lg font-semibold">Form not found</p>
        <Button variant="outline" onClick={() => navigate("/portal/forms")}>Back to Forms</Button>
      </div>
    );
  }

  const currentSection = sections[activeSection];
  const hasTemplate = !!template;
  const isReviewSection = currentSection?.id === "review";

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* ═══ Top Bar ═══ */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between gap-3 shrink-0 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => {
            persistProgress();
            navigate("/portal/forms");
          }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-base font-display font-bold truncate">{form.form_name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{form.form_type}</Badge>
              <span className={cn(
                "transition-colors",
                saveStatus === "saving" && "text-secondary",
                saveStatus === "saved" && "text-success",
                saveStatus === "error" && "text-destructive",
              )}>
                {saveStatus === "saving" ? "Saving…" :
                 saveStatus === "saved" ? "✓ Saved" :
                 saveStatus === "error" ? "Save failed" :
                 isDirty ? "Unsaved" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={cn("text-[10px] px-2.5 py-0.5", statusColor)}>{formStatus}</Badge>
          {!isMobile && (
            <Button
              size="sm"
              variant={viewMode === "review" ? "default" : "outline"}
              onClick={() => setViewMode("review")}
              className="gap-1.5 h-8 text-xs"
            >
              <ClipboardCheck className="w-3.5 h-3.5" /> Review
            </Button>
          )}
        </div>
      </div>

      {/* ═══ Main Layout ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Desktop Sidebar ── */}
        {!isMobile && (
          <div className="w-56 border-r bg-card overflow-y-auto hidden md:flex flex-col shrink-0">
            <ScrollArea className="flex-1 p-3">
              <WizardProgress
                sections={sections}
                activeSection={activeSection}
                completions={sectionCompletions}
                onSectionClick={(i) => {
                  persistProgress();
                  setActiveSection(i);
                  setViewMode(sections[i]?.id === "review" ? "review" : "edit");
                }}
              />
            </ScrollArea>

            {/* Export in sidebar */}
            <div className="p-3 border-t">
              <ExportPaymentGate
                formType={form.form_type}
                onExportAllowed={handleExport}
                onPreview={() => { setViewMode("preview"); generatePreview(); }}
                disabled={exporting || !form}
                exporting={exporting}
              />
            </div>
          </div>
        )}

        {/* ── Center Content ── */}
        <div className="flex-1 overflow-y-auto">
          {/* ══ EDIT MODE ══ */}
          {viewMode === "edit" && currentSection && !isReviewSection ? (
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
              {/* Section header */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                    {activeSection + 1}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-display font-bold">{currentSection.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      Step {activeSection + 1} of {sections.length}
                    </p>
                  </div>
                </div>
                {/* Progress for this section */}
                <div className="flex items-center gap-2">
                  <Progress value={sectionCompletions[activeSection]} className="h-2 flex-1" />
                  <span className="text-xs font-medium text-muted-foreground">{sectionCompletions[activeSection]}%</span>
                </div>
              </div>

              {/* Section purpose */}
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/80">{currentSection.purpose}</p>
              </div>

              {/* Question Cards */}
              <Card className="overflow-hidden shadow-sm">
                <CardContent className="p-0 divide-y divide-border">
                  {currentSection.fields.map((field) => (
                    <GuidedField
                      key={field.key}
                      field={field}
                      value={values[field.key] || ""}
                      error={errors[field.key]}
                      onChange={handleValueChange}
                    />
                  ))}
                </CardContent>
              </Card>

              {/* Compliance note */}
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground">
                  D.O.M.E. provides educational guidance. This is not legal advice.
                </p>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2 pb-8">
                <Button
                  variant="outline"
                  onClick={goPrev}
                  disabled={activeSection === 0}
                  className="gap-2 h-11 px-5"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                {activeSection < sections.length - 1 ? (
                  <Button onClick={goNext} className="gap-2 h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90">
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      persistProgress();
                      setViewMode("review");
                    }}
                    className="gap-2 h-11 px-6 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    <ClipboardCheck className="w-4 h-4" /> Review & Export
                  </Button>
                )}
              </div>
            </div>

          /* ══ REVIEW MODE ══ */
          ) : viewMode === "review" || isReviewSection ? (
            <ScrollArea className="h-full">
              <ReviewScreen
                formType={form.form_type}
                reviewGroups={reviewGroups}
                overallProgress={overallProgress}
                totalFilled={totalFilled}
                totalRequired={totalRequired}
                totalMissing={totalMissing}
                formStatus={formStatus}
                statusColor={statusColor}
                onEditSection={(idx) => {
                  persistProgress();
                  setActiveSection(idx);
                  setViewMode("edit");
                }}
                onJumpToMissing={jumpToMissing}
                onExport={handleExport}
                onPreview={() => { setViewMode("preview"); generatePreview(); }}
                exporting={exporting}
                hasTemplate={hasTemplate}
                formInstanceId={form.id}
                caseId={form.case_id}
                ufeForm={getUFEForm(form.form_type)}
                ufeValues={getUFEForm(form.form_type) ? values : undefined}
              />
            </ScrollArea>

          /* ══ PREVIEW MODE ══ */
          ) : viewMode === "preview" ? (
            <div className="h-full flex flex-col">
              <div className="border-b px-4 py-2.5 flex items-center justify-between bg-card shrink-0">
                <Button size="sm" variant="ghost" onClick={() => setViewMode("edit")} className="gap-1.5 h-8 text-xs">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Edit
                </Button>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setViewMode("review")} className="gap-1.5 h-8 text-xs">
                    <ClipboardCheck className="w-3.5 h-3.5" /> Review
                  </Button>
                  {hasTemplate && (
                    <Button size="sm" variant="outline" onClick={() => { setViewMode("preview"); generatePreview(); }} className="gap-1.5 h-8 text-xs">
                      <Eye className="w-3.5 h-3.5" /> Refresh
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                {previewLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground">Generating preview…</p>
                    </div>
                  </div>
                ) : previewUrl ? (
                  <iframe
                    src={`${previewUrl}#zoom=${zoom}`}
                    className="w-full h-full border-0"
                    title={`${form.form_type} Preview`}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <Eye className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                      <p className="text-sm text-muted-foreground">Preview not yet generated</p>
                      <Button variant="outline" size="sm" onClick={generatePreview}>Generate Preview</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Fallback — sections may be empty for forms without a defined wizard.
            // Keep the screen non-blank so the Review/Preview buttons always have somewhere to land.
            <div className="max-w-2xl mx-auto px-4 py-10 text-center space-y-4">
              <ClipboardCheck className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <h2 className="text-base font-semibold">No guided sections for this form yet</h2>
              <p className="text-sm text-muted-foreground">
                You can still review what's saved or generate a preview using your case data.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button variant="outline" onClick={() => setViewMode("review")} className="gap-1.5">
                  <ClipboardCheck className="w-4 h-4" /> Open Review
                </Button>
                {hasTemplate && (
                  <Button onClick={() => { setViewMode("preview"); generatePreview(); }} className="gap-1.5">
                    <Eye className="w-4 h-4" /> Preview Official Form
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Mobile Bottom Nav ═══ */}
      {isMobile && viewMode === "edit" && (
        <div className="md:hidden border-t bg-card px-4 py-3 flex items-center justify-between shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <Button variant="outline" size="sm" onClick={goPrev} disabled={activeSection === 0} className="gap-1 h-10 px-4">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <div className="text-center">
            <p className="text-xs font-semibold">{activeSection + 1} / {sections.length}</p>
            <p className="text-[10px] text-muted-foreground">{sectionCompletions[activeSection]}% done</p>
          </div>
          {activeSection < sections.length - 1 ? (
            <Button size="sm" onClick={goNext} className="gap-1 h-10 px-4">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => setViewMode("review")} className="gap-1 h-10 px-3 bg-secondary text-secondary-foreground">
              Review
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FormWorkspace;
