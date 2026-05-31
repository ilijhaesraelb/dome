
-- Form templates table for storing uploaded USCIS form templates
CREATE TABLE public.form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_code text NOT NULL,
  form_title text NOT NULL,
  edition_date text,
  total_pages integer NOT NULL DEFAULT 1,
  file_path text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  template_version integer NOT NULL DEFAULT 1,
  mapping_completeness integer NOT NULL DEFAULT 0,
  notes text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read active templates
CREATE POLICY "Anyone can read active templates"
  ON public.form_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admin can manage templates
CREATE POLICY "Admins can manage templates"
  ON public.form_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Template field mappings - maps PDF field names to internal data paths
CREATE TABLE public.template_field_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  pdf_field_name text NOT NULL,
  internal_data_path text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  page_number integer,
  is_required boolean NOT NULL DEFAULT false,
  transform_rule text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id, pdf_field_name)
);

ALTER TABLE public.template_field_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read field mappings"
  ON public.template_field_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage field mappings"
  ON public.template_field_mappings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Form export records with review workflow
CREATE TYPE public.form_export_status AS ENUM ('draft', 'needs_client_fix', 'needs_review', 'ready_for_export', 'exported');

CREATE TABLE public.form_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.form_templates(id),
  form_code text NOT NULL,
  status public.form_export_status NOT NULL DEFAULT 'draft',
  file_path text,
  missing_fields text[],
  reviewer_notes text,
  reviewed_by uuid,
  exported_at timestamptz,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.form_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own exports"
  ON public.form_exports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_case_participant(auth.uid(), case_id));

CREATE POLICY "Users can create own exports"
  ON public.form_exports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own exports"
  ON public.form_exports FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.is_case_participant(auth.uid(), case_id));

-- Updated_at triggers
CREATE TRIGGER update_form_templates_updated_at
  BEFORE UPDATE ON public.form_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_form_exports_updated_at
  BEFORE UPDATE ON public.form_exports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for form templates
INSERT INTO storage.buckets (id, name, public) VALUES ('form-templates', 'form-templates', false);

-- RLS for form-templates bucket
CREATE POLICY "Authenticated can read form templates"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'form-templates');

CREATE POLICY "Admins can upload form templates"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'form-templates' AND public.has_role(auth.uid(), 'admin'));
