/**
 * D.O.M.E. Global Audit Trail Engine
 * 
 * Provides a universal, append-only audit logging system across the entire platform.
 * Every critical action generates an audit event with full context.
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────────
export type AuditModule =
  | "auth" | "cases" | "forms" | "documents" | "signatures"
  | "identity" | "payments" | "exports" | "requests" | "assignments"
  | "tax" | "nonprofit" | "affiliates" | "admin" | "communication"
  | "english" | "business" | "government" | "network";

export type AuditActionType =
  // Auth
  | "register" | "login" | "logout" | "password_reset" | "role_switch"
  // Cases
  | "case_created" | "case_updated" | "case_assigned" | "case_reassigned"
  | "case_transferred" | "case_escalated" | "case_closed" | "case_reopened"
  // Forms
  | "form_created" | "section_saved" | "field_changed" | "form_submitted_for_review"
  | "form_approved" | "form_returned" | "form_export_requested"
  | "form_export_completed" | "form_export_failed"
  // Documents
  | "file_uploaded" | "file_replaced" | "file_deleted" | "file_reclassified"
  | "ocr_run" | "ocr_failed" | "document_linked" | "document_approved" | "document_rejected"
  // Signatures
  | "signature_created" | "signature_updated" | "signature_attached"
  | "signature_replaced" | "signature_invalidated"
  // Identity
  | "id_uploaded" | "id_verified" | "id_verification_failed" | "consent_accepted"
  // Payments
  | "payment_initiated" | "payment_succeeded" | "payment_failed"
  | "refund_issued" | "access_unlocked"
  // Requests / Alerts
  | "request_created" | "request_accepted" | "request_declined"
  | "alert_sent" | "alert_failed" | "message_sent"
  // Affiliates
  | "affiliate_signup" | "referral_click" | "referral_signup"
  | "referral_conversion" | "payout_requested" | "payout_approved" | "payout_sent"
  // Tax / Nonprofit
  | "filing_path_determined" | "filing_started" | "tax_review_completed"
  | "filing_export_completed"
  // Lock system
  | "record_finalized" | "record_reopened" | "record_lock_changed"
  // Version
  | "version_created" | "version_restored"
  // Generic
  | "custom";

export interface AuditEventInput {
  module: AuditModule;
  action_type: AuditActionType | string;
  human_label: string;
  case_id?: string;
  record_id?: string;
  target_type?: string;
  target_id?: string;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  success?: boolean;
  error_details?: string;
  metadata?: Record<string, unknown>;
}

export interface FieldChange {
  field_name: string;
  before_value: string | null;
  after_value: string | null;
}

export interface VersionInput {
  record_type: string;
  record_id: string;
  snapshot: Record<string, unknown>;
  fields_changed?: string[];
  before_values?: Record<string, unknown>;
  after_values?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// ─── Helper: Get user role ──────────────────────────────────────
async function getUserRole(userId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .limit(1)
      .single();
    return data?.role || "unknown";
  } catch {
    return "unknown";
  }
}

// ─── Core: Log Audit Event ──────────────────────────────────────
export async function logAuditEvent(
  userId: string,
  input: AuditEventInput
): Promise<string | null> {
  try {
    const userRole = await getUserRole(userId);

    const { data, error } = await (supabase as any)
      .from("audit_events")
      .insert({
        user_id: userId,
        user_role: userRole,
        module: input.module,
        action_type: input.action_type,
        human_label: input.human_label,
        case_id: input.case_id || null,
        record_id: input.record_id || null,
        target_type: input.target_type || null,
        target_id: input.target_id || null,
        before_state: input.before_state || null,
        after_state: input.after_state || null,
        ip_address: null,
        user_agent: navigator.userAgent,
        success: input.success ?? true,
        error_details: input.error_details || null,
        metadata: input.metadata || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[AuditLogger] Failed to log event:", error);
      return null;
    }
    return data?.id || null;
  } catch (err) {
    console.error("[AuditLogger] Exception:", err);
    return null;
  }
}

// ─── Log Field Changes ─────────────────────────────────────────
export async function logFieldChanges(
  userId: string,
  recordType: string,
  recordId: string,
  changes: FieldChange[],
  auditEventId?: string,
  formInstanceId?: string
): Promise<void> {
  if (changes.length === 0) return;
  try {
    const rows = changes.map((c) => ({
      record_type: recordType,
      record_id: recordId,
      field_name: c.field_name,
      before_value: c.before_value,
      after_value: c.after_value,
      user_id: userId,
      audit_event_id: auditEventId || null,
      form_instance_id: formInstanceId || null,
    }));

    await (supabase as any).from("field_change_logs").insert(rows);
  } catch (err) {
    console.error("[AuditLogger] Field change log failed:", err);
  }
}

// ─── Create Record Version ─────────────────────────────────────
export async function createRecordVersion(
  userId: string,
  input: VersionInput,
  auditEventId?: string
): Promise<number | null> {
  try {
    // Get current max version
    const { data: existing } = await (supabase as any)
      .from("record_versions")
      .select("version_number")
      .eq("record_type", input.record_type)
      .eq("record_id", input.record_id)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion = (existing?.[0]?.version_number || 0) + 1;

    // Mark old versions as not current
    if (nextVersion > 1) {
      await (supabase as any)
        .from("record_versions")
        .update({ is_current: false } as any)
        .eq("record_type", input.record_type)
        .eq("record_id", input.record_id)
        .eq("is_current", true);
    }

    const { error } = await (supabase as any).from("record_versions").insert({
      record_type: input.record_type,
      record_id: input.record_id,
      version_number: nextVersion,
      user_id: userId,
      snapshot: input.snapshot,
      fields_changed: input.fields_changed || null,
      before_values: input.before_values || null,
      after_values: input.after_values || null,
      audit_event_id: auditEventId || null,
      is_current: true,
      metadata: input.metadata || null,
    });

    if (error) {
      console.error("[AuditLogger] Version creation failed:", error);
      return null;
    }
    return nextVersion;
  } catch (err) {
    console.error("[AuditLogger] Version creation exception:", err);
    return null;
  }
}

// ─── Diff Utility ───────────────────────────────────────────────
export function diffObjects(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): FieldChange[] {
  const changes: FieldChange[] = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    const bVal = before[key] !== undefined ? String(before[key]) : null;
    const aVal = after[key] !== undefined ? String(after[key]) : null;
    if (bVal !== aVal) {
      changes.push({ field_name: key, before_value: bVal, after_value: aVal });
    }
  }
  return changes;
}

// ─── Lock System ────────────────────────────────────────────────
export type LockStatus = "draft" | "in_progress" | "under_review" | "ready_for_finalization" | "finalized" | "reopened";

export async function setFormLockStatus(
  userId: string,
  formInstanceId: string,
  newStatus: LockStatus,
  caseId?: string,
  reason?: string
): Promise<boolean> {
  try {
    const { data: current } = await supabase
      .from("form_instances")
      .select("lock_status")
      .eq("id", formInstanceId)
      .single();

    const oldStatus = (current as any)?.lock_status || "draft";

    const updateData: Record<string, unknown> = { lock_status: newStatus };
    if (newStatus === "finalized") {
      updateData.locked_at = new Date().toISOString();
      updateData.locked_by = userId;
    }

    await supabase
      .from("form_instances")
      .update(updateData as any)
      .eq("id", formInstanceId);

    await logAuditEvent(userId, {
      module: "forms",
      action_type: newStatus === "finalized" ? "record_finalized" : newStatus === "reopened" ? "record_reopened" : "record_lock_changed",
      human_label: newStatus === "finalized"
        ? "Form finalized and locked"
        : newStatus === "reopened"
          ? `Form reopened: ${reason || "No reason provided"}`
          : `Form status changed to ${newStatus}`,
      case_id: caseId,
      target_type: "form_instance",
      target_id: formInstanceId,
      before_state: { lock_status: oldStatus },
      after_state: { lock_status: newStatus, reason },
    });

    return true;
  } catch (err) {
    console.error("[AuditLogger] Lock status change failed:", err);
    return false;
  }
}

export async function setCaseLockStatus(
  userId: string,
  caseId: string,
  newStatus: LockStatus,
  reason?: string
): Promise<boolean> {
  try {
    const { data: current } = await supabase
      .from("cases")
      .select("lock_status")
      .eq("id", caseId)
      .single();

    const oldStatus = (current as any)?.lock_status || "draft";

    const updateData: Record<string, unknown> = { lock_status: newStatus };
    if (newStatus === "finalized") {
      updateData.locked_at = new Date().toISOString();
      updateData.locked_by = userId;
    }

    await supabase
      .from("cases")
      .update(updateData as any)
      .eq("id", caseId);

    await logAuditEvent(userId, {
      module: "cases",
      action_type: newStatus === "finalized" ? "record_finalized" : newStatus === "reopened" ? "record_reopened" : "record_lock_changed",
      human_label: newStatus === "finalized"
        ? "Case finalized and locked"
        : newStatus === "reopened"
          ? `Case reopened: ${reason || "No reason provided"}`
          : `Case status changed to ${newStatus}`,
      case_id: caseId,
      target_type: "case",
      target_id: caseId,
      before_state: { lock_status: oldStatus },
      after_state: { lock_status: newStatus, reason },
    });

    return true;
  } catch (err) {
    console.error("[AuditLogger] Case lock change failed:", err);
    return false;
  }
}

// ─── Check if record is locked ──────────────────────────────────
export async function isFormLocked(formInstanceId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("form_instances")
      .select("lock_status")
      .eq("id", formInstanceId)
      .single();
    return (data as any)?.lock_status === "finalized";
  } catch {
    return false;
  }
}
