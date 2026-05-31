import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Resolves the current user's active case.
 * Prefers cases created by the user, then falls back to the most recently updated participating case.
 */
export function useMyCase() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-case", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data: participants, error: pErr } = await supabase
        .from("case_participants")
        .select("case_id")
        .eq("user_id", user.id);

      if (pErr) throw pErr;
      let caseIds = participants?.map((participant) => participant.case_id) ?? [];

      if (!caseIds.length) {
        const { data: initialized, error: initErr } = await supabase.rpc("initialize_client_case", {
          _user_id: user.id,
        });

        if (initErr) throw initErr;

        const initializedCaseId = (initialized as { case_id?: string } | null)?.case_id;
        if (!initializedCaseId) return null;

        caseIds = [initializedCaseId];
      }

      const { data: ownedCases, error: ownedErr } = await supabase
        .from("cases")
        .select("*")
        .eq("created_by", user.id)
        .in("id", caseIds)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (ownedErr) throw ownedErr;
      if (ownedCases?.length) return ownedCases[0];

      const { data: participatingCases, error: caseErr } = await supabase
        .from("cases")
        .select("*")
        .in("id", caseIds)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (caseErr) throw caseErr;
      return participatingCases?.[0] ?? null;
    },
    enabled: !!user,
  });
}
