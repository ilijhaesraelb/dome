import type { Tables } from "@/integrations/supabase/types";

export type FormFlowInstance = Pick<
  Tables<"form_instances">,
  "id" | "case_id" | "form_name" | "form_type" | "status" | "progress" | "created_at" | "updated_at"
>;

const ACTIVE_STATUSES = new Set(["started", "in_progress", "needs_review", "ready_for_review"]);
const COMPLETE_STATUSES = new Set(["completed", "approved", "denied"]);

const getTimestamp = (value?: string | null) => (value ? new Date(value).getTime() : 0);

export const isActiveFormStatus = (status?: string | null) => ACTIVE_STATUSES.has(status ?? "");

export const isCompleteFormStatus = (status?: string | null) => COMPLETE_STATUSES.has(status ?? "");

export const isIncompleteFormStatus = (status?: string | null) => !isCompleteFormStatus(status);

export function sortFormsForResume<T extends FormFlowInstance>(forms: T[], preferredFormId?: string | null) {
  return [...forms].sort((a, b) => {
    const aPreferred = preferredFormId && a.id === preferredFormId && isIncompleteFormStatus(a.status);
    const bPreferred = preferredFormId && b.id === preferredFormId && isIncompleteFormStatus(b.status);

    if (aPreferred !== bPreferred) return aPreferred ? -1 : 1;

    const aActive = isActiveFormStatus(a.status);
    const bActive = isActiveFormStatus(b.status);
    if (aActive !== bActive) return aActive ? -1 : 1;

    const aIncomplete = isIncompleteFormStatus(a.status);
    const bIncomplete = isIncompleteFormStatus(b.status);
    if (aIncomplete !== bIncomplete) return aIncomplete ? -1 : 1;

    if (aActive && bActive) {
      return getTimestamp(b.updated_at) - getTimestamp(a.updated_at) || getTimestamp(b.created_at) - getTimestamp(a.created_at);
    }

    if (aIncomplete && bIncomplete) {
      return getTimestamp(a.created_at) - getTimestamp(b.created_at) || a.form_type.localeCompare(b.form_type);
    }

    return getTimestamp(b.updated_at) - getTimestamp(a.updated_at) || getTimestamp(b.created_at) - getTimestamp(a.created_at);
  });
}

export function getResumeForm<T extends FormFlowInstance>(forms: T[], preferredFormId?: string | null) {
  return sortFormsForResume(forms, preferredFormId).find((form) => isIncompleteFormStatus(form.status)) ?? null;
}

export const buildFormDraftStorageKey = (formId: string) => `dome-form-draft:${formId}`;

export const buildFormUiStorageKey = (formId: string) => `dome-form-ui:${formId}`;

export const buildLastVisitedFormStorageKey = (caseId: string) => `dome-last-form:${caseId}`;