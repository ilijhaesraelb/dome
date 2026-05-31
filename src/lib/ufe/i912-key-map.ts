/**
 * I-912 — Internal field key → official AcroForm PDF widget name.
 *
 * Mapping for the small Applicant intake collected by `I912_SECTIONS`.
 * Additional Means-Tested-Benefits / Income / Hardship sections will
 * be wired progressively as the schema expands.
 */
export const I912_KEY_TO_ACROFORM: Record<string, string> = {
  // Applicant identity (Part 1)
  first_name: "Pt1Line1a_GivenName[0]",
  last_name: "Pt1Line1a_FamilyName[0]",
  date_of_birth: "Pt1Line2_DateOfBirth[0]",
  alien_number: "Pt1Line3_AlienNumber[0]",

  // Applicant address (Part 1)
  current_address: "Pt1Line5_StreetNumberName[0]",
  city: "Pt1Line5_CityOrTown[0]",
  state: "Pt1Line5_State[0]",
  zip: "Pt1Line5_ZipCode[0]",
};