/**
 * Universal Form Engine (UFE) — Schema
 *
 * Single source of truth for every official immigration / tax / nonprofit
 * form supported by D.O.M.E. Each form is decomposed as:
 *
 *   UFEForm
 *     └── UFEPart        (Part 1, Part 2, ... matches official numbering)
 *           └── UFESection  (groups of related questions inside a Part)
 *                 └── UFEQuestion  (the atomic answer unit)
 *
 * Every UFEQuestion carries:
 *   - internal field key (used everywhere in the app)
 *   - official reference (page / part / item / line on the gov form)
 *   - mapping target (PDF field name OR overlay coordinate key)
 *   - validation rules
 *   - help content
 *   - conditional logic
 *
 * RULE: If the official form asks it, a UFEQuestion exists for it.
 * RULE: Internal app data === Review data === Preview data === Export data.
 */

export type UFEFieldType =
  | "text"
  | "longtext"
  | "date"
  | "select"
  | "checkbox"
  | "radio"
  | "yesno"
  | "number"
  | "phone"
  | "email"
  | "ssn"
  | "alien_number"
  | "signature";

export interface UFEFieldHelp {
  /** Plain-English explanation of what this field is. */
  what: string;
  /** Concrete example value. */
  example?: string;
  /** Important warning (red), e.g. "Wrong answer can cause denial". */
  warning?: string;
  /** Where to find the answer (e.g. "Top right of your I-94"). */
  whereToFind?: string;
}

export interface UFEOfficialRef {
  /** Official form code (e.g. "I-485"). */
  formCode: string;
  /** 1-indexed page number on the official PDF. */
  page: number;
  /** Part number (e.g. 1, 2, 14). */
  part: number;
  /** Item / line number string (e.g. "1.a", "23", "8.c"). */
  item: string;
}

export type UFEMappingTarget =
  /** Direct AcroForm field write (used by I-130, I-864, I-912). */
  | { kind: "acroform"; pdfFieldName: string }
  /** XFA fields filled via coordinate overlay (used by I-485, I-693, I-751, I-765). */
  | { kind: "overlay"; coordKey: string }
  /** Computed/derived field — emitted on additional info / continuation page. */
  | { kind: "continuation"; ref: string }
  /** Field exists internally but has no export mapping yet. */
  | { kind: "unmapped"; reason?: string };

export interface UFEConditional {
  /** Field key whose value drives this condition. */
  field: string;
  /** Show this question only when the driver field equals one of these values. */
  equals?: string[];
  /** Show only when the driver field is non-empty. */
  whenFilled?: boolean;
}

export interface UFEValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  /** Custom validator id (resolved at runtime). */
  custom?: string;
}

export interface UFEQuestion {
  /** Stable key used in app data store. Globally unique within form. */
  key: string;
  /** Human-facing question label. */
  label: string;
  type: UFEFieldType;
  placeholder?: string;
  /** Options for select/radio. */
  options?: string[];
  help?: UFEFieldHelp;
  /** Pointer back to the official form layout. */
  officialRef: UFEOfficialRef;
  /** Where this answer goes in the official export. */
  mapping: UFEMappingTarget;
  /** Field validation rules. */
  validation?: UFEValidation;
  /** Conditional visibility. */
  conditional?: UFEConditional;
  /** Repeating group id — questions sharing this id repeat together. */
  repeats?: string;
  /** Hint about evidence document tied to this answer. */
  evidenceHint?: string;
}

export interface UFESection {
  id: string;
  title: string;
  purpose: string;
  questions: UFEQuestion[];
  conditional?: UFEConditional;
}

export interface UFEPart {
  /** Part number on the official form (1, 2, 3, ...). */
  number: number;
  title: string;
  description?: string;
  sections: UFESection[];
}

export interface UFEForm {
  /** Official form code, e.g. "I-485". */
  code: string;
  /** Plain-English title. */
  title: string;
  /** Official form revision date / edition string. */
  edition?: string;
  /** Total pages on the official PDF. */
  totalPages: number;
  parts: UFEPart[];
  /** Optional template path for export. */
  templatePath?: string;
  /** Renderer strategy. */
  renderer: "acroform" | "overlay" | "synthetic" | "eoir";
}

/** Walk all UFEQuestions in a form. */
export function* iterateQuestions(form: UFEForm): Generator<UFEQuestion> {
  for (const part of form.parts) {
    for (const section of part.sections) {
      for (const q of section.questions) yield q;
    }
  }
}

/** Lookup question by key. */
export function findQuestion(form: UFEForm, key: string): UFEQuestion | undefined {
  for (const q of iterateQuestions(form)) {
    if (q.key === key) return q;
  }
  return undefined;
}

/** Count of every question in a form. */
export function countQuestions(form: UFEForm): number {
  let n = 0;
  for (const _ of iterateQuestions(form)) n++;
  return n;
}