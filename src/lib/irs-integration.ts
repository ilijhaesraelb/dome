/**
 * IRS Integration Architecture — Adapter Layer
 *
 * Provides modular adapters for IRIS (1099) and TIN Matching workflows.
 * All adapters validate readiness before attempting any IRS communication.
 * No fake credentials are used — the system operates in "pending" mode
 * until real configuration is supplied by an admin.
 */

// ─── Types ───────────────────────────────────────────────────────

export type IrsEnvironment = "development" | "staging" | "production";

export type IrsIntegrationStatus =
  | "not_started"
  | "draft_configuration"
  | "missing_redirect_url"
  | "missing_jwks"
  | "invalid_jwks_format"
  | "ready_for_testing"
  | "testing_in_progress"
  | "ready_for_production"
  | "active"
  | "error";

export const IRS_STATUS_LABELS: Record<IrsIntegrationStatus, string> = {
  not_started: "Not Started",
  draft_configuration: "Draft Configuration",
  missing_redirect_url: "Missing Redirect URL",
  missing_jwks: "Missing JWKS",
  invalid_jwks_format: "Invalid JWKS Format",
  ready_for_testing: "Ready for Testing",
  testing_in_progress: "Testing In Progress",
  ready_for_production: "Ready for Production Activation",
  active: "Active",
  error: "Error",
};

export const IRS_STATUS_COLORS: Record<IrsIntegrationStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  draft_configuration: "bg-amber-100 text-amber-800",
  missing_redirect_url: "bg-orange-100 text-orange-800",
  missing_jwks: "bg-orange-100 text-orange-800",
  invalid_jwks_format: "bg-destructive/10 text-destructive",
  ready_for_testing: "bg-blue-100 text-blue-800",
  testing_in_progress: "bg-indigo-100 text-indigo-800",
  ready_for_production: "bg-emerald-100 text-emerald-800",
  active: "bg-green-100 text-green-800",
  error: "bg-destructive/10 text-destructive",
};

export interface IrsIntegrationSettings {
  id: string;
  api_label: string;
  selected_apis: string[];
  integration_type: string;
  environment: IrsEnvironment;
  redirect_url: string | null;
  jwks_json: Record<string, unknown> | null;
  status: IrsIntegrationStatus;
  notes: string | null;
  last_updated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── JWKS Validation ─────────────────────────────────────────────

export interface JwksValidationResult {
  valid: boolean;
  errors: string[];
  keyCount: number;
}

export function validateJwksJson(raw: string): JwksValidationResult {
  const errors: string[] = [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, errors: ["Invalid JSON format"], keyCount: 0 };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { valid: false, errors: ["JWKS must be a JSON object with a 'keys' array"], keyCount: 0 };
  }

  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.keys)) {
    return { valid: false, errors: ["Missing top-level 'keys' array"], keyCount: 0 };
  }

  if (obj.keys.length === 0) {
    errors.push("Keys array is empty — at least one key is required");
    return { valid: false, errors, keyCount: 0 };
  }

  const kids = new Set<string>();
  for (let i = 0; i < obj.keys.length; i++) {
    const key = obj.keys[i] as Record<string, unknown>;
    if (!key || typeof key !== "object") {
      errors.push(`Key at index ${i} is not a valid object`);
      continue;
    }
    if (!key.kty) errors.push(`Key at index ${i} missing required 'kty' field`);
    if (!key.kid) {
      errors.push(`Key at index ${i} missing 'kid' field`);
    } else {
      if (kids.has(String(key.kid))) {
        errors.push(`Duplicate 'kid' detected: ${key.kid}`);
      }
      kids.add(String(key.kid));
    }
    if (key.kty === "RSA" && (!key.n || !key.e)) {
      errors.push(`RSA key at index ${i} missing 'n' or 'e' components`);
    }
  }

  return { valid: errors.length === 0, errors, keyCount: obj.keys.length };
}

// ─── Redirect URL Validation ─────────────────────────────────────

export function validateRedirectUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: "Redirect URL is required" };
  }
  try {
    const u = new URL(url);
    if (!["https:", "http:"].includes(u.protocol)) {
      return { valid: false, error: "URL must use https:// or http://" };
    }
    if (u.protocol === "http:" && !["localhost", "127.0.0.1"].includes(u.hostname)) {
      return { valid: false, error: "HTTP is only allowed for localhost development" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

// ─── Configuration Validation ────────────────────────────────────

export interface ConfigValidation {
  checks: { label: string; passed: boolean; detail?: string }[];
  overallStatus: IrsIntegrationStatus;
  canActivate: boolean;
}

export function validateConfiguration(settings: Partial<IrsIntegrationSettings>): ConfigValidation {
  const checks: ConfigValidation["checks"] = [];

  // 1. API Label
  const hasLabel = !!settings.api_label?.trim();
  checks.push({ label: "API Label present", passed: hasLabel });

  // 2. API Selection
  const hasApis = Array.isArray(settings.selected_apis) && settings.selected_apis.length > 0;
  checks.push({ label: "API selection present", passed: hasApis });

  // 3. Integration type
  const hasType = !!settings.integration_type?.trim();
  checks.push({ label: "Integration type present", passed: hasType });

  // 4. Redirect URL
  const hasRedirect = !!settings.redirect_url?.trim();
  const redirectValid = hasRedirect ? validateRedirectUrl(settings.redirect_url!).valid : false;
  checks.push({ label: "Redirect URL present", passed: hasRedirect });
  checks.push({
    label: "Redirect URL format valid",
    passed: redirectValid,
    detail: hasRedirect && !redirectValid ? validateRedirectUrl(settings.redirect_url!).error : undefined,
  });

  // 5. JWKS
  const hasJwks = !!settings.jwks_json && Object.keys(settings.jwks_json).length > 0;
  let jwksValid = false;
  if (hasJwks) {
    const result = validateJwksJson(JSON.stringify(settings.jwks_json));
    jwksValid = result.valid;
    if (!result.valid) {
      checks.push({ label: "JWKS format valid", passed: false, detail: result.errors[0] });
    } else {
      checks.push({ label: "JWKS format valid", passed: true, detail: `${result.keyCount} key(s) found` });
    }
  } else {
    checks.push({ label: "JWKS present", passed: false });
  }

  // 6. Environment
  const hasEnv = ["development", "staging", "production"].includes(settings.environment || "");
  checks.push({ label: "Environment selected", passed: hasEnv });

  // Determine status
  const allPassed = checks.every((c) => c.passed);
  let overallStatus: IrsIntegrationStatus = "draft_configuration";

  if (!hasRedirect) overallStatus = "missing_redirect_url";
  else if (!hasJwks) overallStatus = "missing_jwks";
  else if (hasJwks && !jwksValid) overallStatus = "invalid_jwks_format";
  else if (allPassed) overallStatus = "ready_for_testing";

  return { checks, overallStatus, canActivate: allPassed };
}

// ─── Adapter Interfaces ─────────────────────────────────────────

export interface AdapterResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status: "not_connected" | "pending_configuration" | "transmitted" | "error";
}

export interface IrsAdapter {
  name: string;
  apiKey: string; // e.g. 'IRIS' | 'TINM'
  checkReady(settings: IrsIntegrationSettings | null): boolean;
  getStatus(settings: IrsIntegrationSettings | null): string;
}

// ─── IRIS Adapter (1099 workflows) ──────────────────────────────

export const IrisAdapter: IrsAdapter = {
  name: "IRIS (Information Returns Intake System)",
  apiKey: "IRIS",
  checkReady(settings) {
    return !!settings && settings.status === "active" && settings.selected_apis.includes("IRIS");
  },
  getStatus(settings) {
    if (!settings) return "Not Connected — Pending Admin Configuration";
    if (!settings.selected_apis.includes("IRIS")) return "IRIS API Not Selected";
    if (settings.status !== "active") return `Pending — ${IRS_STATUS_LABELS[settings.status] || settings.status}`;
    return "Active";
  },
};

// ─── TIN Matching Adapter ───────────────────────────────────────

export const TinMatchAdapter: IrsAdapter = {
  name: "TIN Matching",
  apiKey: "TINM",
  checkReady(settings) {
    return !!settings && settings.status === "active" && settings.selected_apis.includes("TINM");
  },
  getStatus(settings) {
    if (!settings) return "Not Connected — Pending Admin Configuration";
    if (!settings.selected_apis.includes("TINM")) return "TINM API Not Selected";
    if (settings.status !== "active") return `Pending — ${IRS_STATUS_LABELS[settings.status] || settings.status}`;
    return "Active";
  },
};

// ─── Tax Workflow Status Labels ─────────────────────────────────

export type TaxFilingMode = "draft_only" | "review_available" | "filing_pending_setup" | "filing_active";

export function getTaxFilingMode(settings: IrsIntegrationSettings | null): TaxFilingMode {
  if (!settings || settings.status === "not_started") return "draft_only";
  if (settings.status === "active") return "filing_active";
  if (["ready_for_testing", "testing_in_progress", "ready_for_production"].includes(settings.status))
    return "review_available";
  return "filing_pending_setup";
}

export const TAX_FILING_MODE_LABELS: Record<TaxFilingMode, { badge: string; message: string; color: string }> = {
  draft_only: {
    badge: "Draft Preparation Available",
    message: "IRS transmission is not yet enabled. You can still prepare, review, and organize your filing.",
    color: "bg-muted text-muted-foreground",
  },
  review_available: {
    badge: "Review Only",
    message: "Filing support available. IRS transmission is being configured by administrators.",
    color: "bg-blue-100 text-blue-800",
  },
  filing_pending_setup: {
    badge: "IRS Transmission Pending Setup",
    message: "IRS integration is being configured. Preparation and review workflows remain fully available.",
    color: "bg-amber-100 text-amber-800",
  },
  filing_active: {
    badge: "IRS Transmission Active",
    message: "Live IRS filing is enabled for this environment.",
    color: "bg-green-100 text-green-800",
  },
};
