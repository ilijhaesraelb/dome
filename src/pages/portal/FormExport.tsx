import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileDown, FileText, Eye, ArrowLeft, AlertTriangle, CheckCircle2,
  Loader2, Send, Edit, Shield, XCircle, ZoomIn, ZoomOut, ChevronLeft,
  ChevronRight, Printer, AlertCircle, Sparkles, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyCase } from "@/hooks/useMyCase";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";
import { logPlatformError } from "@/lib/error-logger";
import { useAuditLog } from "@/hooks/useAuditLog";
import { getPackageForCaseType, getNextRecommendedForm, type PackageFormDef } from "@/data/casePackages";
import {
  TEMPLATE_REGISTRY,
  FORM_FIELD_MAPPINGS,
  fillPdfTemplate,
  generatePreviewPdf,
  buildCaseDataObject,
  type FillResult,
} from "@/lib/pdf-template-engine";

type ExportStatus = "draft" | "needs_client_fix" | "needs_review" | "ready_for_export" | "exported";

const STATUS_CONFIG: Record<ExportStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: Edit },
  needs_client_fix: { label: "Needs Client Fix", color: "bg-destructive/10 text-destructive", icon: AlertTriangle },
  needs_review: { label: "Needs Professional Review", color: "bg-yellow-100 text-yellow-800", icon: Eye },
  ready_for_export: { label: "Ready for Export", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  exported: { label: "Exported", color: "bg-primary/10 text-primary", icon: FileDown },
};

const FormExport = () => {
  const { formCode } = useParams<{ formCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: myCase } = useMyCase();
  const { logEvent } = useAuditLog();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fillResult, setFillResult] = useState<FillResult | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_prevUrl, _setPrevUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [status, setStatus] = useState<ExportStatus>("draft");
  const [exportedSuccessfully, setExportedSuccessfully] = useState(false);
  const [launchingNext, setLaunchingNext] = useState(false);

  const template = formCode ? TEMPLATE_REGISTRY[formCode] : null;
  const mappings = formCode ? (FORM_FIELD_MAPPINGS[formCode] || []) : [];

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  // Fetch persons for this case
  const { data: persons } = useQuery({
    queryKey: ["case-persons", myCase?.id],
    queryFn: async () => {
      const { data } = await supabase.from("persons").select("*").eq("case_id", myCase!.id);
      return data;
    },
    enabled: !!myCase?.id,
  });

  // Fetch addresses
  const { data: addresses } = useQuery({
    queryKey: ["case-addresses", persons],
    queryFn: async () => {
      const personIds = (persons || []).map((p: any) => p.id);
      if (personIds.length === 0) return [];
      const { data } = await supabase.from("addresses").select("*").in("person_id", personIds);
      return data;
    },
    enabled: !!persons && persons.length > 0,
  });

  // Fetch field values from form instances
  const { data: fieldValues } = useQuery({
    queryKey: ["case-field-values", myCase?.id, formCode],
    queryFn: async () => {
      const { data: instances } = await supabase
        .from("form_instances")
        .select("id")
        .eq("case_id", myCase!.id)
        .eq("form_type", formCode!);
      if (!instances?.length) return [];
      const { data } = await supabase
        .from("field_values")
        .select("*")
        .in("form_instance_id", instances.map((i: any) => i.id));
      return data;
    },
    enabled: !!myCase?.id && !!formCode,
  });

  // Build case data and generate preview
  const caseData = useMemo(() => {
    return buildCaseDataObject(
      profile as Record<string, unknown> | null,
      (persons || []) as Record<string, unknown>[],
      (addresses || []) as Record<string, unknown>[],
      (fieldValues || []) as Record<string, unknown>[],
    );
  }, [profile, persons, addresses, fieldValues]);

  const generatePreview = useCallback(async () => {
    if (!formCode || !template) return;
    setLoading(true);
    try {
      const previewBytes = await generatePreviewPdf(formCode, caseData);
      const blob = new Blob([previewBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);

      // Also compute fill result for stats
      const result = await fillPdfTemplate(formCode, caseData);
      setFillResult(result);

      if (result.missingRequired.length === 0) {
        setStatus("ready_for_export");
      } else {
        setStatus("draft");
      }
    } catch (err) {
      console.error("Preview generation failed:", err);
      toast({
        title: "Preview Error",
        description: "Could not generate form preview. The template may not have fillable fields.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [formCode, template, caseData, toast]);

  useEffect(() => {
    if (profile !== undefined) {
      generatePreview();
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [profile, generatePreview]);

  const handleExport = async () => {
    if (!formCode || !fillResult) return;
    setExporting(true);
    try {
      const result = await fillPdfTemplate(formCode, caseData);
      const blob = new Blob([result.pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formCode}_${myCase?.case_number || "draft"}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log export
      if (myCase?.id && user?.id) {
        await supabase.from("case_exports").insert({
          case_id: myCase.id,
          user_id: user.id,
          export_type: "template_form",
          status: "completed",
          file_name: a.download,
          forms_included: [formCode],
          metadata: {
            filled_fields: result.filledFields.length,
            missing_required: result.missingRequired,
            total_fields: result.totalFields,
          },
        });
      }

      // Audit trail
      await logEvent({
        module: "exports",
        action_type: "form_export_completed",
        human_label: `Export completed for ${formCode}`,
        target_type: "form",
        target_id: formCode,
        after_state: {
          filled_fields: result.filledFields.length,
          missing_required: result.missingRequired.length,
          total_fields: result.totalFields,
        },
      });

      setStatus("exported");
      setExportedSuccessfully(true);
      toast({ title: "Export Complete", description: "Form PDF has been downloaded. Review before filing." });
    } catch (err: any) {
      toast({ title: "Export Failed", description: "Could not export form. Please try again.", variant: "destructive" });
      await logEvent({
        module: "exports",
        action_type: "form_export_failed",
        human_label: `Export failed for ${formCode}`,
        target_type: "form",
        target_id: formCode,
        success: false,
        error_details: err?.message || "Unknown error",
      });
      await logPlatformError({
        type: "export_failure",
        severity: "critical",
        message: err?.message || "Form export failed",
        caseId: myCase?.id,
        details: { formCode },
      });
    } finally {
      setExporting(false);
    }
  };

  const handleSendForReview = () => {
    setStatus("needs_review");
    toast({
      title: "Sent for Review",
      description: "The form has been marked for attorney/preparer review.",
    });
  };

  if (!formCode || !template) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Template Not Available</h2>
        <p className="text-muted-foreground mb-4">
          No USCIS template is available for this form code. Contact support to request it.
        </p>
        <Button onClick={() => navigate("/portal/forms")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Forms
        </Button>
      </div>
    );
  }

  const statusConf = STATUS_CONFIG[status];
  const StatusIcon = statusConf.icon;
  const requiredMappings = mappings.filter(m => m.required);
  const filledRequired = fillResult ? requiredMappings.length - fillResult.missingRequired.length : 0;
  const completionPct = requiredMappings.length > 0
    ? Math.round((filledRequired / requiredMappings.length) * 100) : 100;

  // Determine the next recommended form for this case package.
  const pkg = myCase ? getPackageForCaseType(myCase.case_type) : null;
  const nextForm: PackageFormDef | null = pkg && formCode ? getNextRecommendedForm(pkg, formCode) : null;

  const handleStartNextForm = async () => {
    if (!nextForm || !myCase || !user) return;
    setLaunchingNext(true);
    try {
      // Reuse existing instance under the same case if present
      const { data: existing } = await supabase
        .from("form_instances")
        .select("id")
        .eq("case_id", myCase.id)
        .eq("form_type", nextForm.code)
        .maybeSingle();

      let instanceId = existing?.id;
      if (!instanceId) {
        const { data: created, error } = await supabase
          .from("form_instances")
          .insert({
            case_id: myCase.id,
            form_type: nextForm.code,
            form_name: nextForm.name,
            status: "in_progress",
            progress: 0,
          })
          .select("id")
          .single();
        if (error) throw error;
        instanceId = created.id;
      }

      await logEvent({
        module: "cases",
        action_type: "case_updated",
        human_label: `Launched ${nextForm.code} after completing ${formCode}`,
        target_type: "form",
        target_id: nextForm.code,
        case_id: myCase.id,
        metadata: { previous_form: formCode, next_form: nextForm.code },
      });

      navigate(`/portal/forms/${instanceId}`);
    } catch (err: any) {
      toast({
        title: "Could not start next form",
        description: err?.message || "Please try again from the Case Package dashboard.",
        variant: "destructive",
      });
    } finally {
      setLaunchingNext(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <BackButton />
          <h1 className="text-2xl font-display font-bold mt-2 flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            {formCode} — {template.formTitle}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edition {template.editionDate} · {template.totalPages} pages · Generated from uploaded USCIS template
          </p>
        </div>
        <Badge className={statusConf.color}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {statusConf.label}
        </Badge>
      </div>

      {/* Compliance Disclaimer */}
      <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-800">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">Important Notice</p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              This form was generated from an uploaded official USCIS template layout. All information must be reviewed for accuracy, signatures, and filing requirements before submission. D.O.M.E. does not provide legal advice and does not guarantee acceptance by any government agency.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Stats & Validation */}
        <div className="space-y-4">
          {/* Completion */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Field Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>{filledRequired} / {requiredMappings.length} required fields</span>
                <span className="font-medium">{completionPct}%</span>
              </div>
              <Progress value={completionPct} className="h-2" />
              {fillResult && (
                <div className="text-xs text-muted-foreground space-y-1 mt-2">
                  <p>Total PDF fields: {fillResult.totalFields}</p>
                  <p>Mapped fields: {fillResult.mappedFields}</p>
                  <p>Successfully filled: {fillResult.filledFields.length}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Missing Fields */}
          {fillResult && fillResult.missingRequired.length > 0 && (
            <Card className="border-destructive/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Missing Required Fields ({fillResult.missingRequired.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {fillResult.missingRequired.map(field => {
                    const fieldLower = field.toLowerCase();
                    const editPath = fieldLower.includes("address")
                      ? "/portal/passport"
                      : fieldLower.includes("birth") || fieldLower.includes("citizenship") || fieldLower.includes("ssn") || fieldLower.includes("country")
                      ? "/portal/passport"
                      : fieldLower.includes("name")
                      ? "/portal/profile"
                      : `/portal/forms`;
                    return (
                      <li key={field} className="flex items-center gap-2 p-1.5 rounded-md bg-background/60 border">
                        <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                        <span className="text-xs flex-1 text-muted-foreground">{field.replace(/\./g, " › ")}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] gap-1 shrink-0"
                          onClick={() => navigate(editPath)}
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Signature Warning */}
          <Card className="border-yellow-200">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Signature Areas</p>
                <p className="mt-1">
                  Signature lines require review or signing depending on the filing method. D.O.M.E. does not auto-generate signatures.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              className="w-full gap-2"
              onClick={handleExport}
              disabled={exporting || loading}
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              Export PDF
            </Button>

            {/* Next-form CTA appears after a successful export */}
            {exportedSuccessfully && nextForm && (
              <Card className="border-secondary/40 bg-gradient-to-br from-secondary/10 to-transparent">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold text-foreground">Next: {nextForm.code} — {nextForm.name}</p>
                      <p className="text-muted-foreground mt-0.5">{nextForm.reason}</p>
                    </div>
                  </div>
                  <Button
                    className="w-full gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground h-9 text-xs"
                    onClick={handleStartNextForm}
                    disabled={launchingNext}
                  >
                    {launchingNext
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <>Start {nextForm.code} <ArrowRight className="w-3.5 h-3.5" /></>}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-[11px] h-7"
                    onClick={() => navigate("/portal/case-package")}
                  >
                    View Full Case Package
                  </Button>
                </CardContent>
              </Card>
            )}

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleSendForReview}
              disabled={loading}
            >
              <Send className="w-4 h-4" /> Send to Attorney / Preparer Review
            </Button>
            <Button
              variant="ghost"
              className="w-full gap-2"
              onClick={() => navigate(`/portal/forms`)}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Edit
            </Button>
          </div>
        </div>

        {/* Right Panel - PDF Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Form Preview
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom(Math.max(50, zoom - 25))}>
                    <ZoomOut className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                    <ZoomIn className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => previewUrl && window.open(previewUrl, "_blank")}>
                    <Printer className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[600px]">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">Generating preview from USCIS template...</p>
                  </div>
                </div>
              ) : previewUrl ? (
                <div className="border rounded-lg overflow-hidden bg-muted/30" style={{ height: "700px" }}>
                  <iframe
                    src={`${previewUrl}#page=${currentPage}&zoom=${zoom}`}
                    className="w-full h-full border-0"
                    title={`${formCode} Preview`}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[600px] text-center">
                  <div>
                    <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Preview unavailable. The template may not have fillable form fields.
                    </p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={generatePreview}>
                      Retry Preview
                    </Button>
                  </div>
                </div>
              )}

              {/* Page navigation */}
              {previewUrl && (
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {template.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setCurrentPage(Math.min(template.totalPages, currentPage + 1))}
                    disabled={currentPage >= template.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom disclaimer */}
      <p className="text-xs text-center text-muted-foreground max-w-2xl mx-auto">
        Generated from uploaded USCIS template. Check all information carefully before submission.
        D.O.M.E. provides document organization services and does not provide legal advice.
      </p>
    </div>
  );
};

export default FormExport;
