
-- Fix overly permissive INSERT policy on affiliate_clicks
-- Replace WITH CHECK (true) with a check that the affiliate exists and is active
DROP POLICY "Anyone can insert clicks" ON public.affiliate_clicks;
CREATE POLICY "Insert clicks for active affiliates" ON public.affiliate_clicks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.affiliates a WHERE a.id = affiliate_clicks.affiliate_id AND a.is_active = true)
);
