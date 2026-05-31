import { Shield, Lock, Eye, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  variant?: 'upload' | 'payment' | 'signature' | 'general';
  className?: string;
  compact?: boolean;
}

const BADGE_CONFIG = {
  upload: {
    icon: CloudUpload,
    label: "Secure Upload",
    description: "Files are encrypted and stored privately",
  },
  payment: {
    icon: Lock,
    label: "Secure Payment",
    description: "Payments processed via Stripe",
  },
  signature: {
    icon: Shield,
    label: "Verified Signature",
    description: "ESIGN/UETA compliant with audit trail",
  },
  general: {
    icon: Eye,
    label: "Private & Encrypted",
    description: "Your data is protected with bank-grade security",
  },
};

const TrustBadges = ({ variant = 'general', className, compact = false }: TrustBadgeProps) => {
  const config = BADGE_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-muted/50 text-muted-foreground",
        compact ? "px-2.5 py-1.5 text-[10px]" : "px-3 py-2 text-xs",
        className
      )}
      role="status"
      aria-label={config.label}
    >
      <Icon className={cn("shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span className="font-medium">{config.label}</span>
      {!compact && <span className="hidden sm:inline">— {config.description}</span>}
    </div>
  );
};

export const TrustBadgeRow = ({ className }: { className?: string }) => (
  <div className={cn("flex flex-wrap gap-2", className)}>
    <TrustBadges variant="general" compact />
    <TrustBadges variant="upload" compact />
  </div>
);

export default TrustBadges;
