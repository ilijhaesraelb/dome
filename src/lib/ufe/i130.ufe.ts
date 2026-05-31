/**
 * I-130 — UFE form definition.
 *
 * Built from `FORM_SECTIONS["I-130"]` and `I130_KEY_TO_ACROFORM`.
 * Mapped widgets resolve their page via `TEMPLATE_OVERLAY_COORDS["I-130"]`
 * so the Review screen shows users exactly which official PDF widget
 * each answer will be written to.
 */
import { FORM_SECTIONS, type FormSection } from "@/data/formSections";
import { TEMPLATE_OVERLAY_COORDS } from "@/lib/pdf-template-coordinates";
import { buildUFEForm } from "./build-ufe";
import { I130_KEY_TO_ACROFORM } from "./i130-key-map";

const COORDS = TEMPLATE_OVERLAY_COORDS["I-130"] ?? {};
const RAW_SECTIONS = (FORM_SECTIONS as Record<string, FormSection[]>)["I-130"] ?? [];

export const I130_UFE = buildUFEForm({
  code: "I-130",
  title: "Petition for Alien Relative",
  totalPages: 12,
  renderer: "acroform",
  templatePath: "/templates/i-130.pdf",
  sections: RAW_SECTIONS,
  keyMap: I130_KEY_TO_ACROFORM,
  mappingKind: "acroform",
  resolvePage: (name) => {
    const c = COORDS[name];
    return c ? c.page + 1 : undefined;
  },
});