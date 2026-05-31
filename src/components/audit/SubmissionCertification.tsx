import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, CheckCircle2, AlertTriangle, FileText, UserCheck, ArrowLeft } from "lucide-react";

interface SubmissionCertificationProps {
  recordSummary: string;
  signatureStatus: "signed" | "unsigned" | "invalidated";
  identityVerified: boolean;
  exportReady: boolean;
  missingItems?: string[];
  onFinalize: () => Promise<void>;
  onBack: () => void;
  isSubmitting?: boolean;
}

export default function SubmissionCertification({
  recordSummary,
  signatureStatus,
  identityVerified,
  exportReady,
  missingItems = [],
  onFinalize,
  onBack,
  isSubmitting = false,
}: SubmissionCertificationProps) {
  const [confirmed, setConfirmed] = useState(false);

  const canFinalize = signatureStatus === "signed" && identityVerified && exportReady && confirmed && missingItems.length === 0;

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Submission Certification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Record Summary */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" /> Record Summary
          </p>
          <p className="text-sm text-muted-foreground mt-1">{recordSummary}</p>
        </div>

        {/* Status Checks */}
        <div className="space-y-2">
          <StatusRow
            label="Signature"
            passed={signatureStatus === "signed"}
            detail={signatureStatus === "signed" ? "Signed" : signatureStatus === "invalidated" ? "Invalidated – resign required" : "Not signed"}
          />
          <StatusRow label="Identity Verification" passed={identityVerified} detail={identityVerified ? "Verified" : "Not verified"} />
          <StatusRow label="Export Readiness" passed={exportReady} detail={exportReady ? "Ready" : "Not ready"} />
          {missingItems.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-2.5">
              <p className="text-xs font-medium text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Missing Items
              </p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                {missingItems.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <p className="text-xs text-yellow-800 dark:text-yellow-300">
            <strong>Important:</strong> Once finalized, this record will be locked. Any changes made after finalization will be permanently logged in the audit trail and may require re-signing.
          </p>
        </div>

        {/* Confirmation */}
        <div className="flex items-start gap-2">
          <Checkbox
            id="certify"
            checked={confirmed}
            onCheckedChange={(v) => setConfirmed(!!v)}
          />
          <label htmlFor="certify" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            I certify that all information in this record is accurate and complete to the best of my knowledge. I understand that finalizing will lock this record and any subsequent changes will be tracked.
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Review
          </Button>
          <Button
            onClick={onFinalize}
            disabled={!canFinalize || isSubmitting}
            className="gap-2 flex-1"
          >
            <Lock className="w-4 h-4" />
            {isSubmitting ? "Finalizing..." : "Finalize & Lock"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, passed, detail }: { label: string; passed: boolean; detail: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/30">
      <span className="text-sm flex items-center gap-2">
        {passed ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-yellow-600" />}
        {label}
      </span>
      <Badge className={passed ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"} variant="outline">
        {detail}
      </Badge>
    </div>
  );
}
