/**
 * I-751 — UFE form definition.
 *
 * Built from `FORM_SECTIONS["I-751"]` and `I751_KEY_TO_ACROFORM`.
 */
import { FORM_SECTIONS, type FormSection } from "@/data/formSections";
import { buildUFEForm } from "./build-ufe";
import { I751_KEY_TO_ACROFORM } from "./i751-key-map";

const RAW_SECTIONS = (FORM_SECTIONS as Record<string, FormSection[]>)["I-751"] ?? [];

export const I751_UFE = buildUFEForm({
  code: "I-751",
  title: "Petition to Remove Conditions on Residence",
  totalPages: 11,
  renderer: "acroform",
  templatePath: "/templates/i-751.pdf",
  sections: RAW_SECTIONS,
  keyMap: I751_KEY_TO_ACROFORM,
  mappingKind: "acroform",
});