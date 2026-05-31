
-- Enum types for the curriculum system
CREATE TYPE public.lesson_type AS ENUM ('live', 'self_paced', 'mixed');
CREATE TYPE public.section_type AS ENUM ('warmup', 'vocabulary', 'grammar', 'dialogue', 'speaking_practice', 'listening', 'quiz', 'homework', 'teacher_notes');
CREATE TYPE public.question_type AS ENUM ('multiple_choice', 'true_false', 'listening', 'short_answer');
CREATE TYPE public.submission_type AS ENUM ('none', 'text', 'voice', 'worksheet_upload');
CREATE TYPE public.material_type AS ENUM ('slide_deck', 'worksheet', 'audio', 'script', 'vocabulary_list');
CREATE TYPE public.lesson_progress_status AS ENUM ('not_started', 'in_progress', 'completed');

-- english_levels
CREATE TABLE public.english_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  certificate_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- english_modules
CREATE TABLE public.english_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES public.english_levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  learning_goal TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- english_lessons (curriculum lessons, not to conflict with existing english_courses)
CREATE TABLE public.english_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.english_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,
  lesson_type public.lesson_type NOT NULL DEFAULT 'self_paced',
  difficulty_level TEXT,
  speaking_focus TEXT,
  grammar_focus TEXT,
  vocabulary_focus TEXT,
  learning_objective TEXT,
  homework_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- lesson_sections
CREATE TABLE public.lesson_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.english_lessons(id) ON DELETE CASCADE,
  section_type public.section_type NOT NULL,
  title TEXT,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- lesson_vocab_items
CREATE TABLE public.lesson_vocab_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.english_lessons(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  pronunciation_hint TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- lesson_dialogues
CREATE TABLE public.lesson_dialogues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.english_lessons(id) ON DELETE CASCADE,
  speaker_name TEXT NOT NULL,
  line_text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- lesson_voice_prompts
CREATE TABLE public.lesson_voice_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.english_lessons(id) ON DELETE CASCADE,
  prompt_title TEXT,
  prompt_text TEXT NOT NULL,
  sample_answer TEXT,
  feedback_hint TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- lesson_quiz_questions
CREATE TABLE public.lesson_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.english_lessons(id) ON DELETE CASCADE,
  question_type public.question_type NOT NULL DEFAULT 'multiple_choice',
  prompt TEXT NOT NULL,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- lesson_homework_items
CREATE TABLE public.lesson_homework_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.english_lessons(id) ON DELETE CASCADE,
  task_title TEXT NOT NULL,
  task_description TEXT,
  submission_type public.submission_type NOT NULL DEFAULT 'none',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- teacher_lesson_materials
CREATE TABLE public.teacher_lesson_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.english_lessons(id) ON DELETE CASCADE,
  material_type public.material_type NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- student_lesson_progress
CREATE TABLE public.student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.english_lessons(id) ON DELETE CASCADE,
  status public.lesson_progress_status NOT NULL DEFAULT 'not_started',
  completion_percent INTEGER DEFAULT 0,
  quiz_score INTEGER,
  voice_practice_completed BOOLEAN DEFAULT false,
  homework_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- student_level_progress
CREATE TABLE public.student_level_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  level_id UUID NOT NULL REFERENCES public.english_levels(id) ON DELETE CASCADE,
  lessons_completed INTEGER DEFAULT 0,
  quizzes_average INTEGER,
  speaking_score INTEGER,
  certificate_eligible BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, level_id)
);

-- Enable RLS on all tables
ALTER TABLE public.english_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_vocab_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_voice_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_homework_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_lesson_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_level_progress ENABLE ROW LEVEL SECURITY;

-- Public read policies for curriculum content (anyone can browse)
CREATE POLICY "Anyone can read levels" ON public.english_levels FOR SELECT USING (true);
CREATE POLICY "Anyone can read modules" ON public.english_modules FOR SELECT USING (true);
CREATE POLICY "Anyone can read lessons" ON public.english_lessons FOR SELECT USING (true);
CREATE POLICY "Anyone can read sections" ON public.lesson_sections FOR SELECT USING (true);
CREATE POLICY "Anyone can read vocab" ON public.lesson_vocab_items FOR SELECT USING (true);
CREATE POLICY "Anyone can read dialogues" ON public.lesson_dialogues FOR SELECT USING (true);
CREATE POLICY "Anyone can read voice prompts" ON public.lesson_voice_prompts FOR SELECT USING (true);
CREATE POLICY "Anyone can read quiz questions" ON public.lesson_quiz_questions FOR SELECT USING (true);
CREATE POLICY "Anyone can read homework" ON public.lesson_homework_items FOR SELECT USING (true);
CREATE POLICY "Anyone can read teacher materials" ON public.teacher_lesson_materials FOR SELECT USING (true);

-- Admin write policies for content tables (using has_role function)
CREATE POLICY "Admins can manage levels" ON public.english_levels FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage modules" ON public.english_modules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage lessons" ON public.english_lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage sections" ON public.lesson_sections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage vocab" ON public.lesson_vocab_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage dialogues" ON public.lesson_dialogues FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage voice prompts" ON public.lesson_voice_prompts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage quiz questions" ON public.lesson_quiz_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage homework" ON public.lesson_homework_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage teacher materials" ON public.teacher_lesson_materials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Student progress policies
CREATE POLICY "Users can read own lesson progress" ON public.student_lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lesson progress" ON public.student_lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lesson progress" ON public.student_lesson_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can read own level progress" ON public.student_level_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own level progress" ON public.student_level_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own level progress" ON public.student_level_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Admins can read all progress for reporting
CREATE POLICY "Admins can read all lesson progress" ON public.student_lesson_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can read all level progress" ON public.student_level_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for teacher materials
INSERT INTO storage.buckets (id, name, public) VALUES ('english-materials', 'english-materials', true);

-- Storage policies for english-materials bucket
CREATE POLICY "Anyone can read english materials" ON storage.objects FOR SELECT USING (bucket_id = 'english-materials');
CREATE POLICY "Admins can upload english materials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'english-materials' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update english materials" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'english-materials' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete english materials" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'english-materials' AND public.has_role(auth.uid(), 'admin'));
