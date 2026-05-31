import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

export const useIdleTimeout = () => {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleIdle = useCallback(async () => {
    if (!session) return;
    await signOut();
    toast({
      title: "Session expired",
      description: "You were signed out due to inactivity.",
      variant: "destructive",
    });
    navigate("/login");
  }, [session, signOut, navigate, toast]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (session) {
      timerRef.current = setTimeout(handleIdle, IDLE_TIMEOUT_MS);
    }
  }, [session, handleIdle]);

  useEffect(() => {
    if (!session) return;

    resetTimer();

    EVENTS.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [session, resetTimer]);
};
