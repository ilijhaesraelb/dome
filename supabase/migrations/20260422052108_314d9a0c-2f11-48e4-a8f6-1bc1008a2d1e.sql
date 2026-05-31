-- =========================================================================
-- LAYER 1: UNIFIED TAX PLATFORM — extends existing schema in place
-- =========================================================================

-- ---- 1. Lifecycle: add two new states to existing enum ------------------
ALTER TYPE public.tax_file_status ADD VALUE IF NOT EXISTS 'forms_selected' BEFORE 'draft_in_progress';
ALTER TYPE public.tax_file_status ADD VALUE IF NOT EXISTS 'error_review' BEFORE 'ready_for_payment';

-- ---- 2. Year continuity on tax_files ------------------------------------
ALTER TABLE public.tax_files
  ADD COLUMN IF NOT EXISTS prior_year_tax_file_id uuid
    REFERENCES public.tax_files(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tax_files_prior_year
  ON public.tax_files(prior_year_tax_file_id);

-- ---- 3. Forms catalog (multiple forms per tax file) ---------------------
CREATE TABLE IF NOT EXISTS public.tax_file_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_id uuid NOT NULL REFERENCES public.tax_files(id) ON DELETE CASCADE,
  form_code text NOT NULL,                       -- '1040','1120','990','990-EZ','990-N','schedule-a', etc.
  form_role text NOT NULL DEFAULT 'primary',     -- 'primary' | 'schedule' | 'supporting'
  status text NOT NULL DEFAULT 'not_started',    -- not_started | in_progress | needs_review | complete | locked
  completion_pct integer NOT NULL DEFAULT 0,
  field_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_suggested boolean NOT NULL DEFAULT false,
  user_confirmed boolean NOT NULL DEFAULT false,
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES auth.users(id),
  locked boolean NOT NULL DEFAULT false,
  locked_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tax_file_id, form_code)
);
CREATE INDEX IF NOT EXISTS idx_tax_file_forms_file ON public.tax_file_forms(tax_file_id);
CREATE INDEX IF NOT EXISTS idx_tax_file_forms_status ON public.tax_file_forms(status);
CREATE TRIGGER set_tax_file_forms_updated_at
  BEFORE UPDATE ON public.tax_file_forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.tax_file_forms ENABLE ROW LEVEL SECURITY;

-- ---- 4. Field-level provenance ------------------------------------------
CREATE TABLE IF NOT EXISTS public.tax_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_id uuid NOT NULL REFERENCES public.tax_files(id) ON DELETE CASCADE,
  tax_file_form_id uuid REFERENCES public.tax_file_forms(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  value text,
  value_numeric numeric,
  source text NOT NULL DEFAULT 'user_entered',  -- ai_extracted | user_entered | reviewer_corrected | carry_forward
  source_document_id uuid REFERENCES public.tax_file_documents(id) ON DELETE SET NULL,
  source_extraction_id uuid REFERENCES public.tax_document_extractions(id) ON DELETE SET NULL,
  ai_original_value text,
  confidence numeric(5,2),
  verified boolean NOT NULL DEFAULT false,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tax_file_form_id, field_key)
);
CREATE INDEX IF NOT EXISTS idx_tax_field_values_file ON public.tax_field_values(tax_file_id);
CREATE INDEX IF NOT EXISTS idx_tax_field_values_form ON public.tax_field_values(tax_file_form_id);
CREATE INDEX IF NOT EXISTS idx_tax_field_values_unverified
  ON public.tax_field_values(tax_file_id) WHERE verified = false;
CREATE TRIGGER set_tax_field_values_updated_at
  BEFORE UPDATE ON public.tax_field_values
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.tax_field_values ENABLE ROW LEVEL SECURITY;

-- ---- 5. Extraction → form field mappings --------------------------------
CREATE TABLE IF NOT EXISTS public.tax_extraction_field_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_id uuid NOT NULL REFERENCES public.tax_document_extractions(id) ON DELETE CASCADE,
  tax_file_id uuid NOT NULL REFERENCES public.tax_files(id) ON DELETE CASCADE,
  target_form_code text NOT NULL,
  target_field_key text NOT NULL,
  source_field text NOT NULL,
  ai_value text,
  final_value text,
  confidence numeric(5,2),
  state text NOT NULL DEFAULT 'pending',        -- pending | accepted | rejected | edited
  decided_by uuid REFERENCES auth.users(id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_extr_map_file ON public.tax_extraction_field_mappings(tax_file_id);
CREATE INDEX IF NOT EXISTS idx_extr_map_extraction ON public.tax_extraction_field_mappings(extraction_id);
ALTER TABLE public.tax_extraction_field_mappings ENABLE ROW LEVEL SECURITY;

-- ---- 6. Professional org model: firms -----------------------------------
DO $$ BEGIN
  CREATE TYPE public.tax_firm_role AS ENUM (
    'owner_admin','partner_cpa','manager','preparer','reviewer','intake','billing','readonly'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.tax_firms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text,
  ein text,
  phone text,
  email text,
  website text,
  address_street text,
  address_city text,
  address_state text,
  address_zip text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER set_tax_firms_updated_at
  BEFORE UPDATE ON public.tax_firms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.tax_firms ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tax_firm_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES public.tax_firms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.tax_firm_role NOT NULL DEFAULT 'preparer',
  display_name text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firm_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_tfm_user ON public.tax_firm_members(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tfm_firm ON public.tax_firm_members(firm_id) WHERE is_active = true;
CREATE TRIGGER set_tax_firm_members_updated_at
  BEFORE UPDATE ON public.tax_firm_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.tax_firm_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tax_firm_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES public.tax_firms(id) ON DELETE CASCADE,
  tax_client_id uuid NOT NULL REFERENCES public.tax_clients(id) ON DELETE CASCADE,
  added_by uuid REFERENCES auth.users(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firm_id, tax_client_id)
);
CREATE INDEX IF NOT EXISTS idx_tfc_firm ON public.tax_firm_clients(firm_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tfc_client ON public.tax_firm_clients(tax_client_id) WHERE is_active = true;
ALTER TABLE public.tax_firm_clients ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tax_firm_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid NOT NULL REFERENCES public.tax_firms(id) ON DELETE CASCADE,
  tax_file_id uuid NOT NULL REFERENCES public.tax_files(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'preparer',        -- preparer | reviewer | manager
  assigned_by uuid REFERENCES auth.users(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (firm_id, tax_file_id, member_user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_tfa_file ON public.tax_firm_assignments(tax_file_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tfa_member ON public.tax_firm_assignments(member_user_id) WHERE is_active = true;
ALTER TABLE public.tax_firm_assignments ENABLE ROW LEVEL SECURITY;

-- ---- 7. Helper functions (security definer; avoid RLS recursion) -------
CREATE OR REPLACE FUNCTION public.is_tax_firm_member(_user_id uuid, _firm_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tax_firm_members
    WHERE user_id = _user_id AND firm_id = _firm_id AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.get_tax_firm_role(_user_id uuid, _firm_id uuid)
RETURNS public.tax_firm_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.tax_firm_members
  WHERE user_id = _user_id AND firm_id = _firm_id AND is_active = true
  LIMIT 1
$$;

-- True if user belongs to ANY firm that services the given tax_client.
CREATE OR REPLACE FUNCTION public.user_services_tax_client(_user_id uuid, _tax_client_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tax_firm_clients tfc
    JOIN public.tax_firm_members tfm
      ON tfm.firm_id = tfc.firm_id
    WHERE tfc.tax_client_id = _tax_client_id
      AND tfc.is_active = true
      AND tfm.user_id = _user_id
      AND tfm.is_active = true
  )
$$;

-- True if user has an active firm assignment on the given tax_file.
CREATE OR REPLACE FUNCTION public.user_assigned_to_tax_file(_user_id uuid, _tax_file_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tax_firm_assignments
    WHERE tax_file_id = _tax_file_id
      AND member_user_id = _user_id
      AND is_active = true
  )
$$;

-- Reusable predicate: can this user see this tax_file?
CREATE OR REPLACE FUNCTION public.can_access_tax_file(_user_id uuid, _tax_file_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.is_tax_staff(_user_id)
    OR public.has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.tax_files tf
      JOIN public.tax_clients tc ON tc.id = tf.tax_client_id
      WHERE tf.id = _tax_file_id AND tc.user_id = _user_id
    )
    OR public.user_assigned_to_tax_file(_user_id, _tax_file_id)
    OR EXISTS (
      SELECT 1 FROM public.tax_files tf
      WHERE tf.id = _tax_file_id
        AND public.user_services_tax_client(_user_id, tf.tax_client_id)
    )
$$;

-- ---- 8. Review issues ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tax_review_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_id uuid NOT NULL REFERENCES public.tax_files(id) ON DELETE CASCADE,
  tax_file_form_id uuid REFERENCES public.tax_file_forms(id) ON DELETE CASCADE,
  field_key text,
  issue_type text NOT NULL,                     -- missing | inconsistent | needs_clarification | calc_error | doc_required
  severity text NOT NULL DEFAULT 'warning',     -- info | warning | error | blocker
  message text NOT NULL,
  suggested_fix text,
  assigned_to uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'open',          -- open | in_progress | resolved | dismissed
  resolution_note text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tri_file ON public.tax_review_issues(tax_file_id);
CREATE INDEX IF NOT EXISTS idx_tri_open ON public.tax_review_issues(tax_file_id) WHERE status = 'open';
CREATE TRIGGER set_tax_review_issues_updated_at
  BEFORE UPDATE ON public.tax_review_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.tax_review_issues ENABLE ROW LEVEL SECURITY;

-- ---- 9. Lifecycle event log (append-only) -------------------------------
CREATE TABLE IF NOT EXISTS public.tax_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_id uuid NOT NULL REFERENCES public.tax_files(id) ON DELETE CASCADE,
  from_status text,
  to_status text,
  event_type text NOT NULL,                     -- status_change | document_uploaded | extraction_complete | form_added | review_started | finalized | exported | payment_received
  actor_user_id uuid REFERENCES auth.users(id),
  actor_role text,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tle_file ON public.tax_lifecycle_events(tax_file_id, created_at DESC);
ALTER TABLE public.tax_lifecycle_events ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- RLS POLICIES
-- =========================================================================

-- ----- tax_file_forms -----
CREATE POLICY "tff_select" ON public.tax_file_forms FOR SELECT TO authenticated
  USING (public.can_access_tax_file(auth.uid(), tax_file_id));
CREATE POLICY "tff_insert" ON public.tax_file_forms FOR INSERT TO authenticated
  WITH CHECK (public.can_access_tax_file(auth.uid(), tax_file_id));
CREATE POLICY "tff_update" ON public.tax_file_forms FOR UPDATE TO authenticated
  USING (public.can_access_tax_file(auth.uid(), tax_file_id))
  WITH CHECK (public.can_access_tax_file(auth.uid(), tax_file_id));
CREATE POLICY "tff_delete" ON public.tax_file_forms FOR DELETE TO authenticated
  USING (public.is_tax_staff(auth.uid()) OR public.has_role(auth.uid(),'admin'::app_role));

-- ----- tax_field_values -----
CREATE POLICY "tfv_select" ON public.tax_field_values FOR SELECT TO authenticated
  USING (public.can_access_tax_file(auth.uid(), tax_file_id));
CREATE POLICY "tfv_insert" ON public.tax_field_values FOR INSERT TO authenticated
  WITH CHECK (public.can_access_tax_file(auth.uid(), tax_file_id));
CREATE POLICY "tfv_update" ON public.tax_field_values FOR UPDATE TO authenticated
  USING (public.can_access_tax_file(auth.uid(), tax_file_id))
  WITH CHECK (public.can_access_tax_file(auth.uid(), tax_file_id));
CREATE POLICY "tfv_delete" ON public.tax_field_values FOR DELETE TO authenticated
  USING (public.is_tax_staff(auth.uid()) OR public.has_role(auth.uid(),'admin'::app_role));

-- ----- tax_extraction_field_mappings -----
CREATE POLICY "tefm_select" ON public.tax_extraction_field_mappings FOR SELECT TO authenticated
  USING (public.can_access_tax_file(auth.uid(), tax_file_id));
CREATE POLICY "tefm_insert" ON public.tax_extraction_field_mappings FOR INSERT TO authenticated
  WITH CHECK (public.can_access_tax_file(auth.uid(), tax_file_id));
CREATE POLICY "tefm_update" ON public.tax_extraction_field_mappings FOR UPDATE TO authenticated
  USING (public.can_access_tax_file(auth.uid(), tax_file_id))
  WITH CHECK (public.can_access_tax_file(auth.uid(), tax_file_id));

-- ----- tax_firms -----
CREATE POLICY "tfirms_select" ON public.tax_firms FOR SELECT TO authenticated
  USING (
    public.is_tax_staff(auth.uid())
    OR public.has_role(auth.uid(),'admin'::app_role)
    OR public.is_tax_firm_member(auth.uid(), id)
  );
CREATE POLICY "tfirms_insert" ON public.tax_firms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tfirms_update" ON public.tax_firms FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.get_tax_firm_role(auth.uid(), id) IN ('owner_admin','partner_cpa','manager')
  );

-- ----- tax_firm_members -----
CREATE POLICY "tfm_select" ON public.tax_firm_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_tax_firm_member(auth.uid(), firm_id)
    OR public.is_tax_staff(auth.uid())
    OR public.has_role(auth.uid(),'admin'::app_role)
  );
CREATE POLICY "tfm_insert" ON public.tax_firm_members FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.get_tax_firm_role(auth.uid(), firm_id) IN ('owner_admin','partner_cpa','manager')
  );
CREATE POLICY "tfm_update" ON public.tax_firm_members FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.get_tax_firm_role(auth.uid(), firm_id) IN ('owner_admin','partner_cpa','manager')
  );

-- ----- tax_firm_clients -----
CREATE POLICY "tfc_select" ON public.tax_firm_clients FOR SELECT TO authenticated
  USING (
    public.is_tax_firm_member(auth.uid(), firm_id)
    OR public.is_tax_staff(auth.uid())
    OR public.has_role(auth.uid(),'admin'::app_role)
  );
CREATE POLICY "tfc_manage" ON public.tax_firm_clients FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.get_tax_firm_role(auth.uid(), firm_id) IN ('owner_admin','partner_cpa','manager','intake')
  );
CREATE POLICY "tfc_update" ON public.tax_firm_clients FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.get_tax_firm_role(auth.uid(), firm_id) IN ('owner_admin','partner_cpa','manager')
  );

-- ----- tax_firm_assignments -----
CREATE POLICY "tfa_select" ON public.tax_firm_assignments FOR SELECT TO authenticated
  USING (
    member_user_id = auth.uid()
    OR public.is_tax_firm_member(auth.uid(), firm_id)
    OR public.is_tax_staff(auth.uid())
    OR public.has_role(auth.uid(),'admin'::app_role)
  );
CREATE POLICY "tfa_manage" ON public.tax_firm_assignments FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.get_tax_firm_role(auth.uid(), firm_id) IN ('owner_admin','partner_cpa','manager')
  );
CREATE POLICY "tfa_update" ON public.tax_firm_assignments FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin'::app_role)
    OR public.get_tax_firm_role(auth.uid(), firm_id) IN ('owner_admin','partner_cpa','manager')
  );

-- ----- tax_review_issues -----
CREATE POLICY "tri_select" ON public.tax_review_issues FOR SELECT TO authenticated
  USING (public.can_access_tax_file(auth.uid(), tax_file_id));
CREATE POLICY "tri_insert" ON public.tax_review_issues FOR INSERT TO authenticated
  WITH CHECK (public.can_access_tax_file(auth.uid(), tax_file_id));
CREATE POLICY "tri_update" ON public.tax_review_issues FOR UPDATE TO authenticated
  USING (public.can_access_tax_file(auth.uid(), tax_file_id))
  WITH CHECK (public.can_access_tax_file(auth.uid(), tax_file_id));

-- ----- tax_lifecycle_events (append-only) -----
CREATE POLICY "tle_select" ON public.tax_lifecycle_events FOR SELECT TO authenticated
  USING (public.can_access_tax_file(auth.uid(), tax_file_id));
CREATE POLICY "tle_insert" ON public.tax_lifecycle_events FOR INSERT TO authenticated
  WITH CHECK (public.can_access_tax_file(auth.uid(), tax_file_id));

-- =========================================================================
-- Extend tax_files visibility so firm members can see assigned files
-- (existing policies keep working; this ADDS a permissive policy)
-- =========================================================================
DROP POLICY IF EXISTS "tf_select_firm" ON public.tax_files;
CREATE POLICY "tf_select_firm" ON public.tax_files FOR SELECT TO authenticated
  USING (
    public.user_assigned_to_tax_file(auth.uid(), id)
    OR public.user_services_tax_client(auth.uid(), tax_client_id)
  );

DROP POLICY IF EXISTS "tf_update_firm" ON public.tax_files;
CREATE POLICY "tf_update_firm" ON public.tax_files FOR UPDATE TO authenticated
  USING (public.user_assigned_to_tax_file(auth.uid(), id))
  WITH CHECK (public.user_assigned_to_tax_file(auth.uid(), id));