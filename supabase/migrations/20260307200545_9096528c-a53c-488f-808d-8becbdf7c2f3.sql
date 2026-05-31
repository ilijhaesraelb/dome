
-- Add RLS policy for vapid_keys - only service role should access
CREATE POLICY "Service role only" ON public.vapid_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
