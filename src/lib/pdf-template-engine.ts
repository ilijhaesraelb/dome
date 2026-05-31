/**
 * D.O.M.E. PDF Template Engine
 * 
 * Uses pdf-lib to load official USCIS PDF templates and fill form fields
 * with case data from the D.O.M.E. canonical data graph.
 * 
 * COMPLIANCE: Generated forms are "prepared for review" and must be
 * reviewed before filing. D.O.M.E. does not guarantee acceptance.
 */

import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown, StandardFonts, rgb } from "pdf-lib";
import { TEMPLATE_OVERLAY_COORDS } from "./pdf-template-coordinates";
import { FIELD_KEY_TO_DATA_PATH } from "@/data/formSections";

async function loadTemplateBytesFromXhr(url: string, fallbackError?: unknown): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
        resolve(xhr.response as ArrayBuffer);
        return;
      }

      reject(
        new Error(
          xhr.statusText ? `Failed to load template: ${xhr.statusText}` : fallbackError instanceof Error ? fallbackError.message : "Failed to fetch",
        ),
      );
    };

    xhr.onerror = () => {
      reject(fallbackError instanceof Error ? fallbackError : new Error("Failed to fetch"));
    };

    xhr.send();
  });
}

async function loadTemplateBytes(templatePath: string): Promise<ArrayBuffer> {
  const normalizedPath = templatePath.startsWith("/") ? templatePath : `/${templatePath}`;

  if (typeof window !== "undefined") {
    const resolvedUrl = new URL(normalizedPath, window.location.origin).toString();

    try {
      const response = await fetch(resolvedUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed to load template: ${response.statusText}`);
      return response.arrayBuffer();
    } catch (error) {
      console.warn(`[PDF] fetch failed for ${resolvedUrl}; retrying with XHR fallback`, error);
      return loadTemplateBytesFromXhr(resolvedUrl, error);
    }
  }

  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const buffer = await readFile(resolve(process.cwd(), `public${normalizedPath}`));
  return Uint8Array.from(buffer).buffer;
}

async function loadPdfDocumentSafely(templatePath: string): Promise<PDFDocument> {
  const templateBytes = await loadTemplateBytes(templatePath);

  try {
    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
    pdfDoc.getPageCount();
    return pdfDoc;
  } catch (primaryError) {
    const repairedPath = templatePath.replace(/\.pdf$/i, ".pypdf.pdf");

    if (repairedPath === templatePath) {
      throw primaryError;
    }

    try {
      const repairedBytes = await loadTemplateBytes(repairedPath);
      const repairedDoc = await PDFDocument.load(repairedBytes, { ignoreEncryption: true });
      repairedDoc.getPageCount();
      return repairedDoc;
    } catch {
      throw primaryError;
    }
  }
}

// ── Template registry: maps form codes to local template paths ──
export const TEMPLATE_REGISTRY: Record<string, {
  path: string;
  formTitle: string;
  editionDate: string;
  totalPages: number;
}> = {
  "I-130": {
    path: "/templates/i-130.pdf",
    formTitle: "Petition for Alien Relative",
    editionDate: "12/10/24",
    totalPages: 12,
  },
  "I-485": {
    path: "/templates/i-485.pdf",
    formTitle: "Application to Register Permanent Residence or Adjust Status",
    editionDate: "01/20/25",
    totalPages: 20,
  },
  "I-765": {
    path: "/templates/i-765.pdf",
    formTitle: "Application for Employment Authorization",
    editionDate: "08/21/25",
    totalPages: 7,
  },
  "I-864": {
    path: "/templates/i-864.pdf",
    formTitle: "Affidavit of Support Under Section 213A of the INA",
    editionDate: "10/17/24",
    totalPages: 12,
  },
  "I-912": {
    path: "/templates/i-912.pdf",
    formTitle: "Request for Fee Waiver",
    editionDate: "07/22/25",
    totalPages: 8,
  },
  "I-693": {
    path: "/templates/i-693.pdf",
    formTitle: "Report of Medical Examination and Vaccination Record",
    editionDate: "03/01/24",
    totalPages: 8,
  },
  "I-751": {
    path: "/templates/i-751.pdf",
    formTitle: "Petition to Remove Conditions on Residence",
    editionDate: "03/14/22",
    totalPages: 11,
  },
};

export type FieldMapping = {
  pdfFieldName: string;
  internalPath: string;
  fieldType: "text" | "checkbox" | "dropdown" | "date";
  required?: boolean;
  transform?: "uppercase" | "date_mmddyyyy" | "yes_no" | "none";
  checkedValue?: string;
};

// ══════════════════════════════════════════════════════════════════
// I-130 FIELD MAPPINGS — extracted from actual uploaded PDF (450 fields)
// ══════════════════════════════════════════════════════════════════

const I130_MAPPINGS: FieldMapping[] = [
  // ── Page 1: Part 1 (Relationship) & Part 2 Start (Petitioner Info) ──
  { pdfFieldName: "form1[0].#subform[0].Pt1Line1_Spouse[0]", internalPath: "petition.relationship_spouse", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line1_Parent[0]", internalPath: "petition.relationship_parent", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line1_Siblings[0]", internalPath: "petition.relationship_sibling", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line1_Child[0]", internalPath: "petition.relationship_child", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line2_InWedlock[0]", internalPath: "petition.child_in_wedlock", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line2_Stepchild[0]", internalPath: "petition.child_stepchild", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line2_OutOfWedlock[0]", internalPath: "petition.child_out_of_wedlock", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line2_AdoptedChild[0]", internalPath: "petition.child_adopted", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line3_Yes[0]", internalPath: "petition.line3_yes", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line3_No[0]", internalPath: "petition.line3_no", fieldType: "checkbox", checkedValue: "/N" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line4_Yes[0]", internalPath: "petition.line4_yes", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line4_No[0]", internalPath: "petition.line4_no", fieldType: "checkbox", checkedValue: "/N" },
  { pdfFieldName: "form1[0].#subform[0].#area[4].Pt2Line1_AlienNumber[0]", internalPath: "petitioner.alien_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].#area[5].Pt2Line2_USCISOnlineActNumber[0]", internalPath: "petitioner.uscis_account_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].USCISOnlineAcctNumber[0]", internalPath: "petitioner.uscis_online_account", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].Pt2Line4a_FamilyName[0]", internalPath: "petitioner.last_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt2Line4b_GivenName[0]", internalPath: "petitioner.first_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt2Line4c_MiddleName[0]", internalPath: "petitioner.middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt2Line11_SSN[0]", internalPath: "petitioner.ssn", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].VolagNumber[0]", internalPath: "petitioner.volag_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].AttorneyStateBarNumber[0]", internalPath: "preparer.bar_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].CheckBox1[0]", internalPath: "petition.attorney_checkbox", fieldType: "checkbox", checkedValue: "/1" },
  // ── Page 2: Petitioner continued ──
  { pdfFieldName: "form1[0].#subform[1].Pt2Line5a_FamilyName[0]", internalPath: "petitioner.other_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line5b_GivenName[0]", internalPath: "petitioner.other_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line5c_MiddleName[0]", internalPath: "petitioner.other_middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line6_CityTownOfBirth[0]", internalPath: "petitioner.city_of_birth", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line7_CountryofBirth[0]", internalPath: "petitioner.country_of_birth", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line8_DateofBirth[0]", internalPath: "petitioner.date_of_birth", fieldType: "date", required: true, transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line9_Male[0]", internalPath: "petitioner.gender_male", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line9_Female[0]", internalPath: "petitioner.gender_female", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line10_InCareofName[0]", internalPath: "petitioner.address.care_of", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line10_StreetNumberName[0]", internalPath: "petitioner.address.street", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line10_Unit[0]", internalPath: "petitioner.address.unit_apt", fieldType: "checkbox", checkedValue: "/APT" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line10_Unit[1]", internalPath: "petitioner.address.unit_ste", fieldType: "checkbox", checkedValue: "/STE" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line10_Unit[2]", internalPath: "petitioner.address.unit_flr", fieldType: "checkbox", checkedValue: "/FLR" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line10_AptSteFlrNumber[0]", internalPath: "petitioner.address.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line10_CityOrTown[0]", internalPath: "petitioner.address.city", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line10_State[0]", internalPath: "petitioner.address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line10_ZipCode[0]", internalPath: "petitioner.address.zip", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line10_Province[0]", internalPath: "petitioner.address.province", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line10_PostalCode[0]", internalPath: "petitioner.address.postal_code", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line10_Country[0]", internalPath: "petitioner.address.country", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line11_Yes[0]", internalPath: "petitioner.same_address_yes", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line11_No[0]", internalPath: "petitioner.same_address_no", fieldType: "checkbox", checkedValue: "/N" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line12_StreetNumberName[0]", internalPath: "petitioner.physical_address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line12_Unit[0]", internalPath: "petitioner.physical_address.unit_apt", fieldType: "checkbox", checkedValue: "/ APT " },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line12_Unit[1]", internalPath: "petitioner.physical_address.unit_ste", fieldType: "checkbox", checkedValue: "/ STE " },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line12_Unit[2]", internalPath: "petitioner.physical_address.unit_flr", fieldType: "checkbox", checkedValue: "/ FLR " },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line12_AptSteFlrNumber[0]", internalPath: "petitioner.physical_address.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line12_CityOrTown[0]", internalPath: "petitioner.physical_address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line12_State[0]", internalPath: "petitioner.physical_address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line12_ZipCode[0]", internalPath: "petitioner.physical_address.zip", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line12_Province[0]", internalPath: "petitioner.physical_address.province", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line12_PostalCode[0]", internalPath: "petitioner.physical_address.postal_code", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line12_Country[0]", internalPath: "petitioner.physical_address.country", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line13a_DateFrom[0]", internalPath: "petitioner.physical_address.date_from", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line13b_DateTo[0]", internalPath: "petitioner.physical_address.date_to", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line16_NumberofMarriages[0]", internalPath: "petitioner.number_of_marriages", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line17_Single[0]", internalPath: "petitioner.marital_single", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line17_Married[0]", internalPath: "petitioner.marital_married", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line17_Divorced[0]", internalPath: "petitioner.marital_divorced", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line17_Widowed[0]", internalPath: "petitioner.marital_widowed", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line17_Separated[0]", internalPath: "petitioner.marital_separated", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[1].Pt2Line17_Annulled[0]", internalPath: "petitioner.marital_annulled", fieldType: "checkbox", checkedValue: "/Y" },
  // ── Page 3: Marriage, spouse, parents ──
  { pdfFieldName: "form1[0].#subform[2].Pt2Line18_DateOfMarriage[0]", internalPath: "petitioner.date_of_marriage", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line19a_CityTown[0]", internalPath: "petitioner.marriage_city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line19b_State[0]", internalPath: "petitioner.marriage_state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line19c_Province[0]", internalPath: "petitioner.marriage_province", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line19d_Country[0]", internalPath: "petitioner.marriage_country", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].PtLine20a_FamilyName[0]", internalPath: "petitioner.prior_spouse_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line20b_GivenName[0]", internalPath: "petitioner.prior_spouse_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line20c_MiddleName[0]", internalPath: "petitioner.prior_spouse_middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line21_DateMarriageEnded[0]", internalPath: "petitioner.prior_marriage_ended_date", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line24_FamilyName[0]", internalPath: "petitioner.parent1_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line24_GivenName[0]", internalPath: "petitioner.parent1_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line24_MiddleName[0]", internalPath: "petitioner.parent1_middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line25_DateofBirth[0]", internalPath: "petitioner.parent1_dob", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line26_Male[0]", internalPath: "petitioner.parent1_male", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line26_Female[0]", internalPath: "petitioner.parent1_female", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line27_CountryofBirth[0]", internalPath: "petitioner.parent1_country_of_birth", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line30a_FamilyName[0]", internalPath: "petitioner.parent2_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line30b_GivenName[0]", internalPath: "petitioner.parent2_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line30c_MiddleName[0]", internalPath: "petitioner.parent2_middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line36_USCitizen[0]", internalPath: "petitioner.is_us_citizen", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line36_LPR[0]", internalPath: "petitioner.is_lpr", fieldType: "checkbox", checkedValue: "/N" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line37a_CertificateNumber[0]", internalPath: "petitioner.certificate_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line37b_PlaceOfIssuance[0]", internalPath: "petitioner.certificate_place", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].Pt2Line37c_DateOfIssuance[0]", internalPath: "petitioner.certificate_date", fieldType: "date", transform: "date_mmddyyyy" },
  // ── Page 4: Petitioner Immigration & Employment ──
  { pdfFieldName: "form1[0].#subform[3].Pt2Line40a_ClassOfAdmission[0]", internalPath: "petitioner.class_of_admission", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[3].Pt2Line40b_DateOfAdmission[0]", internalPath: "petitioner.date_of_admission", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[3].Pt2Line44_EmployerOrOrgName[0]", internalPath: "petitioner.employer_name", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[3].Pt2Line45_StreetNumberName[0]", internalPath: "petitioner.employer_address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[3].Pt2Line45_CityOrTown[0]", internalPath: "petitioner.employer_address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[3].Pt2Line45_State[0]", internalPath: "petitioner.employer_address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[3].Pt2Line45_ZipCode[0]", internalPath: "petitioner.employer_address.zip", fieldType: "text" },
  // ── Page 5: Part 4 - Beneficiary Info ──
  { pdfFieldName: "form1[0].#subform[4].#area[6].Pt4Line1_AlienNumber[0]", internalPath: "beneficiary.alien_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].#area[7].Pt4Line2_USCISOnlineActNumber[0]", internalPath: "beneficiary.uscis_account_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line3_SSN[0]", internalPath: "beneficiary.ssn", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line4a_FamilyName[0]", internalPath: "beneficiary.last_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line4b_GivenName[0]", internalPath: "beneficiary.first_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line4c_MiddleName[0]", internalPath: "beneficiary.middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[4].P4Line5a_FamilyName[0]", internalPath: "beneficiary.other_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line5b_GivenName[0]", internalPath: "beneficiary.other_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line5c_MiddleName[0]", internalPath: "beneficiary.other_middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line7_CityTownOfBirth[0]", internalPath: "beneficiary.city_of_birth", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line8_CountryOfBirth[0]", internalPath: "beneficiary.country_of_birth", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line9_DateOfBirth[0]", internalPath: "beneficiary.date_of_birth", fieldType: "date", required: true, transform: "date_mmddyyyy" },
  // ── PHANTOMS REPAIRED 2026-04-20 — line numbers corrected to match actual USCIS PDF (12/10/24 ed.) ──
  // Beneficiary gender: actual fields are Pt4Line9_Male/Female (NOT Line10). Line10 is "ever in immigration proceedings" Yes/No/Unknown.
  { pdfFieldName: "form1[0].#subform[4].Pt4Line9_Male[0]", internalPath: "beneficiary.gender_male", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line9_Female[0]", internalPath: "beneficiary.gender_female", fieldType: "checkbox", checkedValue: "/Y" },
  // Line 10: Has the beneficiary EVER been in immigration proceedings?
  { pdfFieldName: "form1[0].#subform[4].Pt4Line10_Yes[0]", internalPath: "beneficiary.in_proceedings_yes", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line10_No[0]", internalPath: "beneficiary.in_proceedings_no", fieldType: "checkbox", checkedValue: "/N" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line10_Unknown[0]", internalPath: "beneficiary.in_proceedings_unknown", fieldType: "checkbox", checkedValue: "/U" },
  // Line 11: Beneficiary current physical address (was incorrectly mapped to Line15a-i — those don't exist)
  { pdfFieldName: "form1[0].#subform[4].Pt4Line11_StreetNumberName[0]", internalPath: "beneficiary.address.street", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line11_Unit[0]", internalPath: "beneficiary.address.unit_apt", fieldType: "checkbox", checkedValue: "/APT" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line11_Unit[1]", internalPath: "beneficiary.address.unit_ste", fieldType: "checkbox", checkedValue: "/STE" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line11_Unit[2]", internalPath: "beneficiary.address.unit_flr", fieldType: "checkbox", checkedValue: "/FLR" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line11_AptSteFlrNumber[0]", internalPath: "beneficiary.address.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line11_CityOrTown[0]", internalPath: "beneficiary.address.city", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line11_State[0]", internalPath: "beneficiary.address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line11_ZipCode[0]", internalPath: "beneficiary.address.zip", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line11_Province[0]", internalPath: "beneficiary.address.province", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line11_PostalCode[0]", internalPath: "beneficiary.address.postal_code", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line11_Country[0]", internalPath: "beneficiary.address.country", fieldType: "text", required: true },
  // Line 12: Beneficiary safe mailing address (often a relative/attorney)
  { pdfFieldName: "form1[0].#subform[4].Pt4Line12a_StreetNumberName[0]", internalPath: "beneficiary.safe_address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line12b_Unit[0]", internalPath: "beneficiary.safe_address.unit_apt", fieldType: "checkbox", checkedValue: "/APT" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line12b_Unit[1]", internalPath: "beneficiary.safe_address.unit_ste", fieldType: "checkbox", checkedValue: "/STE" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line12b_Unit[2]", internalPath: "beneficiary.safe_address.unit_flr", fieldType: "checkbox", checkedValue: "/FLR" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line12b_AptSteFlrNumber[0]", internalPath: "beneficiary.safe_address.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line12c_CityOrTown[0]", internalPath: "beneficiary.safe_address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line12d_State[0]", internalPath: "beneficiary.safe_address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line12e_ZipCode[0]", internalPath: "beneficiary.safe_address.zip", fieldType: "text" },
  // Line 13: Beneficiary mailing address abroad
  { pdfFieldName: "form1[0].#subform[4].Pt4Line13_StreetNumberName[0]", internalPath: "beneficiary.mailing_abroad.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line13_Unit[0]", internalPath: "beneficiary.mailing_abroad.unit_apt", fieldType: "checkbox", checkedValue: "/APT" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line13_Unit[1]", internalPath: "beneficiary.mailing_abroad.unit_ste", fieldType: "checkbox", checkedValue: "/STE" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line13_Unit[2]", internalPath: "beneficiary.mailing_abroad.unit_flr", fieldType: "checkbox", checkedValue: "/FLR" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line13_AptSteFlrNumber[0]", internalPath: "beneficiary.mailing_abroad.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line13_CityOrTown[0]", internalPath: "beneficiary.mailing_abroad.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line13_Province[0]", internalPath: "beneficiary.mailing_abroad.province", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line13_PostalCode[0]", internalPath: "beneficiary.mailing_abroad.postal_code", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Pt4Line13_Country[0]", internalPath: "beneficiary.mailing_abroad.country", fieldType: "text" },
  // Line 14: Beneficiary daytime phone
  { pdfFieldName: "form1[0].#subform[4].Pt4Line14_DaytimePhoneNumber[0]", internalPath: "beneficiary.phone", fieldType: "text" },
  // ── subform[5]: Part 4 contact, marriage, parents, children ──
  // Line 15-16: Beneficiary contact
  { pdfFieldName: "form1[0].#subform[5].Pt4Line15_MobilePhoneNumber[0]", internalPath: "beneficiary.mobile", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line16_EmailAddress[0]", internalPath: "beneficiary.email", fieldType: "text" },
  // Line 16a-c: Name on most recent marriage certificate
  { pdfFieldName: "form1[0].#subform[5].Pt4Line16a_FamilyName[0]", internalPath: "beneficiary.marriage_cert_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line16b_GivenName[0]", internalPath: "beneficiary.marriage_cert_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line16c_MiddleName[0]", internalPath: "beneficiary.marriage_cert_middle_name", fieldType: "text", transform: "uppercase" },
  // Line 17: Number of marriages + dates ended (up to 2)
  { pdfFieldName: "form1[0].#subform[5].Pt4Line17_NumberofMarriages[0]", internalPath: "beneficiary.number_of_marriages", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line17_DateMarriageEnded[0]", internalPath: "beneficiary.prior_marriage_ended_date", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line17_DateMarriageEnded[1]", internalPath: "beneficiary.prior_marriage_ended_date_2", fieldType: "date", transform: "date_mmddyyyy" },
  // Line 18: Marital status (radio group with 6 options) — driven by derived booleans below
  { pdfFieldName: "form1[0].#subform[5].Pt4Line18_MaritalStatus[0]", internalPath: "beneficiary.marital_single", fieldType: "checkbox", checkedValue: "/1" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line18_MaritalStatus[1]", internalPath: "beneficiary.marital_married", fieldType: "checkbox", checkedValue: "/2" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line18_MaritalStatus[2]", internalPath: "beneficiary.marital_divorced", fieldType: "checkbox", checkedValue: "/3" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line18_MaritalStatus[3]", internalPath: "beneficiary.marital_widowed", fieldType: "checkbox", checkedValue: "/4" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line18_MaritalStatus[4]", internalPath: "beneficiary.marital_separated", fieldType: "checkbox", checkedValue: "/5" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line18_MaritalStatus[5]", internalPath: "beneficiary.marital_annulled", fieldType: "checkbox", checkedValue: "/6" },
  // Line 18a-c: Current spouse name
  { pdfFieldName: "form1[0].#subform[5].Pt4Line18a_FamilyName[0]", internalPath: "beneficiary.spouse_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line18b_GivenName[0]", internalPath: "beneficiary.spouse_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line18c_MiddleName[0]", internalPath: "beneficiary.spouse_middle_name", fieldType: "text", transform: "uppercase" },
  // Line 19-20: Marriage date and place
  { pdfFieldName: "form1[0].#subform[5].Pt4Line19_DateOfMarriage[0]", internalPath: "beneficiary.date_of_marriage", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line20a_CityTown[0]", internalPath: "beneficiary.marriage_city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line20b_State[0]", internalPath: "beneficiary.marriage_state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line20c_Province[0]", internalPath: "beneficiary.marriage_province", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line20d_Country[0]", internalPath: "beneficiary.marriage_country", fieldType: "text" },
  // Children (3 slots in subform[5], 2 more in subform[6]). Each slot: name, relationship, DOB, country of birth.
  { pdfFieldName: "form1[0].#subform[5].Pt4Line30a_FamilyName[0]", internalPath: "beneficiary.child1_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line30b_GivenName[0]", internalPath: "beneficiary.child1_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line30c_MiddleName[0]", internalPath: "beneficiary.child1_middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line31_Relationship[0]", internalPath: "beneficiary.child1_relationship", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line32_DateOfBirth[0]", internalPath: "beneficiary.child1_dob", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line34a_FamilyName[0]", internalPath: "beneficiary.child2_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line34b_GivenName[0]", internalPath: "beneficiary.child2_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line34c_MiddleName[0]", internalPath: "beneficiary.child2_middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line35_Relationship[0]", internalPath: "beneficiary.child2_relationship", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line36_DateOfBirth[0]", internalPath: "beneficiary.child2_dob", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line37_CountryOfBirth[0]", internalPath: "beneficiary.child2_country_of_birth", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line38a_FamilyName[0]", internalPath: "beneficiary.child3_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line38b_GivenName[0]", internalPath: "beneficiary.child3_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line38c_MiddleName[0]", internalPath: "beneficiary.child3_middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line39_Relationship[0]", internalPath: "beneficiary.child3_relationship", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line40_DateOfBirth[0]", internalPath: "beneficiary.child3_dob", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line41_CountryOfBirth[0]", internalPath: "beneficiary.child3_country_of_birth", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[5].Pt4Line49_CountryOfBirth[0]", internalPath: "beneficiary.child1_country_of_birth", fieldType: "text" },
  // ── subform[6]: Part 4 immigration history, employment, more children, deportation ──
  // Line 20 again (Yes/No: was beneficiary in U.S. at time of arrival info)
  { pdfFieldName: "form1[0].#subform[6].Pt4Line20_Yes[0]", internalPath: "beneficiary.in_us_now_yes", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line20_No[0]", internalPath: "beneficiary.in_us_now_no", fieldType: "checkbox", checkedValue: "/N" },
  // Line 21: Class of admission, I-94, dates
  { pdfFieldName: "form1[0].#subform[6].Pt4Line21a_ClassOfAdmission[0]", internalPath: "beneficiary.class_of_admission", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[6].#area[8].Pt4Line21b_ArrivalDeparture[0]", internalPath: "beneficiary.i94_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line21c_DateOfArrival[0]", internalPath: "beneficiary.date_of_arrival", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line21d_DateExpired[0]", internalPath: "beneficiary.status_expires_date", fieldType: "date", transform: "date_mmddyyyy" },
  // Line 22-25: Passport / travel doc
  { pdfFieldName: "form1[0].#subform[6].Pt4Line22_PassportNumber[0]", internalPath: "beneficiary.passport_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line23_TravelDocNumber[0]", internalPath: "beneficiary.travel_doc_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line24_CountryOfIssuance[0]", internalPath: "beneficiary.passport_country", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line25_ExpDate[0]", internalPath: "beneficiary.passport_expiry", fieldType: "date", transform: "date_mmddyyyy" },
  // Line 26: Current employer
  { pdfFieldName: "form1[0].#subform[6].Pt4Line26_NameOfCompany[0]", internalPath: "beneficiary.employer_name", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line26_StreetNumberName[0]", internalPath: "beneficiary.employer_address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line26_Unit[0]", internalPath: "beneficiary.employer_address.unit_apt", fieldType: "checkbox", checkedValue: "/APT" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line26_Unit[1]", internalPath: "beneficiary.employer_address.unit_ste", fieldType: "checkbox", checkedValue: "/STE" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line26_Unit[2]", internalPath: "beneficiary.employer_address.unit_flr", fieldType: "checkbox", checkedValue: "/FLR" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line26_AptSteFlrNumber[0]", internalPath: "beneficiary.employer_address.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line26_CityOrTown[0]", internalPath: "beneficiary.employer_address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line26_State[0]", internalPath: "beneficiary.employer_address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line26_ZipCode[0]", internalPath: "beneficiary.employer_address.zip", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line26_Province[0]", internalPath: "beneficiary.employer_address.province", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line26_PostalCode[0]", internalPath: "beneficiary.employer_address.postal_code", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line26_Country[0]", internalPath: "beneficiary.employer_address.country", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line27_DateEmploymentBegan[0]", internalPath: "beneficiary.employment_began_date", fieldType: "date", transform: "date_mmddyyyy" },
  // Line 28: Working without authorization?
  { pdfFieldName: "form1[0].#subform[6].Pt4Line28_Yes[0]", internalPath: "beneficiary.work_without_auth_yes", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line28_No[0]", internalPath: "beneficiary.work_without_auth_no", fieldType: "checkbox", checkedValue: "/N" },
  // Lines 42-49: Children slots 4 & 5 in subform[6]
  { pdfFieldName: "form1[0].#subform[6].Pt4Line42a_FamilyName[0]", internalPath: "beneficiary.child4_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line42b_GivenName[0]", internalPath: "beneficiary.child4_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line42c_MiddleName[0]", internalPath: "beneficiary.child4_middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line43_Relationship[0]", internalPath: "beneficiary.child4_relationship", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line44_DateOfBirth[0]", internalPath: "beneficiary.child4_dob", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line45_CountryOfBirth[0]", internalPath: "beneficiary.child4_country_of_birth", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line46a_FamilyName[0]", internalPath: "beneficiary.child5_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line46b_GivenName[0]", internalPath: "beneficiary.child5_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line46c_MiddleName[0]", internalPath: "beneficiary.child5_middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line47_Relationship[0]", internalPath: "beneficiary.child5_relationship", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line48_DateOfBirth[0]", internalPath: "beneficiary.child5_dob", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line49_CountryOfBirth[1]", internalPath: "beneficiary.child5_country_of_birth", fieldType: "text" },
  // Line 54: Type of immigration proceedings (checkboxes)
  { pdfFieldName: "form1[0].#subform[6].Pt4Line54_Removal[0]", internalPath: "beneficiary.proceedings_removal", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line54_Exclusion[0]", internalPath: "beneficiary.proceedings_exclusion", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line54_Rescission[0]", internalPath: "beneficiary.proceedings_rescission", fieldType: "checkbox", checkedValue: "/Y" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line54_JudicialProceedings[0]", internalPath: "beneficiary.proceedings_judicial", fieldType: "checkbox", checkedValue: "/Y" },
  // Line 55-56: City/state of proceedings + date
  { pdfFieldName: "form1[0].#subform[6].Pt4Line55a_CityOrTown[0]", internalPath: "beneficiary.proceedings_city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line55b_State[0]", internalPath: "beneficiary.proceedings_state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[6].Pt4Line56_Date[0]", internalPath: "beneficiary.proceedings_date", fieldType: "date", transform: "date_mmddyyyy" },
  // ── subform[7]: Part 4 last address & employment abroad, port of entry ──
  // Line 6/7/8/9 in subform[7] are "Other names used by beneficiary" (additional aliases beyond Line5a-c)
  { pdfFieldName: "form1[0].#subform[7].Pt4Line6a_FamilyName[0]", internalPath: "beneficiary.alias2_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line6b_GivenName[0]", internalPath: "beneficiary.alias2_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line6c_MiddleName[0]", internalPath: "beneficiary.alias2_middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line7_Relationship[0]", internalPath: "beneficiary.alias2_relationship", fieldType: "text" },
  // Line 55a-c in subform[7]: Beneficiary's spouse/parent name for relationship section
  { pdfFieldName: "form1[0].#subform[7].Pt4Line55a_FamilyName[0]", internalPath: "beneficiary.relative_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line55b_GivenName[0]", internalPath: "beneficiary.relative_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line55c_MiddleName[0]", internalPath: "beneficiary.relative_middle_name", fieldType: "text", transform: "uppercase" },
  // Line 56: Last address abroad (>1 year)
  { pdfFieldName: "form1[0].#subform[7].Pt4Line56_StreetNumberName[0]", internalPath: "beneficiary.last_address_abroad.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line56_Unit[0]", internalPath: "beneficiary.last_address_abroad.unit_apt", fieldType: "checkbox", checkedValue: "/APT" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line56_Unit[1]", internalPath: "beneficiary.last_address_abroad.unit_ste", fieldType: "checkbox", checkedValue: "/STE" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line56_Unit[2]", internalPath: "beneficiary.last_address_abroad.unit_flr", fieldType: "checkbox", checkedValue: "/FLR" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line56_AptSteFlrNumber[0]", internalPath: "beneficiary.last_address_abroad.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line56_CityOrTown[0]", internalPath: "beneficiary.last_address_abroad.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line56_Province[0]", internalPath: "beneficiary.last_address_abroad.province", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line56_PostalCode[0]", internalPath: "beneficiary.last_address_abroad.postal_code", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line56_Country[0]", internalPath: "beneficiary.last_address_abroad.country", fieldType: "text" },
  // Line 57: Last employment abroad
  { pdfFieldName: "form1[0].#subform[7].Pt4Line57_StreetNumberName[0]", internalPath: "beneficiary.last_employment_abroad.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line57_Unit[0]", internalPath: "beneficiary.last_employment_abroad.unit_apt", fieldType: "checkbox", checkedValue: "/APT" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line57_Unit[1]", internalPath: "beneficiary.last_employment_abroad.unit_ste", fieldType: "checkbox", checkedValue: "/STE" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line57_Unit[2]", internalPath: "beneficiary.last_employment_abroad.unit_flr", fieldType: "checkbox", checkedValue: "/FLR" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line57_AptSteFlrNumber[0]", internalPath: "beneficiary.last_employment_abroad.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line57_CityOrTown[0]", internalPath: "beneficiary.last_employment_abroad.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line57_State[0]", internalPath: "beneficiary.last_employment_abroad.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line57_ZipCode[0]", internalPath: "beneficiary.last_employment_abroad.zip", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line57_Province[0]", internalPath: "beneficiary.last_employment_abroad.province", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line57_PostalCode[0]", internalPath: "beneficiary.last_employment_abroad.postal_code", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line57_Country[0]", internalPath: "beneficiary.last_employment_abroad.country", fieldType: "text" },
  // Line 58: Date employment abroad
  { pdfFieldName: "form1[0].#subform[7].Pt4Line58a_DateFrom[0]", internalPath: "beneficiary.last_employment_abroad.date_from", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line58b_DateTo[0]", internalPath: "beneficiary.last_employment_abroad.date_to", fieldType: "date", transform: "date_mmddyyyy" },
  // Lines 60-61: Place of intended consular processing / port of entry
  { pdfFieldName: "form1[0].#subform[7].Pt4Line60a_CityOrTown[0]", internalPath: "beneficiary.consular_city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line60b_State[0]", internalPath: "beneficiary.consular_state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line61a_CityOrTown[0]", internalPath: "beneficiary.port_of_entry_city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line61b_Province[0]", internalPath: "beneficiary.port_of_entry_province", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[7].Pt4Line61c_Country[0]", internalPath: "beneficiary.port_of_entry_country", fieldType: "text" },
  // ── subform[8]: Part 4 final beneficiary relative slot ──
  { pdfFieldName: "form1[0].#subform[8].Pt4Line8a_FamilyName[0]", internalPath: "beneficiary.relative_last_name_2", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[8].Pt4Line8b_GivenName[0]", internalPath: "beneficiary.relative_first_name_2", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[8].Pt4Line8c_MiddleName[0]", internalPath: "beneficiary.relative_middle_name_2", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[8].Pt4Line9_Relationship[0]", internalPath: "beneficiary.relative_relationship_2", fieldType: "text" },
  // ── subform[9]: Part 4 daytime phone (continuation) ──
  { pdfFieldName: "form1[0].#subform[9].Pt4Line53_DaytimePhoneNumber[0]", internalPath: "beneficiary.phone", fieldType: "text" },
  // ── Page 9: Part 6 - Petitioner Statement ──
  { pdfFieldName: "form1[0].#subform[8].Pt6Line1Checkbox[0]", internalPath: "petitioner.statement_can_read", fieldType: "checkbox", checkedValue: "/A" },
  { pdfFieldName: "form1[0].#subform[8].Pt6Line1Checkbox[1]", internalPath: "petitioner.statement_used_interpreter", fieldType: "checkbox", checkedValue: "/B" },
  { pdfFieldName: "form1[0].#subform[8].Pt6Line1b_Language[0]", internalPath: "petitioner.statement_language", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[8].Pt6Line3_DaytimePhoneNumber[0]", internalPath: "petitioner.contact_phone", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[8].Pt6Line4_MobileNumber[0]", internalPath: "petitioner.contact_mobile", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[8].Pt6Line5_Email[0]", internalPath: "petitioner.contact_email", fieldType: "text" },
  // ── Page 10: Interpreter ──
  { pdfFieldName: "form1[0].#subform[9].Pt7_NameofLanguage[0]", internalPath: "interpreter.language", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[9].Pt7Line1a_InterpreterFamilyName[0]", internalPath: "interpreter.last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[9].Pt7Line1b_InterpreterGivenName[0]", internalPath: "interpreter.first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[9].Pt7Line2_InterpreterBusinessorOrg[0]", internalPath: "interpreter.organization", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[9].Pt7Line3_StreetNumberName[0]", internalPath: "interpreter.address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[9].Pt7Line3_CityOrTown[0]", internalPath: "interpreter.address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[9].Pt7Line3_State[0]", internalPath: "interpreter.address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[9].Pt7Line3_ZipCode[0]", internalPath: "interpreter.address.zip", fieldType: "text" },
  // Preparer
  { pdfFieldName: "form1[0].#subform[9].Pt8Line1a_PreparerFamilyName[0]", internalPath: "preparer.last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[9].Pt8Line1b_PreparerGivenName[0]", internalPath: "preparer.first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[9].Pt8Line2_BusinessName[0]", internalPath: "preparer.business_name", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[9].Pt8Line3_StreetNumberName[0]", internalPath: "preparer.address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[9].Pt8Line3_CityOrTown[0]", internalPath: "preparer.address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[9].Pt8Line3_State[0]", internalPath: "preparer.address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[9].Pt8Line3_ZipCode[0]", internalPath: "preparer.address.zip", fieldType: "text" },
  // ── Page 12: Additional Info ──
  { pdfFieldName: "form1[0].#subform[11].Pt2Line4a_FamilyName[1]", internalPath: "petitioner.last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[11].Pt2Line4b_GivenName[1]", internalPath: "petitioner.first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[11].Pt2Line4c_MiddleName[1]", internalPath: "petitioner.middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[11].Pt2Line1_AlienNumber[1]", internalPath: "petitioner.alien_number", fieldType: "text" },
];

// ══════════════════════════════════════════════════════════════════
// I-485 FIELD MAPPINGS — extracted from uploaded PDF (760 fields)
// ══════════════════════════════════════════════════════════════════

const I485_MAPPINGS: FieldMapping[] = [
  // ── Page 1: Attorney/Rep, Applicant info ──
  { pdfFieldName: "form1[0].#subform[0].CheckBox1[0]", internalPath: "petition.attorney_checkbox", fieldType: "checkbox", checkedValue: "/1" },
  { pdfFieldName: "form1[0].#subform[0].VolagNumber[0]", internalPath: "preparer.volag_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].AttorneyStateBarNumber[0]", internalPath: "preparer.bar_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].USCISOnlineAcctNumber[0]", internalPath: "applicant.uscis_online_account", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].AlienNumber[0]", internalPath: "applicant.alien_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line1_FamilyName[0]", internalPath: "applicant.last_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line1_GivenName[0]", internalPath: "applicant.first_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line1_MiddleName[0]", internalPath: "applicant.middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line2_FamilyName[0]", internalPath: "applicant.other_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line2_GivenName[0]", internalPath: "applicant.other_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line2_MiddleName[0]", internalPath: "applicant.other_middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line3_DOB[0]", internalPath: "applicant.date_of_birth", fieldType: "date", required: true, transform: "date_mmddyyyy" },
  // ── Page 2: Identity, Immigration ──
  { pdfFieldName: "form1[0].#subform[1].Pt1Line6_CB_Sex[1]", internalPath: "applicant.gender_male", fieldType: "checkbox", checkedValue: "/M" },
  { pdfFieldName: "form1[0].#subform[1].Pt1Line6_CB_Sex[0]", internalPath: "applicant.gender_female", fieldType: "checkbox", checkedValue: "/F" },
  { pdfFieldName: "form1[0].#subform[1].Pt1Line7_CityTownOfBirth[0]", internalPath: "applicant.city_of_birth", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt1Line7_CountryOfBirth[0]", internalPath: "applicant.country_of_birth", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[1].Pt1Line8_CountryofCitizenshipNationality[0]", internalPath: "applicant.country_of_citizenship", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[1].Pt1Line9_USCISAccountNumber[0]", internalPath: "applicant.uscis_account_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt1Line10_PassportNum[0]", internalPath: "applicant.passport_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt1Line10_ExpDate[0]", internalPath: "applicant.passport_expiry", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[1].Pt1Line10_Passport[0]", internalPath: "applicant.passport_country", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt1Line10_VisaNum[0]", internalPath: "applicant.visa_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt1Line10_DateofArrival[0]", internalPath: "applicant.date_of_arrival", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[1].Pt1Line10_CityTown[0]", internalPath: "applicant.arrival_city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Pt1Line10_State[0]", internalPath: "applicant.arrival_state", fieldType: "dropdown" },
  // ── Page 3: I-94, Address ──
  { pdfFieldName: "form1[0].#subform[2].P1Line12_I94[0]", internalPath: "applicant.i94_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].Pt1Line12_Date[0]", internalPath: "applicant.i94_date", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[2].Pt1Line12_Status[0]", internalPath: "applicant.i94_status", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].Pt1Line14_Status[0]", internalPath: "applicant.current_status", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].Part1_Item18_InCareOfName[0]", internalPath: "applicant.address.care_of", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].Pt1Line18_StreetNumberName[0]", internalPath: "applicant.address.street", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[2].Pt1Line18US_AptSteFlrNumber[0]", internalPath: "applicant.address.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].Pt1Line18_CityOrTown[0]", internalPath: "applicant.address.city", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[2].Pt1Line18_State[0]", internalPath: "applicant.address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[2].Pt1Line18_ZipCode[0]", internalPath: "applicant.address.zip", fieldType: "text", required: true },
  // Safe mailing address (if different)
  { pdfFieldName: "form1[0].#subform[2].Pt1Line18_CurrentInCareOfName[0]", internalPath: "applicant.safe_address.care_of", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].Pt1Line18_CurrentStreetNumberName[0]", internalPath: "applicant.safe_address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].Pt1Line18_CurrentAptSteFlrNumber[0]", internalPath: "applicant.safe_address.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].Pt1Line18_CurrentCityOrTown[0]", internalPath: "applicant.safe_address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].Pt1Line18_CurrentState[0]", internalPath: "applicant.safe_address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[2].Pt1Line18_CurrentZipCode[0]", internalPath: "applicant.safe_address.zip", fieldType: "text" },
  // ── Page 4: Prior address, SSN ──
  { pdfFieldName: "form1[0].#subform[3].Pt1Line18_PriorStreetName[0]", internalPath: "applicant.prior_address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[3].Pt1Line18_PriorCity[0]", internalPath: "applicant.prior_address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[3].Pt1Line18_PriorState[0]", internalPath: "applicant.prior_address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[3].Pt1Line18_PriorZipCode[0]", internalPath: "applicant.prior_address.zip", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[3].Pt1Line18_PriorCountry[0]", internalPath: "applicant.prior_address.country", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[3].Pt1Line18_PriorDateFrom[0]", internalPath: "applicant.prior_address.date_from", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[3].Pt1Line18PriorDateTo[0]", internalPath: "applicant.prior_address.date_to", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[3].Pt1Line19_SSN[0]", internalPath: "applicant.ssn", fieldType: "text" },
  // ── Page 8: Employment ──
  { pdfFieldName: "form1[0].#subform[7].Pt4Line7_EmployerName[0]", internalPath: "applicant.employer_name", fieldType: "text" },
  // ── Page 9: Employer address ──
  { pdfFieldName: "form1[0].#subform[8].Part4Line7_StreetName[0]", internalPath: "applicant.employer_address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[8].P4Line7_City[0]", internalPath: "applicant.employer_address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[8].P4Line7_State[0]", internalPath: "applicant.employer_address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[8].P4Line7_ZipCode[0]", internalPath: "applicant.employer_address.zip", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[8].Pt4Line7_DateFrom[0]", internalPath: "applicant.employment_start", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[8].Pt4Line7_DateTo[0]", internalPath: "applicant.employment_end", fieldType: "date", transform: "date_mmddyyyy" },
];

// ══════════════════════════════════════════════════════════════════
// I-765 FIELD MAPPINGS — extracted from uploaded PDF (161 fields)
// ══════════════════════════════════════════════════════════════════

const I765_MAPPINGS: FieldMapping[] = [
  // ── Page 1: Attorney/Rep, Names ──
  { pdfFieldName: "form1[0].Page1[0].Attorney-Rep[0].CheckBox1[0]", internalPath: "petition.attorney_checkbox", fieldType: "checkbox", checkedValue: "/1" },
  { pdfFieldName: "form1[0].Page1[0].Attorney-Rep[0].attorneyBarNumber[0]", internalPath: "preparer.bar_number", fieldType: "text" },
  { pdfFieldName: "form1[0].Page1[0].Attorney-Rep[0].USCISELISAcctNumber[0]", internalPath: "applicant.uscis_online_account", fieldType: "text" },
  { pdfFieldName: "form1[0].Page1[0].Line1a_FamilyName[0]", internalPath: "applicant.last_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].Page1[0].Line1b_GivenName[0]", internalPath: "applicant.first_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].Page1[0].Line1c_MiddleName[0]", internalPath: "applicant.middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].Page1[0].Line2a_FamilyName[0]", internalPath: "applicant.other_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].Page1[0].Line2b_GivenName[0]", internalPath: "applicant.other_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].Page1[0].Line2c_MiddleName[0]", internalPath: "applicant.other_middle_name", fieldType: "text", transform: "uppercase" },
  // ── Page 2: Address, Identity ──
  { pdfFieldName: "form1[0].Page2[0].Line7_AlienNumber[0]", internalPath: "applicant.alien_number", fieldType: "text" },
  { pdfFieldName: "form1[0].Page2[0].Line8_ElisAccountNumber[0]", internalPath: "applicant.uscis_account_number", fieldType: "text" },
  { pdfFieldName: "form1[0].Page2[0].Line4a_InCareofName[0]", internalPath: "applicant.address.care_of", fieldType: "text" },
  { pdfFieldName: "form1[0].Page2[0].Line4b_StreetNumberName[0]", internalPath: "applicant.address.street", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].Page2[0].Pt2Line5_AptSteFlrNumber[0]", internalPath: "applicant.address.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].Page2[0].Pt2Line5_CityOrTown[0]", internalPath: "applicant.address.city", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].Page2[0].Pt2Line5_State[0]", internalPath: "applicant.address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].Page2[0].Pt2Line5_ZipCode[0]", internalPath: "applicant.address.zip", fieldType: "text", required: true },
  // Alternate address
  { pdfFieldName: "form1[0].Page2[0].Pt2Line7_StreetNumberName[0]", internalPath: "applicant.alt_address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].Page2[0].Pt2Line7_AptSteFlrNumber[0]", internalPath: "applicant.alt_address.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].Page2[0].Pt2Line7_CityOrTown[0]", internalPath: "applicant.alt_address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].Page2[0].Pt2Line7_State[0]", internalPath: "applicant.alt_address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].Page2[0].Pt2Line7_ZipCode[0]", internalPath: "applicant.alt_address.zip", fieldType: "text" },
  // Marital status
  { pdfFieldName: "form1[0].Page2[0].Line10_Checkbox[2]", internalPath: "applicant.marital_single", fieldType: "checkbox", checkedValue: "/Single" },
  { pdfFieldName: "form1[0].Page2[0].Line10_Checkbox[3]", internalPath: "applicant.marital_married", fieldType: "checkbox", checkedValue: "/Married" },
  { pdfFieldName: "form1[0].Page2[0].Line10_Checkbox[1]", internalPath: "applicant.marital_divorced", fieldType: "checkbox", checkedValue: "/Divorced" },
  { pdfFieldName: "form1[0].Page2[0].Line10_Checkbox[0]", internalPath: "applicant.marital_widowed", fieldType: "checkbox", checkedValue: "/Widowed" },
  { pdfFieldName: "form1[0].Page2[0].Line12b_SSN[0]", internalPath: "applicant.ssn", fieldType: "text" },
  // ── Page 3: Birth, travel document, eligibility ──
  { pdfFieldName: "form1[0].Page3[0].Line18a_CityTownOfBirth[0]", internalPath: "applicant.city_of_birth", fieldType: "text" },
  { pdfFieldName: "form1[0].Page3[0].Line18c_CountryOfBirth[0]", internalPath: "applicant.country_of_birth", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].Page3[0].Line19_DOB[0]", internalPath: "applicant.date_of_birth", fieldType: "date", required: true, transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].Page3[0].Line17a_CountryOfBirth[0]", internalPath: "applicant.country_of_citizenship", fieldType: "text" },
  { pdfFieldName: "form1[0].Page3[0].Line20a_I94Number[0]", internalPath: "applicant.i94_number", fieldType: "text" },
  { pdfFieldName: "form1[0].Page3[0].Line20b_Passport[0]", internalPath: "applicant.passport_number", fieldType: "text" },
  { pdfFieldName: "form1[0].Page3[0].Line20d_CountryOfIssuance[0]", internalPath: "applicant.passport_country", fieldType: "text" },
  { pdfFieldName: "form1[0].Page3[0].Line20e_ExpDate[0]", internalPath: "applicant.passport_expiry", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].Page3[0].Line21_DateOfLastEntry[0]", internalPath: "applicant.date_of_arrival", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].Page3[0].place_entry[0]", internalPath: "applicant.arrival_city", fieldType: "text" },
  { pdfFieldName: "form1[0].Page3[0].Line23_StatusLastEntry[0]", internalPath: "applicant.i94_status", fieldType: "text" },
  { pdfFieldName: "form1[0].Page3[0].Line24_CurrentStatus[0]", internalPath: "applicant.current_status", fieldType: "text" },
  { pdfFieldName: "form1[0].Page3[0].Line26_SEVISnumber[0]", internalPath: "applicant.sevis_number", fieldType: "text" },
  { pdfFieldName: "form1[0].Page3[0].#area[1].section_1[0]", internalPath: "applicant.eligibility_category_1", fieldType: "text" },
  { pdfFieldName: "form1[0].Page3[0].#area[1].section_2[0]", internalPath: "applicant.eligibility_category_2", fieldType: "text" },
  { pdfFieldName: "form1[0].Page3[0].#area[1].section_3[0]", internalPath: "applicant.eligibility_category_3", fieldType: "text" },
  // ── Page 4: Applicant Statement, Interpreter ──
  { pdfFieldName: "form1[0].Page4[0].Pt3Line1Checkbox[1]", internalPath: "applicant.statement_can_read", fieldType: "checkbox", checkedValue: "/A" },
  { pdfFieldName: "form1[0].Page4[0].Pt3Line1Checkbox[0]", internalPath: "applicant.statement_used_interpreter", fieldType: "checkbox", checkedValue: "/B" },
  { pdfFieldName: "form1[0].Page4[0].Pt3Line1b_Language[0]", internalPath: "applicant.statement_language", fieldType: "text" },
  { pdfFieldName: "form1[0].Page4[0].Pt3Line3_DaytimePhoneNumber1[0]", internalPath: "applicant.phone", fieldType: "text" },
  { pdfFieldName: "form1[0].Page4[0].Pt3Line4_MobileNumber1[0]", internalPath: "applicant.mobile_phone", fieldType: "text" },
  { pdfFieldName: "form1[0].Page4[0].Pt3Line5_Email[0]", internalPath: "applicant.email", fieldType: "text" },
  // Interpreter
  { pdfFieldName: "form1[0].Page4[0].Pt4Line1a_InterpreterFamilyName[0]", internalPath: "interpreter.last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].Page4[0].Pt4Line1b_InterpreterGivenName[0]", internalPath: "interpreter.first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].Page4[0].Pt4Line2_InterpreterBusinessorOrg[0]", internalPath: "interpreter.organization", fieldType: "text" },
  // ── Page 5: Interpreter address, Preparer ──
  { pdfFieldName: "form1[0].Page5[0].Pt5Line3a_StreetNumberName[0]", internalPath: "interpreter.address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].Page5[0].Pt5Line3c_CityOrTown[0]", internalPath: "interpreter.address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].Page5[0].Pt5Line3d_State[0]", internalPath: "interpreter.address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].Page5[0].Pt5Line3e_ZipCode[0]", internalPath: "interpreter.address.zip", fieldType: "text" },
  { pdfFieldName: "form1[0].Page5[0].Part4_NameofLanguage[0]", internalPath: "interpreter.language", fieldType: "text" },
  { pdfFieldName: "form1[0].Page5[0].Pt5Line1a_PreparerFamilyName[0]", internalPath: "preparer.last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].Page5[0].Pt5Line1b_PreparerGivenName[0]", internalPath: "preparer.first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].Page5[0].Pt5Line2_BusinessName[0]", internalPath: "preparer.business_name", fieldType: "text" },
  { pdfFieldName: "form1[0].Page5[0].Pt6Line3a_StreetNumberName[0]", internalPath: "preparer.address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].Page5[0].Pt6Line3c_CityOrTown[0]", internalPath: "preparer.address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].Page5[0].Pt6Line3d_State[0]", internalPath: "preparer.address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].Page5[0].Pt6Line3e_ZipCode[0]", internalPath: "preparer.address.zip", fieldType: "text" },
  { pdfFieldName: "form1[0].Page5[0].Pt5Line4_DaytimePhoneNumber1[0]", internalPath: "preparer.phone", fieldType: "text" },
  { pdfFieldName: "form1[0].Page5[0].Pt5Line6_Email[0]", internalPath: "preparer.email", fieldType: "text" },
];

// ══════════════════════════════════════════════════════════════════
// I-864 FIELD MAPPINGS — extracted from uploaded PDF (219 fields)
// ══════════════════════════════════════════════════════════════════

const I864_MAPPINGS: FieldMapping[] = [
  // ── Page 1: Attorney, Part 1 Basis, Sponsor name ──
  { pdfFieldName: "form1[0].#subform[0].G28-CheckBox1[0]", internalPath: "petition.attorney_checkbox", fieldType: "checkbox", checkedValue: "/1" },
  { pdfFieldName: "form1[0].#subform[0].AttorneyStateBarNumber[0]", internalPath: "preparer.bar_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].USCISOnlineAcctNumber[0]", internalPath: "sponsor.uscis_online_account", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].P1_Line1a-f_CB[0]", internalPath: "sponsor.basis_petitioner", fieldType: "checkbox", checkedValue: "/1A" },
  { pdfFieldName: "form1[0].#subform[0].P1_Line1a-f_CB[1]", internalPath: "sponsor.basis_relative", fieldType: "checkbox", checkedValue: "/1B" },
  { pdfFieldName: "form1[0].#subform[0].P1_Line1b_Relationship[0]", internalPath: "sponsor.basis_relationship", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].P4_Line1a_FamilyName[0]", internalPath: "sponsor.last_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].P4_Line1b_GivenName[0]", internalPath: "sponsor.first_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].P4_Line1c_MiddleName[0]", internalPath: "sponsor.middle_name", fieldType: "text", transform: "uppercase" },
  // ── Page 2: Sponsor address, DOB, SSN, citizenship ──
  { pdfFieldName: "form1[0].#subform[1].P4_Line2a_InCareOf[0]", internalPath: "sponsor.address.care_of", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].P4_Line2b_StreetNumberName[0]", internalPath: "sponsor.address.street", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[1].P4_Line2d_AptSteFlrNumber[0]", internalPath: "sponsor.address.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].P4_Line2e_CityOrTown[0]", internalPath: "sponsor.address.city", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[1].P4_Line2f_State[0]", internalPath: "sponsor.address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[1].P4_Line2g_ZipCode[0]", internalPath: "sponsor.address.zip", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[1].P4_Line2j_Country[0]", internalPath: "sponsor.address.country", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].P4_Line5_CountryOfDomicile[0]", internalPath: "sponsor.country_of_domicile", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].P4_Line6_DateOfBirth[0]", internalPath: "sponsor.date_of_birth", fieldType: "date", required: true, transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[1].P4_Line7_CityofBirth[0]", internalPath: "sponsor.city_of_birth", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].P4_Line10_SocialSecurityNumber[0]", internalPath: "sponsor.ssn", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[1].P4_Line11a_Checkbox[0]", internalPath: "sponsor.citizen_by_birth", fieldType: "checkbox", checkedValue: "/A" },
  { pdfFieldName: "form1[0].#subform[1].P4_Line11b_Checkbox[0]", internalPath: "sponsor.citizen_by_naturalization", fieldType: "checkbox", checkedValue: "/B" },
  { pdfFieldName: "form1[0].#subform[1].P4_Line11c_Checkbox[0]", internalPath: "sponsor.is_lpr", fieldType: "checkbox", checkedValue: "/C" },
  { pdfFieldName: "form1[0].#subform[1].#area[1].P4_Line12_AlienNumber[0]", internalPath: "sponsor.alien_number", fieldType: "text" },
  // Physical address if different
  { pdfFieldName: "form1[0].#subform[1].P4_Line4a_StreetNumberName[0]", internalPath: "sponsor.physical_address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].P4_Line4c_AptSteFlrNumber[0]", internalPath: "sponsor.physical_address.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].P4_Line4d_CityOrTown[0]", internalPath: "sponsor.physical_address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].P4_Line4e_State[0]", internalPath: "sponsor.physical_address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[1].P4_Line4f_ZipCode[0]", internalPath: "sponsor.physical_address.zip", fieldType: "text" },
  // ── Page 3: Part 2 - Immigrant (beneficiary) ──
  { pdfFieldName: "form1[0].#subform[2].P2_Line1a_FamilyName[0]", internalPath: "beneficiary.last_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[2].P2_Line1b_GivenName[0]", internalPath: "beneficiary.first_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[2].P2_Line1c_MiddleName[0]", internalPath: "beneficiary.middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[2].P2_Line2_StreetNumberName[0]", internalPath: "beneficiary.address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].P2_Line2_AptSteFlrNumber[0]", internalPath: "beneficiary.address.apt", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].P2_Line2_CityOrTown[0]", internalPath: "beneficiary.address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].P2_Line2_State[0]", internalPath: "beneficiary.address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[2].P2_Line2_ZipCode[0]", internalPath: "beneficiary.address.zip", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].P2_Line2_Country[0]", internalPath: "beneficiary.address.country", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].P2_Line3_CountryCitizenship[0]", internalPath: "beneficiary.country_of_citizenship", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].P2_Line4_DateOfBirth[0]", internalPath: "beneficiary.date_of_birth", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[2].#area[2].P2_Line5_AlienNumber[0]", internalPath: "beneficiary.alien_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[2].P2_Line7_DaytimePhoneNumber[0]", internalPath: "beneficiary.phone", fieldType: "text" },
  // Part 3 - Household size
  { pdfFieldName: "form1[0].#subform[2].P3_Line3a_FamilyName[0]", internalPath: "beneficiary.last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[2].P3_Line3b_GivenName[0]", internalPath: "beneficiary.first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[2].P3_Line4_Relationship[0]", internalPath: "sponsor.relationship_to_immigrant", fieldType: "text" },
  // ── Page 5: Household size totals ──
  { pdfFieldName: "form1[0].#subform[4].P3_Line28_TotalNumberofImmigrants[0]", internalPath: "sponsor.total_immigrants", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].P5_Line2_Yourself[0]", internalPath: "sponsor.household_yourself", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].P5_Line3_Married[0]", internalPath: "sponsor.household_spouse", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].P5_Line4_DependentChildren[0]", internalPath: "sponsor.household_children", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].P5_Line5_OtherDependents[0]", internalPath: "sponsor.household_other_dependents", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].P5_Line6_Sponsors[0]", internalPath: "sponsor.household_sponsors", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].Override[0]", internalPath: "sponsor.household_total", fieldType: "text" },
  // Employment
  { pdfFieldName: "form1[0].#subform[4].P6_Line1a_NameofEmployer[0]", internalPath: "sponsor.employer_name", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[4].P6_Line2_TotalIncome[0]", internalPath: "sponsor.annual_income", fieldType: "text" },
  // ── Page 7: Tax info, Assets ──
  { pdfFieldName: "form1[0].#subform[6].P6_Line19a_TaxYear[0]", internalPath: "sponsor.tax_year_1", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].P6_Line19a_TotalIncome[0]", internalPath: "sponsor.tax_income_1", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].P6_Line19b_TaxYear[0]", internalPath: "sponsor.tax_year_2", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].P6_Line19b_TotalIncome[0]", internalPath: "sponsor.tax_income_2", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].P6_Line19c_TaxYear[0]", internalPath: "sponsor.tax_year_3", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].P6_Line19c_TotalIncome[0]", internalPath: "sponsor.tax_income_3", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].P7_Line1_BalanceofAccounts[0]", internalPath: "sponsor.assets_savings", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].P7_Line2_RealEstate[0]", internalPath: "sponsor.assets_real_estate", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].P7_Line3_StocksBonds[0]", internalPath: "sponsor.assets_stocks", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[6].P7_Line4_Total[0]", internalPath: "sponsor.assets_total", fieldType: "text" },
  // ── Page 10: Sponsor Statement ──
  { pdfFieldName: "form1[0].#subform[9].P6_Line1_Checkbox[1]", internalPath: "sponsor.statement_can_read", fieldType: "checkbox", checkedValue: "/A" },
  { pdfFieldName: "form1[0].#subform[9].P6_Line1_Checkbox[2]", internalPath: "sponsor.statement_used_interpreter", fieldType: "checkbox", checkedValue: "/B" },
  { pdfFieldName: "form1[0].#subform[9].P8_Line1b_language[0]", internalPath: "sponsor.statement_language", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[9].P8_Line3_DaytimeTelephoneNumber[0]", internalPath: "sponsor.phone", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[9].P8_Line4_MobileTelephoneNumber[0]", internalPath: "sponsor.mobile_phone", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[9].P7Line7_EmailAddress[0]", internalPath: "sponsor.email", fieldType: "text" },
  // ── Page 11: Interpreter & Preparer ──
  { pdfFieldName: "form1[0].#subform[10].P9_Line1a_InterpretersFamilyName[0]", internalPath: "interpreter.last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[10].P9_Line1b_InterpretersGivenName[0]", internalPath: "interpreter.first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[10].P8Line2_InterpretersBusinessName[0]", internalPath: "interpreter.organization", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[10].P9_Language[0]", internalPath: "interpreter.language", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[10].P10_Line1a_PreparersFamilyName[0]", internalPath: "preparer.last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[10].P10_Line1b_PreparersGivenName[0]", internalPath: "preparer.first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[10].P10_Line2_PreparersBusinessName[0]", internalPath: "preparer.business_name", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[10].P10_Line4_PreparersDaytimePhoneNumber[0]", internalPath: "preparer.phone", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[10].P10_Line6_PreparersEmailAddress[0]", internalPath: "preparer.email", fieldType: "text" },
  // ── Page 12: Additional Info header ──
  { pdfFieldName: "form1[0].#subform[11].P4_Line1a_FamilyName[1]", internalPath: "sponsor.last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[11].P4_Line1b_GivenName[1]", internalPath: "sponsor.first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[11].P4_Line1c_MiddleName[1]", internalPath: "sponsor.middle_name", fieldType: "text", transform: "uppercase" },
];

// ══════════════════════════════════════════════════════════════════
// I-912 FIELD MAPPINGS — extracted from uploaded PDF (221 fields)
// ══════════════════════════════════════════════════════════════════

const I912_MAPPINGS: FieldMapping[] = [
  // ── Page 1: Basis, Applicant info ──
  { pdfFieldName: "form1[0].#subform[0].P1_Line1_Checkbox[0]", internalPath: "applicant.fee_waiver_means_tested", fieldType: "checkbox", checkedValue: "/A" },
  { pdfFieldName: "form1[0].#subform[0].P1_Line2_Checkbox[0]", internalPath: "applicant.fee_waiver_below_150", fieldType: "checkbox", checkedValue: "/B" },
  { pdfFieldName: "form1[0].#subform[0].P1_Line3_Checkbox[0]", internalPath: "applicant.fee_waiver_hardship", fieldType: "checkbox", checkedValue: "/C" },
  { pdfFieldName: "form1[0].#subform[0].P2_L2_FamilyName[0]", internalPath: "applicant.last_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].P2_L2_GivenName[0]", internalPath: "applicant.first_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].P2_L2_MiddleName[0]", internalPath: "applicant.middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].P2_L3_FamilyName[0]", internalPath: "applicant.other_last_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].P2_L3_GivenName[0]", internalPath: "applicant.other_first_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].P2_L3_MiddleName[0]", internalPath: "applicant.other_middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].P2_Line3_AlienNumber[0]", internalPath: "applicant.alien_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].P2_Line4_AcctIdentifier[0]", internalPath: "applicant.uscis_account_number", fieldType: "text" },
  // ── Page 2: DOB, SSN, Marital, Household, Benefits ──
  { pdfFieldName: "form1[0].#subform[1].P2_5_DateOfBirth[0]", internalPath: "applicant.date_of_birth", fieldType: "date", required: true, transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[1].P2_Line6_SSN[0]", internalPath: "applicant.ssn", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].P2_7_MaritalStatus[3]", internalPath: "applicant.marital_single", fieldType: "checkbox", checkedValue: "/Single" },
  { pdfFieldName: "form1[0].#subform[1].P2_7_MaritalStatus[1]", internalPath: "applicant.marital_married", fieldType: "checkbox", checkedValue: "/Married" },
  { pdfFieldName: "form1[0].#subform[1].P2_7_MaritalStatus[0]", internalPath: "applicant.marital_divorced", fieldType: "checkbox", checkedValue: "/Divorced" },
  { pdfFieldName: "form1[0].#subform[1].P2_7_MaritalStatus[2]", internalPath: "applicant.marital_widowed", fieldType: "checkbox", checkedValue: "/Widowed" },
  // Household members for fee waiver
  { pdfFieldName: "form1[0].#subform[1].Part3_Line1_Name1[0]", internalPath: "fee_waiver.household_member1_name", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].P3_Line1_AlienNumber[0]", internalPath: "fee_waiver.household_member1_anumber", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Part3_Line1_DateofBirth1[0]", internalPath: "fee_waiver.household_member1_dob", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[1].Part4_Line2a_RelationshipToYou1[0]", internalPath: "fee_waiver.household_member1_relationship", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Part3_Line1_FormsFiled1[0]", internalPath: "fee_waiver.household_member1_forms", fieldType: "text" },
  // Benefits
  { pdfFieldName: "form1[0].#subform[1].Part4_Line1_FullName1[0]", internalPath: "fee_waiver.benefit1_name", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Part4_Line1_Relationship1[0]", internalPath: "fee_waiver.benefit1_relationship", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Part4_Line1_Agency1[0]", internalPath: "fee_waiver.benefit1_agency", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Part4_Line1_TypeofBene1[0]", internalPath: "fee_waiver.benefit1_type", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[1].Part4_Line1_DateAward1[0]", internalPath: "fee_waiver.benefit1_date", fieldType: "date", transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[1].Part3_Line1_TotalForms[0]", internalPath: "fee_waiver.total_forms_filed", fieldType: "text" },
];

// ══════════════════════════════════════════════════════════════════
// MASTER MAPPING REGISTRY
// ══════════════════════════════════════════════════════════════════

// I-693 basic mappings (medical exam — most fields filled by civil surgeon)
const I693_MAPPINGS: FieldMapping[] = [
  { pdfFieldName: "form1[0].#subform[0].Pt1Line1a_FamilyName[0]", internalPath: "applicant.last_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line1b_GivenName[0]", internalPath: "applicant.first_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line1c_MiddleName[0]", internalPath: "applicant.middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line2_AlienNumber[0]", internalPath: "applicant.alien_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line3_USCISAcctNumber[0]", internalPath: "applicant.uscis_account_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line4_DateOfBirth[0]", internalPath: "applicant.date_of_birth", fieldType: "date", required: true, transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line5_CountryOfBirth[0]", internalPath: "applicant.country_of_birth", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line6_StreetNumberName[0]", internalPath: "applicant.address.street", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line6_CityOrTown[0]", internalPath: "applicant.address.city", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line6_State[0]", internalPath: "applicant.address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line6_ZipCode[0]", internalPath: "applicant.address.zip", fieldType: "text" },
];

// I-751 basic mappings (remove conditions on residence)
const I751_MAPPINGS: FieldMapping[] = [
  { pdfFieldName: "form1[0].#subform[0].Pt1Line1a_FamilyName[0]", internalPath: "applicant.last_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line1b_GivenName[0]", internalPath: "applicant.first_name", fieldType: "text", required: true, transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line1c_MiddleName[0]", internalPath: "applicant.middle_name", fieldType: "text", transform: "uppercase" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line2_AlienNumber[0]", internalPath: "applicant.alien_number", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line3_USCISAcctNumber[0]", internalPath: "applicant.uscis_account_number", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line4_DateOfBirth[0]", internalPath: "applicant.date_of_birth", fieldType: "date", required: true, transform: "date_mmddyyyy" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line5_SSN[0]", internalPath: "applicant.ssn", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line6_CountryOfBirth[0]", internalPath: "applicant.country_of_birth", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line7_CountryOfCitizenship[0]", internalPath: "applicant.country_of_citizenship", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line8_StreetNumberName[0]", internalPath: "applicant.address.street", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line8_CityOrTown[0]", internalPath: "applicant.address.city", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line8_State[0]", internalPath: "applicant.address.state", fieldType: "dropdown" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line8_ZipCode[0]", internalPath: "applicant.address.zip", fieldType: "text", required: true },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line9_Phone[0]", internalPath: "applicant.phone", fieldType: "text" },
  { pdfFieldName: "form1[0].#subform[0].Pt1Line10_Email[0]", internalPath: "applicant.email", fieldType: "text" },
];

export const FORM_FIELD_MAPPINGS: Record<string, FieldMapping[]> = {
  "I-130": I130_MAPPINGS,
  "I-485": I485_MAPPINGS,
  "I-765": I765_MAPPINGS,
  "I-864": I864_MAPPINGS,
  "I-912": I912_MAPPINGS,
  "I-693": I693_MAPPINGS,
  "I-751": I751_MAPPINGS,
};

// ── Data resolution helpers ──

/** Resolve a dot-separated path from a nested data object */
export function resolveDataPath(data: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = data;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  if (current == null) return undefined;
  return String(current);
}

/** Apply transformation to a field value */
export function applyTransform(value: string, transform?: string): string {
  if (!value) return value;
  switch (transform) {
    case "uppercase":
      return value.toUpperCase();
    case "date_mmddyyyy": {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
      }
      return value;
    }
    case "yes_no":
      return value.toLowerCase() === "true" || value === "1" ? "Yes" : "No";
    default:
      return value;
  }
}

// ── Build a flat data object from D.O.M.E. case data ──
export function buildCaseDataObject(
  profile: Record<string, unknown> | null,
  persons: Record<string, unknown>[] | null,
  addresses: Record<string, unknown>[] | null,
  fieldValues: Record<string, unknown>[] | null,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  const buildPersonBlock = (person: Record<string, unknown> | undefined | null, personAddresses: Record<string, unknown>[]) => {
    const block: Record<string, unknown> = {};
    if (!person) return block;
    block.first_name = person.first_name || "";
    block.last_name = person.last_name || "";
    block.middle_name = person.middle_name || "";
    block.date_of_birth = person.date_of_birth || "";
    block.country_of_birth = person.country_of_birth || "";
    block.city_of_birth = person.city_of_birth || "";
    block.country_of_citizenship = person.citizenship || "";
    block.alien_number = person.alien_number || "";
    block.ssn = person.ssn || "";
    block.gender = person.gender || "";
    block.passport_number = person.passport_number || "";
    block.passport_country = person.passport_country || "";
    block.passport_expiry = person.passport_expiry || "";
    block.phone = person.phone || "";
    block.email = person.email || "";
    block.occupation = person.occupation || "";
    block.employer_name = person.employer_name || "";
    block.number_of_marriages = person.number_of_marriages || "";

    const g = String(person.gender || "").toLowerCase();
    block.gender_male = g === "male" ? "true" : "false";
    block.gender_female = g === "female" ? "true" : "false";

    const currentAddr = personAddresses.find((a: Record<string, unknown>) => a.is_current) || personAddresses[0];
    if (currentAddr) {
      block.address = {
        street: currentAddr.street || "",
        apt: currentAddr.apt || "",
        city: currentAddr.city || "",
        state: currentAddr.state || "",
        zip: currentAddr.zip || "",
        country: currentAddr.country || "United States",
        care_of: "",
        province: currentAddr.province || currentAddr.state || "",
        postal_code: currentAddr.postal_code || currentAddr.zip || "",
      };
      block.physical_address = block.address;
    }
    return block;
  };

  // Build applicant data from profile + persons
  const applicant: Record<string, unknown> = {};
  if (profile) {
    applicant.first_name = profile.first_name || "";
    applicant.last_name = profile.last_name || "";
    applicant.middle_name = profile.middle_name || "";
    applicant.email = profile.email || "";
    applicant.phone = profile.phone || "";
  }

  const primaryPerson = persons?.find((p: Record<string, unknown>) => p.role === "applicant" || p.role === "beneficiary") || persons?.[0];
  if (primaryPerson) {
    applicant.date_of_birth = primaryPerson.date_of_birth || "";
    applicant.country_of_birth = primaryPerson.country_of_birth || "";
    applicant.country_of_citizenship = primaryPerson.citizenship || "";
    applicant.alien_number = primaryPerson.alien_number || "";
    applicant.ssn = primaryPerson.ssn || "";
    applicant.gender = primaryPerson.gender || "";
    applicant.passport_number = primaryPerson.passport_number || "";
    applicant.passport_country = primaryPerson.passport_country || "";
    applicant.city_of_birth = primaryPerson.city_of_birth || "";
    applicant.passport_expiry = primaryPerson.passport_expiry || "";

    const g = String(primaryPerson.gender || "").toLowerCase();
    applicant.gender_male = g === "male" ? "true" : "false";
    applicant.gender_female = g === "female" ? "true" : "false";
  }

  const applicantPersonId = primaryPerson ? (primaryPerson.id as string) : null;
  const applicantAddresses = addresses?.filter((a: Record<string, unknown>) => !applicantPersonId || a.person_id === applicantPersonId) || [];
  const currentAddress = applicantAddresses.find((a: Record<string, unknown>) => a.is_current) || addresses?.find((a: Record<string, unknown>) => a.is_current) || addresses?.[0];
  if (currentAddress) {
    applicant.address = {
      street: currentAddress.street || "",
      apt: currentAddress.apt || "",
      city: currentAddress.city || "",
      state: currentAddress.state || "",
      zip: currentAddress.zip || "",
      country: currentAddress.country || "United States",
      care_of: "",
    };
  }

  data.applicant = applicant;

  // Petitioner (for I-130)
  const petitionerPerson = persons?.find((p: Record<string, unknown>) => p.role === "petitioner");
  const petitionerAddresses = petitionerPerson
    ? (addresses?.filter((a: Record<string, unknown>) => a.person_id === (petitionerPerson.id as string)) || [])
    : [];
  if (petitionerPerson) {
    data.petitioner = buildPersonBlock(petitionerPerson, petitionerAddresses);
  } else if (profile) {
    data.petitioner = { ...applicant };
  }

  // Beneficiary (for I-130)
  const beneficiaryPerson = persons?.find((p: Record<string, unknown>) => p.role === "beneficiary");
  const beneficiaryAddresses = beneficiaryPerson
    ? (addresses?.filter((a: Record<string, unknown>) => a.person_id === (beneficiaryPerson.id as string)) || [])
    : [];
  if (beneficiaryPerson) {
    data.beneficiary = buildPersonBlock(beneficiaryPerson, beneficiaryAddresses);
  }

  // Sponsor (for I-864) — same as petitioner typically
  const sponsor: Record<string, unknown> = {};
  const petitioner = petitionerPerson || persons?.find((p: Record<string, unknown>) => p.role === "petitioner");
  if (petitioner) {
    sponsor.first_name = petitioner.first_name || "";
    sponsor.last_name = petitioner.last_name || "";
    sponsor.middle_name = petitioner.middle_name || "";
    sponsor.date_of_birth = petitioner.date_of_birth || "";
    sponsor.city_of_birth = petitioner.city_of_birth || "";
    sponsor.ssn = petitioner.ssn || "";
    sponsor.country_of_domicile = "United States";
    sponsor.phone = petitioner.phone || "";
    sponsor.email = petitioner.email || "";
    const petAddr = addresses?.find((a: Record<string, unknown>) => a.person_id === petitioner.id && a.is_current);
    if (petAddr) {
      sponsor.address = {
        street: petAddr.street || "",
        apt: petAddr.apt || "",
        city: petAddr.city || "",
        state: petAddr.state || "",
        zip: petAddr.zip || "",
        country: petAddr.country || "United States",
        care_of: "",
      };
    }
  } else {
    // Fall back to applicant as sponsor
    Object.assign(sponsor, applicant);
    sponsor.country_of_domicile = "United States";
  }
  data.sponsor = sponsor;

  // Fold in field_values from form instances using the FIELD_KEY_TO_DATA_PATH map
  // This bridges the gap between the workspace UI keys and the PDF engine's nested paths.
  if (fieldValues) {
    const pathMap = FIELD_KEY_TO_DATA_PATH;

    for (const fv of fieldValues) {
      const key = fv.field_key as string;
      const val = fv.field_value as string;
      if (!key || !val) continue;

      const dataPath = pathMap[key];
      if (dataPath) {
        // Set deeply: e.g. "petitioner.last_name" → data.petitioner.last_name
        const parts = dataPath.split(".");
        let target: Record<string, unknown> = data;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!target[parts[i]] || typeof target[parts[i]] !== "object") {
            target[parts[i]] = {};
          }
          target = target[parts[i]] as Record<string, unknown>;
        }
        const leaf = parts[parts.length - 1];
        // Workspace field_values ALWAYS override profile/persons data because
        // the user explicitly entered them in the form workspace.
        target[leaf] = val;
      }

      // Also handle checkbox derivation for relationship/gender/marital
      if (key === "relationship") {
        const petition = (data.petition || {}) as Record<string, unknown>;
        petition.relationship_spouse = val === "Spouse" ? "true" : "false";
        petition.relationship_parent = val === "Parent" ? "true" : "false";
        petition.relationship_sibling = val === "Brother/Sister" ? "true" : "false";
        petition.relationship_child = val === "Child" ? "true" : "false";
        data.petition = petition;
      }
      if (key === "petitioner_gender") {
        const pet = (data.petitioner || {}) as Record<string, unknown>;
        pet.gender_male = val === "Male" ? "true" : "false";
        pet.gender_female = val === "Female" ? "true" : "false";
        data.petitioner = pet;
      }
      if (key === "beneficiary_gender") {
        const ben = (data.beneficiary || {}) as Record<string, unknown>;
        ben.gender_male = val === "Male" ? "true" : "false";
        ben.gender_female = val === "Female" ? "true" : "false";
        data.beneficiary = ben;
      }
      if (key === "petitioner_marital_status") {
        const pet = (data.petitioner || {}) as Record<string, unknown>;
        pet.marital_single = val.includes("Single") ? "true" : "false";
        pet.marital_married = val === "Married" ? "true" : "false";
        pet.marital_divorced = val === "Divorced" ? "true" : "false";
        pet.marital_widowed = val === "Widowed" ? "true" : "false";
        pet.marital_separated = val === "Separated" ? "true" : "false";
        pet.marital_annulled = val.includes("Annulled") ? "true" : "false";
        data.petitioner = pet;
      }
      if (key === "petitioner_status") {
        const pet = (data.petitioner || {}) as Record<string, unknown>;
        pet.is_us_citizen = val.includes("Citizen") ? "true" : "false";
        pet.is_lpr = val.includes("Permanent") || val.includes("LPR") ? "true" : "false";
        data.petitioner = pet;
      }
      if (key === "beneficiary_marital_status") {
        const ben = (data.beneficiary || {}) as Record<string, unknown>;
        ben.marital_single = val.includes("Single") ? "true" : "false";
        ben.marital_married = val === "Married" ? "true" : "false";
        ben.marital_divorced = val === "Divorced" ? "true" : "false";
        ben.marital_widowed = val === "Widowed" ? "true" : "false";
        ben.marital_separated = val === "Separated" ? "true" : "false";
        ben.marital_annulled = val.includes("Annulled") ? "true" : "false";
        data.beneficiary = ben;
      }
      if (key === "beneficiary_in_proceedings") {
        const ben = (data.beneficiary || {}) as Record<string, unknown>;
        ben.in_proceedings_yes = val === "Yes" ? "true" : "false";
        ben.in_proceedings_no = val === "No" ? "true" : "false";
        ben.in_proceedings_unknown = val === "Unknown" ? "true" : "false";
        data.beneficiary = ben;
      }
      if (key === "beneficiary_in_us_now") {
        const ben = (data.beneficiary || {}) as Record<string, unknown>;
        ben.in_us_now_yes = val === "Yes" ? "true" : "false";
        ben.in_us_now_no = val === "No" ? "true" : "false";
        data.beneficiary = ben;
      }
      if (key === "beneficiary_work_without_auth") {
        const ben = (data.beneficiary || {}) as Record<string, unknown>;
        ben.work_without_auth_yes = val === "Yes" ? "true" : "false";
        ben.work_without_auth_no = val === "No" ? "true" : "false";
        data.beneficiary = ben;
      }
      if (key === "beneficiary_proceedings_type") {
        const ben = (data.beneficiary || {}) as Record<string, unknown>;
        ben.proceedings_removal = val === "Removal" ? "true" : "false";
        ben.proceedings_exclusion = val === "Exclusion/Deportation" ? "true" : "false";
        ben.proceedings_rescission = val === "Rescission" ? "true" : "false";
        ben.proceedings_judicial = val === "Judicial Proceedings" ? "true" : "false";
        data.beneficiary = ben;
      }
      if (key === "petitioner_statement_can_read") {
        const pet = (data.petitioner || {}) as Record<string, unknown>;
        pet.statement_can_read = val === "Yes" ? "true" : "false";
        data.petitioner = pet;
      }
      if (key === "petitioner_statement_used_interpreter") {
        const pet = (data.petitioner || {}) as Record<string, unknown>;
        pet.statement_used_interpreter = val === "Yes" ? "true" : "false";
        data.petitioner = pet;
      }

      // Legacy fallback for generic applicant keys
      if (key === "first_name" && !applicant.first_name) applicant.first_name = val;
      if (key === "last_name" && !applicant.last_name) applicant.last_name = val;
      if (key === "date_of_birth" && !applicant.date_of_birth) applicant.date_of_birth = val;
    }
  }

  return data;
}

// ── Core PDF fill engine ──

export interface FillResult {
  pdfBytes: Uint8Array;
  filledFields: string[];
  missingRequired: string[];
  totalFields: number;
  mappedFields: number;
  unmappedPdfFields: string[];
}

interface PopulatedFormResult {
  attemptedCount: number;
  fieldNames: string[];
  filledFields: string[];
  mappedFields: number;
  missingRequired: string[];
  unmappedPdfFields: string[];
}

function isTruthyValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "y" || normalized === "checked";
}

function normalizePdfFieldName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveMatchingPdfFieldName(fieldNames: string[], requestedName: string): string | undefined {
  if (fieldNames.includes(requestedName)) return requestedName;

  const fieldPart = requestedName.split(".").pop() || requestedName;
  const normalizedRequested = normalizePdfFieldName(requestedName);
  const normalizedPart = normalizePdfFieldName(fieldPart);

  return fieldNames.find((name) => {
    const normalizedName = normalizePdfFieldName(name);
    return (
      name.endsWith(fieldPart) ||
      normalizedName === normalizedRequested ||
      normalizedName.endsWith(normalizedPart)
    );
  });
}

function tryPopulateField(
  form: PDFForm,
  fieldName: string,
  fieldType: FieldMapping["fieldType"],
  value: string,
): boolean {
  if (fieldType === "checkbox") {
    try {
      const field = form.getCheckBox(fieldName);
      if (isTruthyValue(value)) {
        field.check();
      } else {
        field.uncheck();
      }
      return true;
    } catch {
      return false;
    }
  }

  if (fieldType === "dropdown") {
    try {
      const field = form.getDropdown(fieldName);
      field.select(value);
      return true;
    } catch {
      try {
        const textField = form.getTextField(fieldName);
        textField.setText(value);
        return true;
      } catch {
        return false;
      }
    }
  }

  try {
    const field = form.getTextField(fieldName);
    field.setText(value);
    return true;
  } catch {
    try {
      const dropdown = form.getDropdown(fieldName);
      dropdown.select(value);
      return true;
    } catch {
      return false;
    }
  }
}

function populatePdfForm(
  form: PDFForm,
  mappings: FieldMapping[],
  caseData: Record<string, unknown>,
): PopulatedFormResult {
  const fieldNames = form.getFields().map((field) => field.getName());
  const filledFieldNames = new Set<string>();
  const missingRequired: string[] = [];
  let attemptedCount = 0;

  for (const mapping of mappings) {
    const rawValue = resolveDataPath(caseData, mapping.internalPath);

    if (!rawValue && mapping.required) {
      missingRequired.push(mapping.internalPath);
      continue;
    }

    if (!rawValue) continue;

    attemptedCount++;
    const value = applyTransform(rawValue, mapping.transform);
    const resolvedFieldName = resolveMatchingPdfFieldName(fieldNames, mapping.pdfFieldName);

    if (!resolvedFieldName) continue;
    if (tryPopulateField(form, resolvedFieldName, mapping.fieldType, value)) {
      filledFieldNames.add(resolvedFieldName);
    }
  }

  const unmappedPdfFields = fieldNames.filter(
    (fieldName) => !mappings.some((mapping) => resolveMatchingPdfFieldName([fieldName], mapping.pdfFieldName) === fieldName),
  );

  return {
    attemptedCount,
    fieldNames,
    filledFields: Array.from(filledFieldNames),
    mappedFields: mappings.length,
    missingRequired,
    unmappedPdfFields,
  };
}

async function finalizePdfWithAppearances(pdfDoc: PDFDocument, form: PDFForm, flatten = true): Promise<Uint8Array> {
  try {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    form.updateFieldAppearances(font);
  } catch {
    // Some malformed templates reject appearance regeneration; flattening still improves compatibility.
  }

  if (flatten) {
    try {
      form.flatten();
    } catch {
      // If flattening fails, save the populated document as-is rather than failing preview/export entirely.
    }
  }

  return new Uint8Array(await pdfDoc.save());
}

async function renderOverlayTemplate(
  pdfDoc: PDFDocument,
  formCode: string,
  mappings: FieldMapping[],
  caseData: Record<string, unknown>,
): Promise<FillResult> {
  const overlayCoords = TEMPLATE_OVERLAY_COORDS[formCode] || {};
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const filledFields: string[] = [];
  const missingRequired: string[] = [];

  for (const mapping of mappings) {
    const fieldKey = mapping.pdfFieldName.split(".").pop() || mapping.pdfFieldName;
    const overlay = overlayCoords[fieldKey] || overlayCoords[mapping.pdfFieldName];
    const rawValue = resolveDataPath(caseData, mapping.internalPath);

    if (!rawValue && mapping.required) {
      missingRequired.push(mapping.internalPath);
      continue;
    }
    if (!rawValue || !overlay) continue;

    const value = applyTransform(rawValue, mapping.transform);
    const page = pages[overlay.page];
    if (!page) continue;

    const [x1, y1, x2, y2] = overlay.rect;
    const width = Math.max(x2 - x1, 8);
    const height = Math.max(y2 - y1, 8);

    if (overlay.type === "checkbox" || mapping.fieldType === "checkbox") {
      if (isTruthyValue(value)) {
        page.drawText("X", {
          x: x1 + Math.max((width - 7) / 2, 0),
          y: y1 + Math.max((height - 7) / 2, 0),
          size: Math.min(height + 1, 10),
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        filledFields.push(mapping.pdfFieldName);
      }
      continue;
    }

    const fontSize = Math.max(7, Math.min(height * 0.72, 10));
    const textY = y1 + Math.max((height - fontSize) / 2, 0) + 1;
    const maxChars = Math.max(1, Math.floor(width / (fontSize * 0.52)));
    const text = String(value).slice(0, maxChars);

    page.drawText(text, {
      x: x1 + 1.5,
      y: textY,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
      maxWidth: width - 3,
    });
    filledFields.push(mapping.pdfFieldName);
  }

  return {
    pdfBytes: new Uint8Array(await pdfDoc.save()),
    filledFields,
    missingRequired,
    totalFields: Object.keys(overlayCoords).length,
    mappedFields: mappings.length,
    unmappedPdfFields: Object.keys(overlayCoords).filter((name) => !mappings.some((mapping) => (mapping.pdfFieldName.split(".").pop() || mapping.pdfFieldName) === name || mapping.pdfFieldName === name)),
  };
}

export async function fillPdfTemplate(
  formCode: string,
  caseData: Record<string, unknown>,
): Promise<FillResult> {
  const templateInfo = TEMPLATE_REGISTRY[formCode];
  if (!templateInfo) throw new Error(`No template registered for form ${formCode}`);

  const pdfDoc = await loadPdfDocumentSafely(templateInfo.path);
  const mappings = FORM_FIELD_MAPPINGS[formCode] || [];

  let form: PDFForm;
  try {
    form = pdfDoc.getForm();
  } catch {
    return renderOverlayTemplate(pdfDoc, formCode, mappings, caseData);
  }

  let fieldCount = 0;
  try {
    fieldCount = form.getFields().length;
  } catch {
    return renderOverlayTemplate(pdfDoc, formCode, mappings, caseData);
  }
  if (fieldCount === 0 && TEMPLATE_OVERLAY_COORDS[formCode]) {
    return renderOverlayTemplate(pdfDoc, formCode, mappings, caseData);
  }
  const populated = populatePdfForm(form, mappings, caseData);

  if (populated.attemptedCount > 0 && populated.filledFields.length === 0 && TEMPLATE_OVERLAY_COORDS[formCode]) {
    return renderOverlayTemplate(pdfDoc, formCode, mappings, caseData);
  }

  // Stamp DRAFT watermark on every page when required fields are missing.
  // This prevents users from filing a defective official form unknowingly.
  if (populated.missingRequired.length > 0) {
    await stampDraftWatermark(pdfDoc, populated.missingRequired.length);
  }

  const pdfBytes = await finalizePdfWithAppearances(pdfDoc, form, true);

  return {
    pdfBytes,
    filledFields: populated.filledFields,
    missingRequired: populated.missingRequired,
    totalFields: populated.fieldNames.length,
    mappedFields: populated.mappedFields,
    unmappedPdfFields: populated.unmappedPdfFields,
  };
}

/**
 * Stamps a diagonal "DRAFT — INCOMPLETE" watermark across every page.
 * Used when an export is generated with required fields missing, so the
 * user (and any reviewer) immediately sees the document is not fileable.
 */
async function stampDraftWatermark(pdfDoc: PDFDocument, missingCount: number): Promise<void> {
  try {
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const label = `DRAFT — INCOMPLETE (${missingCount} required field${missingCount === 1 ? "" : "s"} missing)`;
    for (const page of pages) {
      const { width, height } = page.getSize();
      // Big diagonal watermark
      page.drawText("DRAFT", {
        x: width * 0.18,
        y: height * 0.45,
        size: 120,
        font,
        color: rgb(0.85, 0.1, 0.1),
        opacity: 0.18,
        rotate: { type: "degrees", angle: 35 } as never,
      });
      // Top banner
      page.drawRectangle({
        x: 0,
        y: height - 22,
        width,
        height: 22,
        color: rgb(0.85, 0.1, 0.1),
        opacity: 0.85,
      });
      page.drawText(label, {
        x: 14,
        y: height - 16,
        size: 11,
        font,
        color: rgb(1, 1, 1),
      });
      // Bottom note
      page.drawText("Do not file with USCIS until all required fields are complete.", {
        x: 14,
        y: 8,
        size: 8,
        font,
        color: rgb(0.85, 0.1, 0.1),
      });
    }
  } catch (err) {
    console.warn("[Watermark] Failed to stamp DRAFT watermark:", err);
  }
}

/** Get all PDF field names from a template (for admin mapping tools) */
export async function extractPdfFieldNames(formCode: string): Promise<{
  fields: Array<{ name: string; type: string; value?: string }>;
  pageCount: number;
}> {
  const templateInfo = TEMPLATE_REGISTRY[formCode];
  if (!templateInfo) throw new Error(`No template registered for form ${formCode}`);

  const pdfDoc = await loadPdfDocumentSafely(templateInfo.path);

  let fields: Array<{ name: string; type: string; value?: string }> = [];

  try {
    const form = pdfDoc.getForm();
    const allFields = form.getFields();

    fields = allFields.map(field => {
      const name = field.getName();
      let type = "unknown";
      let value: string | undefined;

      if (field instanceof PDFTextField) {
        type = "text";
        value = field.getText() || undefined;
      } else if (field instanceof PDFCheckBox) {
        type = "checkbox";
        value = field.isChecked() ? "checked" : "unchecked";
      } else if (field instanceof PDFDropdown) {
        type = "dropdown";
        value = field.getSelected()?.join(", ") || undefined;
      }

      return { name, type, value };
    });
  } catch { /* No form fields */ }

  return { fields, pageCount: pdfDoc.getPageCount() };
}

/** Generate preview PDF (not flattened — fields remain editable) */
export async function generatePreviewPdf(
  formCode: string,
  caseData: Record<string, unknown>,
): Promise<Uint8Array> {
  const templateInfo = TEMPLATE_REGISTRY[formCode];
  if (!templateInfo) throw new Error(`No template for ${formCode}`);

  const pdfDoc = await loadPdfDocumentSafely(templateInfo.path);
  const mappings = FORM_FIELD_MAPPINGS[formCode] || [];

  // If no mappings defined, fall back to overlay immediately
  if (mappings.length === 0 && TEMPLATE_OVERLAY_COORDS[formCode]) {
    return (await renderOverlayTemplate(pdfDoc, formCode, mappings, caseData)).pdfBytes;
  }

  let form: PDFForm;
  try {
    form = pdfDoc.getForm();
  } catch {
    return (await renderOverlayTemplate(pdfDoc, formCode, mappings, caseData)).pdfBytes;
  }

  let fields;
  try {
    fields = form.getFields();
  } catch {
    return (await renderOverlayTemplate(pdfDoc, formCode, mappings, caseData)).pdfBytes;
  }

  // If PDF has no form fields, use overlay rendering
  if (fields.length === 0 && TEMPLATE_OVERLAY_COORDS[formCode]) {
    return (await renderOverlayTemplate(pdfDoc, formCode, mappings, caseData)).pdfBytes;
  }

  const populated = populatePdfForm(form, mappings, caseData);

  // If native filling produced very few results, fall back to overlay for better population
  if (populated.attemptedCount > 0 && populated.filledFields.length === 0 && TEMPLATE_OVERLAY_COORDS[formCode]) {
    console.warn(`[Preview] Native fill produced 0/${populated.attemptedCount} fields for ${formCode}, falling back to overlay`);
    // Reload a fresh copy for overlay since we may have partially corrupted the form
    const freshDoc = await loadPdfDocumentSafely(templateInfo.path);
    return (await renderOverlayTemplate(freshDoc, formCode, mappings, caseData)).pdfBytes;
  }

  console.log(`[Preview] Filled ${populated.filledFields.length}/${populated.attemptedCount} fields for ${formCode}`);
  return finalizePdfWithAppearances(pdfDoc, form, true);
}
