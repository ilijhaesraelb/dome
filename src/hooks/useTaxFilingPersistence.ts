/**
 * useTaxFilingPersistence — Supabase-backed persistence for tax filing workspaces.
 * Handles create/load/autosave/manual-save for 990-N, 990-EZ, and 8868 flows.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UseTaxFilingPersistenceOptions {
  filingType: string; // e.g. "990-N", "990-EZ", "8868"
  prefill?: Record<string, string>;
}

export function useTaxFilingPersistence({ filingType, prefill = {} }: UseTaxFilingPersistenceOptions) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filingId, setFilingId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(prefill);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const debounceRef = useRef<NodeJS.Timeout>();
  const dirtyRef = useRef(false);

  // Load or create filing on mount
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }

    const loadOrCreate = async () => {
      setLoading(true);
      try {
        // Try to find existing in-progress filing
        const { data: existing } = await supabase
          .from("tax_filings")
          .select("*")
          .eq("user_id", user.id)
          .eq("filing_type", filingType)
          .in("status", ["draft", "in_progress"])
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          setFilingId(existing.id);
          const dbValues = (existing.field_values as Record<string, string>) || {};
          // Merge: DB values as base, prefill only for empty fields
          const merged = { ...prefill };
          Object.entries(dbValues).forEach(([k, v]) => {
            if (v) merged[k] = v;
          });
          setValues(merged);
        } else {
          // Create new filing
          const { data: created, error } = await supabase
            .from("tax_filings")
            .insert({
              user_id: user.id,
              filing_type: filingType,
              field_values: prefill,
              status: "draft",
              progress: 0,
            })
            .select()
            .single();
          if (error) throw error;
          setFilingId(created.id);
          setValues(prefill);
        }
      } catch (err: any) {
        console.error("Tax filing load error:", err);
        toast({ title: "Could not load filing", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadOrCreate();
  }, [user?.id, filingType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to Supabase
  const saveToDb = useCallback(async (currentValues: Record<string, string>) => {
    if (!filingId || !user?.id) return;
    setSaveStatus("saving");
    try {
      const cleanValues = Object.fromEntries(
        Object.entries(currentValues).filter(([, v]) => v?.trim())
      );
      const { error } = await supabase
        .from("tax_filings")
        .update({
          field_values: cleanValues as any,
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", filingId);
      if (error) throw error;
      setSaveStatus("saved");
      dirtyRef.current = false;
    } catch (err: any) {
      console.error("Tax filing save error:", err);
      setSaveStatus("error");
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  }, [filingId, user?.id, toast]);

  // Field change with debounced autosave
  const handleChange = useCallback((key: string, val: string) => {
    setValues(prev => {
      const next = { ...prev, [key]: val };
      dirtyRef.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => saveToDb(next), 2000);
      setSaveStatus("saving");
      return next;
    });
  }, [saveToDb]);

  // Manual save
  const manualSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    saveToDb(values);
  }, [saveToDb, values]);

  // Mark as completed
  const markCompleted = useCallback(async () => {
    if (!filingId) return;
    await supabase
      .from("tax_filings")
      .update({ status: "completed", progress: 100, exported_at: new Date().toISOString() })
      .eq("id", filingId);
  }, [filingId]);

  return {
    filingId,
    values,
    loading,
    saveStatus,
    handleChange,
    manualSave,
    markCompleted,
    setValues,
  };
}
