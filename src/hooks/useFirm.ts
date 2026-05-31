import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useFirm() {
  const { user } = useAuth();

  const { data: firmMembership, isLoading: loadingMembership } = useQuery({
    queryKey: ["firm-membership", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("firm_members")
        .select("*, law_firms(*)")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const firm = firmMembership?.law_firms as any;
  const firmId = firmMembership?.firm_id;
  const firmRole = firmMembership?.role;

  return { firm, firmId, firmRole, loadingMembership, hasFirm: !!firmId };
}

export function useFirmMembers(firmId?: string) {
  return useQuery({
    queryKey: ["firm-members", firmId],
    enabled: !!firmId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("firm_members")
        .select("*, profiles:user_id(display_name, email)")
        .eq("firm_id", firmId!)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useIntakeRequests(firmId?: string) {
  return useQuery({
    queryKey: ["intake-requests", firmId],
    enabled: !!firmId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intake_requests")
        .select("*")
        .eq("firm_id", firmId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateFirm() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (firmData: { name: string; address?: string; phone?: string; email?: string; practice_areas?: string[] }) => {
      const { data: firm, error: firmError } = await supabase
        .from("law_firms")
        .insert({ ...firmData, created_by: user!.id })
        .select()
        .single();
      if (firmError) throw firmError;

      const { error: memberError } = await supabase
        .from("firm_members")
        .insert({ firm_id: firm.id, user_id: user!.id, role: "firm_admin" as any });
      if (memberError) throw memberError;

      return firm;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["firm-membership"] });
    },
  });
}

export function useUpdateIntakeStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, assigned_to }: { id: string; status: string; assigned_to?: string }) => {
      const { error } = await supabase
        .from("intake_requests")
        .update({ status: status as any, assigned_to })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intake-requests"] });
    },
  });
}
