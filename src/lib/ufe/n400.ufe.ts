/**
 * N-400 — UFE form definition.
 *
 * Built from `FORM_SECTIONS["N-400"]` and `N400_KEY_TO_ACROFORM`. The
 * N-400 PDF accepts AcroForm writes via pdf-lib's safe-loading
 * pipeline.
 */
import { FORM_SECTIONS, type FormSection } from "@/data/formSections";
import { buildUFEForm } from "./build-ufe";
import { N400_KEY_TO_ACROFORM } from "./n400-key-map";

const RAW_SECTIONS = (FORM_SECTIONS as Record<string, FormSection[]>)["N-400"] ?? [];

export const N400_UFE = buildUFEForm({
  code: "N-400",
  title: "Application for Naturalization",
  totalPages: 20,
  renderer: "acroform",
  templatePath: "/templates/n-400.pdf",
  sections: RAW_SECTIONS,
  keyMap: N400_KEY_TO_ACROFORM,
  mappingKind: "acroform",
});