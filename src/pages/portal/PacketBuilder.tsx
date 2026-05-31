import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2, Circle, Loader2, AlertCircle, FileDown, FileText,
  Shield, BookOpen, Package, Clock, AlertTriangle, Download, History,
  ArrowRight, User, Upload, Eye, Printer, Send, Edit, XCircle,
  ClipboardCheck, MessageSquare, ChevronDown, ChevronUp, FileCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMyCase } from "@/hooks/useMyCase";
import { useCaseDocuments, useCaseFormInstances } from "@/hooks/useCases";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useT } from "@/hooks/useT";
import { TEMPLATE_REGISTRY, buildCaseDataObject, fillPdfTemplate } from "@/lib/pdf-template-engine";
import {
  assemblePacket,
  validateForExport,
  calculateReadiness,
  filterCaseEvidence,
  type PacketCaseData,
  type PacketFormEntry,
  type PacketDocEntry,
  type ValidationResult,
  type FormExportResult,
} from "@/lib/packet-assembler";
import BackButton from "@/components/BackButton";
import { logPlatformError } from "@/lib/error-logger";

type ReviewStatus = "draft" | "client_review" | "attorney_review" | "ready_for_export" | "exported";

const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  client_review: { label: "Client Review", color: "bg-yellow-100 text-yellow-800" },
  attorney_review: { label: "Attorney Review", color: "bg-blue-100 text-blue-800" },
  ready_for_export: { label: "Ready for Export", color: "bg-green-100 text-green-800" },
  exported: { label: "Exported", color: "bg-primary/10 text-primary" },
};

const PacketBuilder = () => {
  const t = useT();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [generating, setGenerating] = useState(false);
  const [includeCover, setIncludeCover] = useState(true);
  const [includeTOC, setIncludeTOC] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeReviewNotes, setIncludeReviewNotes] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("draft");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmChecks, setConfirmChecks] = useState<Record<string, boolean>>({});
  const [showBlockers, setShowBlockers] = useState(true);
  const [downloadMode, setDownloadMode] = useState<"full" | "forms_only" | "docs_only">("full");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  const { data: myCase, isLoading: caseLoading } = useMyCase();
  const { data: documents = [], isLoading: docsLoading } = useCaseDocuments(myCase?.id);
  const { data: forms = [], isLoading: formsLoading } = useCaseFormInstances(myCase?.id);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
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
    queryKey: ["case-addresses-packet", persons],
    queryFn: async () => {
      const personIds = (persons || []).map((p: any) => p.id);
      if (!personIds.length) return [];
      const { data } = await supabase.from("addresses").select("*").in("person_id", personIds);
      return data;
    },
    enabled: !!persons && persons.length > 0,
  });

  // CRITICAL: Fetch ALL field_values for ALL form instances in this case
  const { data: allFieldValues = [] } = useQuery({
    queryKey: ["case-all-field-values", myCase?.id],
    queryFn: async () => {
      const { data: instances } = await supabase
        .from("form_instances")
        .select("id")
        .eq("case_id", myCase!.id);
      if (!instances?.length) return [];
      const { data } = await supabase
        .from("field_values")
        .select("*")
        .in("form_instance_id", instances.map((i: any) => i.id));
      return data || [];
    },
    enabled: !!myCase?.id,
  });

  const { data: exports = [] } = useQuery({
    queryKey: ["case-exports", myCase?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_exports")
        .select("*")
        .eq("case_id", myCase!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!myCase?.id,
  });

  const isLoading = caseLoading || docsLoading || formsLoading;

  // Derive applicant data
  const applicant = persons?.find((p: any) => p.role === "applicant" || p.role === "beneficiary") || persons?.[0];
  const currentAddr = addresses?.find((a: any) => a.is_current) || addresses?.[0];
  const clientName = profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Client";

  const packetCaseData: PacketCaseData = useMemo(() => ({
    clientName,
    caseNumber: myCase?.case_number || "",
    caseType: myCase?.case_type || "",
    displayName: profile?.display_name || clientName,
    readiness: 0,
    applicantDob: (applicant as any)?.date_of_birth || "",
    applicantCob: (applicant as any)?.country_of_birth || "",
    applicantANumber: (applicant as any)?.alien_number || "",
    mailingAddress: currentAddr
      ? `${(currentAddr as any).street || ""}, ${(currentAddr as any).city || ""}, ${(currentAddr as any).state || ""} ${(currentAddr as any).zip || ""}`.trim()
      : "",
  }), [clientName, myCase, profile, applicant, currentAddr]);

  const readyFormStatuses = new Set(["completed", "ready_for_review", "submitted", "approved"]);
  const completedForms: PacketFormEntry[] = useMemo(() =>
    forms
      .filter(f => readyFormStatuses.has(f.status) || (f.progress ?? 0) >= 100)
      .map(f => ({ formType: f.form_type, formName: f.form_name, status: f.status, progress: f.progress ?? 0 })),
    [forms]
  );

  const allFormEntries: PacketFormEntry[] = useMemo(() =>
    forms.map(f => ({ formType: f.form_type, formName: f.form_name, status: f.status, progress: f.progress ?? 0 })),
    [forms]
  );

  const packetDocs: PacketDocEntry[] = useMemo(() =>
    filterCaseEvidence(
      documents.map(d => ({ name: d.name, category: d.category, fileType: d.file_type || "", createdAt: d.created_at }))
    ),
    [documents]
  );

  const approvedDocs = packetDocs; // all case evidence (already filtered)
  const incompleteForms = forms.filter(f => !readyFormStatuses.has(f.status) && (f.progress ?? 0) < 100);

  // Calculate readiness with real validation
  const readiness = useMemo(() =>
    calculateReadiness(packetCaseData, allFormEntries, packetDocs),
    [packetCaseData, allFormEntries, packetDocs]
  );

  // Build structured blockers
  const hasFirstName = !!profile?.first_name;
  const hasLastName = !!profile?.last_name;
  const hasDob = !!(applicant as any)?.date_of_birth;
  const hasCob = !!(applicant as any)?.country_of_birth;
  const hasAddr = !!currentAddr;
  const docsCount = packetDocs.length;
  const incompleteFormsList = incompleteForms.map(f => ({ id: f.id, name: f.form_name, progress: f.progress ?? 0 }));
  const unmappedFormsList = validation?.unmappedForms ?? [];

  type Blocker = { label: string; path: string; actionLabel: string; severity: "error" | "warning" };
  const structuredBlockers: Blocker[] = useMemo(() => {
    const items: Blocker[] = [];
    if (!hasFirstName) items.push({ label: "Missing profile field: First Name", path: "/portal/profile", actionLabel: "Edit Profile", severity: "error" });
    if (!hasLastName) items.push({ label: "Missing profile field: Last Name", path: "/portal/profile", actionLabel: "Edit Profile", severity: "error" });
    if (!hasDob) items.push({ label: "Missing Date of Birth", path: "/portal/passport", actionLabel: "Add in Passport", severity: "error" });
    if (!hasCob) items.push({ label: "Missing Country of Birth", path: "/portal/passport", actionLabel: "Add in Passport", severity: "error" });
    if (!hasAddr) items.push({ label: "Missing Mailing Address", path: "/portal/passport", actionLabel: "Add Address", severity: "error" });
    incompleteFormsList.forEach(f => items.push({
      label: `Incomplete form: ${f.name}`,
      path: `/portal/forms/${f.id}`,
      actionLabel: f.progress > 0 ? "Review Form" : "Start Form",
      severity: "warning",
    }));
    if (docsCount === 0) items.push({ label: "No supporting documents uploaded", path: "/portal/documents", actionLabel: "Upload", severity: "warning" });
    unmappedFormsList.forEach(f => items.push({
      label: `Form ${f}: no official template — structured fallback will be used`,
      path: "/portal/forms",
      actionLabel: "View Forms",
      severity: "warning",
    }));
    return items;
  }, [hasFirstName, hasLastName, hasDob, hasCob, hasAddr, incompleteFormsList.length, docsCount, unmappedFormsList.length]);

  const criticalBlockers = structuredBlockers.filter(b => b.severity === "error");
  const canExport = criticalBlockers.length === 0 && completedForms.length > 0;

  const confirmCheckItems = [
    { id: "names", label: "I have reviewed all names for correct spelling" },
    { id: "dates", label: "I have confirmed all dates are accurate" },
    { id: "docs", label: "I have verified all supporting documents are uploaded" },
    { id: "signatures", label: "I understand signature sections may require wet signature" },
    { id: "review", label: "I understand this packet must be reviewed before filing" },
  ];
  const allConfirmed = confirmCheckItems.every(c => confirmChecks[c.id]);

  // Run validation
  const handleValidate = async () => {
    if (!myCase) return;
    setValidating(true);
    try {
      const caseDataObj = buildCaseDataObject(
        profile as Record<string, unknown> | null,
        (persons || []) as Record<string, unknown>[],
        (addresses || []) as Record<string, unknown>[],
        (allFieldValues || []) as Record<string, unknown>[],
      );
      const formResults: Record<string, any> = {};
      for (const form of completedForms) {
        if (TEMPLATE_REGISTRY[form.formType]) {
          try {
            formResults[form.formType] = await fillPdfTemplate(form.formType, caseDataObj);
          } catch { /* skip */ }
        }
      }
      const result = validateForExport(packetCaseData, completedForms, packetDocs, formResults);
      setValidation(result);
      if (result.canExport) {
        toast({ title: "Validation passed", description: "All required fields are complete. Ready for export." });
      } else {
        toast({ title: "Validation issues found", description: `${result.missingFields.length} required field(s) missing.`, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Validation failed", description: err.message, variant: "destructive" });
    } finally {
      setValidating(false);
    }
  };

  const handleExportClick = () => {
    if (!canExport) return;
    setShowConfirmDialog(true);
    setConfirmChecks({});
  };

  const handleConfirmedExport = async () => {
    if (!allConfirmed || !user || !myCase) return;
    setShowConfirmDialog(false);
    setGenerating(true);

    try {
      const caseDataObj = buildCaseDataObject(
        profile as Record<string, unknown> | null,
        (persons || []) as Record<string, unknown>[],
        (addresses || []) as Record<string, unknown>[],
        (allFieldValues || []) as Record<string, unknown>[],
      );

      const config = {
        includeCover, includeTOC, includeSummary, includeReviewNotes,
        reviewNotes, downloadMode,
      };

      const { pdfBytes, formResults, formExportResults, fileName, warnings: exportWarnings } = await assemblePacket(
        config, packetCaseData, caseDataObj, completedForms, packetDocs,
      );

      // Download
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log export
      const filledCounts: Record<string, number> = {};
      const missingCounts: Record<string, string[]> = {};
      for (const [code, result] of Object.entries(formResults)) {
        filledCounts[code] = result.filledFields.length;
        missingCounts[code] = result.missingRequired;
      }

      const fallbackForms = Object.values(formExportResults)
        .filter(r => r.templateStatus === "fallback_structured" || r.templateStatus === "fallback_emergency")
        .map(r => r.formType);

      await supabase.from("case_exports").insert({
        case_id: myCase.id,
        user_id: user.id,
        export_type: downloadMode === "full" ? "full_packet" : downloadMode,
        status: "completed",
        file_name: fileName,
        forms_included: completedForms.map(f => f.formType),
        documents_included: packetDocs.map(d => d.name),
        metadata: {
          readiness,
          includeCover, includeTOC, includeSummary, reviewStatus, downloadMode,
          formFillStats: filledCounts,
          formMissing: missingCounts,
          usedOfficialTemplates: Object.keys(formResults),
          fallbackForms,
          warnings: exportWarnings,
        },
      });

      setReviewStatus("exported");
      queryClient.invalidateQueries({ queryKey: ["case-exports", myCase.id] });

      const fallbackNote = fallbackForms.length > 0
        ? ` (${fallbackForms.join(", ")} used structured fallback)`
        : "";
      toast({ title: "Packet exported", description: `${fileName}${fallbackNote}` });
    } catch (err: any) {
      if (myCase && user) {
        try {
          await supabase.from("case_exports").insert({
            case_id: myCase.id, user_id: user.id, export_type: "full_packet",
            status: "failed", error_message: err.message,
          });
        } catch { /* ignore */ }
      }
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
      await logPlatformError({
        type: "export_failure",
        severity: "critical",
        message: err.message || "Full packet export failed",
        caseId: myCase?.id,
        details: { exportType: "full_packet" },
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleExportSingleForm = async (formCode: string) => {
    if (!myCase || !user) return;
    setGenerating(true);
    try {
      const caseDataObj = buildCaseDataObject(
        profile as Record<string, unknown> | null,
        (persons || []) as Record<string, unknown>[],
        (addresses || []) as Record<string, unknown>[],
        (allFieldValues || []) as Record<string, unknown>[],
      );
      const result = await fillPdfTemplate(formCode, caseDataObj);

      if (result.missingRequired.length > 0) {
        toast({
          title: `${formCode} has missing required fields`,
          description: `${result.missingRequired.length} field(s) still needed. Exporting draft version.`,
          variant: "destructive",
        });
      }

      const blob = new Blob([result.pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const safeName = (clientName || "Client").replace(/[^a-zA-Z0-9_-]/g, "_");
      const a = document.createElement("a");
      a.href = url;
      a.download = `DOME_${formCode}_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await supabase.from("case_exports").insert({
        case_id: myCase.id, user_id: user.id, export_type: "template_form",
        status: "completed", file_name: a.download, forms_included: [formCode],
        metadata: { filled: result.filledFields.length, missing: result.missingRequired, totalPdfFields: result.totalFields },
      });
      queryClient.invalidateQueries({ queryKey: ["case-exports", myCase.id] });
      toast({ title: `${formCode} exported`, description: "Official-layout template PDF downloaded. Review before filing." });
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
      await logPlatformError({
        type: "export_failure",
        severity: "high",
        message: err.message || "Single form export failed",
        caseId: myCase?.id,
        details: { formCode },
      });
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!myCase) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-display font-bold text-foreground">No Active Case</h2>
        <p className="text-sm text-muted-foreground">Start by selecting a form to create your case.</p>
        <Button onClick={() => navigate("/portal/forms")} variant="outline">Go to Forms</Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 pb-28 max-w-2xl mx-auto space-y-5">
      <BackButton />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-display font-bold text-foreground">Export Packet Builder</h1>
          <p className="text-sm text-muted-foreground">
            Case {myCase.case_number} · {myCase.case_type}
          </p>
        </div>
        <Badge className={STATUS_CONFIG[reviewStatus].color}>
          {STATUS_CONFIG[reviewStatus].label}
        </Badge>
      </div>

      {/* Compliance Disclaimer */}
      <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-800">
        <CardContent className="p-3 flex items-start gap-3">
          <Shield className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            This packet has been prepared for review. Please verify all information, signatures, and filing requirements before submission. D.O.M.E. does not provide legal advice.
          </p>
        </CardContent>
      </Card>

      {/* Readiness Score */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Packet Readiness</span>
            <span className="text-sm font-bold text-foreground">{readiness}%</span>
          </div>
          <Progress value={readiness} className="h-2 rounded-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedForms.length} form(s) ready</span>
            <span>{approvedDocs.length} evidence doc(s)</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1"
            onClick={handleValidate}
            disabled={validating}
          >
            {validating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileCheck className="w-3 h-3" />}
            Run Pre-Export Validation
          </Button>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validation && (
        <Card className={validation.canExport ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : "border-destructive/30 bg-destructive/5"}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              {validation.canExport
                ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                : <XCircle className="w-4 h-4 text-destructive" />
              }
              <span className="text-sm font-semibold">
                {validation.canExport ? "Validation Passed — Ready for Export" : `${validation.missingFields.length} required field(s) missing`}
              </span>
            </div>
            {validation.missingFields.length > 0 && (
              <ul className="space-y-1.5">
                {validation.missingFields.map((f, i) => {
                  const fieldLower = f.toLowerCase();
                  const editPath = fieldLower.includes("address")
                    ? "/portal/passport"
                    : fieldLower.includes("birth") || fieldLower.includes("citizenship") || fieldLower.includes("ssn")
                    ? "/portal/passport"
                    : fieldLower.includes("name") || fieldLower.includes("profile")
                    ? "/portal/profile"
                    : `/portal/forms`;
                  return (
                    <li key={i} className="flex items-center gap-2 p-1.5 rounded-md bg-background/60 border border-destructive/10">
                      <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                      <span className="text-xs flex-1 text-muted-foreground">{f}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px] gap-1 shrink-0"
                        onClick={() => navigate(editPath)}
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
            {validation.warnings.length > 0 && (
              <ul className="space-y-1 border-t pt-2">
                {validation.warnings.map((w, i) => (
                  <li key={i} className="text-xs flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-yellow-600 shrink-0" />
                    <span className="text-muted-foreground">{w}</span>
                  </li>
                ))}
              </ul>
            )}
            {validation.unmappedForms.length > 0 && (
              <div className="text-xs border-t pt-2 space-y-1.5">
                <p className="font-medium text-muted-foreground mb-1">Forms without official template:</p>
                {validation.unmappedForms.map(f => (
                  <div key={f} className="flex items-center gap-2 p-1.5 rounded-md bg-background/60 border border-yellow-200">
                    <AlertTriangle className="w-3 h-3 text-yellow-500 shrink-0" />
                    <span className="text-xs flex-1">{f}: template not available</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] gap-1 shrink-0"
                      onClick={() => navigate("/portal/forms")}
                    >
                      View Forms <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {/* Per-form fill stats */}
            {Object.keys(validation.formResults).length > 0 && (
              <div className="text-xs border-t pt-2 space-y-1">
                <p className="font-medium text-muted-foreground">Official template fill results:</p>
                {Object.entries(validation.formResults).map(([code, result]) => (
                  <div key={code} className="flex items-center gap-2">
                    {result.missingRequired.length === 0
                      ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                      : <AlertTriangle className="w-3 h-3 text-yellow-500" />
                    }
                    <span>{code}: {result.filledFields.length}/{result.mappedFields} fields filled</span>
                    {result.missingRequired.length > 0 && (
                      <span className="text-destructive">({result.missingRequired.length} missing)</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Blockers */}
      {structuredBlockers.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 space-y-3">
            <button
              className="flex items-center gap-2 w-full text-left"
              onClick={() => setShowBlockers(!showBlockers)}
            >
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-sm font-semibold text-destructive flex-1">
                {structuredBlockers.length} issue(s) to resolve
              </span>
              {showBlockers ? <ChevronUp className="w-4 h-4 text-destructive" /> : <ChevronDown className="w-4 h-4 text-destructive" />}
            </button>
            {showBlockers && (
              <ul className="space-y-2">
                {structuredBlockers.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background/60 border border-destructive/10">
                    <AlertCircle className={`w-3.5 h-3.5 shrink-0 ${b.severity === "error" ? "text-destructive" : "text-yellow-500"}`} />
                    <span className="text-xs flex-1 text-foreground">{b.label}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(b.path);
                      }}
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Packet Contents */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-display font-semibold">Packet Contents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { id: "cover", checked: includeCover, onChange: setIncludeCover, icon: BookOpen, label: "Cover Page", desc: "Professional cover with applicant info and case details" },
            { id: "toc", checked: includeTOC, onChange: setIncludeTOC, icon: FileText, label: "Table of Contents", desc: "Auto-generated with page numbers" },
            { id: "summary", checked: includeSummary, onChange: setIncludeSummary, icon: ClipboardCheck, label: "Case Summary", desc: "Quick overview for reviewer" },
          ].map(item => (
            <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border">
              <Checkbox id={item.id} checked={item.checked} onCheckedChange={v => item.onChange(!!v)} />
              <item.icon className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1">
                <label htmlFor={item.id} className="text-sm font-medium cursor-pointer">{item.label}</label>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}

          <Separator />

          {/* Forms list */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Forms ({completedForms.length} ready)
            </p>
            {forms.map(f => {
              const isReady = readyFormStatuses.has(f.status) || (f.progress ?? 0) >= 100;
              const hasTemplate = !!TEMPLATE_REGISTRY[f.form_type];
              return (
                <div key={f.id} className="flex items-center gap-2 py-1.5 px-2">
                  {isReady && hasTemplate ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  ) : isReady ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs flex-1">{f.form_name}</span>
                  {hasTemplate ? (
                    <Badge variant="outline" className="text-[9px] text-green-700 border-green-300">Official Template</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] text-yellow-700 border-yellow-300">No Template</Badge>
                  )}
                  {isReady && hasTemplate && (
                    <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1 text-primary" onClick={() => handleExportSingleForm(f.form_type)} disabled={generating}>
                      <FileDown className="w-3 h-3" /> PDF
                    </Button>
                  )}
                </div>
              );
            })}
            {forms.length === 0 && <p className="text-xs text-muted-foreground py-2">No forms started yet.</p>}
          </div>

          <Separator />

          {/* Evidence list */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Case Evidence ({approvedDocs.length})
            </p>
            {approvedDocs.map((d, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 px-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs flex-1 truncate">{d.name}</span>
                <Badge variant="outline" className="text-[9px]">{d.category}</Badge>
              </div>
            ))}
            {approvedDocs.length === 0 && <p className="text-xs text-muted-foreground py-2">No documents uploaded yet.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Review Notes */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox id="review-notes" checked={includeReviewNotes} onCheckedChange={v => setIncludeReviewNotes(!!v)} />
            <MessageSquare className="w-4 h-4 text-primary" />
            <label htmlFor="review-notes" className="text-sm font-medium cursor-pointer">Include Review Notes</label>
          </div>
          {includeReviewNotes && (
            <Textarea
              placeholder="Add notes for attorney/preparer review (optional, not included in filing)..."
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              className="text-sm min-h-[80px]"
            />
          )}
        </CardContent>
      </Card>

      {/* Review Status */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Review Status</p>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(STATUS_CONFIG) as [ReviewStatus, typeof STATUS_CONFIG[ReviewStatus]][]).map(([key, conf]) => (
              <Button
                key={key}
                variant={reviewStatus === key ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setReviewStatus(key)}
              >
                {conf.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Download Options */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Download Options</p>
          <Select value={downloadMode} onValueChange={(v: any) => setDownloadMode(v)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full Packet (Shell + Official Forms + Evidence)</SelectItem>
              <SelectItem value="forms_only">Official Forms Only (Template-filled PDFs)</SelectItem>
              <SelectItem value="docs_only">Supporting Documents Summary Only</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Export Button */}
      <Button
        onClick={handleExportClick}
        disabled={generating || !canExport}
        className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl shadow-md gap-2"
      >
        {generating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Download className="w-5 h-5" />
            {canExport ? "Export Official-Layout Packet" : "Resolve Issues First"}
          </>
        )}
      </Button>

      {/* Export History */}
      {exports.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-display font-semibold text-foreground">Export History</h3>
            </div>
            {exports.map((exp: any) => (
              <div key={exp.id} className="flex items-center gap-2 py-1.5">
                {exp.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                <span className="text-xs flex-1 truncate">{exp.file_name || "Export"}</span>
                <Badge variant="outline" className="text-[9px]">{exp.export_type}</Badge>
                <span className="text-[9px] text-muted-foreground">{new Date(exp.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-[10px] text-muted-foreground/60 text-center pb-4">
        Generated forms use official-layout USCIS templates and are prepared for review. All information must be verified before submission. D.O.M.E. does not provide legal advice.
      </p>

      {/* Pre-Export Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Pre-Export Checklist
            </DialogTitle>
            <DialogDescription>
              Please confirm the following before exporting your official-layout packet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {confirmCheckItems.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg border">
                <Checkbox
                  id={`confirm-${item.id}`}
                  checked={!!confirmChecks[item.id]}
                  onCheckedChange={v => setConfirmChecks(prev => ({ ...prev, [item.id]: !!v }))}
                  className="mt-0.5"
                />
                <label htmlFor={`confirm-${item.id}`} className="text-sm cursor-pointer leading-snug">
                  {item.label}
                </label>
              </div>
            ))}
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              <strong>Reminder:</strong> This packet is prepared for review. Generated from uploaded official USCIS template layouts. Check all information carefully before submission to any government agency.
            </p>
          </div>

          {/* Export summary */}
          <div className="text-xs space-y-1 border rounded-lg p-3 bg-muted/30">
            <p className="font-medium">Export will include:</p>
            {includeCover && <p>✓ Cover Page</p>}
            {includeTOC && <p>✓ Table of Contents</p>}
            {includeSummary && <p>✓ Case Summary</p>}
            {completedForms.filter(f => TEMPLATE_REGISTRY[f.formType]).map(f => (
              <p key={f.formType}>✓ {f.formType} — Official template-filled pages</p>
            ))}
            {completedForms.filter(f => !TEMPLATE_REGISTRY[f.formType]).length > 0 && (
              <p className="text-yellow-600">⚠ {completedForms.filter(f => !TEMPLATE_REGISTRY[f.formType]).length} form(s) without official template — excluded from packet</p>
            )}
            {approvedDocs.length > 0 && <p>✓ {approvedDocs.length} evidence document(s) listed</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmedExport}
              disabled={!allConfirmed || generating}
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Confirm & Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PacketBuilder;
