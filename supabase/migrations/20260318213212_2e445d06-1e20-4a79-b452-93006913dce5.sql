
-- Add language preference columns to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS secondary_language text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS translation_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tts_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS voice_input_enabled boolean NOT NULL DEFAULT false;

-- Create message_translations table for storing original + translated messages
CREATE TABLE public.message_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.case_messages(id) ON DELETE CASCADE,
  target_language text NOT NULL,
  translated_text text NOT NULL,
  simple_explanation text,
  source_language text NOT NULL DEFAULT 'en',
  translation_method text NOT NULL DEFAULT 'ai',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create language_support_requests table
CREATE TABLE public.language_support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  request_type text NOT NULL DEFAULT 'translator',
  preferred_language text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  assigned_to uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create translation_analytics table
CREATE TABLE public.translation_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  source_language text,
  target_language text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.message_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_analytics ENABLE ROW LEVEL SECURITY;

-- RLS for message_translations: participants of the case can read translations
CREATE POLICY "Case participants can read translations"
  ON public.message_translations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.case_messages cm
      JOIN public.case_participants cp ON cp.case_id = cm.case_id
      WHERE cm.id = message_translations.message_id
        AND cp.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.case_messages cm
      JOIN public.cases c ON c.id = cm.case_id
      WHERE cm.id = message_translations.message_id
        AND c.created_by = auth.uid()
    )
  );

-- Allow authenticated users to insert translations (via edge function)
CREATE POLICY "Authenticated users can insert translations"
  ON public.message_translations FOR INSERT TO authenticated
  WITH CHECK (true);

-- RLS for language_support_requests
CREATE POLICY "Users can view own support requests"
  ON public.language_support_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create support requests"
  ON public.language_support_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update support requests"
  ON public.language_support_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS for translation_analytics
CREATE POLICY "Users can insert analytics"
  ON public.translation_analytics FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view analytics"
  ON public.translation_analytics FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_message_translations_message ON public.message_translations(message_id);
CREATE INDEX idx_message_translations_lang ON public.message_translations(target_language);
CREATE INDEX idx_language_support_requests_user ON public.language_support_requests(user_id);
CREATE INDEX idx_language_support_requests_status ON public.language_support_requests(status);
CREATE INDEX idx_translation_analytics_type ON public.translation_analytics(event_type);
CREATE INDEX idx_translation_analytics_created ON public.translation_analytics(created_at);
