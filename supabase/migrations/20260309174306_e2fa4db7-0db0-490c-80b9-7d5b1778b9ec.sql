
-- Add 'government' as a valid requested_role mapping in handle_new_user
-- Government users get 'practitioner' app_role + auto institution setup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _requested_role text;
  _assigned_role app_role;
  _org_name text;
  _inst_id uuid;
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
    WHEN 'government' THEN _assigned_role := 'practitioner';
    ELSE _assigned_role := 'client';
  END CASE;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _assigned_role);

  -- Auto-create institution for government/institutional signups
  IF _requested_role = 'government' THEN
    _org_name := COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization');
    
    INSERT INTO public.institutions (name, type, created_by, status, default_language)
    VALUES (_org_name, 'nonprofit'::institution_type, NEW.id, 'active'::institution_status, 'en')
    RETURNING id INTO _inst_id;
    
    INSERT INTO public.institution_users (institution_id, user_id, role, is_active)
    VALUES (_inst_id, NEW.id, 'organization_admin'::institutional_role, true);
  END IF;

  RETURN NEW;
END;
$function$;
