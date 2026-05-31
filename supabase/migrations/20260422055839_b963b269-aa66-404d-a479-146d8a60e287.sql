
-- 1. review_status on tax_field_values
ALTER TABLE public.tax_field_values
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'user_entered';

COMMENT ON COLUMN public.tax_field_values.review_status IS
  'one of: user_entered, ai_auto_filled, ai_needs_review, user_verified, user_edited, user_rejected, professional_overridden';

CREATE INDEX IF NOT EXISTS idx_tfv_review_status ON public.tax_field_values(tax_file_id, review_status);

-- 2. target field info on extractions (rows added per extracted item)
ALTER TABLE public.tax_document_extractions
  ADD COLUMN IF NOT EXISTS target_form_code text,
  ADD COLUMN IF NOT EXISTS target_section_key text,
  ADD COLUMN IF NOT EXISTS mapped_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unmapped_count integer DEFAULT 0;

-- 3. CSV mapping templates
CREATE TABLE IF NOT EXISTS public.csv_mapping_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filing_type text NOT NULL,
  template_name text NOT NULL,
  column_map jsonb NOT NULL DEFAULT '{}'::jsonb,
  category_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.csv_mapping_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "csv_tpl_select_own_or_staff" ON public.csv_mapping_templates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_tax_staff(auth.uid()));
CREATE POLICY "csv_tpl_insert_own" ON public.csv_mapping_templates
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "csv_tpl_update_own" ON public.csv_mapping_templates
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "csv_tpl_delete_own" ON public.csv_mapping_templates
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER set_csv_tpl_updated BEFORE UPDATE ON public.csv_mapping_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. extraction review actions
CREATE TABLE IF NOT EXISTS public.tax_extraction_review_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_id uuid NOT NULL REFERENCES public.tax_files(id) ON DELETE CASCADE,
  tax_field_value_id uuid REFERENCES public.tax_field_values(id) ON DELETE SET NULL,
  field_key text NOT NULL,
  action text NOT NULL,
  previous_value text,
  new_value text,
  performed_by uuid REFERENCES auth.users(id),
  performed_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tax_extraction_review_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tera_select" ON public.tax_extraction_review_actions
  FOR SELECT TO authenticated USING (public.can_access_tax_file(auth.uid(), tax_file_id));
CREATE POLICY "tera_insert" ON public.tax_extraction_review_actions
  FOR INSERT TO authenticated WITH CHECK (public.can_access_tax_file(auth.uid(), tax_file_id));

CREATE INDEX IF NOT EXISTS idx_tera_file ON public.tax_extraction_review_actions(tax_file_id, created_at DESC);
