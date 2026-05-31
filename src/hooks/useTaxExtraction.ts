import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Run AI extraction on a single uploaded tax document.
 * The function persists results server-side and creates `ai_needs_review`
 * field-value rows. The caller should then refresh the verification list.
 */
export function useTaxExtraction() {
  const [running, setRunning] = useState(false);

  const extract = useCallback(async (documentId: string) => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("tax-extract-document", {
        body: { documentId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({
        title: "Document analyzed",
        description: `${data.mapped_count ?? 0} field${data.mapped_count === 1 ? "" : "s"} ready to verify.`,
      });
      return data;
    } catch (e: any) {
      toast({ title: "Extraction failed", description: e?.message ?? "Unknown error", variant: "destructive" });
      return null;
    } finally {
      setRunning(false);
    }
  }, []);

  const extractMany = useCallback(async (documentIds: string[]) => {
    const results = [];
    for (const id of documentIds) {
      // Sequential to avoid rate limits
      // eslint-disable-next-line no-await-in-loop
      results.push(await extract(id));
    }
    return results;
  }, [extract]);

  return { extract, extractMany, running };
}
