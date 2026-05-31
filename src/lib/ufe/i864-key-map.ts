/**
 * I-864 — Internal field key → official AcroForm PDF widget name.
 *
 * Mapping for the small set of Sponsor fields collected by the current
 * Workspace `I864_SECTIONS`. The official I-864 PDF has many more
 * fields; the unmapped ones surface as gaps in the UFE Coordinate Map
 * so the team can wire them progressively.
 */
export const I864_KEY_TO_ACROFORM: Record<string, string> = {
  // Sponsor identity (Part 1)
  first_name: "Pt1Line2_GivenName[0]",
  last_name: "Pt1Line2_FamilyName[0]",
  date_of_birth: "Pt1Line5_DateOfBirth[0]",
  ssn: "Pt1Line8_SSN[0]",

  // Sponsor mailing address (Part 1)
  address: "Pt1Line6_StreetNumberName[0]",
  city: "Pt1Line6_CityOrTown[0]",
  state: "Pt1Line6_State[0]",
  zip: "Pt1Line6_ZipCode[0]",
};