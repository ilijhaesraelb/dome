
-- Fix overly permissive RLS policy on enterprise packages
DROP POLICY IF EXISTS "Anyone can submit inquiry" ON public.english_enterprise_packages;
CREATE POLICY "Authenticated users submit inquiries" ON public.english_enterprise_packages FOR INSERT TO authenticated WITH CHECK (contact_email IS NOT NULL AND organization_name IS NOT NULL);
