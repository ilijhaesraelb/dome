
-- Fix the overly permissive partnership_leads INSERT policy
DROP POLICY "Anyone can submit partnership leads" ON public.partnership_leads;

CREATE POLICY "Anyone can submit partnership leads" ON public.partnership_leads FOR INSERT TO anon, authenticated
  WITH CHECK (
    contact_email IS NOT NULL AND 
    organization_name IS NOT NULL AND 
    contact_name IS NOT NULL AND
    length(contact_email) <= 255 AND
    length(organization_name) <= 500 AND
    length(contact_name) <= 255
  );
