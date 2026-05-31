
-- English Learning Center tables

-- Course levels enum
CREATE TYPE public.english_level AS ENUM ('beginner', 'basic', 'intermediate', 'advanced');

-- Class type enum
CREATE TYPE public.class_type AS ENUM ('group', 'private');

-- Enrollment status enum
CREATE TYPE public.enrollment_status AS ENUM ('enrolled', 'completed', 'dropped');

-- Teachers table
CREATE TABLE public.english_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  bio text,
  specialties text[] DEFAULT '{}',
  languages text[] DEFAULT '{en}',
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Courses table
CREATE TABLE public.english_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.english_teachers(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'beginner_english',
  level english_level NOT NULL DEFAULT 'beginner',
  class_type class_type NOT NULL DEFAULT 'group',
  max_students integer DEFAULT 20,
  duration_minutes integer DEFAULT 60,
  price numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  materials_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Scheduled class sessions
CREATE TABLE public.english_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.english_courses(id) ON DELETE CASCADE NOT NULL,
  teacher_id uuid REFERENCES public.english_teachers(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  jitsi_room_name text NOT NULL DEFAULT (gen_random_uuid())::text,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Student enrollments
CREATE TABLE public.english_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.english_courses(id) ON DELETE CASCADE NOT NULL,
  status enrollment_status NOT NULL DEFAULT 'enrolled',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, course_id)
);

-- Progress tracking
CREATE TABLE public.english_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.english_courses(id) ON DELETE CASCADE NOT NULL,
  classes_attended integer DEFAULT 0,
  total_classes integer DEFAULT 0,
  speaking_score integer DEFAULT 0,
  listening_score integer DEFAULT 0,
  reading_score integer DEFAULT 0,
  overall_score integer DEFAULT 0,
  placement_level english_level,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Certificates
CREATE TABLE public.english_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.english_courses(id) ON DELETE CASCADE NOT NULL,
  certificate_number text NOT NULL DEFAULT (gen_random_uuid())::text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  level english_level NOT NULL,
  course_title text NOT NULL,
  student_name text NOT NULL
);

-- Enable RLS
ALTER TABLE public.english_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_certificates ENABLE ROW LEVEL SECURITY;

-- Teachers RLS
CREATE POLICY "Anyone can view active teachers" ON public.english_teachers FOR SELECT USING (is_active = true);
CREATE POLICY "Teachers manage own profile" ON public.english_teachers FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage teachers" ON public.english_teachers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Courses RLS
CREATE POLICY "Anyone can view active courses" ON public.english_courses FOR SELECT USING (is_active = true);
CREATE POLICY "Teachers manage own courses" ON public.english_courses FOR ALL TO authenticated USING (teacher_id IN (SELECT id FROM public.english_teachers WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage courses" ON public.english_courses FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Classes RLS
CREATE POLICY "Authenticated view classes" ON public.english_classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers manage own classes" ON public.english_classes FOR ALL TO authenticated USING (teacher_id IN (SELECT id FROM public.english_teachers WHERE user_id = auth.uid()));
CREATE POLICY "Admins manage classes" ON public.english_classes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Enrollments RLS
CREATE POLICY "Users view own enrollments" ON public.english_enrollments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users enroll themselves" ON public.english_enrollments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own enrollments" ON public.english_enrollments FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Teachers view course enrollments" ON public.english_enrollments FOR SELECT TO authenticated USING (course_id IN (SELECT id FROM public.english_courses WHERE teacher_id IN (SELECT id FROM public.english_teachers WHERE user_id = auth.uid())));
CREATE POLICY "Admins manage enrollments" ON public.english_enrollments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Progress RLS
CREATE POLICY "Users view own progress" ON public.english_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users manage own progress" ON public.english_progress FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Teachers view student progress" ON public.english_progress FOR SELECT TO authenticated USING (course_id IN (SELECT id FROM public.english_courses WHERE teacher_id IN (SELECT id FROM public.english_teachers WHERE user_id = auth.uid())));
CREATE POLICY "Admins manage progress" ON public.english_progress FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Certificates RLS
CREATE POLICY "Users view own certificates" ON public.english_certificates FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage certificates" ON public.english_certificates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Teachers issue certificates" ON public.english_certificates FOR INSERT TO authenticated WITH CHECK (course_id IN (SELECT id FROM public.english_courses WHERE teacher_id IN (SELECT id FROM public.english_teachers WHERE user_id = auth.uid())));
