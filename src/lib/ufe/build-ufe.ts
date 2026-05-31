/**
 * Generic UFE Builder
 *
 * Converts a list of `FormSection` (from `formSections.ts`) into a fully
 * structured `UFEForm`. Used by every UFE definition (I-485, I-130,
 * I-864, I-912, ...) so that internal data, Review screen, Preview, and
 * Export are all driven from the same canonical schema.
 *
 * The caller supplies a `keyMap` that tells the builder, for each
 * internal field key, the official PDF widget name (AcroForm or XFA
 * overlay). Keys not in the map are tracked as `unmapped` so the
 * validator can surface remaining gaps before export.
 */
import type { FormFieldDef, FormSection } from "@/data/formSections";
import type {
  UFEForm,
  UFEPart,
  UFESection,
  UFEQuestion,
  UFEFieldType,
  UFEMappingTarget,
} from "./schema";

export type UFEMappingKind = "acroform" | "overlay";

export interface UFEBuilderOptions {
  /** Official form code, e.g. "I-130". */
  code: string;
  /** Plain-English title. */
  title: string;
  /** Total pages on the official PDF. */
  totalPages: number;
  /** Renderer strategy used when exporting the form. */
  renderer: UFEForm["renderer"];
  /** Optional template path. */
  templatePath?: string;
  /** Sections from `FORM_SECTIONS[<code>]`. */
  sections: FormSection[];
  /** Internal field key → official PDF widget name. */
  keyMap: Record<string, string>;
  /**
   * Tells the builder whether mapped widgets are AcroForm fields
   * (direct PDFForm.setText) or XFA overlay coords (stamped at fixed
   * positions on the flattened template).
   */
  mappingKind: UFEMappingKind;
  /**
   * Optional resolver returning the official-PDF page number (1-indexed)
   * for a mapped widget name. Used to populate `officialRef.page`.
   */
  resolvePage?: (widgetName: string) => number | undefined;
}

function toUFEType(t?: FormFieldDef["type"]): UFEFieldType {
  switch (t) {
    case "date": return "date";
    case "select": return "select";
    case "checkbox": return "checkbox";
    default: return "text";
  }
}

/** Pull "Line N[a-z]?" from an XFA / AcroForm widget name. */
function extractItem(widgetName: string | undefined): string {
  if (!widgetName) return "—";
  const m = /Line\s*(\d+[A-Za-z]?)/i.exec(widgetName);
  return m ? m[1] : "—";
}

function buildQuestion(
  field: FormFieldDef,
  sectionTitle: string,
  options: UFEBuilderOptions,
): UFEQuestion {
  const partMatch = /Part\s+(\d+)/i.exec(sectionTitle);
  const part = partMatch ? Number(partMatch[1]) : 0;
  const widgetName = options.keyMap[field.key];
  const page = widgetName && options.resolvePage
    ? (options.resolvePage(widgetName) ?? 0)
    : 0;

  let mapping: UFEMappingTarget;
  if (widgetName) {
    mapping = options.mappingKind === "overlay"
      ? { kind: "overlay", coordKey: widgetName }
      : { kind: "acroform", pdfFieldName: widgetName };
  } else {
    mapping = { kind: "unmapped", reason: `Pending widget assignment for ${options.code}.` };
  }

  return {
    key: field.key,
    label: field.label,
    type: toUFEType(field.type),
    placeholder: field.placeholder,
    options: field.options,
    help: field.help
      ? {
          what: field.help.what,
          example: field.help.example,
          warning: field.help.warning,
          whereToFind: field.help.whereToFind,
        }
      : undefined,
    officialRef: {
      formCode: options.code,
      page,
      part,
      item: extractItem(widgetName),
    },
    mapping,
    validation: { required: field.required === true },
    evidenceHint: field.evidenceHint,
  };
}

function buildSection(section: FormSection, options: UFEBuilderOptions): UFESection {
  return {
    id: section.id,
    title: section.title,
    purpose: section.purpose,
    questions: section.fields.map((f) => buildQuestion(f, section.title, options)),
  };
}

function groupIntoParts(sections: FormSection[], options: UFEBuilderOptions): UFEPart[] {
  const buckets = new Map<number, { title: string; sections: UFESection[] }>();
  for (const s of sections) {
    const m = /Part\s+(\d+)/i.exec(s.title);
    const num = m ? Number(m[1]) : 0;
    if (!buckets.has(num)) {
      buckets.set(num, { title: m ? `Part ${num}` : "Other", sections: [] });
    }
    buckets.get(num)!.sections.push(buildSection(s, options));
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([num, v]) => ({ number: num, title: v.title, sections: v.sections }));
}

/** Build a complete `UFEForm` from sections + a key map. */
export function buildUFEForm(options: UFEBuilderOptions): UFEForm {
  return {
    code: options.code,
    title: options.title,
    totalPages: options.totalPages,
    renderer: options.renderer,
    templatePath: options.templatePath,
    parts: groupIntoParts(options.sections, options),
  };
}