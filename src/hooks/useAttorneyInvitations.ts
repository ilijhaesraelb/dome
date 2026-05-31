import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMyCase } from "@/hooks/useMyCase";
import { useToast } from "@/hooks/use-toast";

export interface AttorneyInvitation {
  id: string;
  case_id: string;
  invited_by: string;
  invited_email: string;
  collaborator_type: "attorney" | "organization" | "ar_doj";
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  token: string;
  permissions: { upload_documents: boolean; view_sensitive: boolean };
  selected_forms: string[];
  accepted_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export function useAttorneyInvitations() {
  const { user } = useAuth();
  const { data: myCase } = useMyCase();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ["attorney-invitations", myCase?.id];

  const invitationsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      if (!myCase) return [];
      const { data, error } = await supabase
        .from("attorney_invitations")
        .select("*")
        .eq("case_id", myCase.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as AttorneyInvitation[];
    },
    enabled: !!myCase,
  });

  const sendInvitation = useMutation({
    mutationFn: async (params: {
      email: string;
      collaboratorType: "attorney" | "organization" | "ar_doj";
      permissions: { upload_documents: boolean; view_sensitive: boolean };
      selectedForms: string[];
    }) => {
      if (!myCase || !user) throw new Error("No active case");
      const { error } = await supabase.from("attorney_invitations").insert({
        case_id: myCase.id,
        invited_by: user.id,
        invited_email: params.email,
        collaborator_type: params.collaboratorType,
        permissions: params.permissions,
        selected_forms: params.selectedForms,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Invitation sent", description: "Your collaborator will receive access instructions." });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      const msg = err.message?.includes("idx_active_invitation")
        ? "An active invitation already exists for this email on this case."
        : err.message || "Failed to send invitation.";
      toast({ title: "Invitation failed", description: msg, variant: "destructive" });
    },
  });

  const revokeInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("attorney_invitations")
        .update({ status: "revoked" } as any)
        .eq("id", invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Invitation revoked" });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updatePermissions = useMutation({
    mutationFn: async (params: { invitationId: string; permissions: { upload_documents: boolean; view_sensitive: boolean } }) => {
      const { error } = await supabase
        .from("attorney_invitations")
        .update({ permissions: params.permissions } as any)
        .eq("id", params.invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Permissions updated" });
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    invitations: invitationsQuery.data ?? [],
    isLoading: invitationsQuery.isLoading,
    sendInvitation,
    revokeInvitation,
    updatePermissions,
  };
}
