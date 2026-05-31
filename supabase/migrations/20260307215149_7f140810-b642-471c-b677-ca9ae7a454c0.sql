
-- Fix 1: Tighten storage policies for case-documents bucket
DROP POLICY IF EXISTS "Case participants can view case documents" ON storage.objects;
DROP POLICY IF EXISTS "Case participants can upload case documents" ON storage.objects;

-- SELECT: only case participants can view documents
CREATE POLICY "Case participants can view case documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'case-documents'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_path = storage.objects.name
        AND public.is_case_participant(auth.uid(), d.case_id)
    )
  );

-- INSERT: only case participants can upload
CREATE POLICY "Case participants can upload case documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'case-documents'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.case_participants cp
      WHERE cp.user_id = auth.uid()
    )
  );

-- Practitioners/admins can manage all docs in bucket
DROP POLICY IF EXISTS "Practitioners can manage case documents" ON storage.objects;
CREATE POLICY "Practitioners can manage case documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'case-documents'
    AND (public.has_role(auth.uid(), 'practitioner') OR public.has_role(auth.uid(), 'admin'))
  );
