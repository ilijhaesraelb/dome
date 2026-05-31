DROP POLICY IF EXISTS "Case owners can insert addresses" ON public.addresses;
DROP POLICY IF EXISTS "Case owners can update addresses" ON public.addresses;

CREATE POLICY "Case participants can insert addresses"
ON public.addresses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.persons p
    WHERE p.id = addresses.person_id
      AND public.is_case_participant(auth.uid(), p.case_id)
  )
);

CREATE POLICY "Case participants can update addresses"
ON public.addresses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.persons p
    WHERE p.id = addresses.person_id
      AND public.is_case_participant(auth.uid(), p.case_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.persons p
    WHERE p.id = addresses.person_id
      AND public.is_case_participant(auth.uid(), p.case_id)
  )
);