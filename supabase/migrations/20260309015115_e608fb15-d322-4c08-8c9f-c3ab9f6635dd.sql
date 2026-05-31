
-- Add address fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS home_address TEXT,
  ADD COLUMN IF NOT EXISTS home_city TEXT,
  ADD COLUMN IF NOT EXISTS home_state TEXT,
  ADD COLUMN IF NOT EXISTS home_zip TEXT,
  ADD COLUMN IF NOT EXISTS home_country TEXT DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS foreign_address TEXT,
  ADD COLUMN IF NOT EXISTS foreign_city TEXT,
  ADD COLUMN IF NOT EXISTS foreign_country TEXT;

-- Create professional verification documents table
CREATE TABLE public.professional_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'bar_license', 'doj_approval_letter'
  file_path TEXT,
  file_name TEXT,
  issued_date DATE,
  expiration_date DATE,
  renewal_date DATE,
  license_number TEXT,
  issuing_authority TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review', -- 'pending_review', 'approved', 'rejected', 'expired'
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.professional_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view and insert their own verifications
CREATE POLICY "Users view own verifications"
  ON public.professional_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own verifications"
  ON public.professional_verifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own verifications"
  ON public.professional_verifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins manage all verifications
CREATE POLICY "Admins manage all verifications"
  ON public.professional_verifications
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT DO NOTHING;

-- Storage policies for verification docs
CREATE POLICY "Users upload own verification docs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users view own verification docs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins view all verification docs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'verification-docs' AND has_role(auth.uid(), 'admin'::app_role));
