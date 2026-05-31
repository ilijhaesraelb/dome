/**
 * UFE Registry — single lookup point for every wired form definition.
 *
 * Allows the FormWorkspace and Review screen to resolve `form_type → UFEForm`
 * without hard-coding which forms are wired. New forms are added simply by
 * importing them here.
 */
import type { UFEForm } from "./schema";
import { I485_UFE } from "./i485.ufe";
import { I130_UFE } from "./i130.ufe";
import { I864_UFE } from "./i864.ufe";
import { I912_UFE } from "./i912.ufe";
import { I765_UFE } from "./i765.ufe";
import { N400_UFE } from "./n400.ufe";
import { I751_UFE } from "./i751.ufe";
import { I693_UFE } from "./i693.ufe";

const FORMS: UFEForm[] = [
  I485_UFE,
  I130_UFE,
  I864_UFE,
  I912_UFE,
  I765_UFE,
  N400_UFE,
  I751_UFE,
  I693_UFE,
];

const REGISTRY: Record<string, UFEForm> = FORMS.reduce(
  (acc, f) => ({ ...acc, [f.code]: f }),
  {} as Record<string, UFEForm>,
);

/** Resolve a UFE definition by official form code (e.g. "I-130"). */
export function getUFEForm(formCode: string | undefined | null): UFEForm | undefined {
  if (!formCode) return undefined;
  return REGISTRY[formCode];
}

/** All wired UFE forms. */
export function listUFEForms(): UFEForm[] {
  return FORMS;
}