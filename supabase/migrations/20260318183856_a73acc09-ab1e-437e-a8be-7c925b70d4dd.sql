-- Fix success_map_entries: create a public view without user_id
CREATE OR REPLACE VIEW public.success_map_entries_public AS
SELECT id, latitude, longitude, location_label, case_type, milestone, 
       timeline_months, is_approved, created_at
FROM public.success_map_entries
WHERE is_approved = true;

-- Fix english_classes: restrict SELECT to enrolled students and teachers
DROP POLICY IF EXISTS "Authenticated view classes" ON public.english_classes;

CREATE POLICY "Enrolled students and teachers view classes"
ON public.english_classes
FOR SELECT
TO authenticated
USING (
  teacher_id IN (SELECT id FROM public.english_teachers WHERE user_id = auth.uid())
  OR course_id IN (
    SELECT course_id FROM public.english_enrollments WHERE user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);