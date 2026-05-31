/**
 * useSubmitIntakeRequest — Client-side hook to submit a help request
 * that providers/firms can see and accept.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface IntakeRequestInput {
  caseId?: string;
  caseType?: string;
  notes?: string;
  urgency?: string;
  preferredLanguage?: string;
}

export function useSubmitIntakeRequest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: IntakeRequestInput) => {
      if (!user) throw new Error("Must be signed in");

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("user_id", user.id)
        .single();

      const { data, error } = await supabase
        .from("intake_requests")
        .insert({
          client_user_id: user.id,
          client_name: profile?.display_name || user.email?.split("@")[0] || "Client",
          client_email: profile?.email || user.email,
          case_id: input.caseId || null,
          case_type: input.caseType || null,
          notes: input.notes || null,
          urgency: input.urgency || "normal",
          preferred_language: input.preferredLanguage || "en",
          source: "portal",
          status: "new" as any,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Request submitted", description: "A provider will review your request shortly." });
      qc.invalidateQueries({ queryKey: ["intake-requests"] });
    },
    onError: (err: any) => {
      toast({ title: "Request failed", description: err.message, variant: "destructive" });
    },
  });
}
