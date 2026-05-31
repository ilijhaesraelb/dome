/**
 * I-485 — UFE form definition.
 *
 * Derived from `I485_SECTIONS` in `src/data/formSections.ts`. Each
 * `FormFieldDef` is converted to a `UFEQuestion`. Mapping targets are
 * resolved through `I485_KEY_TO_OVERLAY` so the Review/Preview surfaces
 * exactly which official PDF widget each answer will be stamped onto.
 *
 * Questions without a known overlay coord become `{ kind: "unmapped" }`
 * so the validator and UI can surface remaining gaps.
 */
import { FORM_SECTIONS, type FormFieldDef, type FormSection } from "@/data/formSections";
import { I485_OVERLAY_FIELDS } from "@/lib/i485-overlay-coords";
import { I485_KEY_TO_OVERLAY } from "./i485-key-map";
import type {
  UFEForm, UFEPart, UFESection, UFEQuestion, UFEFieldType, UFEMappingTarget,
} from "./schema";

const OVERLAY_INDEX = new Map(I485_OVERLAY_FIELDS.map((f) => [f.name, f]));

/** Map raw FormFieldDef.type → UFE field type. */
function toUFEType(t?: FormFieldDef["type"]): UFEFieldType {
  switch (t) {
    case "date": return "date";
    case "select": return "select";
    case "checkbox": return "checkbox";
    default: return "text";
  }
}

/** Best-effort derivation of (page, part, item) from a FormSection title. */
function parseRef(sectionTitle: string, fieldKey: string): { part: number; item: string; page: number } {
  const partMatch = /Part\s+(\d+)/i.exec(sectionTitle);
  const part = partMatch ? Number(partMatch[1]) : 0;
  const overlayName = I485_KEY_TO_OVERLAY[fieldKey];
  const overlay = overlayName ? OVERLAY_INDEX.get(overlayName) : undefined;
  const page = overlay ? overlay.page + 1 : 0;
  // Pull a "Line N" item number from the overlay name if present.
  const lineMatch = overlayName ? /Line(\d+[A-Za-z]?)/.exec(overlayName) : null;
  const item = lineMatch ? lineMatch[1] : "—";
  return { page, part, item };
}

function toMapping(fieldKey: string): UFEMappingTarget {
  const overlayName = I485_KEY_TO_OVERLAY[fieldKey];
  if (overlayName && OVERLAY_INDEX.has(overlayName)) {
    return { kind: "overlay", coordKey: overlayName };
  }
  return { kind: "unmapped", reason: "Pending overlay coord assignment for I-485." };
}

function toQuestion(field: FormFieldDef, sectionTitle: string): UFEQuestion {
  const ref = parseRef(sectionTitle, field.key);
  return {
    key: field.key,
    label: field.label,
    type: toUFEType(field.type),
    placeholder: field.placeholder,
    options: field.options,
    help: field.help
      ? { what: field.help.what, example: field.help.example, warning: field.help.warning }
      : undefined,
    officialRef: { formCode: "I-485", page: ref.page, part: ref.part, item: ref.item },
    mapping: toMapping(field.key),
    validation: { required: field.required === true },
    evidenceHint: field.evidenceHint,
  };
}

function toUFESection(section: FormSection): UFESection {
  return {
    id: section.id,
    title: section.title,
    purpose: section.purpose,
    questions: section.fields.map((f) => toQuestion(f, section.title)),
  };
}

/** Group sections into UFE Parts based on the "Part N" prefix in titles. */
function groupIntoParts(sections: FormSection[]): UFEPart[] {
  const buckets = new Map<number, { title: string; sections: UFESection[] }>();
  for (const s of sections) {
    const m = /Part\s+(\d+)/i.exec(s.title);
    const num = m ? Number(m[1]) : 0;
    if (!buckets.has(num)) {
      buckets.set(num, { title: m ? `Part ${num}` : "Other", sections: [] });
    }
    buckets.get(num)!.sections.push(toUFESection(s));
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([num, v]) => ({ number: num, title: v.title, sections: v.sections }));
}

const RAW_I485_SECTIONS = (FORM_SECTIONS as Record<string, FormSection[]>)["I-485"] ?? [];

export const I485_UFE: UFEForm = {
  code: "I-485",
  title: "Application to Register Permanent Residence or Adjust Status",
  totalPages: 24,
  renderer: "overlay",
  templatePath: "/templates/i-485.pdf",
  parts: groupIntoParts(RAW_I485_SECTIONS),
};