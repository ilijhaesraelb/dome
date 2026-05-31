
-- IRS Integration Settings table
CREATE TABLE public.irs_integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_label TEXT NOT NULL DEFAULT 'DOME Tax Services',
  selected_apis TEXT[] NOT NULL DEFAULT ARRAY['IRIS', 'TINM'],
  integration_type TEXT NOT NULL DEFAULT 'isp_platform',
  environment TEXT NOT NULL DEFAULT 'development',
  redirect_url TEXT,
  jwks_json JSONB,
  status TEXT NOT NULL DEFAULT 'not_started',
  notes TEXT,
  last_updated_by UUID,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_environment CHECK (environment IN ('development', 'staging', 'production')),
  CONSTRAINT unique_environment UNIQUE (environment)
);

-- Enable RLS
ALTER TABLE public.irs_integration_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view IRS settings"
ON public.irs_integration_settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create IRS settings"
ON public.irs_integration_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update IRS settings"
ON public.irs_integration_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete IRS settings"
ON public.irs_integration_settings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp
CREATE TRIGGER update_irs_integration_settings_updated_at
BEFORE UPDATE ON public.irs_integration_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
