/**
 * I-912 — UFE form definition.
 *
 * Built from `FORM_SECTIONS["I-912"]` and `I912_KEY_TO_ACROFORM`.
 */
import { FORM_SECTIONS, type FormSection } from "@/data/formSections";
import { TEMPLATE_OVERLAY_COORDS } from "@/lib/pdf-template-coordinates";
import { buildUFEForm } from "./build-ufe";
import { I912_KEY_TO_ACROFORM } from "./i912-key-map";

const COORDS = TEMPLATE_OVERLAY_COORDS["I-912"] ?? {};
const RAW_SECTIONS = (FORM_SECTIONS as Record<string, FormSection[]>)["I-912"] ?? [];

export const I912_UFE = buildUFEForm({
  code: "I-912",
  title: "Request for Fee Waiver",
  totalPages: 11,
  renderer: "acroform",
  templatePath: "/templates/i-912.pdf",
  sections: RAW_SECTIONS,
  keyMap: I912_KEY_TO_ACROFORM,
  mappingKind: "acroform",
  resolvePage: (name) => {
    const c = COORDS[name];
    return c ? c.page + 1 : undefined;
  },
});