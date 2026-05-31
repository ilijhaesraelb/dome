/**
 * I-693 — UFE form definition.
 *
 * Built from `FORM_SECTIONS["I-693"]` and `I693_KEY_TO_ACROFORM`. Most
 * of the I-693 is filled by the civil surgeon during the medical exam;
 * UFE wires only the applicant-disclosed identity & medical notes.
 */
import { FORM_SECTIONS, type FormSection } from "@/data/formSections";
import { buildUFEForm } from "./build-ufe";
import { I693_KEY_TO_ACROFORM } from "./i693-key-map";

const RAW_SECTIONS = (FORM_SECTIONS as Record<string, FormSection[]>)["I-693"] ?? [];

export const I693_UFE = buildUFEForm({
  code: "I-693",
  title: "Report of Medical Examination and Vaccination Record",
  totalPages: 14,
  renderer: "acroform",
  templatePath: "/templates/i-693.pdf",
  sections: RAW_SECTIONS,
  keyMap: I693_KEY_TO_ACROFORM,
  mappingKind: "acroform",
});