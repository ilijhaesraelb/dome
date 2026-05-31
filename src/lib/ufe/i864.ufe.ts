/**
 * I-864 — UFE form definition.
 *
 * Built from `FORM_SECTIONS["I-864"]` and `I864_KEY_TO_ACROFORM`.
 */
import { FORM_SECTIONS, type FormSection } from "@/data/formSections";
import { TEMPLATE_OVERLAY_COORDS } from "@/lib/pdf-template-coordinates";
import { buildUFEForm } from "./build-ufe";
import { I864_KEY_TO_ACROFORM } from "./i864-key-map";

const COORDS = TEMPLATE_OVERLAY_COORDS["I-864"] ?? {};
const RAW_SECTIONS = (FORM_SECTIONS as Record<string, FormSection[]>)["I-864"] ?? [];

export const I864_UFE = buildUFEForm({
  code: "I-864",
  title: "Affidavit of Support Under Section 213A of the INA",
  totalPages: 10,
  renderer: "acroform",
  templatePath: "/templates/i-864.pdf",
  sections: RAW_SECTIONS,
  keyMap: I864_KEY_TO_ACROFORM,
  mappingKind: "acroform",
  resolvePage: (name) => {
    const c = COORDS[name];
    return c ? c.page + 1 : undefined;
  },
});