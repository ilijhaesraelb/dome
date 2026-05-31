CREATE POLICY "Creators can view own cases"
ON public.cases
FOR SELECT
TO authenticated
USING (created_by = auth.uid());