/**
 * I-485 — Internal field key → official XFA overlay field name.
 *
 * The official I-485 PDF is XFA-only. We stamp answers onto the
 * flattened template at fixed coordinates from `i485-overlay-coords.ts`.
 * This map links the in-app `FormFieldDef.key` values used by the
 * Form Workspace to the underlying overlay coordinate keys (XFA names).
 *
 * Keys NOT in this map are tracked as `unmapped` in the UFE definition
 * so the validator and Review screen can surface them as gaps.
 */
export const I485_KEY_TO_OVERLAY: Record<string, string> = {
  // ── Part 1 — Applicant Info ──
  first_name: "Pt1Line1_GivenName[0]",
  middle_name: "Pt1Line1_MiddleName[0]",
  last_name: "Pt1Line1_FamilyName[0]",
  applicant_other_first_name: "Pt1Line2_GivenName[0]",
  applicant_other_middle_name: "Pt1Line2_MiddleName[0]",
  applicant_other_last_name: "Pt1Line2_FamilyName[0]",
  date_of_birth: "Pt1Line3_DOB[0]",
  applicant_other_dob: "Pt1Line3A_OtherDOB[0]",
  alien_number: "AlienNumber[0]",
  applicant_uscis_account: "USCISOnlineAcctNumber[0]",
  city_of_birth: "Pt1Line7_CityTownOfBirth[0]",
  applicant_city_of_birth: "Pt1Line7_CityTownOfBirth[0]",
  country_of_birth: "Pt1Line7_CountryOfBirth[0]",
  nationality: "Pt1Line8_CountryofCitizenshipNationality[0]",
  applicant_country_of_citizenship: "Pt1Line8_CountryofCitizenshipNationality[0]",
  ssn: "Pt1Line9_USCISAccountNumber[0]",

  // Travel doc & arrival (Part 1 cont.)
  applicant_passport_number: "Pt1Line10_PassportNum[0]",
  applicant_passport_expiry: "Pt1Line10_ExpDate[0]",
  applicant_passport_country: "Pt1Line10_Passport[0]",
  applicant_visa_number: "Pt1Line10_VisaNum[0]",
  applicant_arrival_city: "Pt1Line10_CityTown[0]",
  applicant_arrival_state: "Pt1Line10_State[0]",
  date_of_last_entry: "Pt1Line10_DateofArrival[0]",
  applicant_visa_issued_date: "Pt1Line10_NonImmDate[0]",
  applicant_admitted_as: "Pt1Line11_Admitted[0]",
  applicant_paroled_as: "Pt1Line11_Paroled[0]",
  applicant_entry_other: "Pt1Line11_Other[0]",
  i94_number: "P1Line12_I94[0]",
  applicant_i94_status: "Pt1Line12_Status[0]",
  applicant_i94_expires: "Pt1Line12_Date[0]",

  // Current address (Part 1, Item 18)
  current_address: "Pt1Line18_CurrentStreetNumberName[0]",
  city: "Pt1Line18_CurrentCityOrTown[0]",
  state: "Pt1Line18_CurrentState[0]",
  zip: "Pt1Line18_CurrentZipCode[0]",

  // Prior address (Part 1, Item 18 prior)
  prior_address_street: "Pt1Line18_PriorStreetName[0]",
  prior_address_city: "Pt1Line18_PriorCity[0]",
  prior_address_state: "Pt1Line18_PriorState[0]",
  prior_address_zip: "Pt1Line18_PriorZipCode[0]",
  prior_address_country: "Pt1Line18_PriorCountry[0]",
  prior_address_date_from: "Pt1Line18_PriorDateFrom[0]",
};