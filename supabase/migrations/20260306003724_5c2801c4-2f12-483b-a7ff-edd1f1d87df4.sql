
-- Pathway Finder: Core tables

-- 1. Questions bank
CREATE TABLE public.questions (
  id text PRIMARY KEY,
  title text NOT NULL,
  prompt_plain text NOT NULL,
  prompt_official text,
  help_plain text,
  examples jsonb DEFAULT '[]'::jsonb,
  answer_type text NOT NULL CHECK (answer_type IN ('BOOLEAN','CHOICE','MULTI_CHOICE','DATE','TEXT','NUMBER')),
  choices jsonb DEFAULT '[]'::jsonb,
  followups jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Question logic (when to ask)
CREATE TABLE public.question_logic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id text NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  condition_expr jsonb NOT NULL,
  priority int NOT NULL DEFAULT 50,
  stop_rule text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Pathways catalog
CREATE TYPE public.pathway_category AS ENUM ('FAMILY','WORK','HUMANITARIAN','STUDY','CITIZENSHIP');
CREATE TYPE public.pathway_risk_level AS ENUM ('LOW','MEDIUM','HIGH');
CREATE TYPE public.pathway_result_status AS ENUM ('STRONG','POSSIBLE','NOT_ELIGIBLE','NEEDS_INFO');
CREATE TYPE public.pathway_session_status AS ENUM ('in_progress','complete','abandoned');
CREATE TYPE public.pathway_rule_type AS ENUM ('ELIGIBILITY','DISQUALIFIER','SCORE','EVIDENCE','ROADMAP');

CREATE TABLE public.pathways (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  category pathway_category NOT NULL,
  description_plain text,
  requires_rep_review boolean NOT NULL DEFAULT false,
  risk_level_default pathway_risk_level NOT NULL DEFAULT 'MEDIUM',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Pathway rules
CREATE TABLE public.pathway_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id text NOT NULL REFERENCES public.pathways(id) ON DELETE CASCADE,
  rule_type pathway_rule_type NOT NULL DEFAULT 'ELIGIBILITY',
  expr jsonb NOT NULL,
  weight float NOT NULL DEFAULT 1.0,
  explain_if_true text,
  explain_if_false text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Pathway forms
CREATE TABLE public.pathway_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id text NOT NULL REFERENCES public.pathways(id) ON DELETE CASCADE,
  form_code text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Pathway evidence templates
CREATE TABLE public.pathway_evidence_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id text NOT NULL REFERENCES public.pathways(id) ON DELETE CASCADE,
  requirement_key text NOT NULL,
  label text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  explain_plain text,
  examples jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Pathway roadmap templates
CREATE TABLE public.pathway_roadmap_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id text NOT NULL REFERENCES public.pathways(id) ON DELETE CASCADE,
  step_order int NOT NULL,
  step_key text NOT NULL,
  title text NOT NULL,
  description_plain text,
  trigger text,
  documents_expected jsonb DEFAULT '[]'::jsonb,
  estimated_time_band jsonb DEFAULT '{"min_days":0,"max_days":0}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Pathway sessions
CREATE TABLE public.pathway_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  locale text NOT NULL DEFAULT 'en',
  country_of_residence text,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status pathway_session_status NOT NULL DEFAULT 'in_progress',
  disclaimer_ack boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Pathway answers
CREATE TABLE public.pathway_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.pathway_sessions(id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.questions(id),
  answer_value jsonb,
  confidence float DEFAULT 1.0,
  source text NOT NULL DEFAULT 'TYPED' CHECK (source IN ('TYPED','VOICE','IMPORTED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Pathway results
CREATE TABLE public.pathway_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.pathway_sessions(id) ON DELETE CASCADE,
  pathway_id text NOT NULL REFERENCES public.pathways(id),
  status pathway_result_status NOT NULL DEFAULT 'NEEDS_INFO',
  score int NOT NULL DEFAULT 0,
  reasons jsonb DEFAULT '[]'::jsonb,
  risk_flags jsonb DEFAULT '[]'::jsonb,
  missing_questions jsonb DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- 11. Pathway rule audit
CREATE TABLE public.pathway_rule_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.pathway_sessions(id) ON DELETE CASCADE,
  pathway_id text NOT NULL REFERENCES public.pathways(id),
  rule_id uuid NOT NULL REFERENCES public.pathway_rules(id),
  rule_fired boolean NOT NULL DEFAULT false,
  inputs_used jsonb DEFAULT '{}'::jsonb,
  explanation_returned text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies

-- Questions & pathways are public read
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_logic ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_evidence_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_roadmap_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pathway_rule_audit ENABLE ROW LEVEL SECURITY;

-- Public read for catalog tables
CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Anyone can read question_logic" ON public.question_logic FOR SELECT USING (true);
CREATE POLICY "Anyone can read pathways" ON public.pathways FOR SELECT USING (true);
CREATE POLICY "Anyone can read pathway_rules" ON public.pathway_rules FOR SELECT USING (true);
CREATE POLICY "Anyone can read pathway_forms" ON public.pathway_forms FOR SELECT USING (true);
CREATE POLICY "Anyone can read pathway_evidence_templates" ON public.pathway_evidence_templates FOR SELECT USING (true);
CREATE POLICY "Anyone can read pathway_roadmap_templates" ON public.pathway_roadmap_templates FOR SELECT USING (true);

-- Admin manage catalog
CREATE POLICY "Admins manage questions" ON public.questions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage question_logic" ON public.question_logic FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage pathways" ON public.pathways FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage pathway_rules" ON public.pathway_rules FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage pathway_forms" ON public.pathway_forms FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage pathway_evidence_templates" ON public.pathway_evidence_templates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage pathway_roadmap_templates" ON public.pathway_roadmap_templates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Sessions: users can manage their own, guests can create
CREATE POLICY "Users manage own sessions" ON public.pathway_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anon can create sessions" ON public.pathway_sessions FOR INSERT TO anon WITH CHECK (user_id IS NULL);
CREATE POLICY "Anon can read own session" ON public.pathway_sessions FOR SELECT TO anon USING (user_id IS NULL);
CREATE POLICY "Practitioners can view all sessions" ON public.pathway_sessions FOR SELECT USING (has_role(auth.uid(), 'practitioner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Answers: tied to session ownership
CREATE POLICY "Users manage own answers" ON public.pathway_answers FOR ALL USING (EXISTS (SELECT 1 FROM public.pathway_sessions ps WHERE ps.id = pathway_answers.session_id AND ps.user_id = auth.uid()));
CREATE POLICY "Anon can insert answers" ON public.pathway_answers FOR INSERT TO anon WITH CHECK (EXISTS (SELECT 1 FROM public.pathway_sessions ps WHERE ps.id = pathway_answers.session_id AND ps.user_id IS NULL));
CREATE POLICY "Anon can read own answers" ON public.pathway_answers FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM public.pathway_sessions ps WHERE ps.id = pathway_answers.session_id AND ps.user_id IS NULL));
CREATE POLICY "Practitioners can view all answers" ON public.pathway_answers FOR SELECT USING (has_role(auth.uid(), 'practitioner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Results
CREATE POLICY "Users view own results" ON public.pathway_results FOR SELECT USING (EXISTS (SELECT 1 FROM public.pathway_sessions ps WHERE ps.id = pathway_results.session_id AND ps.user_id = auth.uid()));
CREATE POLICY "Anon view own results" ON public.pathway_results FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM public.pathway_sessions ps WHERE ps.id = pathway_results.session_id AND ps.user_id IS NULL));
CREATE POLICY "System can insert results" ON public.pathway_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Practitioners view all results" ON public.pathway_results FOR SELECT USING (has_role(auth.uid(), 'practitioner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Audit
CREATE POLICY "Users view own audit" ON public.pathway_rule_audit FOR SELECT USING (EXISTS (SELECT 1 FROM public.pathway_sessions ps WHERE ps.id = pathway_rule_audit.session_id AND ps.user_id = auth.uid()));
CREATE POLICY "System can insert audit" ON public.pathway_rule_audit FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Practitioners view all audit" ON public.pathway_rule_audit FOR SELECT USING (has_role(auth.uid(), 'practitioner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
