
-- Export history tracking table
CREATE TABLE public.case_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  export_type text NOT NULL DEFAULT 'full_packet',
  status text NOT NULL DEFAULT 'completed',
  file_name text,
  file_path text,
  forms_included text[] DEFAULT '{}',
  documents_included text[] DEFAULT '{}',
  missing_fields text[] DEFAULT '{}',
  missing_documents text[] DEFAULT '{}',
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.case_exports ENABLE ROW LEVEL SECURITY;

-- Users can view their own exports
CREATE POLICY "Users view own exports"
ON public.case_exports FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create exports for their cases
CREATE POLICY "Users create exports"
ON public.case_exports FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND is_case_participant(auth.uid(), case_id));

-- Practitioners/admins can view all exports
CREATE POLICY "Practitioners view all exports"
ON public.case_exports FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'practitioner') OR has_role(auth.uid(), 'admin'));

-- Admins manage all exports
CREATE POLICY "Admins manage exports"
ON public.case_exports FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));
