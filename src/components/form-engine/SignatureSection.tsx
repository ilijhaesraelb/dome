/**
 * SignatureSection — Integrates signature pad + identity verification into forms.
 * Blocks export if signature is required but missing.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PenTool, Shield, FileCheck, AlertCircle } from "lucide-react";
import SignaturePad from "@/components/SignaturePad";
import IdentityVerification from "@/components/IdentityVerification";
import { cn } from "@/lib/utils";

interface SignatureSectionProps {
  formInstanceId?: string;
  caseId?: string;
  signerRole?: string;
  requireIdVerification?: boolean;
  onSigned?: (signatureId: string) => void;
  className?: string;
}

const SignatureSection = ({
  formInstanceId,
  caseId,
  signerRole = "client",
  requireIdVerification = true,
  onSigned,
  className,
}: SignatureSectionProps) => {
  const [idVerified, setIdVerified] = useState(false);
  const [idDocumentId, setIdDocumentId] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  const handleIdVerified = (docId: string) => {
    setIdVerified(true);
    setIdDocumentId(docId);
  };

  const handleSigned = (signatureId: string) => {
    setSigned(true);
    onSigned?.(signatureId);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Step 1: Identity Verification */}
      {requireIdVerification && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
              idVerified ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"
            )}>
              1
            </div>
            <span className="text-sm font-semibold">Verify Your Identity</span>
            {idVerified && <Badge className="bg-success/10 text-success text-[10px]"><FileCheck className="w-3 h-3 mr-1" /> Verified</Badge>}
          </div>
          <IdentityVerification
            onVerified={handleIdVerified}
            compact={idVerified}
          />
        </div>
      )}

      {/* Step 2: Sign Document */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
            signed ? "bg-success text-success-foreground" : requireIdVerification && !idVerified ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
          )}>
            {requireIdVerification ? 2 : 1}
          </div>
          <span className="text-sm font-semibold">Sign Your Document</span>
          {signed && <Badge className="bg-success/10 text-success text-[10px]"><PenTool className="w-3 h-3 mr-1" /> Signed</Badge>}
        </div>
        {requireIdVerification && !idVerified ? (
          <Card className="border-muted">
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
              Please verify your identity first before signing.
            </CardContent>
          </Card>
        ) : (
          <SignaturePad
            formInstanceId={formInstanceId}
            caseId={caseId}
            signerRole={signerRole}
            onSignatureComplete={handleSigned}
          />
        )}
      </div>
    </div>
  );
};

export default SignatureSection;