ALTER TABLE public.tax_files
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;