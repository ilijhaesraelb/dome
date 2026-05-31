/**
 * IRS Integration Status Badge — for use in tax workflows and CCGVS portal.
 * Shows the current filing mode based on IRS integration readiness.
 */
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useIrsIntegration } from "@/hooks/useIrsIntegration";
import { TAX_FILING_MODE_LABELS } from "@/lib/irs-integration";

interface IrsStatusBadgeProps {
  showMessage?: boolean;
  compact?: boolean;
}

const IrsStatusBadge = ({ showMessage = false, compact = false }: IrsStatusBadgeProps) => {
  const { filingMode } = useIrsIntegration();
  const mode = TAX_FILING_MODE_LABELS[filingMode];

  if (compact) {
    return <Badge className={mode.color}>{mode.badge}</Badge>;
  }

  return (
    <div className="space-y-2">
      <Badge className={mode.color}>{mode.badge}</Badge>
      {showMessage && filingMode !== "filing_active" && (
        <Alert className="border-muted">
          <Info className="w-4 h-4" />
          <AlertDescription className="text-sm">{mode.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default IrsStatusBadge;
