
-- Enums (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tax_staff_role') THEN
    CREATE TYPE public.tax_staff_role AS ENUM (
      'owner_admin','tax_preparer','accountant','cpa_reviewer','intake_staff','document_reviewer','readonly_staff'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tax_user_type') THEN
    CREATE TYPE public.tax_user_type AS ENUM (
      'individual','nonprofit','small_business','accountant_cpa','internal_client'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tax_file_status') THEN
    CREATE TYPE public.tax_file_status AS ENUM (
      'new_intake','awaiting_documents','documents_uploaded','extraction_complete',
      'draft_in_progress','awaiting_review','awaiting_client_response',
      'ready_for_payment','paid_ready_export','completed','on_hold'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tax_service_mode') THEN
    CREATE TYPE public.tax_service_mode AS ENUM (
      'self_prepare','guided_self_service','ccgvs_assisted','cpa_review','full_service'
    );
  END IF;
END $$;

-- Tax clients
CREATE TABLE public.tax_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tax_user_type tax_user_type NOT NULL DEFAULT 'individual',
  legal_first_name text, legal_last_name text, date_of_birth date,
  ssn_encrypted text, filing_status text, dependents_count int DEFAULT 0,
  organization_name text, ein_encrypted text, organization_type text,
  officer_name text, officer_email text, financial_contact_name text, financial_contact_email text,
  email text, phone text, preferred_language text DEFAULT 'en',
  address_street text, address_city text, address_state text, address_zip text, address_country text DEFAULT 'US',
  notes text, created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tax files
CREATE TABLE public.tax_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_client_id uuid REFERENCES public.tax_clients(id) ON DELETE CASCADE NOT NULL,
  tax_year int NOT NULL DEFAULT EXTRACT(YEAR FROM now())::int - 1,
  filing_type text NOT NULL DEFAULT 'individual',
  service_mode tax_service_mode NOT NULL DEFAULT 'self_prepare',
  status tax_file_status NOT NULL DEFAULT 'new_intake',
  assigned_to uuid REFERENCES auth.users(id),
  reviewer_id uuid REFERENCES auth.users(id),
  readiness_score int DEFAULT 0,
  field_values jsonb DEFAULT '{}', extracted_data jsonb DEFAULT '{}',
  draft_return_data jsonb DEFAULT '{}', financial_statement_data jsonb DEFAULT '{}',
  payment_status text DEFAULT 'unpaid', payment_amount_cents int, stripe_payment_id text,
  exported_at timestamptz, finalized_at timestamptz, finalized_by uuid REFERENCES auth.users(id),
  lock_status text DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tax staff
CREATE TABLE public.tax_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role tax_staff_role NOT NULL DEFAULT 'readonly_staff',
  display_name text NOT NULL, email text, is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tax staff notes
CREATE TABLE public.tax_staff_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_id uuid REFERENCES public.tax_files(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES auth.users(id) NOT NULL,
  author_name text NOT NULL DEFAULT '', content text NOT NULL,
  note_type text DEFAULT 'general', is_flagged boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tax assignments
CREATE TABLE public.tax_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_id uuid REFERENCES public.tax_files(id) ON DELETE CASCADE NOT NULL,
  assigned_to uuid REFERENCES auth.users(id) NOT NULL,
  assigned_by uuid REFERENCES auth.users(id) NOT NULL,
  role text NOT NULL DEFAULT 'preparer',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tax messages
CREATE TABLE public.tax_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_id uuid REFERENCES public.tax_files(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id),
  sender_name text NOT NULL DEFAULT '', sender_role text NOT NULL DEFAULT 'client',
  content text NOT NULL, is_internal boolean DEFAULT false, read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tax file documents (new table, separate from legacy tax_documents)
CREATE TABLE public.tax_file_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_id uuid REFERENCES public.tax_files(id) ON DELETE CASCADE NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id),
  name text NOT NULL, category text NOT NULL DEFAULT 'other',
  file_path text, file_type text, file_size int,
  extraction_status text DEFAULT 'pending', extracted_data jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.tax_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_staff_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_file_documents ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_tax_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.tax_staff WHERE user_id = _user_id AND is_active = true)
$$;

CREATE OR REPLACE FUNCTION public.get_tax_staff_role(_user_id uuid)
RETURNS tax_staff_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.tax_staff WHERE user_id = _user_id AND is_active = true LIMIT 1
$$;

-- Policies: tax_clients
CREATE POLICY "tc_select" ON public.tax_clients FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_tax_staff(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "tc_insert" ON public.tax_clients FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_tax_staff(auth.uid()));
CREATE POLICY "tc_update" ON public.tax_clients FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_tax_staff(auth.uid()));

-- Policies: tax_files
CREATE POLICY "tf_select" ON public.tax_files FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tax_clients tc WHERE tc.id = tax_client_id AND tc.user_id = auth.uid())
    OR public.is_tax_staff(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "tf_insert" ON public.tax_files FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tax_clients tc WHERE tc.id = tax_client_id AND tc.user_id = auth.uid())
    OR public.is_tax_staff(auth.uid()));
CREATE POLICY "tf_update" ON public.tax_files FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tax_clients tc WHERE tc.id = tax_client_id AND tc.user_id = auth.uid())
    OR public.is_tax_staff(auth.uid()));

-- Policies: tax_staff
CREATE POLICY "ts_select" ON public.tax_staff FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.is_tax_staff(auth.uid()));
CREATE POLICY "ts_manage" ON public.tax_staff FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.get_tax_staff_role(auth.uid()) = 'owner_admin');
CREATE POLICY "ts_update" ON public.tax_staff FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.get_tax_staff_role(auth.uid()) = 'owner_admin');

-- Policies: tax_staff_notes (staff only)
CREATE POLICY "tsn_all" ON public.tax_staff_notes FOR SELECT TO authenticated
  USING (public.is_tax_staff(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "tsn_insert" ON public.tax_staff_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_tax_staff(auth.uid()));

-- Policies: tax_assignments (staff only)
CREATE POLICY "ta_select" ON public.tax_assignments FOR SELECT TO authenticated
  USING (public.is_tax_staff(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "ta_insert" ON public.tax_assignments FOR INSERT TO authenticated
  WITH CHECK (public.is_tax_staff(auth.uid()));

-- Policies: tax_messages
CREATE POLICY "tm_select" ON public.tax_messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR public.is_tax_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.tax_files tf JOIN public.tax_clients tc ON tc.id = tf.tax_client_id WHERE tf.id = tax_file_id AND tc.user_id = auth.uid()));
CREATE POLICY "tm_insert" ON public.tax_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() OR public.is_tax_staff(auth.uid()));

-- Policies: tax_file_documents
CREATE POLICY "tfd_select" ON public.tax_file_documents FOR SELECT TO authenticated
  USING (uploaded_by = auth.uid() OR public.is_tax_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.tax_files tf JOIN public.tax_clients tc ON tc.id = tf.tax_client_id WHERE tf.id = tax_file_id AND tc.user_id = auth.uid()));
CREATE POLICY "tfd_insert" ON public.tax_file_documents FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() OR public.is_tax_staff(auth.uid()));
CREATE POLICY "tfd_update" ON public.tax_file_documents FOR UPDATE TO authenticated
  USING (uploaded_by = auth.uid() OR public.is_tax_staff(auth.uid()));

-- Triggers
CREATE TRIGGER set_tax_clients_updated_at BEFORE UPDATE ON public.tax_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_tax_files_updated_at BEFORE UPDATE ON public.tax_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_tax_staff_updated_at BEFORE UPDATE ON public.tax_staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_tax_file_documents_updated_at BEFORE UPDATE ON public.tax_file_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
