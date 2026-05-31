/**
 * N-400 — Internal field key → official AcroForm PDF widget name.
 *
 * Mappings cover the Part 1 / Part 2 questions exposed in
 * `N400_SECTIONS`. Additional sections (Part 3+) will be wired
 * progressively as the schema grows.
 */
export const N400_KEY_TO_ACROFORM: Record<string, string> = {
  // Part 1 — applicant identity
  first_name: "Pt1Line1b_GivenName[0]",
  last_name: "Pt1Line1a_FamilyName[0]",
  date_of_birth: "Pt2Line1_DateOfBirth[0]",
  country_of_birth: "Pt2Line2_CountryOfBirth[0]",
  date_became_resident: "Pt2Line5_DateOfResidence[0]",
  alien_number: "Pt1Line3_AlienNumber[0]",
  ssn: "Pt1Line4_SSN[0]",

  // Part 2 — current address & employment
  current_address: "Pt4Line1a_StreetNumberName[0]",
  city: "Pt4Line1c_CityOrTown[0]",
  state: "Pt4Line1d_State[0]",
  zip: "Pt4Line1e_ZipCode[0]",
  marital_status: "Pt8Line1_MaritalStatus[0]",
  employer: "Pt9Line1_Employer[0]",
  occupation: "Pt9Line2_Occupation[0]",
};