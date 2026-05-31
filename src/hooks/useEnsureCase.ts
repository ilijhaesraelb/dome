import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { logPlatformError } from "@/lib/error-logger";

/**
 * Ensures the current client user has an active case + person record.
 * Uses a SECURITY DEFINER RPC to atomically create case, participant, and person.
 */
export function useEnsureCase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureCase = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    try {
      const { data, error } = await supabase.rpc("initialize_client_case", {
        _user_id: user.id,
      });

      if (error) throw error;

      const result = data as { case_id: string; person_id: string | null } | null;
      if (result?.case_id) {
        setCaseId(result.case_id);
        setPersonId(result.person_id || null);
      }

      queryClient.invalidateQueries({ queryKey: ["my-case"] });
      queryClient.invalidateQueries({ queryKey: ["passport-data"] });
    } catch (err: any) {
      console.error("ensureCase error:", err);
      await logPlatformError({
        type: "case_creation_failure",
        severity: "critical",
        message: err?.message || "Failed to ensure case for user",
        details: { userId: user?.id },
      });
    } finally {
      setLoading(false);
    }
  }, [user, queryClient]);

  useEffect(() => {
    ensureCase();
  }, [ensureCase]);

  return { caseId, personId, loading };
}
