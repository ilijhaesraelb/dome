/**
 * Case Package definitions for D.O.M.E.
 * Each package defines the complete set of forms, documents, and flow
 * required for a specific immigration case type.
 *
 * GOLD STANDARD: Marriage-Based Adjustment of Status (Inside U.S.)
 */

export interface PackageFormDef {
  code: string;
  name: string;
  reason: string;
  required: boolean;
  order: number;
  /** Who fills this form: petitioner, beneficiary, or joint */
  filledBy: "petitioner" | "beneficiary" | "joint";
}

export interface PackageDocDef {
  category: string;
  label: string;
  description: string;
  required: boolean;
  /** Which person this document belongs to */
  belongsTo: "petitioner" | "beneficiary" | "both" | "joint";
}

export interface CasePackage {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  caseType: string;
  /** Ordered list of forms */
  forms: PackageFormDef[];
  /** Required and recommended documents */
  documents: PackageDocDef[];
  /** Shared data fields that auto-fill across forms */
  sharedDataKeys: string[];
  /** Compliance disclaimer */
  disclaimer: string;
}

export const CASE_PACKAGES: Record<string, CasePackage> = {
  marriage_aos_inside: {
    id: "marriage_aos_inside",
    label: "Marriage-Based Adjustment of Status (Inside U.S.)",
    shortLabel: "Marriage Green Card",
    description:
      "Complete case package for a spouse of a U.S. citizen or permanent resident applying for a green card from inside the United States.",
    caseType: "Adjustment of Status",

    forms: [
      {
        code: "I-130",
        name: "Petition for Alien Relative",
        reason: "Establishes the qualifying family relationship between petitioner and beneficiary.",
        required: true,
        order: 1,
        filledBy: "petitioner",
      },
      {
        code: "I-485",
        name: "Application to Register Permanent Residence (Adjustment of Status)",
        reason: "The beneficiary's application to adjust status to lawful permanent resident.",
        required: true,
        order: 2,
        filledBy: "beneficiary",
      },
      {
        code: "I-765",
        name: "Application for Employment Authorization",
        reason: "Allows the beneficiary to work while the case is pending.",
        required: false,
        order: 3,
        filledBy: "beneficiary",
      },
      {
        code: "I-864",
        name: "Affidavit of Support Under Section 213A of the INA",
        reason: "Proves the petitioner can financially support the beneficiary.",
        required: true,
        order: 4,
        filledBy: "petitioner",
      },
      {
        code: "I-693",
        name: "Report of Medical Examination and Vaccination Record",
        reason: "Required medical examination for adjustment of status applicants.",
        required: true,
        order: 5,
        filledBy: "beneficiary",
      },
      {
        code: "I-912",
        name: "Request for Fee Waiver",
        reason: "Request to waive USCIS filing fees based on financial hardship.",
        required: false,
        order: 6,
        filledBy: "beneficiary",
      },
    ],

    documents: [
      // Petitioner documents
      {
        category: "identity",
        label: "Petitioner's Passport or ID",
        description: "Valid passport, driver's license, or government-issued photo ID of the U.S. citizen/LPR spouse.",
        required: true,
        belongsTo: "petitioner",
      },
      {
        category: "identity",
        label: "Petitioner's Birth Certificate",
        description: "To establish U.S. citizenship (if born in the U.S.).",
        required: true,
        belongsTo: "petitioner",
      },
      {
        category: "immigration",
        label: "Petitioner's Naturalization Certificate",
        description: "If the petitioner is a naturalized U.S. citizen.",
        required: false,
        belongsTo: "petitioner",
      },
      {
        category: "immigration",
        label: "Petitioner's Green Card (if LPR)",
        description: "Copy of both sides if petitioner is a lawful permanent resident.",
        required: false,
        belongsTo: "petitioner",
      },

      // Beneficiary documents
      {
        category: "identity",
        label: "Beneficiary's Passport",
        description: "Valid passport of the foreign-national spouse.",
        required: true,
        belongsTo: "beneficiary",
      },
      {
        category: "identity",
        label: "Beneficiary's Birth Certificate",
        description: "Official birth certificate with translation if not in English.",
        required: true,
        belongsTo: "beneficiary",
      },
      {
        category: "immigration",
        label: "Beneficiary's I-94 Record",
        description: "Most recent I-94 arrival/departure record.",
        required: true,
        belongsTo: "beneficiary",
      },
      {
        category: "immigration",
        label: "Beneficiary's Visa Page",
        description: "Copy of the visa used to enter the United States.",
        required: false,
        belongsTo: "beneficiary",
      },

      // Joint / relationship documents
      {
        category: "civil documents",
        label: "Marriage Certificate",
        description: "Official marriage certificate proving the marital relationship.",
        required: true,
        belongsTo: "joint",
      },
      {
        category: "civil documents",
        label: "Prior Marriage Termination",
        description: "Divorce decree, annulment, or death certificate for any prior marriages of either spouse.",
        required: false,
        belongsTo: "both",
      },
      {
        category: "supporting",
        label: "Proof of Bona Fide Marriage",
        description: "Joint bank statements, lease/mortgage, photos together, affidavits from friends/family.",
        required: true,
        belongsTo: "joint",
      },
      {
        category: "financial",
        label: "Petitioner's Tax Returns (3 years)",
        description: "Federal tax returns, W-2s, or tax transcripts for the most recent 3 years.",
        required: true,
        belongsTo: "petitioner",
      },
      {
        category: "financial",
        label: "Petitioner's Employment Letter",
        description: "Current employment verification letter showing salary.",
        required: true,
        belongsTo: "petitioner",
      },
      {
        category: "financial",
        label: "Petitioner's Bank Statements",
        description: "Recent bank statements showing financial stability.",
        required: false,
        belongsTo: "petitioner",
      },

      // Photos
      {
        category: "identity",
        label: "Passport-Style Photos",
        description: "2x2 inch passport photos of both petitioner and beneficiary (2 each).",
        required: true,
        belongsTo: "both",
      },
    ],

    sharedDataKeys: [
      "petitioner_first_name",
      "petitioner_last_name",
      "petitioner_middle_name",
      "petitioner_dob",
      "petitioner_country_of_birth",
      "petitioner_city_of_birth",
      "petitioner_ssn",
      "petitioner_address",
      "petitioner_city",
      "petitioner_state",
      "petitioner_zip",
      "petitioner_alien_number",
      "beneficiary_first_name",
      "beneficiary_last_name",
      "beneficiary_middle_name",
      "beneficiary_dob",
      "beneficiary_country_of_birth",
      "beneficiary_city_of_birth",
      "beneficiary_alien_number",
      "beneficiary_address",
      "beneficiary_city",
      "beneficiary_state",
      "beneficiary_zip",
      "date_of_marriage",
      "marriage_city",
      "marriage_state",
      "marriage_country",
    ],

    disclaimer:
      "D.O.M.E. provides educational guidance, document organization, and form-preparation support. D.O.M.E. does not provide legal advice. Generated forms must be reviewed for accuracy, signatures, and filing requirements before submission to USCIS.",
  },
};

/**
 * Get the case package definition for a given case type string.
 */
export function getPackageForCaseType(caseType: string): CasePackage | null {
  if (
    caseType === "Adjustment of Status" ||
    caseType === "marriage_based_aos" ||
    caseType === "family" ||
    caseType === "green_card"
  ) {
    return CASE_PACKAGES.marriage_aos_inside;
  }
  return null;
}

/**
 * Given a case package and the form the user just completed, return the
 * next recommended form in the sequence (skipping the just-completed form).
 * Returns null if no next form exists or all subsequent forms are optional
 * and skipped.
 */
export function getNextRecommendedForm(
  pkg: CasePackage,
  justCompletedFormCode: string,
): PackageFormDef | null {
  const sorted = [...pkg.forms].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((f) => f.code === justCompletedFormCode);
  if (idx === -1) return null;
  // Prefer the next required form; if none, return the next form in order.
  const after = sorted.slice(idx + 1);
  return after.find((f) => f.required) || after[0] || null;
}
