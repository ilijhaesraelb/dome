import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  connectionQuality: 'good' | 'slow' | 'offline';
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'slow' | 'offline'>(
    navigator.onLine ? 'good' : 'offline'
  );
  const { toast } = useToast();

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setConnectionQuality('good');
    if (wasOffline) {
      toast({
        title: "Back online",
        description: "Your connection has been restored. Any pending changes will sync.",
      });
    }
  }, [wasOffline, toast]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    setConnectionQuality('offline');
    toast({
      title: "You're offline",
      description: "Your work is saved locally. Changes will sync when you reconnect.",
      variant: "destructive",
    });
  }, [toast]);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check connection quality via Navigator API
    const conn = (navigator as any).connection;
    if (conn) {
      const checkQuality = () => {
        if (!navigator.onLine) {
          setConnectionQuality('offline');
        } else if (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
          setConnectionQuality('slow');
        } else {
          setConnectionQuality('good');
        }
      };
      conn.addEventListener('change', checkQuality);
      checkQuality();
      return () => {
        conn.removeEventListener('change', checkQuality);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline, connectionQuality };
}

/**
 * Hook to warn user before leaving with unsaved changes.
 */
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean) {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);
}
