import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PassportIdentity {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string | null;
  nationality: string | null;
  countryOfBirth: string | null;
  cityOfBirth: string | null;
  gender: string | null;
  passportNumber: string | null;
  passportCountry: string | null;
  alienNumber: string | null;
  ssn: string | null;
  maritalStatus: string | null;
  email: string | null;
  phone: string | null;
}

export interface PassportAddress {
  type: string;
  street: string | null;
  apt: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  from: string | null;
  to: string | null;
  isCurrent: boolean;
}

export interface PassportEmployment {
  employer: string;
  title: string | null;
  from: string | null;
  to: string | null;
  current: boolean;
  address: string | null;
}

export interface PassportTravel {
  country: string;
  departure: string | null;
  return: string | null;
  purpose: string | null;
}

export interface PassportImmigrationEntry {
  type: string | null;
  status: string | null;
  entryDate: string | null;
  expiryDate: string | null;
  port: string | null;
}

export interface PassportFiling {
  form: string;
  date: string | null;
  receipt: string | null;
  result: string | null;
}

export interface PassportDocument {
  name: string;
  category: string;
  status: string;
  date: string;
}

export interface PassportData {
  identity: PassportIdentity | null;
  addresses: PassportAddress[];
  employment: PassportEmployment[];
  travel: PassportTravel[];
  immigration: PassportImmigrationEntry[];
  filings: PassportFiling[];
  documents: PassportDocument[];
  completeness: number;
}

const computeCompleteness = (data: PassportData): number => {
  let filled = 0;
  let total = 10;

  const id = data.identity;
  if (id) {
    if (id.firstName) filled++;
    if (id.dateOfBirth) filled++;
    if (id.nationality) filled++;
    if (id.countryOfBirth) filled++;
    if (id.passportNumber) filled++;
    if (id.gender) filled++;
    if (id.maritalStatus) filled++;
  }
  // bonus sections
  total += 3;
  if (data.addresses.length > 0) filled++;
  if (data.employment.length > 0) filled++;
  if (data.travel.length > 0) filled++;

  return Math.round((filled / total) * 100);
};

export const usePassportData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["passport-data", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<PassportData> => {
      // 1. Get case IDs the user participates in
      const { data: participations } = await supabase
        .from("case_participants")
        .select("case_id")
        .eq("user_id", user!.id);

      const caseIds = participations?.map((p) => p.case_id) ?? [];

      if (caseIds.length === 0) {
        return {
          identity: null,
          addresses: [],
          employment: [],
          travel: [],
          immigration: [],
          filings: [],
          documents: [],
          completeness: 0,
        };
      }

      // 2. Fetch all persons linked to user's cases
      const { data: persons } = await supabase
        .from("persons_safe")
        .select("*")
        .in("case_id", caseIds);

      const personIds = persons?.map((p) => p.id) ?? [];

      // Use the first "beneficiary" or "petitioner" person as identity
      const primaryPerson =
        persons?.find((p) => p.role === "beneficiary") ||
        persons?.find((p) => p.role === "petitioner") ||
        persons?.[0] ||
        null;

      const identity: PassportIdentity | null = primaryPerson
        ? {
            firstName: primaryPerson.first_name,
            lastName: primaryPerson.last_name,
            middleName: primaryPerson.middle_name ?? undefined,
            dateOfBirth: primaryPerson.date_of_birth,
            nationality: primaryPerson.nationality,
            countryOfBirth: primaryPerson.country_of_birth,
            cityOfBirth: primaryPerson.city_of_birth,
            gender: primaryPerson.gender,
            passportNumber: primaryPerson.passport_number,
            passportCountry: primaryPerson.passport_country,
            alienNumber: primaryPerson.alien_number,
            ssn: primaryPerson.ssn,
            maritalStatus: primaryPerson.marital_status,
            email: primaryPerson.email,
            phone: primaryPerson.phone,
          }
        : null;

      // 3. Parallel fetches for related data
      const [addressRes, employmentRes, travelRes, immigrationRes, filingRes, documentRes] =
        await Promise.all([
          personIds.length > 0
            ? supabase.from("addresses").select("*").in("person_id", personIds).order("from_date", { ascending: false })
            : Promise.resolve({ data: [] }),
          personIds.length > 0
            ? supabase.from("employments").select("*").in("person_id", personIds).order("start_date", { ascending: false })
            : Promise.resolve({ data: [] }),
          personIds.length > 0
            ? supabase.from("travels").select("*").in("person_id", personIds).order("departure_date", { ascending: false })
            : Promise.resolve({ data: [] }),
          personIds.length > 0
            ? supabase.from("immigration_entries").select("*").in("person_id", personIds).order("date_of_entry", { ascending: false })
            : Promise.resolve({ data: [] }),
          personIds.length > 0
            ? supabase.from("immigration_filings").select("*").in("person_id", personIds).order("filing_date", { ascending: false })
            : Promise.resolve({ data: [] }),
          supabase
            .from("documents")
            .select("*")
            .in("case_id", caseIds)
            .order("created_at", { ascending: false }),
        ]);

      const addresses: PassportAddress[] = (addressRes.data ?? []).map((a: any) => ({
        type: a.is_current ? "Current" : a.country !== "USA" && a.country !== "US" ? "Foreign" : "Previous",
        street: a.street,
        apt: a.apt,
        city: a.city,
        state: a.state,
        zip: a.zip,
        country: a.country,
        from: a.from_date,
        to: a.is_current ? "Present" : a.to_date,
        isCurrent: a.is_current ?? false,
      }));

      const employment: PassportEmployment[] = (employmentRes.data ?? []).map((e: any) => ({
        employer: e.employer,
        title: e.job_title,
        from: e.start_date,
        to: e.is_current ? "Present" : e.end_date,
        current: e.is_current ?? false,
        address: e.address,
      }));

      const travel: PassportTravel[] = (travelRes.data ?? []).map((t: any) => ({
        country: t.destination_country,
        departure: t.departure_date,
        return: t.return_date,
        purpose: t.purpose,
      }));

      const immigration: PassportImmigrationEntry[] = (immigrationRes.data ?? []).map((i: any) => ({
        type: i.visa_type,
        status: i.status,
        entryDate: i.date_of_entry,
        expiryDate: i.expiry_date,
        port: i.port_of_entry,
      }));

      const filings: PassportFiling[] = (filingRes.data ?? []).map((f: any) => ({
        form: f.form_type,
        date: f.filing_date,
        receipt: f.receipt_number,
        result: f.result,
      }));

      const documents: PassportDocument[] = (documentRes.data ?? []).map((d: any) => ({
        name: d.name,
        category: d.category,
        status: d.status ?? "pending",
        date: d.created_at?.split("T")[0] ?? "",
      }));

      const passportData: PassportData = {
        identity,
        addresses,
        employment,
        travel,
        immigration,
        filings,
        documents,
        completeness: 0,
      };
      passportData.completeness = computeCompleteness(passportData);

      return passportData;
    },
  });
};
