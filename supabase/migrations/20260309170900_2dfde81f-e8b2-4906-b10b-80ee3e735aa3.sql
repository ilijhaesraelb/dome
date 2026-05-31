
-- Pilot Program Applications
CREATE TABLE public.pilot_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  organization_type TEXT,
  location TEXT,
  clients_served_annually INTEGER,
  program_type TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Demo Requests (richer than partnership_leads)
CREATE TABLE public.demo_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  role_title TEXT,
  organization_type TEXT,
  country TEXT DEFAULT 'US',
  email TEXT NOT NULL,
  phone TEXT,
  program_interest TEXT,
  expected_users INTEGER,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pilot_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Pilot applications: public insert with validation, admin manage
CREATE POLICY "Anyone can submit pilot applications" ON public.pilot_applications FOR INSERT TO anon, authenticated
  WITH CHECK (
    organization_name IS NOT NULL AND
    contact_name IS NOT NULL AND
    contact_email IS NOT NULL AND
    length(organization_name) <= 500 AND
    length(contact_name) <= 255 AND
    length(contact_email) <= 255
  );

CREATE POLICY "Admins manage pilot applications" ON public.pilot_applications FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Demo requests: public insert with validation, admin manage
CREATE POLICY "Anyone can submit demo requests" ON public.demo_requests FOR INSERT TO anon, authenticated
  WITH CHECK (
    organization_name IS NOT NULL AND
    contact_name IS NOT NULL AND
    email IS NOT NULL AND
    length(organization_name) <= 500 AND
    length(contact_name) <= 255 AND
    length(email) <= 255
  );

CREATE POLICY "Admins manage demo requests" ON public.demo_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
