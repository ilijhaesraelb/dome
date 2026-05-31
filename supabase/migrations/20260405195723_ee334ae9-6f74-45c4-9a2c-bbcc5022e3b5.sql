CREATE OR REPLACE FUNCTION public.initialize_client_case(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _case_id uuid;
  _person_id uuid;
  _case_number text;
  _profile RECORD;
  _email text;
BEGIN
  -- Check if user already has a case as participant
  SELECT cp.case_id INTO _case_id
  FROM case_participants cp
  WHERE cp.user_id = _user_id
  LIMIT 1;

  IF _case_id IS NOT NULL THEN
    -- Already has a case, get person
    SELECT p.id INTO _person_id FROM persons p WHERE p.case_id = _case_id LIMIT 1;
    RETURN jsonb_build_object('case_id', _case_id, 'person_id', _person_id);
  END IF;

  -- Check if user has a case they created (but no participant record)
  SELECT c.id INTO _case_id
  FROM cases c
  WHERE c.created_by = _user_id
  ORDER BY c.updated_at DESC
  LIMIT 1;

  IF _case_id IS NULL THEN
    -- Create new case
    _case_number := 'DOME-' || upper(to_hex(extract(epoch from now())::bigint));
    INSERT INTO cases (case_number, case_type, created_by, status, priority)
    VALUES (_case_number, 'general', _user_id, 'draft', 'medium')
    RETURNING id INTO _case_id;
  END IF;

  -- Ensure participant exists
  INSERT INTO case_participants (case_id, user_id, role)
  VALUES (_case_id, _user_id, 'client')
  ON CONFLICT DO NOTHING;

  -- Add timeline event
  INSERT INTO case_timeline (case_id, title, description, event_type)
  VALUES (_case_id, 'Case created', 'Case automatically created for client onboarding.', 'system');

  -- Ensure person record exists
  SELECT p.id INTO _person_id FROM persons p WHERE p.case_id = _case_id LIMIT 1;

  IF _person_id IS NULL THEN
    SELECT email INTO _email FROM auth.users WHERE id = _user_id;
    SELECT * INTO _profile FROM profiles WHERE user_id = _user_id;

    INSERT INTO persons (case_id, first_name, last_name, email, role)
    VALUES (
      _case_id,
      COALESCE(_profile.first_name, split_part(_email, '@', 1), 'Unknown'),
      COALESCE(_profile.last_name, ''),
      _email,
      'beneficiary'
    )
    RETURNING id INTO _person_id;
  END IF;

  RETURN jsonb_build_object('case_id', _case_id, 'person_id', _person_id);
END;
$$;