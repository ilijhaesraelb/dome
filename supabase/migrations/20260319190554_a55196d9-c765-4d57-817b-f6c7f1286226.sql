
CREATE POLICY "Case owners can insert addresses"
ON public.addresses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.persons p
    JOIN public.cases c ON c.id = p.case_id
    WHERE p.id = addresses.person_id
      AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Case owners can update addresses"
ON public.addresses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.persons p
    JOIN public.cases c ON c.id = p.case_id
    WHERE p.id = addresses.person_id
      AND c.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.persons p
    JOIN public.cases c ON c.id = p.case_id
    WHERE p.id = addresses.person_id
      AND c.created_by = auth.uid()
  )
);
