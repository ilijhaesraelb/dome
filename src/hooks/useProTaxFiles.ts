/**
 * useProTaxFiles — Loads the Professional Console queue.
 * Returns enriched tax_files visible to the current staff user, plus
 * convenience aggregates used by the Drake-style dashboard.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProTaxFile {
  id: string;
  tax_client_id: string;
  filing_year: number | null;
  filing_type: string | null;
  status: string;
  payment_status: string | null;
  readiness_score: number | null;
  current_step: string | null;
  updated_at: string;
  created_at: string;
  client_name: string | null;
  client_type: string | null;
  forms: string[];
  open_issues: number;
  blockers: number;
  assigned_to: string | null;
}

const STATUS_BUCKETS = {
  intake: ["not_started", "documents_uploaded", "ai_analyzing", "awaiting_verification"],
  active: ["profile_confirmed", "forms_selected", "in_preparation", "error_review"],
  review: ["awaiting_user_verification", "review_required", "ready_for_preview"],
  payment: ["ready_for_payment"],
  export: ["paid", "ready_for_export"],
  done: ["exported", "portal_filed", "archived"],
} as const;

export type ProQueueBucket = keyof typeof STATUS_BUCKETS;

export function useProTaxFiles() {
  const { session } = useAuth();
  const [files, setFiles] = useState<ProTaxFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const { data: rows, error: e1 } = await supabase
        .from("tax_files")
        .select(`
          id, tax_client_id, filing_year, filing_type, status, payment_status,
          readiness_score, current_step, updated_at, created_at,
          tax_clients ( legal_name, first_name, last_name, profile_type )
        `)
        .order("updated_at", { ascending: false })
        .limit(200);
      if (e1) throw e1;

      const ids = (rows ?? []).map((r: any) => r.id);
      const [{ data: forms }, { data: issues }, { data: assignments }] = await Promise.all([
        ids.length
          ? supabase.from("tax_file_forms").select("tax_file_id, form_code").in("tax_file_id", ids)
          : Promise.resolve({ data: [] as any[] }),
        ids.length
          ? supabase.from("tax_review_issues").select("tax_file_id, severity, status").in("tax_file_id", ids)
          : Promise.resolve({ data: [] as any[] }),
        ids.length
          ? supabase.from("tax_firm_assignments").select("tax_file_id, member_user_id, is_active").in("tax_file_id", ids)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const formsByFile = new Map<string, string[]>();
      (forms ?? []).forEach((f: any) => {
        const list = formsByFile.get(f.tax_file_id) ?? [];
        list.push(f.form_code);
        formsByFile.set(f.tax_file_id, list);
      });

      const issuesByFile = new Map<string, { open: number; blockers: number }>();
      (issues ?? []).forEach((i: any) => {
        if (i.status === "resolved" || i.status === "suppressed") return;
        const cur = issuesByFile.get(i.tax_file_id) ?? { open: 0, blockers: 0 };
        cur.open += 1;
        if (i.severity === "blocker") cur.blockers += 1;
        issuesByFile.set(i.tax_file_id, cur);
      });

      const assignByFile = new Map<string, string>();
      (assignments ?? []).forEach((a: any) => {
        if (a.is_active) assignByFile.set(a.tax_file_id, a.member_user_id);
      });

      const enriched: ProTaxFile[] = (rows ?? []).map((r: any) => {
        const tc = Array.isArray(r.tax_clients) ? r.tax_clients[0] : r.tax_clients;
        const name = tc?.legal_name || [tc?.first_name, tc?.last_name].filter(Boolean).join(" ") || "Unnamed client";
        const iss = issuesByFile.get(r.id) ?? { open: 0, blockers: 0 };
        return {
          id: r.id,
          tax_client_id: r.tax_client_id,
          filing_year: r.filing_year,
          filing_type: r.filing_type,
          status: r.status,
          payment_status: r.payment_status,
          readiness_score: r.readiness_score,
          current_step: r.current_step,
          updated_at: r.updated_at,
          created_at: r.created_at,
          client_name: name,
          client_type: tc?.profile_type ?? null,
          forms: formsByFile.get(r.id) ?? [],
          open_issues: iss.open,
          blockers: iss.blockers,
          assigned_to: assignByFile.get(r.id) ?? null,
        };
      });
      setFiles(enriched);
    } catch (e: any) {
      setError(e.message ?? "Failed to load tax files");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => { load(); }, [load]);

  const buckets: Record<ProQueueBucket, ProTaxFile[]> = {
    intake: [], active: [], review: [], payment: [], export: [], done: [],
  };
  files.forEach((f) => {
    for (const [k, list] of Object.entries(STATUS_BUCKETS)) {
      if ((list as readonly string[]).includes(f.status)) {
        buckets[k as ProQueueBucket].push(f);
        return;
      }
    }
    buckets.active.push(f);
  });

  return { files, buckets, loading, error, reload: load };
}