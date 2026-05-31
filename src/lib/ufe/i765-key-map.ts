/**
 * I-765 — Internal field key → official XFA overlay widget name.
 *
 * Coordinates for these widgets live in
 * `TEMPLATE_OVERLAY_COORDS["I-765"]` (see `pdf-template-coordinates.ts`).
 * The Universal Form Engine uses this map to:
 *   - resolve the official PDF page for each answer (Review screen)
 *   - stamp the answer at the correct (x, y) on export.
 */
export const I765_KEY_TO_OVERLAY: Record<string, string> = {
  // Part 1 — applicant identity
  first_name: "Line1b_GivenName[0]",
  middle_name: "Line1c_MiddleName[0]",
  last_name: "Line1a_FamilyName[0]",
  date_of_birth: "Line19_DOB[0]",
  country_of_birth: "Line17a_CountryOfBirth[0]",
  ssn: "Line12b_SSN[0]",

  // Part 2 — current address
  current_address: "Pt2Line7_StreetNumberName[0]",
  city: "Pt2Line7_CityOrTown[0]",
  state: "Pt2Line7_State[0]",
  zip: "Pt2Line7_ZipCode[0]",
};