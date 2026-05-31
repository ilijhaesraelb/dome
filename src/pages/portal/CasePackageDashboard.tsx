import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2, Circle, FileText, Upload, ChevronRight, ArrowLeft,
  Shield, AlertTriangle, Sparkles, Download, Eye, Users, Clock,
  FolderOpen, ArrowRight, Info, ExternalLink, Loader2, Heart,
} from "lucide-react";
import { useMyCase } from "@/hooks/useMyCase";
import { useCaseFormInstances, useCaseDocuments } from "@/hooks/useCases";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { CASE_PACKAGES, getPackageForCaseType, type CasePackage, type PackageFormDef } from "@/data/casePackages";
import BackButton from "@/components/BackButton";
import type { Tables } from "@/integrations/supabase/types";
import { isActiveFormStatus } from "@/lib/form-flow";

type FormInstance = Tables<"form_instances">;

/* ── Status helpers ── */
const formStatusLabel = (status: string) => {
  switch (status) {
    case "not_started": return "Not Started";
    case "in_progress": return "In Progress";
    case "completed": return "Completed";
    case "needs_review": return "Needs Review";
    default: return status;
  }
};

const formStatusColor = (status: string) => {
  switch (status) {
    case "not_started": return "bg-muted text-muted-foreground";
    case "in_progress": return "bg-yellow-100 text-yellow-800";
    case "completed": return "bg-green-100 text-green-800";
    case "needs_review": return "bg-blue-100 text-blue-800";
    default: return "bg-muted text-muted-foreground";
  }
};

const CasePackageDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: myCase, isLoading: caseLoading } = useMyCase();
  const { data: formInstances = [] } = useCaseFormInstances(myCase?.id);
  const { data: documents = [] } = useCaseDocuments(myCase?.id);
  const [creatingForms, setCreatingForms] = useState(false);

  // Get the package definition — always returns a value (no early return before hooks)
  const pkg = useMemo<CasePackage>(() => {
    if (!myCase) return CASE_PACKAGES.marriage_aos_inside;
    return getPackageForCaseType(myCase.case_type) ?? CASE_PACKAGES.marriage_aos_inside;
  }, [myCase]);

  // Map form instances to package forms
  const formMap = useMemo(() => {
    const map = new Map<string, FormInstance>();
    formInstances.forEach((fi) => map.set(fi.form_type, fi));
    return map;
  }, [formInstances]);

  const formsProgress = useMemo(() => {
    const total = pkg.forms.filter((f) => f.required).length;
    const completed = pkg.forms.filter(
      (f) => f.required && formMap.get(f.code)?.status === "completed"
    ).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [pkg.forms, formMap]);

  const docsProgress = useMemo(() => {
    const requiredDocs = pkg.documents.filter((d) => d.required);
    const uploaded = requiredDocs.filter((d) =>
      documents.some(
        (doc) => doc.category?.toLowerCase() === d.category.toLowerCase()
      )
    );
    return requiredDocs.length > 0
      ? Math.round((uploaded.length / requiredDocs.length) * 100)
      : 0;
  }, [pkg.documents, documents]);

  const overallProgress = Math.round((formsProgress + docsProgress) / 2);

  // Find the next form to work on
  const nextForm = useMemo(() => {
    const activeForm = pkg.forms.find((f) => {
      const inst = formMap.get(f.code);
      return inst && isActiveFormStatus(inst.status);
    });

    if (activeForm) return activeForm;

    for (const f of pkg.forms) {
      const inst = formMap.get(f.code);
      if (!inst || inst.status === "not_started" || inst.status === "in_progress") {
        return f;
      }
    }
    return null;
  }, [pkg.forms, formMap]);

  // Create all package form instances if they don't exist
  const handleInitializeForms = async () => {
    if (!user || !myCase) return;
    setCreatingForms(true);
    try {
      const existingTypes = formInstances.map((fi) => fi.form_type);
      const newForms = pkg.forms.filter((f) => !existingTypes.includes(f.code));

      if (newForms.length > 0) {
        const rows = newForms.map((f) => ({
          case_id: myCase.id,
          form_type: f.code,
          form_name: f.name,
          status: "not_started" as const,
          progress: 0,
        }));
        const { error } = await supabase.from("form_instances").insert(rows);
        if (error) throw error;
      }

      toast({
        title: `${newForms.length} form(s) initialized`,
        description: "All required forms have been added to your case.",
      });
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreatingForms(false);
    }
  };

  const openForm = (formCode: string) => {
    const inst = formMap.get(formCode);
    if (inst) {
      navigate(`/portal/forms/${inst.id}`);
    } else {
      toast({
        title: "Form not initialized",
        description: "Please initialize all forms first.",
        variant: "destructive",
      });
    }
  };

  if (caseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const missingForms = pkg.forms.filter((f) => !formMap.has(f.code));

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <BackButton />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Heart className="w-5 h-5 text-secondary" />
            <h1 className="text-xl font-display font-bold text-foreground">
              {pkg.shortLabel}
            </h1>
            <Badge className="bg-secondary/10 text-secondary border-0 text-[10px]">
              Case Package
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>
        </div>
      </div>

      {/* Overall Progress */}
      <Card className="border-secondary/20">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Overall Readiness</span>
            <span className="text-2xl font-bold text-secondary">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Forms: {formsProgress}%</span>
            </div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Documents: {docsProgress}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Initialize forms if missing */}
      {missingForms.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  {missingForms.length} form(s) not yet initialized
                </p>
                <p className="text-xs text-yellow-700">
                  Click below to add all required forms to your case.
                </p>
              </div>
            </div>
            <Button
              onClick={handleInitializeForms}
              disabled={creatingForms}
              className="w-full gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              {creatingForms ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Initialize All Forms
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Next Action */}
      {nextForm && formMap.has(nextForm.code) && (
        <Card
          className="border-secondary/30 bg-gradient-to-r from-secondary/5 to-transparent cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => openForm(nextForm.code)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
              <ArrowRight className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">
                Continue: {nextForm.code} — {nextForm.name}
              </p>
              <p className="text-xs text-muted-foreground">{nextForm.reason}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Forms Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-display font-bold flex items-center gap-2">
            <FileText className="w-4 h-4 text-secondary" /> Required Forms
          </h2>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/portal/forms")}>
            All Forms <ExternalLink className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-2">
          {pkg.forms.map((form, idx) => {
            const inst = formMap.get(form.code);
            const status = inst?.status || "not_started";
            const progress = inst?.progress || 0;
            const isComplete = status === "completed";
            const isActive = nextForm?.code === form.code;

            return (
              <Card
                key={form.code}
                className={cn(
                  "transition-all cursor-pointer hover:shadow-sm",
                  isActive && "border-secondary/40 shadow-sm",
                  isComplete && "border-green-200 bg-green-50/30"
                )}
                onClick={() => inst && openForm(form.code)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  {/* Order number */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                      isComplete
                        ? "bg-green-100 text-green-700"
                        : isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Form info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold">{form.code}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {form.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        className={cn(
                          "text-[9px] border-0",
                          formStatusColor(status)
                        )}
                      >
                        {formStatusLabel(status)}
                      </Badge>
                      {form.required ? (
                        <Badge className="bg-secondary/10 text-secondary border-0 text-[9px]">
                          Required
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px]">
                          Optional
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        Filled by: {form.filledBy}
                      </span>
                    </div>
                    {progress > 0 && progress < 100 && (
                      <Progress value={progress} className="h-1 mt-1.5" />
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Documents Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-display font-bold flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-secondary" /> Required Documents
          </h2>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/portal/documents")}>
            Document Vault <ExternalLink className="w-3 h-3" />
          </Button>
        </div>

        {/* Group by belongsTo */}
        {(["petitioner", "beneficiary", "joint", "both"] as const).map((group) => {
          const groupDocs = pkg.documents.filter((d) => d.belongsTo === group);
          if (groupDocs.length === 0) return null;
          const groupLabel =
            group === "petitioner"
              ? "Petitioner (U.S. Citizen/LPR Spouse)"
              : group === "beneficiary"
              ? "Beneficiary (Foreign-National Spouse)"
              : group === "joint"
              ? "Joint / Relationship Evidence"
              : "Both Spouses";

          return (
            <div key={group} className="space-y-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3 h-3" /> {groupLabel}
              </h3>
              {groupDocs.map((doc) => {
                const hasDoc = documents.some(
                  (d) => d.category?.toLowerCase() === doc.category.toLowerCase()
                );
                return (
                  <div
                    key={doc.label}
                    className="flex items-start gap-2 py-2 px-3 rounded-lg bg-muted/30"
                  >
                    {hasDoc ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">
                        {doc.label}
                        {doc.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {doc.description}
                      </p>
                    </div>
                    {!hasDoc && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-7 gap-1 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/portal/documents");
                        }}
                      >
                        <Upload className="w-3 h-3" /> Upload
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          className="gap-2 text-xs h-10"
          onClick={() => navigate("/portal/passport")}
        >
          <Shield className="w-3.5 h-3.5" /> Immigration Passport
        </Button>
        <Button
          variant="outline"
          className="gap-2 text-xs h-10"
          onClick={() => navigate("/portal/documents")}
        >
          <Upload className="w-3.5 h-3.5" /> Upload Documents
        </Button>
        <Button
          variant="outline"
          className="gap-2 text-xs h-10"
          onClick={() => navigate("/portal/attorney")}
        >
          <Users className="w-3.5 h-3.5" /> Get Professional Help
        </Button>
        <Button
          className="gap-2 text-xs h-10 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
          onClick={() => navigate("/portal/packet")}
          disabled={overallProgress < 50}
        >
          <Download className="w-3.5 h-3.5" /> Export Packet
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-muted/40 border border-border/50 p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {pkg.disclaimer}
        </p>
      </div>
    </div>
  );
};

export default CasePackageDashboard;
