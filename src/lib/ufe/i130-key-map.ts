/**
 * I-130 — Internal field key → official AcroForm PDF widget name.
 *
 * The official I-130 template at `/templates/i-130.pdf` is a real
 * AcroForm. Each internal `FormFieldDef.key` used in the Workspace
 * is mapped here to the underlying PDF widget so the UFE Coordinate
 * Map panel can show the user exactly where their answer will land.
 *
 * Coordinates / pages are resolved from `TEMPLATE_OVERLAY_COORDS["I-130"]`
 * in `src/lib/pdf-template-coordinates.ts`.
 */
export const I130_KEY_TO_ACROFORM: Record<string, string> = {
  // ── Part 1 — Relationship ──
  relationship_spouse: "Pt1Line1_Spouse[0]",
  relationship_parent: "Pt1Line1_Parent[0]",
  relationship_child: "Pt1Line1_Child[0]",
  relationship_sibling: "Pt1Line1_Siblings[0]",

  // ── Part 2 — Petitioner ──
  petitioner_alien_number: "Pt2Line1_AlienNumber[0]",
  petitioner_uscis_account: "Pt2Line2_USCISOnlineActNumber[0]",
  petitioner_ssn: "Pt2Line11_SSN[0]",
  petitioner_last_name: "Pt2Line4a_FamilyName[0]",
  petitioner_first_name: "Pt2Line4b_GivenName[0]",
  petitioner_middle_name: "Pt2Line4c_MiddleName[0]",
  petitioner_other_last_name: "Pt2Line5a_FamilyName[0]",
  petitioner_other_first_name: "Pt2Line5b_GivenName[0]",
  petitioner_other_middle_name: "Pt2Line5c_MiddleName[0]",
  petitioner_city_of_birth: "Pt2Line6_CityTownOfBirth[0]",
  petitioner_country_of_birth: "Pt2Line7_CountryofBirth[0]",
  petitioner_date_of_birth: "Pt2Line8_DateofBirth[0]",
  petitioner_gender_male: "Pt2Line9_Male[0]",
  petitioner_gender_female: "Pt2Line9_Female[0]",

  // ── Part 2 — Petitioner Address (current) ──
  petitioner_in_care_of: "Pt2Line10_InCareofName[0]",
  petitioner_street: "Pt2Line10_StreetNumberName[0]",
  petitioner_apt: "Pt2Line10_AptSteFlrNumber[0]",
  petitioner_city: "Pt2Line10_CityOrTown[0]",
  petitioner_state: "Pt2Line10_State[0]",
  petitioner_zip: "Pt2Line10_ZipCode[0]",
  petitioner_province: "Pt2Line10_Province[0]",
  petitioner_postal_code: "Pt2Line10_PostalCode[0]",
  petitioner_country: "Pt2Line10_Country[0]",

  // ── Part 2 — Marital Status (Item 17) ──
  petitioner_marital_single: "Pt2Line17_Single[0]",
  petitioner_marital_married: "Pt2Line17_Married[0]",
  petitioner_marital_divorced: "Pt2Line17_Divorced[0]",
  petitioner_marital_widowed: "Pt2Line17_Widowed[0]",
  petitioner_marital_separated: "Pt2Line17_Separated[0]",
  petitioner_marital_annulled: "Pt2Line17_Annulled[0]",
  petitioner_number_of_marriages: "Pt2Line16_NumberofMarriages[0]",
  petitioner_date_of_marriage: "Pt2Line18_DateOfMarriage[0]",

  // ── Part 2 — Status / Citizenship ──
  petitioner_is_us_citizen: "Pt2Line36_USCitizen[0]",
  petitioner_is_lpr: "Pt2Line36_LPR[0]",
  petitioner_certificate_number: "Pt2Line37a_CertificateNumber[0]",
  petitioner_place_of_issuance: "Pt2Line37b_PlaceOfIssuance[0]",
  petitioner_date_of_issuance: "Pt2Line37c_DateOfIssuance[0]",

  // ── Part 4 — Beneficiary ──
  beneficiary_alien_number: "Pt4Line1_AlienNumber[0]",
  beneficiary_uscis_account: "Pt4Line2_USCISOnlineActNumber[0]",
  beneficiary_ssn: "Pt4Line3_SSN[0]",
  beneficiary_last_name: "Pt4Line4a_FamilyName[0]",
  beneficiary_first_name: "Pt4Line4b_GivenName[0]",
  beneficiary_middle_name: "Pt4Line4c_MiddleName[0]",
  beneficiary_city_of_birth: "Pt4Line7_CityTownOfBirth[0]",
  beneficiary_country_of_birth: "Pt4Line8_CountryOfBirth[0]",
  beneficiary_date_of_birth: "Pt4Line9_DateOfBirth[0]",
};