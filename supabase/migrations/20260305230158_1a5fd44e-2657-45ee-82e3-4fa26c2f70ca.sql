
-- ══════════════════════════════════════════════════════════
-- D.O.M.E. Immigration Platform – Core Database Schema
-- ══════════════════════════════════════════════════════════

-- 0. Utility: updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'practitioner', 'attorney', 'paralegal', 'translator', 'client');
CREATE TYPE public.case_status AS ENUM ('draft', 'in_progress', 'waiting_client', 'ready_for_review', 'submitted', 'rfe_issued', 'rfe_response_sent', 'approved', 'denied', 'closed');
CREATE TYPE public.case_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.person_role AS ENUM ('petitioner', 'beneficiary', 'sponsor', 'derivative', 'preparer', 'interpreter');
CREATE TYPE public.application_status AS ENUM ('not_started', 'started', 'in_progress', 'completed', 'ready_for_review', 'submitted', 'approved', 'denied');
CREATE TYPE public.evidence_quality AS ENUM ('complete', 'missing', 'low_quality');
CREATE TYPE public.doc_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.consistency_severity AS ENUM ('high', 'medium', 'low');
CREATE TYPE public.timeline_event_type AS ENUM ('system', 'user', 'uscis', 'milestone');
CREATE TYPE public.payment_status AS ENUM ('paid', 'pending', 'overdue', 'refunded');
CREATE TYPE public.workflow_status AS ENUM ('draft', 'client_completed', 'ready_for_review', 'returned_for_fixes', 'approved_to_submit', 'submitted');
CREATE TYPE public.message_sender_role AS ENUM ('practitioner', 'client', 'system', 'attorney');

-- 2. Profiles (auto-created on signup)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. User Roles (separate table per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Cases
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL UNIQUE,
  case_type TEXT NOT NULL,
  visa_type TEXT,
  package_forms TEXT[] DEFAULT '{}',
  status case_status NOT NULL DEFAULT 'draft',
  priority case_priority NOT NULL DEFAULT 'medium',
  workflow_status workflow_status NOT NULL DEFAULT 'draft',
  assigned_to UUID REFERENCES auth.users(id),
  representative TEXT,
  deadline DATE,
  notes TEXT,
  readiness_score INTEGER DEFAULT 0,
  forms_completion INTEGER DEFAULT 0,
  evidence_completion INTEGER DEFAULT 0,
  consistency_score INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- 5. Case Participants (links users to cases with roles)
CREATE TABLE public.case_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (case_id, user_id, role)
);
ALTER TABLE public.case_participants ENABLE ROW LEVEL SECURITY;

-- 6. Persons (canonical data graph – people associated with a case)
CREATE TABLE public.persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  role person_role NOT NULL DEFAULT 'beneficiary',
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  other_names TEXT[],
  date_of_birth DATE,
  country_of_birth TEXT,
  city_of_birth TEXT,
  nationality TEXT,
  gender TEXT,
  ssn TEXT,
  alien_number TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  passport_country TEXT,
  email TEXT,
  phone TEXT,
  marital_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

-- 7. Person Identity (additional identity records, e.g. spouse, parents)
CREATE TABLE public.person_identity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL, -- 'father', 'mother', 'spouse', 'child'
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  country_of_birth TEXT,
  nationality TEXT,
  alien_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.person_identity ENABLE ROW LEVEL SECURITY;

-- 8. Addresses
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL DEFAULT 'residence', -- residence, mailing, previous
  street TEXT,
  apt TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT,
  from_date DATE,
  to_date DATE,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- 9. Employments
CREATE TABLE public.employments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  employer TEXT NOT NULL,
  job_title TEXT,
  start_date DATE,
  end_date DATE,
  address TEXT,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employments ENABLE ROW LEVEL SECURITY;

-- 10. Travel History
CREATE TABLE public.travels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  destination_country TEXT NOT NULL,
  departure_date DATE,
  return_date DATE,
  purpose TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.travels ENABLE ROW LEVEL SECURITY;

-- 11. Immigration Entries
CREATE TABLE public.immigration_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  visa_type TEXT,
  status TEXT,
  date_of_entry DATE,
  i94_number TEXT,
  port_of_entry TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.immigration_entries ENABLE ROW LEVEL SECURITY;

-- 12. Immigration Filings (previous)
CREATE TABLE public.immigration_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL,
  filing_date DATE,
  result TEXT,
  receipt_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.immigration_filings ENABLE ROW LEVEL SECURITY;

-- 13. Documents (evidence vault)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  file_path TEXT,
  file_type TEXT,
  file_size INTEGER,
  quality evidence_quality DEFAULT 'missing',
  status doc_status DEFAULT 'pending',
  uploaded_by UUID REFERENCES auth.users(id),
  linked_forms TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 14. Evidence Links (links documents to specific forms)
CREATE TABLE public.evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  form_instance_id UUID, -- will reference form_instances
  field_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.evidence_links ENABLE ROW LEVEL SECURITY;

-- 15. Form Instances (each form in a case package)
CREATE TABLE public.form_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL,
  form_name TEXT NOT NULL,
  status application_status NOT NULL DEFAULT 'not_started',
  progress INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id),
  populated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.form_instances ENABLE ROW LEVEL SECURITY;

-- Add FK to evidence_links
ALTER TABLE public.evidence_links
  ADD CONSTRAINT fk_evidence_form_instance
  FOREIGN KEY (form_instance_id) REFERENCES public.form_instances(id) ON DELETE SET NULL;

-- 16. Field Values (populated form field data)
CREATE TABLE public.field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_instance_id UUID NOT NULL REFERENCES public.form_instances(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_value TEXT,
  canonical_path TEXT,
  populated_from TEXT, -- 'auto' or 'manual'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (form_instance_id, field_key)
);
ALTER TABLE public.field_values ENABLE ROW LEVEL SECURITY;

-- 17. Form Field Mappings (maps canonical paths to form fields)
CREATE TABLE public.form_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_code TEXT NOT NULL,
  field_key TEXT NOT NULL,
  canonical_path TEXT NOT NULL,
  direction TEXT DEFAULT 'bidirectional',
  transform_rule TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (form_code, field_key)
);
ALTER TABLE public.form_field_mappings ENABLE ROW LEVEL SECURITY;

-- 18. Consistency Issues
CREATE TABLE public.consistency_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  severity consistency_severity NOT NULL DEFAULT 'medium',
  field TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_forms TEXT[] DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.consistency_issues ENABLE ROW LEVEL SECURITY;

-- 19. Readiness Scores (historical tracking)
CREATE TABLE public.readiness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  forms_score INTEGER NOT NULL,
  evidence_score INTEGER NOT NULL,
  consistency_score INTEGER NOT NULL,
  blockers TEXT[] DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.readiness_scores ENABLE ROW LEVEL SECURITY;

-- 20. Case Timeline Events
CREATE TABLE public.case_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type timeline_event_type NOT NULL DEFAULT 'system',
  actor_id UUID REFERENCES auth.users(id),
  actor_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.case_timeline ENABLE ROW LEVEL SECURITY;

-- 21. Case Messages
CREATE TABLE public.case_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_name TEXT NOT NULL,
  sender_role message_sender_role NOT NULL DEFAULT 'client',
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.case_messages ENABLE ROW LEVEL SECURITY;

-- 22. Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  paid_date DATE,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 23. Case Notes
CREATE TABLE public.case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════
-- Security Definer Functions
-- ══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_case_participant(_user_id UUID, _case_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.case_participants
    WHERE user_id = _user_id AND case_id = _case_id
  )
$$;

-- ══════════════════════════════════════════════════════════
-- RLS Policies
-- ══════════════════════════════════════════════════════════

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Practitioners can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'practitioner'));

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Cases: participants + admins + practitioners
CREATE POLICY "Participants can view their cases" ON public.cases FOR SELECT USING (public.is_case_participant(auth.uid(), id));
CREATE POLICY "Practitioners can view all cases" ON public.cases FOR SELECT USING (public.has_role(auth.uid(), 'practitioner'));
CREATE POLICY "Admins can view all cases" ON public.cases FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Practitioners can create cases" ON public.cases FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Practitioners can update cases" ON public.cases FOR UPDATE USING (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin'));

-- Case Participants
CREATE POLICY "Participants can view case participants" ON public.case_participants FOR SELECT USING (public.is_case_participant(auth.uid(), case_id));
CREATE POLICY "Practitioners can manage participants" ON public.case_participants FOR ALL USING (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin'));

-- Persons (scoped to case participation)
CREATE POLICY "Case participants can view persons" ON public.persons FOR SELECT USING (public.is_case_participant(auth.uid(), case_id));
CREATE POLICY "Practitioners can manage persons" ON public.persons FOR ALL USING (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin'));

-- Person Identity
CREATE POLICY "Case participants can view person identity" ON public.person_identity FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND public.is_case_participant(auth.uid(), p.case_id))
);
CREATE POLICY "Practitioners can manage person identity" ON public.person_identity FOR ALL USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin')))
);

-- Addresses
CREATE POLICY "Case participants can view addresses" ON public.addresses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND public.is_case_participant(auth.uid(), p.case_id))
);
CREATE POLICY "Practitioners can manage addresses" ON public.addresses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin')))
);

-- Employments
CREATE POLICY "Case participants can view employments" ON public.employments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND public.is_case_participant(auth.uid(), p.case_id))
);
CREATE POLICY "Practitioners can manage employments" ON public.employments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin')))
);

-- Travels
CREATE POLICY "Case participants can view travels" ON public.travels FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND public.is_case_participant(auth.uid(), p.case_id))
);
CREATE POLICY "Practitioners can manage travels" ON public.travels FOR ALL USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin')))
);

-- Immigration Entries
CREATE POLICY "Case participants can view immigration entries" ON public.immigration_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND public.is_case_participant(auth.uid(), p.case_id))
);
CREATE POLICY "Practitioners can manage immigration entries" ON public.immigration_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin')))
);

-- Immigration Filings
CREATE POLICY "Case participants can view immigration filings" ON public.immigration_filings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND public.is_case_participant(auth.uid(), p.case_id))
);
CREATE POLICY "Practitioners can manage immigration filings" ON public.immigration_filings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.persons p WHERE p.id = person_id AND (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin')))
);

-- Documents
CREATE POLICY "Case participants can view documents" ON public.documents FOR SELECT USING (public.is_case_participant(auth.uid(), case_id));
CREATE POLICY "Participants can upload documents" ON public.documents FOR INSERT WITH CHECK (public.is_case_participant(auth.uid(), case_id));
CREATE POLICY "Practitioners can manage documents" ON public.documents FOR ALL USING (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin'));

-- Evidence Links
CREATE POLICY "Case participants can view evidence links" ON public.evidence_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND public.is_case_participant(auth.uid(), d.case_id))
);
CREATE POLICY "Practitioners can manage evidence links" ON public.evidence_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.documents d WHERE d.id = document_id AND (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin')))
);

-- Form Instances
CREATE POLICY "Case participants can view form instances" ON public.form_instances FOR SELECT USING (public.is_case_participant(auth.uid(), case_id));
CREATE POLICY "Practitioners can manage form instances" ON public.form_instances FOR ALL USING (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin'));

-- Field Values
CREATE POLICY "Case participants can view field values" ON public.field_values FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.form_instances fi WHERE fi.id = form_instance_id AND public.is_case_participant(auth.uid(), fi.case_id))
);
CREATE POLICY "Practitioners can manage field values" ON public.field_values FOR ALL USING (
  EXISTS (SELECT 1 FROM public.form_instances fi WHERE fi.id = form_instance_id AND (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin')))
);

-- Form Field Mappings (readable by all authenticated)
CREATE POLICY "Authenticated users can view field mappings" ON public.form_field_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage field mappings" ON public.form_field_mappings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Consistency Issues
CREATE POLICY "Case participants can view consistency issues" ON public.consistency_issues FOR SELECT USING (public.is_case_participant(auth.uid(), case_id));
CREATE POLICY "Practitioners can manage consistency issues" ON public.consistency_issues FOR ALL USING (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin'));

-- Readiness Scores
CREATE POLICY "Case participants can view readiness scores" ON public.readiness_scores FOR SELECT USING (public.is_case_participant(auth.uid(), case_id));
CREATE POLICY "Practitioners can manage readiness scores" ON public.readiness_scores FOR ALL USING (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin'));

-- Case Timeline
CREATE POLICY "Case participants can view timeline" ON public.case_timeline FOR SELECT USING (public.is_case_participant(auth.uid(), case_id));
CREATE POLICY "Practitioners can manage timeline" ON public.case_timeline FOR ALL USING (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin'));

-- Case Messages
CREATE POLICY "Case participants can view messages" ON public.case_messages FOR SELECT USING (public.is_case_participant(auth.uid(), case_id));
CREATE POLICY "Case participants can send messages" ON public.case_messages FOR INSERT WITH CHECK (public.is_case_participant(auth.uid(), case_id));
CREATE POLICY "Practitioners can manage messages" ON public.case_messages FOR ALL USING (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin'));

-- Payments
CREATE POLICY "Case participants can view payments" ON public.payments FOR SELECT USING (public.is_case_participant(auth.uid(), case_id));
CREATE POLICY "Practitioners can manage payments" ON public.payments FOR ALL USING (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin'));

-- Case Notes
CREATE POLICY "Case participants can view notes" ON public.case_notes FOR SELECT USING (public.is_case_participant(auth.uid(), case_id));
CREATE POLICY "Case participants can create notes" ON public.case_notes FOR INSERT WITH CHECK (public.is_case_participant(auth.uid(), case_id));
CREATE POLICY "Practitioners can manage notes" ON public.case_notes FOR ALL USING (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin'));

-- ══════════════════════════════════════════════════════════
-- Triggers
-- ══════════════════════════════════════════════════════════

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON public.persons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_form_instances_updated_at BEFORE UPDATE ON public.form_instances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_field_values_updated_at BEFORE UPDATE ON public.field_values FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_case_notes_updated_at BEFORE UPDATE ON public.case_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  -- Default role: client
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Document storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('case-documents', 'case-documents', false);

CREATE POLICY "Case participants can view case documents" ON storage.objects FOR SELECT USING (bucket_id = 'case-documents');
CREATE POLICY "Authenticated users can upload case documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'case-documents' AND auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_case_participants_case ON public.case_participants(case_id);
CREATE INDEX idx_case_participants_user ON public.case_participants(user_id);
CREATE INDEX idx_persons_case ON public.persons(case_id);
CREATE INDEX idx_addresses_person ON public.addresses(person_id);
CREATE INDEX idx_employments_person ON public.employments(person_id);
CREATE INDEX idx_documents_case ON public.documents(case_id);
CREATE INDEX idx_form_instances_case ON public.form_instances(case_id);
CREATE INDEX idx_field_values_form ON public.field_values(form_instance_id);
CREATE INDEX idx_case_timeline_case ON public.case_timeline(case_id);
CREATE INDEX idx_case_messages_case ON public.case_messages(case_id);
CREATE INDEX idx_payments_case ON public.payments(case_id);
CREATE INDEX idx_case_notes_case ON public.case_notes(case_id);
CREATE INDEX idx_consistency_issues_case ON public.consistency_issues(case_id);
