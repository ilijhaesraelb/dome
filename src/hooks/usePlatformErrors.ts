import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePlatformErrors(filters?: { resolved?: boolean; type?: string; severity?: string }) {
  return useQuery({
    queryKey: ["platform-errors", filters],
    queryFn: async () => {
      let query = supabase
        .from("platform_errors")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.resolved !== undefined) {
        query = query.eq("resolved", filters.resolved);
      }
      if (filters?.type) {
        query = query.eq("error_type", filters.type);
      }
      if (filters?.severity) {
        query = query.eq("severity", filters.severity);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Auto-refresh every 30s
  });
}

export function useResolveError() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ errorId, userId }: { errorId: string; userId: string }) => {
      const { error } = await supabase
        .from("platform_errors")
        .update({ resolved: true, resolved_at: new Date().toISOString(), resolved_by: userId })
        .eq("id", errorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-errors"] });
    },
  });
}

export function usePlatformErrorStats() {
  return useQuery({
    queryKey: ["platform-error-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_errors")
        .select("error_type, severity, resolved")
        .eq("resolved", false);
      if (error) throw error;

      const stats = {
        total: data.length,
        critical: data.filter(e => e.severity === "critical").length,
        high: data.filter(e => e.severity === "high").length,
        byType: {} as Record<string, number>,
      };

      for (const e of data) {
        stats.byType[e.error_type] = (stats.byType[e.error_type] || 0) + 1;
      }

      return stats;
    },
    refetchInterval: 30000,
  });
}
