
-- Signature types enum
CREATE TYPE public.signature_method AS ENUM ('draw', 'type', 'upload');

-- Identity document types enum
CREATE TYPE public.id_document_type AS ENUM ('passport', 'drivers_license', 'state_id', 'government_id', 'other');

-- Identity verification status
CREATE TYPE public.id_verification_status AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- ═══ Digital Signatures table ═══
CREATE TABLE public.signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method signature_method NOT NULL,
  signature_data TEXT NOT NULL,
  typed_name TEXT,
  font_style TEXT,
  file_path TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- Users can manage their own signatures
CREATE POLICY "Users can view own signatures"
  ON public.signatures FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own signatures"
  ON public.signatures FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own signatures"
  ON public.signatures FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own signatures"
  ON public.signatures FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ═══ Form Signature Records (audit trail) ═══
CREATE TABLE public.form_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_instance_id UUID REFERENCES public.form_instances(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  signer_user_id UUID NOT NULL REFERENCES auth.users(id),
  signature_id UUID NOT NULL REFERENCES public.signatures(id),
  signer_role TEXT NOT NULL DEFAULT 'client',
  signer_name TEXT NOT NULL,
  signer_email TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  consent_text TEXT NOT NULL DEFAULT 'I agree that this electronic signature is legally binding.',
  identity_document_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.form_signatures ENABLE ROW LEVEL SECURITY;

-- Case participants can view signatures on their cases
CREATE POLICY "Participants can view form signatures"
  ON public.form_signatures FOR SELECT TO authenticated
  USING (public.is_case_participant(auth.uid(), case_id) OR signer_user_id = auth.uid());

CREATE POLICY "Users can sign forms"
  ON public.form_signatures FOR INSERT TO authenticated
  WITH CHECK (signer_user_id = auth.uid());

-- ═══ Identity Documents table ═══
CREATE TABLE public.identity_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type id_document_type NOT NULL,
  file_path TEXT NOT NULL,
  file_path_back TEXT,
  extracted_name TEXT,
  extracted_dob TEXT,
  extracted_document_number TEXT,
  ocr_raw JSONB,
  verification_status id_verification_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.identity_documents ENABLE ROW LEVEL SECURITY;

-- Users can manage their own identity docs
CREATE POLICY "Users can view own identity docs"
  ON public.identity_documents FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can upload identity docs"
  ON public.identity_documents FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own identity docs"
  ON public.identity_documents FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Admins can view and review all identity docs
CREATE POLICY "Admins can view all identity docs"
  ON public.identity_documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update identity docs"
  ON public.identity_documents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add foreign key from form_signatures to identity_documents
ALTER TABLE public.form_signatures
  ADD CONSTRAINT form_signatures_identity_document_id_fkey
  FOREIGN KEY (identity_document_id) REFERENCES public.identity_documents(id);

-- ═══ Signature events log (audit) ═══
CREATE TABLE public.signature_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  form_instance_id UUID,
  case_id UUID,
  signature_id UUID,
  identity_document_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.signature_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own signature events"
  ON public.signature_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can log signature events"
  ON public.signature_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all signature events"
  ON public.signature_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ═══ Storage bucket for identity documents ═══
INSERT INTO storage.buckets (id, name, public)
VALUES ('identity-documents', 'identity-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for identity-documents bucket
CREATE POLICY "Users can upload own identity docs to storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'identity-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own identity docs in storage"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'identity-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ═══ Storage bucket for signatures ═══
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own signatures to storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own signatures in storage"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'signatures' AND (storage.foldername(name))[1] = auth.uid()::text);
