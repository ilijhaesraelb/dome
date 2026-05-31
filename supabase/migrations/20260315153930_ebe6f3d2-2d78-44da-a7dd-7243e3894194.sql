
-- Private lesson bookings
CREATE TABLE public.english_lesson_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  teacher_id uuid REFERENCES public.english_teachers(id) ON DELETE CASCADE NOT NULL,
  lesson_type text NOT NULL DEFAULT '60min',
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'pending',
  jitsi_room_name text NOT NULL DEFAULT (gen_random_uuid())::text,
  stripe_payment_id text,
  notes text,
  teacher_feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Teacher availability slots
CREATE TABLE public.english_teacher_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.english_teachers(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Employer/Nonprofit training packages
CREATE TABLE public.english_enterprise_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name text NOT NULL,
  contact_email text NOT NULL,
  contact_name text NOT NULL,
  package_type text NOT NULL DEFAULT 'employer',
  seats integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'inquiry',
  stripe_subscription_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- English subscription tracking
CREATE TABLE public.english_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  voice_practices_today integer DEFAULT 0,
  voice_practices_reset_at date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.english_lesson_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_enterprise_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_subscriptions ENABLE ROW LEVEL SECURITY;

-- Lesson bookings RLS
CREATE POLICY "Students view own bookings" ON public.english_lesson_bookings FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Students create bookings" ON public.english_lesson_bookings FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "Teachers view their bookings" ON public.english_lesson_bookings FOR SELECT TO authenticated USING (teacher_id IN (SELECT id FROM public.english_teachers WHERE user_id = auth.uid()));
CREATE POLICY "Teachers update their bookings" ON public.english_lesson_bookings FOR UPDATE TO authenticated USING (teacher_id IN (SELECT id FROM public.english_teachers WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage bookings" ON public.english_lesson_bookings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Teacher availability RLS
CREATE POLICY "Anyone view availability" ON public.english_teacher_availability FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers manage own availability" ON public.english_teacher_availability FOR ALL TO authenticated USING (teacher_id IN (SELECT id FROM public.english_teachers WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage availability" ON public.english_teacher_availability FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Enterprise packages RLS
CREATE POLICY "Admins manage packages" ON public.english_enterprise_packages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can submit inquiry" ON public.english_enterprise_packages FOR INSERT TO authenticated WITH CHECK (true);

-- Subscriptions RLS
CREATE POLICY "Users view own subscription" ON public.english_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users manage own subscription" ON public.english_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage subscriptions" ON public.english_subscriptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
