-- Allow case participants to delete their own documents
CREATE POLICY "Participants can delete own documents"
ON public.documents FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid() AND is_case_participant(auth.uid(), case_id));

-- Allow case participants to update their own documents  
CREATE POLICY "Participants can update own documents"
ON public.documents FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid() AND is_case_participant(auth.uid(), case_id));

-- Allow case participants to manage persons in their case
CREATE POLICY "Participants can insert persons"
ON public.persons FOR INSERT
TO authenticated
WITH CHECK (is_case_participant(auth.uid(), case_id));

-- Allow participants to update persons
CREATE POLICY "Participants can update persons"
ON public.persons FOR UPDATE
TO authenticated
USING (is_case_participant(auth.uid(), case_id));

-- Allow case participants to insert timeline events
CREATE POLICY "Participants can insert timeline events"
ON public.case_timeline FOR INSERT
TO authenticated
WITH CHECK (is_case_participant(auth.uid(), case_id));