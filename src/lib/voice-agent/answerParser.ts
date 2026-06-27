/**
 * Speech-to-structured-value parser for the D.O.M.E. voice agent.
 * Converts raw voice transcripts into clean, typed form field values.
 *
 * Security: sensitive fields (SSN, A-number, passport, EIN, receipt numbers)
 * are flagged and masked — never echoed aloud by default.
 */

// ── Sensitive fields ─────────────────────────────────────────────────────────
// Values for these keys are masked in the UI and never spoken aloud
export const SENSITIVE_FIELD_KEYS = new Set([
  "alien_number",
  "petitioner_alien_number",
  "beneficiary_alien_number",
  "ssn",
  "social_security_number",
  "passport_number",
  "passport_no",
  "tax_id",
  "ein",
  "uscis_receipt_number",
  "i94_number",
  "visa_number",
  "receipt_number",
  "petitioner_ssn",
]);

export function isSensitiveField(fieldKey: string): boolean {
  return SENSITIVE_FIELD_KEYS.has(fieldKey.toLowerCase());
}

export function maskValue(value: string, fieldKey: string): string {
  const k = fieldKey.toLowerCase();
  if (k.includes("ssn") || k.includes("social_security")) {
    // Show only last 4: e.g. •••-••-6789
    return value.replace(/\d(?=[\d-]{4}$)/g, "•");
  }
  if (k.includes("alien_number") || k === "a_number") {
    return "A" + "•".repeat(6) + value.slice(-2);
  }
  if (k.includes("passport") || k.includes("visa_number")) {
    return value.slice(0, 2) + "•".repeat(Math.max(0, value.length - 4)) + value.slice(-2);
  }
  if (k === "ein" || k.includes("tax_id")) {
    return value.slice(0, 2) + "-" + "•".repeat(7);
  }
  return value;
}

// ── Date parsing ─────────────────────────────────────────────────────────────
const MONTH_MAP: Record<string, string> = {
  january: "01", jan: "01", february: "02", feb: "02", march: "03", mar: "03",
  april: "04", apr: "04", may: "05", june: "06", jun: "06",
  july: "07", jul: "07", august: "08", aug: "08",
  september: "09", sep: "09", sept: "09", october: "10", oct: "10",
  november: "11", nov: "11", december: "12", dec: "12",
};

const ORDINAL_MAP: Record<string, string> = {
  first: "01", second: "02", third: "03", fourth: "04", fifth: "05",
  sixth: "06", seventh: "07", eighth: "08", ninth: "09", tenth: "10",
  eleventh: "11", twelfth: "12", thirteenth: "13", fourteenth: "14",
  fifteenth: "15", sixteenth: "16", seventeenth: "17", eighteenth: "18",
  nineteenth: "19", twentieth: "20",
  "twenty-first": "21", "twenty first": "21",
  "twenty-second": "22", "twenty second": "22",
  "twenty-third": "23", "twenty third": "23",
  "twenty-fourth": "24", "twenty fourth": "24",
  "twenty-fifth": "25", "twenty fifth": "25",
  "twenty-sixth": "26", "twenty sixth": "26",
  "twenty-seventh": "27", "twenty seventh": "27",
  "twenty-eighth": "28", "twenty eighth": "28",
  "twenty-ninth": "29", "twenty ninth": "29",
  thirtieth: "30", "thirty-first": "31", "thirty first": "31",
};

export function parseDate(text: string): string | null {
  const t = text.toLowerCase().trim();

  // MM/DD/YYYY or MM-DD-YYYY
  const slash = t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slash) {
    const [, m, d, y] = slash;
    return `${m.padStart(2, "0")}/${d.padStart(2, "0")}/${y}`;
  }

  // "Month Day Year" — e.g. "March 15 1985" or "march fifteenth 1985"
  const words = t.split(/[\s,]+/);
  if (words.length >= 3) {
    const month = MONTH_MAP[words[0]];
    if (month) {
      const rawDay = words[1].replace(/st$|nd$|rd$|th$/i, "");
      const day = ORDINAL_MAP[rawDay] ?? rawDay.padStart(2, "0");
      const year = words[words.length - 1];
      if (/^\d{4}$/.test(year) && /^\d{1,2}$/.test(day.replace(/•/g, ""))) {
        return `${month}/${day}/${year}`;
      }
    }
  }

  return null;
}

// ── A-Number parsing ─────────────────────────────────────────────────────────
export function parseAlienNumber(text: string): string | null {
  const cleaned = text.replace(/\s+/g, "").toUpperCase();
  // "A012345678" or "012345678" or "A 012 345 678"
  const match = cleaned.match(/A?(\d{7,9})/);
  if (match) return `A${match[1].padStart(9, "0")}`;
  return null;
}

// ── SSN parsing ──────────────────────────────────────────────────────────────
export function parseSSN(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }
  return null;
}

// ── EIN parsing ──────────────────────────────────────────────────────────────
export function parseEIN(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  if (digits.length === 9) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return null;
}

// ── State name → abbreviation ────────────────────────────────────────────────
const STATE_MAP: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR",
  california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS",
  kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
  "new york": "NY", "north carolina": "NC", "north dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA",
  "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY", "district of columbia": "DC",
  "washington dc": "DC", "washington d.c.": "DC",
};

export function parseState(text: string): string {
  const lower = text.toLowerCase().trim();
  return STATE_MAP[lower] ?? text.trim().toUpperCase().slice(0, 2);
}

// ── ZIP ───────────────────────────────────────────────────────────────────────
export function parseZip(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  if (digits.length === 5) return digits;
  if (digits.length === 9) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return null;
}

// ── Title case ───────────────────────────────────────────────────────────────
export function toTitleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ── Unified parser ────────────────────────────────────────────────────────────
export interface ParsedAnswer {
  raw: string;       // raw transcript
  value: string;     // cleaned value to store
  masked: string;    // display-safe version (redacted if sensitive)
  sensitive: boolean;
}

export function parseAnswer(
  transcript: string,
  fieldKey: string,
  fieldType?: string
): ParsedAnswer {
  const key = fieldKey.toLowerCase();
  let value = transcript.trim();

  if (fieldType === "date" || key.includes("date") || key === "date_of_birth" || key.includes("_dob")) {
    value = parseDate(transcript) ?? value;
  } else if (key.includes("alien_number")) {
    value = parseAlienNumber(transcript) ?? value;
  } else if (key.includes("ssn") || key.includes("social_security")) {
    value = parseSSN(transcript) ?? value;
  } else if (key === "ein") {
    value = parseEIN(transcript) ?? value;
  } else if (key === "state" || key.endsWith("_state") || key === "state_of_residence" || key === "org_state") {
    value = parseState(transcript);
  } else if (key === "zip" || key.includes("zip")) {
    value = parseZip(transcript) ?? value;
  } else if (key.includes("name") || key.includes("country") || key.includes("city")) {
    value = toTitleCase(transcript);
  }

  const sensitive = isSensitiveField(fieldKey);
  const masked = sensitive ? maskValue(value, fieldKey) : value;

  return { raw: transcript, value, masked, sensitive };
}
