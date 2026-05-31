/**
 * React hook for the D.O.M.E. audit trail system.
 * Provides easy access to audit logging, version history, and lock management.
 */

import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyCase } from "@/hooks/useMyCase";
import {
  logAuditEvent,
  logFieldChanges,
  createRecordVersion,
  diffObjects,
  setFormLockStatus,
  setCaseLockStatus,
  isFormLocked,
  type AuditEventInput,
  type FieldChange,
  type VersionInput,
  type LockStatus,
} from "@/lib/audit-logger";

export function useAuditLog() {
  const { user } = useAuth();
  const { data: myCase } = useMyCase();

  const logEvent = useCallback(
    async (input: Omit<AuditEventInput, "case_id"> & { case_id?: string }) => {
      if (!user?.id) return null;
      return logAuditEvent(user.id, {
        ...input,
        case_id: input.case_id || myCase?.id,
      });
    },
    [user?.id, myCase?.id]
  );

  const logFields = useCallback(
    async (
      recordType: string,
      recordId: string,
      changes: FieldChange[],
      auditEventId?: string,
      formInstanceId?: string
    ) => {
      if (!user?.id) return;
      return logFieldChanges(user.id, recordType, recordId, changes, auditEventId, formInstanceId);
    },
    [user?.id]
  );

  const createVersion = useCallback(
    async (input: VersionInput, auditEventId?: string) => {
      if (!user?.id) return null;
      return createRecordVersion(user.id, input, auditEventId);
    },
    [user?.id]
  );

  const trackChanges = useCallback(
    async (
      recordType: string,
      recordId: string,
      before: Record<string, unknown>,
      after: Record<string, unknown>,
      module: AuditEventInput["module"],
      humanLabel: string,
      formInstanceId?: string
    ) => {
      if (!user?.id) return;
      const changes = diffObjects(before, after);
      if (changes.length === 0) return;

      const eventId = await logAuditEvent(user.id, {
        module,
        action_type: "field_changed",
        human_label: humanLabel,
        case_id: myCase?.id,
        target_type: recordType,
        target_id: recordId,
        before_state: before,
        after_state: after,
        metadata: { changed_fields: changes.map((c) => c.field_name) },
      });

      await logFieldChanges(user.id, recordType, recordId, changes, eventId || undefined, formInstanceId);

      await createRecordVersion(user.id, {
        record_type: recordType,
        record_id: recordId,
        snapshot: after,
        fields_changed: changes.map((c) => c.field_name),
        before_values: before,
        after_values: after,
      }, eventId || undefined);
    },
    [user?.id, myCase?.id]
  );

  const setFormLock = useCallback(
    async (formInstanceId: string, status: LockStatus, reason?: string) => {
      if (!user?.id) return false;
      return setFormLockStatus(user.id, formInstanceId, status, myCase?.id, reason);
    },
    [user?.id, myCase?.id]
  );

  const setCaseLock = useCallback(
    async (caseId: string, status: LockStatus, reason?: string) => {
      if (!user?.id) return false;
      return setCaseLockStatus(user.id, caseId, status, reason);
    },
    [user?.id, myCase?.id]
  );

  const checkFormLocked = useCallback(
    async (formInstanceId: string) => isFormLocked(formInstanceId),
    []
  );

  return {
    logEvent,
    logFields,
    createVersion,
    trackChanges,
    setFormLock,
    setCaseLock,
    checkFormLocked,
    diffObjects,
  };
}
