
-- Government & Institutional Portal: Core Tables

-- Institution types enum
CREATE TYPE public.institution_type AS ENUM ('government_agency', 'nonprofit', 'city_office', 'state_office', 'federal_program', 'community_org', 'accelerator', 'education');

-- Institution status enum
CREATE TYPE public.institution_status AS ENUM ('active', 'pending', 'suspended', 'inactive');

-- Institutional role enum
CREATE TYPE public.institutional_role AS ENUM ('super_admin', 'government_admin', 'organization_admin', 'program_manager', 'caseworker', 'support_staff', 'reporting_only');

-- Program type enum
CREATE TYPE public.program_type AS ENUM ('citizenship', 'legal_orientation', 'integration', 'entrepreneurship', 'housing', 'education', 'health', 'general');

-- Participant status enum
CREATE TYPE public.participant_status AS ENUM ('onboarding', 'active', 'waiting_on_documents', 'ready_for_review', 'referred_out', 'completed', 'inactive');

-- Institutions table
CREATE TABLE public.institutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type public.institution_type NOT NULL DEFAULT 'nonprofit',
  status public.institution_status NOT NULL DEFAULT 'pending',
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  website TEXT,
  logo_url TEXT,
  default_language TEXT NOT NULL DEFAULT 'en',
  plan_tier TEXT DEFAULT 'small_nonprofit',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Institution users (staff) table
CREATE TABLE public.institution_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.institutional_role NOT NULL DEFAULT 'caseworker',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institution_id, user_id)
);

-- Programs table
CREATE TABLE public.institution_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  program_type public.program_type NOT NULL DEFAULT 'general',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  default_language TEXT DEFAULT 'en',
  visible_modules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Participants table
CREATE TABLE public.institution_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.institution_programs(id) ON DELETE SET NULL,
  user_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  preferred_language TEXT DEFAULT 'en',
  status public.participant_status NOT NULL DEFAULT 'onboarding',
  readiness_score INTEGER DEFAULT 0,
  assigned_staff_id UUID REFERENCES public.institution_users(id) ON DELETE SET NULL,
  next_milestone TEXT,
  referral_status TEXT,
  service_notes TEXT,
  tags TEXT[] DEFAULT '{}',
  documents_uploaded INTEGER DEFAULT 0,
  documents_required INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Participant timeline
CREATE TABLE public.participant_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES public.institution_participants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'note',
  title TEXT NOT NULL,
  description TEXT,
  actor_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Program reports / metrics snapshots
CREATE TABLE public.program_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.institution_programs(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL DEFAULT 'monthly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metrics JSONB DEFAULT '{}'::jsonb,
  generated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Demo/partnership leads
CREATE TABLE public.partnership_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  organization_type TEXT,
  interest_area TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit logs for institutional actions
CREATE TABLE public.institution_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function for institution membership check
CREATE OR REPLACE FUNCTION public.is_institution_member(_user_id UUID, _institution_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institution_users
    WHERE user_id = _user_id AND institution_id = _institution_id AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.get_institution_role(_user_id UUID, _institution_id UUID)
RETURNS public.institutional_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.institution_users
  WHERE user_id = _user_id AND institution_id = _institution_id AND is_active = true
  LIMIT 1
$$;

-- RLS Policies: Institutions
CREATE POLICY "Platform admins manage all institutions" ON public.institutions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Institution members view own institution" ON public.institutions FOR SELECT TO authenticated
  USING (is_institution_member(auth.uid(), id));

-- RLS Policies: Institution Users
CREATE POLICY "Platform admins manage all institution users" ON public.institution_users FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Institution admins manage own staff" ON public.institution_users FOR ALL TO authenticated
  USING (is_institution_member(auth.uid(), institution_id) AND get_institution_role(auth.uid(), institution_id) IN ('super_admin', 'government_admin', 'organization_admin'));

CREATE POLICY "Staff view own institution users" ON public.institution_users FOR SELECT TO authenticated
  USING (is_institution_member(auth.uid(), institution_id));

-- RLS Policies: Programs
CREATE POLICY "Platform admins manage all programs" ON public.institution_programs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Institution members view programs" ON public.institution_programs FOR SELECT TO authenticated
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Program managers manage programs" ON public.institution_programs FOR ALL TO authenticated
  USING (is_institution_member(auth.uid(), institution_id) AND get_institution_role(auth.uid(), institution_id) IN ('super_admin', 'government_admin', 'organization_admin', 'program_manager'));

-- RLS Policies: Participants (tenant-isolated)
CREATE POLICY "Platform admins manage all participants" ON public.institution_participants FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Institution staff view participants" ON public.institution_participants FOR SELECT TO authenticated
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Caseworkers manage participants" ON public.institution_participants FOR ALL TO authenticated
  USING (is_institution_member(auth.uid(), institution_id) AND get_institution_role(auth.uid(), institution_id) IN ('super_admin', 'government_admin', 'organization_admin', 'program_manager', 'caseworker'));

-- RLS Policies: Participant Timeline
CREATE POLICY "Platform admins manage all timelines" ON public.participant_timeline FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Institution staff view timelines" ON public.participant_timeline FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.institution_participants p WHERE p.id = participant_timeline.participant_id AND is_institution_member(auth.uid(), p.institution_id)));

CREATE POLICY "Caseworkers manage timelines" ON public.participant_timeline FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.institution_participants p WHERE p.id = participant_timeline.participant_id AND is_institution_member(auth.uid(), p.institution_id) AND get_institution_role(auth.uid(), p.institution_id) IN ('super_admin', 'government_admin', 'organization_admin', 'program_manager', 'caseworker')));

-- RLS Policies: Reports
CREATE POLICY "Platform admins manage all reports" ON public.program_reports FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Institution staff view reports" ON public.program_reports FOR SELECT TO authenticated
  USING (is_institution_member(auth.uid(), institution_id));

CREATE POLICY "Managers manage reports" ON public.program_reports FOR ALL TO authenticated
  USING (is_institution_member(auth.uid(), institution_id) AND get_institution_role(auth.uid(), institution_id) IN ('super_admin', 'government_admin', 'organization_admin', 'program_manager'));

-- RLS Policies: Partnership Leads (public insert, admin view)
CREATE POLICY "Anyone can submit partnership leads" ON public.partnership_leads FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Platform admins manage leads" ON public.partnership_leads FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies: Audit Logs
CREATE POLICY "Platform admins view all audit logs" ON public.institution_audit_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Institution admins view audit logs" ON public.institution_audit_logs FOR SELECT TO authenticated
  USING (is_institution_member(auth.uid(), institution_id) AND get_institution_role(auth.uid(), institution_id) IN ('super_admin', 'government_admin', 'organization_admin'));

-- Updated_at triggers
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON public.institutions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_institution_users_updated_at BEFORE UPDATE ON public.institution_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_institution_programs_updated_at BEFORE UPDATE ON public.institution_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_institution_participants_updated_at BEFORE UPDATE ON public.institution_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
