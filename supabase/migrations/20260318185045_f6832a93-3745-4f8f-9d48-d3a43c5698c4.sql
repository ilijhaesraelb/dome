
-- Create a security-definer function to get SSN only for case owners
CREATE OR REPLACE FUNCTION public.get_person_ssn(_person_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.ssn FROM public.persons p
  JOIN public.cases c ON c.id = p.case_id
  WHERE p.id = _person_id
    AND c.created_by = auth.uid()
$$;

-- Create a view that masks SSN for non-owners
CREATE OR REPLACE VIEW public.persons_safe AS
SELECT 
  id, case_id, role, first_name, middle_name, last_name,
  date_of_birth, city_of_birth, country_of_birth, nationality, gender,
  other_names, alien_number, passport_number, passport_country,
  passport_expiry, marital_status, email, phone,
  created_at, updated_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.cases c 
      WHERE c.id = persons.case_id AND c.created_by = auth.uid()
    )
    THEN ssn
    ELSE CASE 
      WHEN ssn IS NOT NULL THEN '***-**-' || RIGHT(ssn, 4)
      ELSE NULL
    END
  END AS ssn
FROM public.persons;

ALTER VIEW public.persons_safe SET (security_invoker = on);
