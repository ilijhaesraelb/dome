/**
 * I-693 — Internal field key → official AcroForm PDF widget name.
 *
 * The civil surgeon completes most of the I-693 in person; UFE only
 * wires the applicant-identity fields the platform collects.
 */
export const I693_KEY_TO_ACROFORM: Record<string, string> = {
  // Part 1 — applicant identity
  first_name: "Pt1Line1b_GivenName[0]",
  middle_name: "Pt1Line1c_MiddleName[0]",
  last_name: "Pt1Line1a_FamilyName[0]",
  date_of_birth: "Pt1Line2_DateOfBirth[0]",
  country_of_birth: "Pt1Line3_CountryOfBirth[0]",
  alien_number: "Pt1Line4_AlienNumber[0]",

  // Part 1 — current address
  current_address: "Pt1Line5a_StreetNumberName[0]",
  city: "Pt1Line5c_CityOrTown[0]",
  state: "Pt1Line5d_State[0]",
  zip: "Pt1Line5e_ZipCode[0]",

  // Part 2 — applicant-disclosed medical notes
  vaccination_record_available: "Pt2Line1_VaccinationRecord[0]",
  mental_health_conditions: "Pt2Line2_MentalHealth[0]",
  substance_abuse_history: "Pt2Line3_SubstanceAbuse[0]",
};