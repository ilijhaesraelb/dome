
-- Platform error logging table for observability
CREATE TABLE IF NOT EXISTS public.platform_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL, -- 'save_failure', 'upload_failure', 'export_failure', 'ocr_failure', 'permission_denial', 'route_error', 'notification_failure'
  severity text NOT NULL DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  message text NOT NULL,
  details jsonb DEFAULT '{}',
  user_id uuid,
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  route text,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for admin queries
CREATE INDEX idx_platform_errors_type ON public.platform_errors(error_type);
CREATE INDEX idx_platform_errors_severity ON public.platform_errors(severity);
CREATE INDEX idx_platform_errors_created ON public.platform_errors(created_at DESC);
CREATE INDEX idx_platform_errors_unresolved ON public.platform_errors(resolved) WHERE resolved = false;

-- RLS: only admins can read/write
ALTER TABLE public.platform_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage platform errors"
  ON public.platform_errors FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow any authenticated user to INSERT errors (for client-side logging)
CREATE POLICY "Any user can log errors"
  ON public.platform_errors FOR INSERT
  TO authenticated
  WITH CHECK (true);
