
-- Fix 1: tax_file_documents INSERT policy
-- Original only checked uploaded_by = auth.uid(), but can_access_tax_file covers all
-- legitimate actors (tax client, staff, admin, assignee). Also guards the case where
-- the JWT is fresh but the session context is missing can_access via the tax_clients join.
DROP POLICY IF EXISTS "tfd_insert" ON public.tax_file_documents;
CREATE POLICY "tfd_insert" ON public.tax_file_documents FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    OR public.is_tax_staff(auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.can_access_tax_file(auth.uid(), tax_file_id)
  );

-- Fix 2: storage SELECT policy uses index [1] which resolves to "tax" for paths like
-- tax/{user.id}/{tax_file_id}/... — it should be [2] for that format.
-- Keep backward compat with old format {user.id}/{case.id}/...
DROP POLICY IF EXISTS "Users can view own case documents" ON storage.objects;
CREATE POLICY "Users can view own case documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'case-documents'
  AND (
    -- Legacy format: {user.id}/{case.id}/filename
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Tax format: tax/{user.id}/{tax_file_id}/filename
    (
      (storage.foldername(name))[1] = 'tax'
      AND auth.uid()::text = (storage.foldername(name))[2]
    )
  )
);

-- Fix 3: same index fix for DELETE
DROP POLICY IF EXISTS "Users can delete own case documents" ON storage.objects;
CREATE POLICY "Users can delete own case documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'case-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR (
      (storage.foldername(name))[1] = 'tax'
      AND auth.uid()::text = (storage.foldername(name))[2]
    )
  )
);
