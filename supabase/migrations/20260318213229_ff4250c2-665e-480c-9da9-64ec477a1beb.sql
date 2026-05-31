
-- Tighten translation insert policy: only case participants can insert translations
DROP POLICY "Authenticated users can insert translations" ON public.message_translations;
CREATE POLICY "Case participants can insert translations"
  ON public.message_translations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.case_messages cm
      JOIN public.case_participants cp ON cp.case_id = cm.case_id
      WHERE cm.id = message_translations.message_id
        AND cp.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.case_messages cm
      JOIN public.cases c ON c.id = cm.case_id
      WHERE cm.id = message_translations.message_id
        AND c.created_by = auth.uid()
    )
  );

-- Tighten analytics insert policy: only log own analytics
DROP POLICY "Users can insert analytics" ON public.translation_analytics;
CREATE POLICY "Users can insert own analytics"
  ON public.translation_analytics FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
