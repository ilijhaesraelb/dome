
-- Drop existing storage policy that conflicts
DROP POLICY IF EXISTS "Authenticated users can upload case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own case documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own case documents" ON storage.objects;

-- Re-create storage RLS policies
CREATE POLICY "Authenticated users can upload case documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'case-documents');

CREATE POLICY "Users can view own case documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'case-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own case documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'case-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'nonprofit',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view own org"
ON public.organizations FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.organization_members om
  WHERE om.organization_id = organizations.id AND om.user_id = auth.uid()
));

CREATE POLICY "Admins manage orgs"
ON public.organizations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members view own membership"
ON public.organization_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins manage org members"
ON public.organization_members FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Update handle_new_user to respect role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _requested_role text;
  _assigned_role app_role;
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );

  _requested_role := COALESCE(NEW.raw_user_meta_data->>'requested_role', 'client');
  
  CASE _requested_role
    WHEN 'attorney' THEN _assigned_role := 'attorney';
    WHEN 'accredited_rep' THEN _assigned_role := 'practitioner';
    WHEN 'practitioner' THEN _assigned_role := 'practitioner';
    ELSE _assigned_role := 'client';
  END CASE;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _assigned_role);

  RETURN NEW;
END;
$$;
