
-- Tighten notifications insert: only allow inserting for own user_id or by admins
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Insert own or admin notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
