CREATE POLICY "Case participants can insert form instances"
ON public.form_instances FOR INSERT
TO authenticated
WITH CHECK (is_case_participant(auth.uid(), case_id));

CREATE POLICY "Case participants can update own form instances"
ON public.form_instances FOR UPDATE
TO authenticated
USING (is_case_participant(auth.uid(), case_id));

CREATE POLICY "Case participants can insert field values"
ON public.field_values FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM form_instances fi
    WHERE fi.id = field_values.form_instance_id
    AND is_case_participant(auth.uid(), fi.case_id)
  )
);

CREATE POLICY "Case participants can update field values"
ON public.field_values FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM form_instances fi
    WHERE fi.id = field_values.form_instance_id
    AND is_case_participant(auth.uid(), fi.case_id)
  )
);