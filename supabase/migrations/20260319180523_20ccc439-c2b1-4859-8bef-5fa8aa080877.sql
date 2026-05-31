-- Fix PRIVILEGE_ESCALATION: Replace the overly permissive INSERT policy on case_participants
-- Old policy only checked user_id = auth.uid() with no restriction on case_id
-- New policy requires the user either created the case OR has an accepted attorney invitation

DROP POLICY IF EXISTS "Users can add self as participant" ON public.case_participants;

CREATE POLICY "Users can add self as participant" ON public.case_participants
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    -- User created the case
    EXISTS (
      SELECT 1 FROM public.cases c
      WHERE c.id = case_id AND c.created_by = auth.uid()
    )
    OR
    -- User has an accepted attorney invitation for this case
    EXISTS (
      SELECT 1 FROM public.attorney_invitations ai
      WHERE ai.case_id = case_participants.case_id
        AND ai.invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND ai.status = 'accepted'
    )
  )
);