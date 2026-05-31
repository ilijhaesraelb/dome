/**
 * ReviewScreen — Summary of all answers before payment/export.
 * Shows inline-editable sections with clear visual status.
 * Includes a toggle to enable/disable digital signature (for users who prefer to print unsigned and sign in ink).
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle2, AlertCircle, Edit, Shield, FileDown,
  Loader2, TriangleAlert, PenTool, Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormSection } from "@/data/formSections";
import SignatureSection from "@/components/form-engine/SignatureSection";
import UFECoordinateMapPanel from "@/components/form-engine/UFECoordinateMapPanel";
import ExportVerificationPanel from "@/components/form-engine/ExportVerificationPanel";
import type { UFEForm } from "@/lib/ufe/schema";

interface ReviewGroup {
  title: string;
  sectionIndex: number;
  complete: number;
  missing: number;
  fields: { label: string; value: string; required?: boolean; missing: boolean }[];
}

interface ReviewScreenProps {
  formType: string;
  reviewGroups: ReviewGroup[];
  overallProgress: number;
  totalFilled: number;
  totalRequired: number;
  totalMissing: number;
  formStatus: string;
  statusColor: string;
  onEditSection: (sectionIndex: number) => void;
  onJumpToMissing: () => void;
  onExport: () => void;
  onPreview: () => void;
  exporting: boolean;
  hasTemplate: boolean;
  formInstanceId?: string;
  caseId?: string;
  /** Optional UFE form definition — when provided, renders the coordinate-overlay map panel. */
  ufeForm?: UFEForm;
  /** Flat answer values keyed by question key — required when `ufeForm` is provided. */
  ufeValues?: Record<string, unknown>;
}

const ReviewScreen = ({
  formType,
  reviewGroups,
  overallProgress,
  totalFilled,
  totalRequired,
  totalMissing,
  formStatus,
  statusColor,
  onEditSection,
  onJumpToMissing,
  onExport,
  onPreview,
  exporting,
  hasTemplate,
  formInstanceId,
  caseId,
  ufeForm,
  ufeValues,
}: ReviewScreenProps) => {
  const [signatureEnabled, setSignatureEnabled] = useState(true);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-display font-bold flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-primary" />
          Review Your {formType}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review all information below. Click "Edit" on any section to make changes.
        </p>
      </div>

      {/* Status Card */}
      <Card className="border-2">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold">Overall Completion</p>
              <p className="text-sm text-muted-foreground">{totalFilled} of {totalRequired} required fields</p>
            </div>
            <Badge className={cn("text-xs px-3 py-1", statusColor)}>{formStatus}</Badge>
          </div>
          <Progress value={overallProgress} className="h-3" />
          {totalMissing > 0 && (
            <div className="mt-3 flex items-center gap-2 p-2 bg-destructive/5 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive flex-1">
                {totalMissing} required field{totalMissing > 1 ? "s" : ""} still need your attention
              </p>
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={onJumpToMissing}>
                Fix Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section summaries */}
      {reviewGroups.map((group, gi) => (
        <Card key={gi} className={cn(
          "transition-all duration-200",
          group.complete === 100 && "border-success/30",
          group.missing > 0 && "border-destructive/20"
        )}>
          <CardHeader className="py-3 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {group.complete === 100 ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-destructive/60" />
                )}
                {group.title}
              </CardTitle>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => onEditSection(group.sectionIndex)}>
                <Edit className="w-3 h-3" /> Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {group.fields.map((f, fi) => (
                <div key={fi} className="flex items-baseline gap-2 text-sm py-1 border-b border-border/50 last:border-0">
                  <span className={cn("text-muted-foreground shrink-0 text-xs", f.missing && "text-destructive font-medium")}>
                    {f.label}
                  </span>
                  <span className="flex-1" />
                  {f.value ? (
                    <span className="font-medium text-foreground text-xs text-right max-w-[200px] truncate">{f.value}</span>
                  ) : f.required ? (
                    <span className="text-destructive text-xs italic">Required</span>
                  ) : (
                    <span className="text-muted-foreground/40 text-xs">—</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Signature Toggle */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {signatureEnabled ? (
                <PenTool className="w-5 h-5 text-primary" />
              ) : (
                <Printer className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {signatureEnabled ? "Digital Signature Enabled" : "Print & Sign in Ink"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {signatureEnabled
                    ? "Sign electronically below. ESIGN/UETA compliant."
                    : "Documents will be exported unsigned for wet-ink signature."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{signatureEnabled ? "On" : "Off"}</span>
              <Switch
                checked={signatureEnabled}
                onCheckedChange={setSignatureEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Section (conditionally rendered) */}
      {signatureEnabled ? (
        <SignatureSection
          formInstanceId={formInstanceId}
          caseId={caseId}
          signerRole="client"
          requireIdVerification={true}
        />
      ) : (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4 flex items-start gap-3">
            <TriangleAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Signature Disabled — Print Mode</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your exported documents will not include a digital signature. You will need to print
                the documents and sign each form in ink before filing with USCIS or the relevant agency.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* UFE Coordinate-Overlay Map (rendered when a UFE definition is supplied — currently I-485). */}
      {ufeForm && ufeValues && (
        <UFECoordinateMapPanel form={ufeForm} values={ufeValues} />
      )}

      {/* Export Verification Checklist — runs sample data through I-765, N-400, I-751, I-693. */}
      <ExportVerificationPanel />

      {/* Disclaimer */}
      <div className="bg-muted/50 border rounded-lg p-3 flex items-start gap-2">
        <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground">
          D.O.M.E. provides educational guidance and form-preparation support — not legal advice.
          Review all information before filing.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 pb-8">
        {hasTemplate && (
          <Button variant="outline" onClick={onPreview} className="gap-2 h-12 flex-1">
            Preview Official Form
          </Button>
        )}
        <Button
          onClick={onExport}
          disabled={exporting}
          className="gap-2 h-12 flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold"
        >
          {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
          {totalMissing > 0 ? "Export (with warnings)" : "Export PDF — $3.00"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewScreen;
