
-- Make tax_staff_notes.tax_file_id nullable (for portal-wide notes)
ALTER TABLE public.tax_staff_notes ALTER COLUMN tax_file_id DROP NOT NULL;

-- Add is_urgent column
ALTER TABLE public.tax_staff_notes ADD COLUMN IF NOT EXISTS is_urgent boolean DEFAULT false;

-- Add deadline column to tax_files
ALTER TABLE public.tax_files ADD COLUMN IF NOT EXISTS deadline timestamptz;

-- Add reviewer_id column to tax_files
ALTER TABLE public.tax_files ADD COLUMN IF NOT EXISTS reviewer_id uuid;
