CREATE TABLE public.english_placement_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vocab_score INTEGER NOT NULL DEFAULT 0,
  grammar_score INTEGER NOT NULL DEFAULT 0,
  listening_score INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'beginner',
  voice_words INTEGER NOT NULL DEFAULT 0,
  recommended_courses TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.english_placement_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own placement results"
  ON public.english_placement_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own placement results"
  ON public.english_placement_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);