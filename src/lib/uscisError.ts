export interface USCISStatusErrorPayload {
  code?: number | string;
  message?: string;
  error?: string;
}

export function resolveCaseStatusError(payload?: USCISStatusErrorPayload | null): {
  code: number | null;
  message: string;
} {
  const rawCode = payload?.code;
  const code = typeof rawCode === "number" ? rawCode : Number(rawCode ?? 0) || null;
  const explicitMessage = typeof payload?.message === "string" ? payload.message : payload?.error;

  if (typeof explicitMessage === "string" && explicitMessage.trim()) {
    return { code, message: explicitMessage.trim() };
  }

  const fallbackMessageByCode: Record<number, string> = {
    401: "Invalid Access Token",
    404: "Case Status Online does not recognize the receipt number entered. Please check your receipt number and try again. If you need further assistance, please call the USCIS Contact Center at 1-800-375-5283.",
    422: "The application receipt number is not formatted correctly, It should be total of 13 characters (3 character prefix followed by 10 digits). Please check your receipt number and try again",
    429: "Spike Arrest Violation",
    503: "Service Unavailable",
  };

  if (code && fallbackMessageByCode[code]) {
    return { code, message: fallbackMessageByCode[code] };
  }

  return {
    code,
    message: explicitMessage || "Lookup Failed",
  };
}
