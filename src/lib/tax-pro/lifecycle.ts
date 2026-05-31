/**
 * Tax pro lifecycle / audit helpers — append-only event recording.
 * Mirrors the pattern used by audit-logger.ts for the immigration side.
 */
import { supabase } from "@/integrations/supabase/client";

export async function recordLifecycleEvent(
  taxFileId: string,
  eventType: string,
  metadata: Record<string, unknown> = {},
) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("tax_lifecycle_events").insert({
    tax_file_id: taxFileId,
    event_type: eventType,
    actor_user_id: user?.id ?? null,
    metadata,
  } as any);
}

export async function recordExtractionAction(
  fieldValueId: string,
  action: "confirmed" | "edited" | "rejected" | "overridden" | "remapped",
  metadata: Record<string, unknown> = {},
) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("tax_extraction_review_actions").insert({
    field_value_id: fieldValueId,
    action,
    actor_user_id: user?.id ?? null,
    metadata,
  } as any);
}