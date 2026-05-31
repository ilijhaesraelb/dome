ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS prompt_translations jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS help_translations jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS choice_translations jsonb DEFAULT '{}'::jsonb;