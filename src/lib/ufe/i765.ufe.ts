/**
 * I-765 — UFE form definition.
 *
 * The official I-765 is XFA, so internal answers are exported via the
 * coordinate-overlay renderer. Page numbers are resolved through
 * `TEMPLATE_OVERLAY_COORDS["I-765"]` so the Review screen surfaces the
 * exact official-PDF page each answer will be stamped onto.
 */
import { FORM_SECTIONS, type FormSection } from "@/data/formSections";
import { TEMPLATE_OVERLAY_COORDS } from "@/lib/pdf-template-coordinates";
import { buildUFEForm } from "./build-ufe";
import { I765_KEY_TO_OVERLAY } from "./i765-key-map";

const COORDS = TEMPLATE_OVERLAY_COORDS["I-765"] ?? {};
const RAW_SECTIONS = (FORM_SECTIONS as Record<string, FormSection[]>)["I-765"] ?? [];

export const I765_UFE = buildUFEForm({
  code: "I-765",
  title: "Application for Employment Authorization",
  totalPages: 7,
  renderer: "overlay",
  templatePath: "/templates/i-765.pdf",
  sections: RAW_SECTIONS,
  keyMap: I765_KEY_TO_OVERLAY,
  mappingKind: "overlay",
  resolvePage: (name) => {
    const c = COORDS[name];
    return c ? c.page + 1 : undefined;
  },
});