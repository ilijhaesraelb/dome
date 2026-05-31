-- =====================================================================
-- D.O.M.E. TAX PLATFORM — LAYER 1 GAP-FILL MIGRATION (corrected)
-- =====================================================================

-- ---------- LIFECYCLE ENUM EXPANSION ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ai_analyzing' AND enumtypid = 'public.tax_file_status'::regtype) THEN
    ALTER TYPE public.tax_file_status ADD VALUE 'ai_analyzing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'awaiting_verification' AND enumtypid = 'public.tax_file_status'::regtype) THEN
    ALTER TYPE public.tax_file_status ADD VALUE 'awaiting_verification';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'profile_confirmed' AND enumtypid = 'public.tax_file_status'::regtype) THEN
    ALTER TYPE public.tax_file_status ADD VALUE 'profile_confirmed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ready_for_preview' AND enumtypid = 'public.tax_file_status'::regtype) THEN
    ALTER TYPE public.tax_file_status ADD VALUE 'ready_for_preview';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ready_for_export' AND enumtypid = 'public.tax_file_status'::regtype) THEN
    ALTER TYPE public.tax_file_status ADD VALUE 'ready_for_export';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'exported' AND enumtypid = 'public.tax_file_status'::regtype) THEN
    ALTER TYPE public.tax_file_status ADD VALUE 'exported';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'portal_filing_pending' AND enumtypid = 'public.tax_file_status'::regtype) THEN
    ALTER TYPE public.tax_file_status ADD VALUE 'portal_filing_pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'portal_filed' AND enumtypid = 'public.tax_file_status'::regtype) THEN
    ALTER TYPE public.tax_file_status ADD VALUE 'portal_filed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'archived' AND enumtypid = 'public.tax_file_status'::regtype) THEN
    ALTER TYPE public.tax_file_status ADD VALUE 'archived';
  END IF;
END$$;

-- ---------- FORM-LEVEL LIFECYCLE ENUM ----------
DO $$ BEGIN
  CREATE TYPE public.tax_form_lifecycle AS ENUM (
    'not_started','in_progress','awaiting_user_verification',
    'awaiting_professional_review','review_required','ready_for_preview',
    'ready_for_export','exported','filed','blocked'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.tax_file_forms
  ADD COLUMN IF NOT EXISTS lifecycle public.tax_form_lifecycle NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS selection_source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS preview_status text NOT NULL DEFAULT 'not_ready',
  ADD COLUMN IF NOT EXISTS export_status text NOT NULL DEFAULT 'not_ready',
  ADD COLUMN IF NOT EXISTS mapping_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS form_year integer,
  ADD COLUMN IF NOT EXISTS required_or_optional text NOT NULL DEFAULT 'required';

-- ===== tax_form_sections =====
CREATE TABLE IF NOT EXISTS public.tax_form_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_form_id uuid NOT NULL REFERENCES public.tax_file_forms(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  section_title text NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  completion_percent integer NOT NULL DEFAULT 0,
  missing_items_count integer NOT NULL DEFAULT 0,
  last_saved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tax_file_form_id, section_key)
);
CREATE INDEX IF NOT EXISTS idx_tfs_form ON public.tax_form_sections(tax_file_form_id);
ALTER TABLE public.tax_form_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tfs_access ON public.tax_form_sections;
CREATE POLICY tfs_access ON public.tax_form_sections FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tax_file_forms tff
                 WHERE tff.id = tax_form_sections.tax_file_form_id
                   AND public.can_access_tax_file(auth.uid(), tff.tax_file_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tax_file_forms tff
                 WHERE tff.id = tax_form_sections.tax_file_form_id
                   AND public.can_access_tax_file(auth.uid(), tff.tax_file_id)));

ALTER TABLE public.tax_field_values
  ADD COLUMN IF NOT EXISTS section_key text,
  ADD COLUMN IF NOT EXISTS field_type text;

-- ===== tax_document_analysis =====
CREATE TABLE IF NOT EXISTS public.tax_document_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_document_id uuid NOT NULL REFERENCES public.tax_file_documents(id) ON DELETE CASCADE,
  detected_form_type text,
  detected_tax_year integer,
  detected_owner_name text,
  detected_entity_name text,
  detected_identifier text,
  extracted_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  analysis_status text NOT NULL DEFAULT 'pending',
  confidence_score numeric(5,2),
  ai_model text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tax_document_id)
);
CREATE INDEX IF NOT EXISTS idx_tda_doc ON public.tax_document_analysis(tax_document_id);
ALTER TABLE public.tax_document_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tda_access ON public.tax_document_analysis;
CREATE POLICY tda_access ON public.tax_document_analysis FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tax_file_documents d
                 WHERE d.id = tax_document_analysis.tax_document_id
                   AND public.can_access_tax_file(auth.uid(), d.tax_file_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tax_file_documents d
                 WHERE d.id = tax_document_analysis.tax_document_id
                   AND public.can_access_tax_file(auth.uid(), d.tax_file_id)));

-- ===== tax_financial_statements =====
CREATE TABLE IF NOT EXISTS public.tax_financial_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_id uuid NOT NULL REFERENCES public.tax_files(id) ON DELETE CASCADE,
  statement_type text NOT NULL,
  statement_year integer NOT NULL,
  source_method text NOT NULL DEFAULT 'manual',
  statement_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  export_status text NOT NULL DEFAULT 'not_ready',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tfs_stmt_file ON public.tax_financial_statements(tax_file_id);
ALTER TABLE public.tax_financial_statements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tfs_stmt_access ON public.tax_financial_statements;
CREATE POLICY tfs_stmt_access ON public.tax_financial_statements FOR ALL TO authenticated
  USING (public.can_access_tax_file(auth.uid(), tax_file_id))
  WITH CHECK (public.can_access_tax_file(auth.uid(), tax_file_id));

-- ===== tax_exports =====
CREATE TABLE IF NOT EXISTS public.tax_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_id uuid NOT NULL REFERENCES public.tax_files(id) ON DELETE CASCADE,
  export_type text NOT NULL,
  included_forms jsonb NOT NULL DEFAULT '[]'::jsonb,
  included_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  export_status text NOT NULL DEFAULT 'pending',
  file_path text,
  file_size_bytes integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_tax_exports_file ON public.tax_exports(tax_file_id);
ALTER TABLE public.tax_exports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tax_exports_access ON public.tax_exports;
CREATE POLICY tax_exports_access ON public.tax_exports FOR ALL TO authenticated
  USING (public.can_access_tax_file(auth.uid(), tax_file_id))
  WITH CHECK (public.can_access_tax_file(auth.uid(), tax_file_id));

-- ===== tax_payments =====
CREATE TABLE IF NOT EXISTS public.tax_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_id uuid NOT NULL REFERENCES public.tax_files(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  stripe_session_id text,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  refunded_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tax_payments_file ON public.tax_payments(tax_file_id);
CREATE INDEX IF NOT EXISTS idx_tax_payments_session ON public.tax_payments(stripe_session_id);
ALTER TABLE public.tax_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tax_payments_access ON public.tax_payments;
CREATE POLICY tax_payments_access ON public.tax_payments FOR ALL TO authenticated
  USING (public.can_access_tax_file(auth.uid(), tax_file_id))
  WITH CHECK (public.can_access_tax_file(auth.uid(), tax_file_id));

-- ===== tax_ai_sessions =====
CREATE TABLE IF NOT EXISTS public.tax_ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_id uuid NOT NULL REFERENCES public.tax_files(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  mode text NOT NULL DEFAULT 'guided',
  current_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tax_ai_sessions_file ON public.tax_ai_sessions(tax_file_id);
ALTER TABLE public.tax_ai_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tax_ai_sessions_access ON public.tax_ai_sessions;
CREATE POLICY tax_ai_sessions_access ON public.tax_ai_sessions FOR ALL TO authenticated
  USING (public.can_access_tax_file(auth.uid(), tax_file_id))
  WITH CHECK (public.can_access_tax_file(auth.uid(), tax_file_id));

-- ===== tax_ai_events =====
CREATE TABLE IF NOT EXISTS public.tax_ai_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_ai_session_id uuid NOT NULL REFERENCES public.tax_ai_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  field_key text,
  suggested_value text,
  decision text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tax_ai_events_session ON public.tax_ai_events(tax_ai_session_id);
ALTER TABLE public.tax_ai_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tax_ai_events_access ON public.tax_ai_events;
CREATE POLICY tax_ai_events_access ON public.tax_ai_events FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tax_ai_sessions s
                 WHERE s.id = tax_ai_events.tax_ai_session_id
                   AND public.can_access_tax_file(auth.uid(), s.tax_file_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tax_ai_sessions s
                 WHERE s.id = tax_ai_events.tax_ai_session_id
                   AND public.can_access_tax_file(auth.uid(), s.tax_file_id)));

-- ===== business_formation_profiles =====
CREATE TABLE IF NOT EXISTS public.business_formation_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state text NOT NULL,
  entity_type text NOT NULL,
  proposed_name text NOT NULL,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  organizer jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  linked_tax_client_id uuid REFERENCES public.tax_clients(id) ON DELETE SET NULL,
  formation_date date,
  ein text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bfp_owner ON public.business_formation_profiles(owner_user_id);
ALTER TABLE public.business_formation_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bfp_owner_access ON public.business_formation_profiles;
CREATE POLICY bfp_owner_access ON public.business_formation_profiles FOR ALL TO authenticated
  USING (owner_user_id = auth.uid() OR public.is_tax_staff(auth.uid()) OR public.has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (owner_user_id = auth.uid() OR public.is_tax_staff(auth.uid()) OR public.has_role(auth.uid(),'admin'::app_role));

-- ===== Document Type Registry =====
CREATE TABLE IF NOT EXISTS public.tax_document_type_registry (
  code text PRIMARY KEY,
  display_name text NOT NULL,
  category text NOT NULL,
  applicable_profile_types text[] NOT NULL DEFAULT '{}',
  feeds_form_codes text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tax_document_type_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tdtr_read ON public.tax_document_type_registry;
CREATE POLICY tdtr_read ON public.tax_document_type_registry FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS tdtr_admin_write ON public.tax_document_type_registry;
CREATE POLICY tdtr_admin_write ON public.tax_document_type_registry FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.is_tax_staff(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.is_tax_staff(auth.uid()));

INSERT INTO public.tax_document_type_registry (code, display_name, category, applicable_profile_types, feeds_form_codes) VALUES
  ('w2','W-2 Wage Statement','income',ARRAY['individual'],ARRAY['1040']),
  ('1099_int','1099-INT Interest Income','income',ARRAY['individual','business','nonprofit'],ARRAY['1040','1120']),
  ('1099_div','1099-DIV Dividend Income','income',ARRAY['individual','business'],ARRAY['1040','1120']),
  ('1099_misc','1099-MISC Misc Income','income',ARRAY['individual','business'],ARRAY['1040','1120']),
  ('1099_nec','1099-NEC Nonemployee Comp','income',ARRAY['individual','business'],ARRAY['1040','1120']),
  ('1099_r','1099-R Retirement Dist','income',ARRAY['individual'],ARRAY['1040']),
  ('prior_1040','Prior Year Form 1040','prior_return',ARRAY['individual'],ARRAY['1040']),
  ('prior_1120','Prior Year Form 1120','prior_return',ARRAY['business'],ARRAY['1120']),
  ('prior_990','Prior Year Form 990','prior_return',ARRAY['nonprofit'],ARRAY['990','990ez','990n']),
  ('990n_support','990-N Supporting Records','financial',ARRAY['nonprofit'],ARRAY['990n']),
  ('990ez_support','990-EZ Supporting Records','financial',ARRAY['nonprofit'],ARRAY['990ez']),
  ('bank_statement','Bank Statement','financial',ARRAY['individual','business','nonprofit'],ARRAY['1040','1120','990','990ez']),
  ('payroll_report','Payroll Report','financial',ARRAY['business','nonprofit'],ARRAY['1120','990','990ez']),
  ('profit_and_loss','Profit & Loss Statement','financial',ARRAY['business','nonprofit'],ARRAY['1120','990','990ez']),
  ('balance_sheet','Balance Sheet','financial',ARRAY['business','nonprofit'],ARRAY['1120','990','990ez']),
  ('bookkeeping_export','Bookkeeping Export','financial',ARRAY['business','nonprofit'],ARRAY['1120','990','990ez']),
  ('csv_financial','CSV Financial Data','financial',ARRAY['business','nonprofit'],ARRAY['1120','990','990ez']),
  ('irs_notice','IRS Notice / Letter','notice',ARRAY['individual','business','nonprofit'],ARRAY[]::text[]),
  ('other_tax_document','Other Tax Document','other',ARRAY['individual','business','nonprofit'],ARRAY[]::text[])
ON CONFLICT (code) DO NOTHING;

-- ===== Form Registry =====
CREATE TABLE IF NOT EXISTS public.tax_form_registry (
  form_code text PRIMARY KEY,
  form_name text NOT NULL,
  applicable_profile_types text[] NOT NULL DEFAULT '{}',
  years_supported integer[] NOT NULL DEFAULT ARRAY[2022,2023,2024,2025],
  requires_signature boolean NOT NULL DEFAULT true,
  supports_ai_prefill boolean NOT NULL DEFAULT true,
  supports_export boolean NOT NULL DEFAULT true,
  supports_portal_filing boolean NOT NULL DEFAULT false,
  required_schedules jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tax_form_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tfr_read ON public.tax_form_registry;
CREATE POLICY tfr_read ON public.tax_form_registry FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS tfr_admin_write ON public.tax_form_registry;
CREATE POLICY tfr_admin_write ON public.tax_form_registry FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.is_tax_staff(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.is_tax_staff(auth.uid()));

INSERT INTO public.tax_form_registry (form_code, form_name, applicable_profile_types, requires_signature, supports_portal_filing, required_schedules) VALUES
  ('1040','U.S. Individual Income Tax Return',ARRAY['individual'],true,true,'[]'::jsonb),
  ('1040_sch_a','Schedule A — Itemized Deductions',ARRAY['individual'],false,false,'[]'::jsonb),
  ('1040_sch_b','Schedule B — Interest & Dividends',ARRAY['individual'],false,false,'[]'::jsonb),
  ('1040_sch_c','Schedule C — Profit or Loss from Business',ARRAY['individual'],false,false,'[]'::jsonb),
  ('1120','U.S. Corporation Income Tax Return',ARRAY['business'],true,true,'[]'::jsonb),
  ('990n','Form 990-N (e-Postcard)',ARRAY['nonprofit'],false,true,'[]'::jsonb),
  ('990ez','Form 990-EZ Short Form',ARRAY['nonprofit'],true,true,'["990_sch_a"]'::jsonb),
  ('990','Form 990 Return of Org Exempt from Tax',ARRAY['nonprofit'],true,true,'["990_sch_a"]'::jsonb),
  ('990_sch_a','Schedule A — Public Charity Status',ARRAY['nonprofit'],false,false,'[]'::jsonb),
  ('8868','Application for Extension to File',ARRAY['nonprofit','business'],true,true,'[]'::jsonb)
ON CONFLICT (form_code) DO NOTHING;

-- ===== Year Registry =====
CREATE TABLE IF NOT EXISTS public.tax_year_registry (
  tax_year integer PRIMARY KEY,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  filing_deadline date,
  extension_deadline date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tax_year_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tyr_read ON public.tax_year_registry;
CREATE POLICY tyr_read ON public.tax_year_registry FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS tyr_admin_write ON public.tax_year_registry;
CREATE POLICY tyr_admin_write ON public.tax_year_registry FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::app_role) OR public.is_tax_staff(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.is_tax_staff(auth.uid()));

INSERT INTO public.tax_year_registry (tax_year, is_default, filing_deadline, extension_deadline) VALUES
  (2022,false,'2023-04-18','2023-10-16'),
  (2023,false,'2024-04-15','2024-10-15'),
  (2024,true ,'2025-04-15','2025-10-15'),
  (2025,false,'2026-04-15','2026-10-15')
ON CONFLICT (tax_year) DO NOTHING;

-- ===== updated_at triggers =====
DO $$ BEGIN CREATE TRIGGER set_tfs_updated BEFORE UPDATE ON public.tax_form_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER set_tda_updated BEFORE UPDATE ON public.tax_document_analysis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER set_tfs_stmt_updated BEFORE UPDATE ON public.tax_financial_statements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER set_tax_payments_updated BEFORE UPDATE ON public.tax_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER set_tax_ai_sessions_updated BEFORE UPDATE ON public.tax_ai_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER set_bfp_updated BEFORE UPDATE ON public.business_formation_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;