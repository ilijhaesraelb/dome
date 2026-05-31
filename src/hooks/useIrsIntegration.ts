/**
 * Hook for IRS Integration Settings — provides read/write access
 * for admins and read-only status helpers for tax workflows.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { logAuditEvent } from "@/lib/audit-logger";
import {
  type IrsIntegrationSettings,
  type IrsEnvironment,
  type IrsIntegrationStatus,
  validateConfiguration,
  getTaxFilingMode,
} from "@/lib/irs-integration";

const TABLE = "irs_integration_settings";
const QK = "irs-integration";

export function useIrsIntegration(environment?: IrsEnvironment) {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const { toast } = useToast();
  const qc = useQueryClient();

  // Fetch settings for a given environment (or current one)
  const settingsQuery = useQuery({
    queryKey: [QK, environment || "production"],
    queryFn: async () => {
      const env = environment || "production";
      const { data, error } = await (supabase as any)
        .from(TABLE)
        .select("*")
        .eq("environment", env)
        .maybeSingle();
      if (error) throw error;
      return (data as IrsIntegrationSettings) || null;
    },
    enabled: !!user,
  });

  // Fetch all environments
  const allSettingsQuery = useQuery({
    queryKey: [QK, "all"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from(TABLE).select("*").order("environment");
      if (error) throw error;
      return (data as IrsIntegrationSettings[]) || [];
    },
    enabled: !!user && isAdmin,
  });

  // Save / upsert settings
  const saveMutation = useMutation({
    mutationFn: async (input: Partial<IrsIntegrationSettings> & { environment: IrsEnvironment }) => {
      const existing = allSettingsQuery.data?.find((s) => s.environment === input.environment);
      const payload = { ...input, last_updated_by: user?.id, updated_at: new Date().toISOString() };

      let result;
      if (existing) {
        const { data, error } = await (supabase as any).from(TABLE).update(payload).eq("id", existing.id).select().single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await (supabase as any).from(TABLE).insert(payload).select().single();
        if (error) throw error;
        result = data;
      }

      // Audit
      if (user?.id) {
        await logAuditEvent(user.id, {
          module: "admin",
          action_type: existing ? "custom" : "custom",
          human_label: existing
            ? `IRS integration settings updated for ${input.environment}`
            : `IRS integration settings created for ${input.environment}`,
          before_state: existing ? { status: existing.status } : undefined,
          after_state: { status: input.status || "draft_configuration" },
          metadata: { environment: input.environment, api_label: input.api_label },
        });
      }

      return result as IrsIntegrationSettings;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast({ title: "Configuration saved", description: "IRS integration settings have been updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  // Activate
  const activateMutation = useMutation({
    mutationFn: async (env: IrsEnvironment) => {
      const settings = allSettingsQuery.data?.find((s) => s.environment === env);
      if (!settings) throw new Error("No settings found for this environment");
      const validation = validateConfiguration(settings);
      if (!validation.canActivate) throw new Error("Configuration is not ready for activation");

      const { error } = await (supabase as any)
        .from(TABLE)
        .update({ status: "active" as IrsIntegrationStatus, validated_at: new Date().toISOString(), last_updated_by: user?.id })
        .eq("id", settings.id);
      if (error) throw error;

      if (user?.id) {
        await logAuditEvent(user.id, {
          module: "admin",
          action_type: "custom",
          human_label: `IRS integration activated for ${env}`,
          before_state: { status: settings.status },
          after_state: { status: "active" },
          metadata: { environment: env },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast({ title: "Integration activated" });
    },
    onError: (err: Error) => {
      toast({ title: "Activation failed", description: err.message, variant: "destructive" });
    },
  });

  // Deactivate
  const deactivateMutation = useMutation({
    mutationFn: async (env: IrsEnvironment) => {
      const settings = allSettingsQuery.data?.find((s) => s.environment === env);
      if (!settings) throw new Error("No settings found for this environment");

      const { error } = await (supabase as any)
        .from(TABLE)
        .update({ status: "draft_configuration" as IrsIntegrationStatus, last_updated_by: user?.id })
        .eq("id", settings.id);
      if (error) throw error;

      if (user?.id) {
        await logAuditEvent(user.id, {
          module: "admin",
          action_type: "custom",
          human_label: `IRS integration deactivated for ${env}`,
          before_state: { status: settings.status },
          after_state: { status: "draft_configuration" },
          metadata: { environment: env },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
      toast({ title: "Integration deactivated" });
    },
    onError: (err: Error) => {
      toast({ title: "Deactivation failed", description: err.message, variant: "destructive" });
    },
  });

  // Convenience: current filing mode
  const filingMode = getTaxFilingMode(settingsQuery.data || null);

  return {
    settings: settingsQuery.data || null,
    allSettings: allSettingsQuery.data || [],
    isLoading: settingsQuery.isLoading,
    filingMode,
    save: saveMutation.mutateAsync,
    activate: activateMutation.mutateAsync,
    deactivate: deactivateMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isAdmin,
  };
}
