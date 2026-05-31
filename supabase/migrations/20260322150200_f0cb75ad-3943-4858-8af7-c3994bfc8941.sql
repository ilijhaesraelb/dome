
-- Fix the overly permissive INSERT policy on intake_requests
DROP POLICY "Anyone can create intake request" ON public.intake_requests;

CREATE POLICY "Authenticated users can create intake requests" ON public.intake_requests
  FOR INSERT TO authenticated WITH CHECK (
    client_user_id = auth.uid()
    OR (firm_id IS NOT NULL AND public.is_firm_member(auth.uid(), firm_id))
  );
