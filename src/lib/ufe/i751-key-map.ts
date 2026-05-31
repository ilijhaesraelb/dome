/**
 * I-751 — Internal field key → official AcroForm PDF widget name.
 *
 * Wires every key declared by `I751_SECTIONS` in `formSections.ts`.
 */
export const I751_KEY_TO_ACROFORM: Record<string, string> = {
  // Part 1 — applicant identity
  first_name: "Pt1Line1b_GivenName[0]",
  middle_name: "Pt1Line1c_MiddleName[0]",
  last_name: "Pt1Line1a_FamilyName[0]",
  date_of_birth: "Pt1Line5_DateOfBirth[0]",
  country_of_birth: "Pt1Line6_CountryOfBirth[0]",
  alien_number: "Pt1Line2_AlienNumber[0]",
  ssn: "Pt1Line4_SSN[0]",

  // Part 1 — current address
  current_address: "Pt1Line8a_StreetNumberName[0]",
  city: "Pt1Line8c_CityOrTown[0]",
  state: "Pt1Line8d_State[0]",
  zip: "Pt1Line8e_ZipCode[0]",

  // Part 2 — marriage information
  petitioner_date_of_marriage: "Pt2Line1_DateOfMarriage[0]",
  petitioner_marriage_city: "Pt2Line2a_CityOfMarriage[0]",
  petitioner_marriage_state: "Pt2Line2b_StateOfMarriage[0]",
  petitioner_marriage_country: "Pt2Line2c_CountryOfMarriage[0]",
  petitioner_marital_status: "Pt2Line3_MaritalStatus[0]",

  // Part 3 — petitioning spouse
  petitioner_last_name: "Pt3Line1a_FamilyName[0]",
  petitioner_first_name: "Pt3Line1b_GivenName[0]",
  petitioner_dob: "Pt3Line2_DateOfBirth[0]",
  petitioner_ssn: "Pt3Line3_SSN[0]",

  // Part 4 — bona fide marriage evidence
  joint_lease_or_mortgage: "Pt4Line1_JointLease[0]",
  joint_bank_accounts: "Pt4Line2_JointAccounts[0]",
  joint_tax_returns: "Pt4Line3_JointTaxReturns[0]",
  children_together: "Pt4Line4_ChildrenTogether[0]",
};