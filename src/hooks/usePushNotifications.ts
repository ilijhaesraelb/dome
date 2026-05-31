import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { logPlatformError } from "@/lib/error-logger";

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    });
  }, [user]);

  const subscribe = useCallback(async () => {
    if (!user || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast({ title: "Push notifications not supported", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast({ title: "Notification permission denied", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Get VAPID public key from edge function
      const { data: keyData, error: keyError } = await supabase.functions.invoke(
        "push-notifications",
        { body: { action: "get-public-key" } }
      );
      if (keyError || !keyData?.publicKey) throw new Error("Failed to get push key");

      // Subscribe via Push API
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });

      // Store subscription on server
      const { error } = await supabase.functions.invoke("push-notifications", {
        body: {
          action: "subscribe",
          subscription: subscription.toJSON(),
          userId: user.id,
        },
      });
      if (error) throw error;

      setIsSubscribed(true);
      toast({ title: "Notifications enabled! 🔔" });
    } catch (err: any) {
      console.error("Push subscribe error:", err);
      toast({ title: "Failed to enable notifications", description: err.message, variant: "destructive" });
      logPlatformError({
        type: "notification_failure",
        severity: "high",
        message: err?.message || "Push subscription failed",
        details: { action: "subscribe" },
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await supabase.functions.invoke("push-notifications", {
        body: { action: "unsubscribe", userId: user.id },
      });

      setIsSubscribed(false);
      toast({ title: "Notifications disabled" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      logPlatformError({
        type: "notification_failure",
        severity: "medium",
        message: err?.message || "Push unsubscribe failed",
        details: { action: "unsubscribe" },
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { permission, isSubscribed, loading, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}
