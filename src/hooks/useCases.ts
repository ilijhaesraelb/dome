import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type CaseRow = Tables<"cases">;

export function useCases() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as CaseRow[];
    },
    enabled: !!user,
  });
}

export function useCase(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["case", id],
    queryFn: async () => {
      if (!id) throw new Error("No case id");
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as CaseRow;
    },
    enabled: !!user && !!id,
  });
}

export function useCasePersons(caseId: string | undefined) {
  return useQuery({
    queryKey: ["case-persons", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("persons_safe")
        .select("*")
        .eq("case_id", caseId!);
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });
}

export function useCaseFormInstances(caseId: string | undefined) {
  return useQuery({
    queryKey: ["case-forms", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_instances")
        .select("*")
        .eq("case_id", caseId!);
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });
}

export function useCaseDocuments(caseId: string | undefined) {
  return useQuery({
    queryKey: ["case-documents", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("case_id", caseId!);
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });
}

export function useCaseTimeline(caseId: string | undefined) {
  return useQuery({
    queryKey: ["case-timeline", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_timeline")
        .select("*")
        .eq("case_id", caseId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });
}

export function useCaseMessages(caseId: string | undefined) {
  return useQuery({
    queryKey: ["case-messages", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_messages")
        .select("*")
        .eq("case_id", caseId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });
}

export function useCasePayments(caseId: string | undefined) {
  return useQuery({
    queryKey: ["case-payments", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("case_id", caseId!);
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });
}

export function useCaseNotes(caseId: string | undefined) {
  return useQuery({
    queryKey: ["case-notes", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_notes")
        .select("*")
        .eq("case_id", caseId!)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });
}

export function useCaseConsistencyIssues(caseId: string | undefined) {
  return useQuery({
    queryKey: ["case-consistency", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consistency_issues")
        .select("*")
        .eq("case_id", caseId!);
      if (error) throw error;
      return data;
    },
    enabled: !!caseId,
  });
}

export function useCreateCase() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (caseData: Partial<TablesInsert<"cases">>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("cases")
        .insert({
          case_number: caseData.case_number || `DOME-${Date.now()}`,
          case_type: caseData.case_type || "Adjustment of Status",
          created_by: user.id,
          ...caseData,
        })
        .select()
        .single();
      if (error) throw error;

      // Add creator as case participant
      await supabase.from("case_participants").insert({
        case_id: data.id,
        user_id: user.id,
        role: "practitioner",
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}

export function useSendMessage(caseId: string) {
  const queryClient = useQueryClient();
  const { user, roles } = useAuth();

  return useMutation({
    mutationFn: async ({ content, senderName }: { content: string; senderName: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Derive sender_role from actual user roles
      const practitionerRoles = ["practitioner", "admin", "paralegal", "translator"];
      let senderRole: "practitioner" | "client" | "attorney" = "client";
      if (roles.includes("attorney")) senderRole = "attorney";
      else if (roles.some((r) => practitionerRoles.includes(r))) senderRole = "practitioner";

      const { error } = await supabase.from("case_messages").insert({
        case_id: caseId,
        content,
        sender_id: user.id,
        sender_name: senderName,
        sender_role: senderRole,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-messages", caseId] });
    },
  });
}
