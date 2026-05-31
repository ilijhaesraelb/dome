
-- =============================================================
-- SECTION 1: Create submission_lock_status enum
-- =============================================================
CREATE TYPE public.submission_lock_status AS ENUM (
  'draft',
  'in_progress',
  'under_review',
  'ready_for_finalization',
  'finalized',
  'reopened'
);

-- =============================================================
-- SECTION 2: Global Audit Events Table (append-only)
-- =============================================================
CREATE TABLE public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role text,
  case_id uuid,
  record_id text,
  module text NOT NULL,
  action_type text NOT NULL,
  target_type text,
  target_id text,
  before_state jsonb,
  after_state jsonb,
  ip_address text,
  user_agent text,
  session_id text,
  success boolean NOT NULL DEFAULT true,
  error_details text,
  human_label text,
  metadata jsonb
);

-- Index for fast lookups
CREATE INDEX idx_audit_events_user ON public.audit_events(user_id);
CREATE INDEX idx_audit_events_case ON public.audit_events(case_id);
CREATE INDEX idx_audit_events_module ON public.audit_events(module);
CREATE INDEX idx_audit_events_action ON public.audit_events(action_type);
CREATE INDEX idx_audit_events_created ON public.audit_events(created_at DESC);
CREATE INDEX idx_audit_events_target ON public.audit_events(target_type, target_id);

-- =============================================================
-- SECTION 3: Record Versions Table
-- =============================================================
CREATE TABLE public.record_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  record_type text NOT NULL,
  record_id text NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  snapshot jsonb NOT NULL,
  fields_changed text[],
  before_values jsonb,
  after_values jsonb,
  audit_event_id uuid REFERENCES public.audit_events(id),
  is_current boolean NOT NULL DEFAULT true,
  metadata jsonb
);

CREATE INDEX idx_record_versions_record ON public.record_versions(record_type, record_id);
CREATE INDEX idx_record_versions_current ON public.record_versions(record_type, record_id, is_current) WHERE is_current = true;
CREATE UNIQUE INDEX idx_record_versions_unique ON public.record_versions(record_type, record_id, version_number);

-- =============================================================
-- SECTION 4: Field Change Logs Table
-- =============================================================
CREATE TABLE public.field_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  record_type text NOT NULL,
  record_id text NOT NULL,
  field_name text NOT NULL,
  before_value text,
  after_value text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  audit_event_id uuid REFERENCES public.audit_events(id),
  form_instance_id uuid
);

CREATE INDEX idx_field_changes_record ON public.field_change_logs(record_type, record_id);
CREATE INDEX idx_field_changes_field ON public.field_change_logs(field_name);
CREATE INDEX idx_field_changes_form ON public.field_change_logs(form_instance_id);

-- =============================================================
-- SECTION 5: Add lock_status to form_instances and cases
-- =============================================================
ALTER TABLE public.form_instances ADD COLUMN IF NOT EXISTS lock_status public.submission_lock_status NOT NULL DEFAULT 'draft';
ALTER TABLE public.form_instances ADD COLUMN IF NOT EXISTS locked_at timestamptz;
ALTER TABLE public.form_instances ADD COLUMN IF NOT EXISTS locked_by uuid REFERENCES auth.users(id);

ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS lock_status public.submission_lock_status NOT NULL DEFAULT 'draft';
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS locked_at timestamptz;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS locked_by uuid REFERENCES auth.users(id);

-- =============================================================
-- SECTION 6: RLS Policies - Audit events are append-only for authenticated users
-- =============================================================
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_change_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert audit events
CREATE POLICY "Authenticated users can insert audit events"
  ON public.audit_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read audit events for their own cases or if admin
CREATE POLICY "Users can read own or case audit events"
  ON public.audit_events FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (case_id IS NOT NULL AND public.is_case_participant(auth.uid(), case_id))
    OR public.has_role(auth.uid(), 'admin')
  );

-- No update or delete allowed on audit events (tamper-resistant)

-- Record versions: insert by authenticated users
CREATE POLICY "Authenticated users can insert record versions"
  ON public.record_versions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Record versions: read by owner, case participants, or admin
CREATE POLICY "Users can read own or case record versions"
  ON public.record_versions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- Field change logs: insert by authenticated
CREATE POLICY "Authenticated users can insert field change logs"
  ON public.field_change_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Field change logs: read by owner or admin
CREATE POLICY "Users can read own field change logs"
  ON public.field_change_logs FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

-- =============================================================
-- SECTION 7: Security definer function for system-level audit inserts
-- =============================================================
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _user_id uuid,
  _user_role text,
  _module text,
  _action_type text,
  _human_label text,
  _case_id uuid DEFAULT NULL,
  _record_id text DEFAULT NULL,
  _target_type text DEFAULT NULL,
  _target_id text DEFAULT NULL,
  _before_state jsonb DEFAULT NULL,
  _after_state jsonb DEFAULT NULL,
  _success boolean DEFAULT true,
  _error_details text DEFAULT NULL,
  _metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id uuid;
BEGIN
  INSERT INTO public.audit_events (
    user_id, user_role, module, action_type, human_label,
    case_id, record_id, target_type, target_id,
    before_state, after_state, success, error_details, metadata
  ) VALUES (
    _user_id, _user_role, _module, _action_type, _human_label,
    _case_id, _record_id, _target_type, _target_id,
    _before_state, _after_state, _success, _error_details, _metadata
  ) RETURNING id INTO _event_id;
  
  RETURN _event_id;
END;
$$;
