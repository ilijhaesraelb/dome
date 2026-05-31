import { WifiOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { cn } from "@/lib/utils";

const NetworkStatusBar = () => {
  const { isOnline, connectionQuality } = useNetworkStatus();

  if (isOnline && connectionQuality === 'good') return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-all",
        !isOnline
          ? "bg-destructive text-destructive-foreground"
          : "bg-warning text-warning-foreground"
      )}
      role="alert"
      aria-live="assertive"
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>You're offline — your work is saved locally and will sync when reconnected</span>
        </>
      ) : (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span>Slow connection detected — saves may take longer</span>
        </>
      )}
    </div>
  );
};

export default NetworkStatusBar;
