/**
 * D.O.M.E. Platform Error Logger
 * 
 * Centralized error logging that persists to the platform_errors table.
 * Every critical failure (save, upload, export, OCR, permission) must go through here.
 */

import { supabase } from "@/integrations/supabase/client";

export type ErrorType =
  | "save_failure"
  | "upload_failure"
  | "export_failure"
  | "ocr_failure"
  | "permission_denial"
  | "route_error"
  | "notification_failure"
  | "case_creation_failure"
  | "assignment_failure";

export type ErrorSeverity = "critical" | "high" | "medium" | "low";

interface LogErrorParams {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: Record<string, unknown>;
  caseId?: string;
  route?: string;
}

/**
 * Log a platform error to the database.
 * Never throws — swallows its own errors to avoid cascading failures.
 */
export async function logPlatformError(params: LogErrorParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("platform_errors").insert([{
      error_type: params.type,
      severity: params.severity,
      message: params.message,
      details: (params.details || {}) as any,
      user_id: user?.id || null,
      case_id: params.caseId || null,
      route: params.route || (typeof window !== "undefined" ? window.location.pathname : null),
    }]);
  } catch {
    // Never throw from the error logger itself
    console.error("[DOME Error Logger] Failed to persist error:", params.message);
  }
}

/**
 * Wrap an async operation with error logging.
 * Returns the result or null on failure, and shows a toast if provided.
 */
export async function withErrorLogging<T>(
  operation: () => Promise<T>,
  errorParams: Omit<LogErrorParams, "message">,
  fallbackMessage = "An unexpected error occurred",
): Promise<T | null> {
  try {
    return await operation();
  } catch (err: any) {
    const message = err?.message || fallbackMessage;
    await logPlatformError({ ...errorParams, message });
    throw err; // Re-throw so callers can still handle it
  }
}
