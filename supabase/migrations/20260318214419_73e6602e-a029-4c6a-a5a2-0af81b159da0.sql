
-- Step 1: Create interpreters first (no dependencies)
CREATE TABLE public.interpreters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  role text NOT NULL DEFAULT 'interpreter',
  languages text[] NOT NULL DEFAULT '{}',
  specialties text[] DEFAULT '{}',
  hourly_rate numeric DEFAULT 0,
  is_internal boolean DEFAULT false,
  certifications text,
  organization_affiliation text,
  timezone text DEFAULT 'America/New_York',
  bio text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.interpreter_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interpreter_id uuid REFERENCES public.interpreters(id) ON DELETE CASCADE NOT NULL,
  day_of_week int NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.interpreter_blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interpreter_id uuid REFERENCES public.interpreters(id) ON DELETE CASCADE NOT NULL,
  blocked_date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Step 2: Drop old language_support_requests and recreate with new schema
DROP TABLE IF EXISTS public.language_support_requests CASCADE;

CREATE TABLE public.language_support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  preferred_language text NOT NULL DEFAULT 'en',
  secondary_language text,
  support_type text NOT NULL DEFAULT 'live_interpreter',
  urgency text NOT NULL DEFAULT 'within_3_days',
  meeting_type text,
  description text,
  preferred_date timestamptz,
  preferred_time text,
  user_role text,
  status text NOT NULL DEFAULT 'pending',
  assigned_interpreter_id uuid REFERENCES public.interpreters(id) ON DELETE SET NULL,
  admin_notes text,
  pricing_mode text DEFAULT 'free',
  price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.interpreter_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.language_support_requests(id) ON DELETE SET NULL,
  interpreter_id uuid REFERENCES public.interpreters(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 30,
  language_pair text NOT NULL,
  support_type text NOT NULL,
  meeting_link text,
  meeting_type text,
  status text NOT NULL DEFAULT 'confirmed',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.document_translation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  document_title text NOT NULL,
  source_language text NOT NULL DEFAULT 'en',
  target_language text NOT NULL,
  file_path text,
  deadline timestamptz,
  notes text,
  request_type text NOT NULL DEFAULT 'understanding',
  status text NOT NULL DEFAULT 'pending',
  assigned_interpreter_id uuid REFERENCES public.interpreters(id) ON DELETE SET NULL,
  translated_file_path text,
  price numeric DEFAULT 0,
  pricing_mode text DEFAULT 'free',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.interpreter_session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.interpreter_bookings(id) ON DELETE CASCADE NOT NULL,
  interpreter_id uuid REFERENCES public.interpreters(id) ON DELETE CASCADE NOT NULL,
  duration_actual int,
  language_pair text,
  support_type text,
  note text,
  follow_up_recommended boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.interpreter_session_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.interpreter_bookings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  communication_clarity int,
  professionalism int,
  usefulness int,
  language_accuracy int,
  overall_rating int,
  feedback text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(booking_id, user_id)
);

-- RLS
ALTER TABLE public.interpreters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interpreter_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interpreter_blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interpreter_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_translation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interpreter_session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interpreter_session_ratings ENABLE ROW LEVEL SECURITY;

-- Interpreter policies
CREATE POLICY "Anyone can view active interpreters" ON public.interpreters FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage interpreters" ON public.interpreters FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own interpreter profile" ON public.interpreters FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Anyone can view availability" ON public.interpreter_availability FOR SELECT USING (true);
CREATE POLICY "Owner manages availability" ON public.interpreter_availability FOR ALL TO authenticated USING (interpreter_id IN (SELECT id FROM public.interpreters WHERE user_id = auth.uid()));
CREATE POLICY "Admin manages availability" ON public.interpreter_availability FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner views blocked dates" ON public.interpreter_blocked_dates FOR SELECT TO authenticated USING (interpreter_id IN (SELECT id FROM public.interpreters WHERE user_id = auth.uid()));
CREATE POLICY "Owner manages blocked dates" ON public.interpreter_blocked_dates FOR ALL TO authenticated USING (interpreter_id IN (SELECT id FROM public.interpreters WHERE user_id = auth.uid()));
CREATE POLICY "Admin manages blocked dates" ON public.interpreter_blocked_dates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own requests" ON public.language_support_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users create own requests" ON public.language_support_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own requests" ON public.language_support_requests FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage all requests" ON public.language_support_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Assigned interpreter views requests" ON public.language_support_requests FOR SELECT TO authenticated USING (assigned_interpreter_id IN (SELECT id FROM public.interpreters WHERE user_id = auth.uid()));

CREATE POLICY "Users view own bookings" ON public.interpreter_bookings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users create bookings" ON public.interpreter_bookings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own bookings" ON public.interpreter_bookings FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Interpreter views own bookings" ON public.interpreter_bookings FOR SELECT TO authenticated USING (interpreter_id IN (SELECT id FROM public.interpreters WHERE user_id = auth.uid()));
CREATE POLICY "Interpreter updates own bookings" ON public.interpreter_bookings FOR UPDATE TO authenticated USING (interpreter_id IN (SELECT id FROM public.interpreters WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage all bookings" ON public.interpreter_bookings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own doc requests" ON public.document_translation_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users create doc requests" ON public.document_translation_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own doc requests" ON public.document_translation_requests FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage doc requests" ON public.document_translation_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Interpreter creates own notes" ON public.interpreter_session_notes FOR INSERT TO authenticated WITH CHECK (interpreter_id IN (SELECT id FROM public.interpreters WHERE user_id = auth.uid()));
CREATE POLICY "Interpreter views own notes" ON public.interpreter_session_notes FOR SELECT TO authenticated USING (interpreter_id IN (SELECT id FROM public.interpreters WHERE user_id = auth.uid()));
CREATE POLICY "Admin manages notes" ON public.interpreter_session_notes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own ratings" ON public.interpreter_session_ratings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users view own ratings" ON public.interpreter_session_ratings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin views all ratings" ON public.interpreter_session_ratings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Triggers
CREATE TRIGGER update_interpreters_updated_at BEFORE UPDATE ON public.interpreters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lsr_updated_at BEFORE UPDATE ON public.language_support_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ib_updated_at BEFORE UPDATE ON public.interpreter_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dtr_updated_at BEFORE UPDATE ON public.document_translation_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
