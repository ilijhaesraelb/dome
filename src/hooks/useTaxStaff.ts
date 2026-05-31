/**
 * useTaxStaff — resolves whether the current user is internal tax staff,
 * which staff role they hold, and (optionally) which firm they belong to.
 *
 * Used to gate the Professional Tax Console (`/tax/pro/*`).
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TaxStaffRole =
  | "owner_admin"
  | "cpa_reviewer"
  | "accountant"
  | "tax_preparer"
  | "internal_tax_staff"
  | "admin"
  | string;

interface TaxStaffState {
  loading: boolean;
  isStaff: boolean;
  staffRole: TaxStaffRole | null;
  firmId: string | null;
  firmRole: string | null;
}

export function useTaxStaff(): TaxStaffState {
  const { session, loading: authLoading } = useAuth();
  const [state, setState] = useState<TaxStaffState>({
    loading: true,
    isStaff: false,
    staffRole: null,
    firmId: null,
    firmRole: null,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!session?.user) {
      setState({ loading: false, isStaff: false, staffRole: null, firmId: null, firmRole: null });
      return;
    }
    const uid = session.user.id;
    (async () => {
      const [{ data: staff }, { data: firm }] = await Promise.all([
        supabase.from("tax_staff").select("role,is_active").eq("user_id", uid).eq("is_active", true).maybeSingle(),
        supabase.from("tax_firm_members").select("firm_id,role,is_active").eq("user_id", uid).eq("is_active", true).maybeSingle(),
      ]);
      setState({
        loading: false,
        isStaff: !!staff || !!firm,
        staffRole: (staff?.role as TaxStaffRole) ?? null,
        firmId: firm?.firm_id ?? null,
        firmRole: (firm?.role as string) ?? null,
      });
    })();
  }, [session?.user?.id, authLoading]);

  return state;
}

/** Convenience matrix of capabilities derived from staff + firm role. */
export function deriveTaxCapabilities(s: TaxStaffState) {
  const role = s.staffRole ?? s.firmRole;
  const isOwner = role === "owner_admin" || role === "admin";
  const isCpa = role === "cpa_reviewer";
  const isAccountant = role === "accountant" || role === "tax_preparer" || role === "internal_tax_staff";
  return {
    canReview: s.isStaff,
    canOverride: isOwner || isCpa,
    canAssign: isOwner || isCpa,
    canExport: isOwner || isCpa || isAccountant,
    canMessageClient: s.isStaff,
    canViewFinancials: s.isStaff,
    canManageFirm: isOwner,
  };
}