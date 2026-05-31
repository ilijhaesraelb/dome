
-- Add bio column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT '';

-- Allow clients to insert their own case (auto-create)
CREATE POLICY "Clients can create own case"
ON public.cases FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Allow clients to insert themselves as participant
CREATE POLICY "Users can add self as participant"
ON public.case_participants FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
