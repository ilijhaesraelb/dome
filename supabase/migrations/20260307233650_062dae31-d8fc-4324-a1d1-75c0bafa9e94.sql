
-- Invitation status enum
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'declined', 'revoked', 'expired');

-- Collaborator type enum
CREATE TYPE public.collaborator_type AS ENUM ('attorney', 'organization', 'ar_doj');

-- Attorney invitations table
CREATE TABLE public.attorney_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL,
  invited_email TEXT NOT NULL,
  collaborator_type collaborator_type NOT NULL DEFAULT 'attorney',
  status invitation_status NOT NULL DEFAULT 'pending',
  token TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
  permissions JSONB NOT NULL DEFAULT '{"upload_documents": true, "view_sensitive": false}'::jsonb,
  selected_forms TEXT[] NOT NULL DEFAULT '{}'::text[],
  accepted_by UUID,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: one active invitation per email per case
CREATE UNIQUE INDEX idx_active_invitation_per_case 
  ON public.attorney_invitations (case_id, invited_email) 
  WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.attorney_invitations ENABLE ROW LEVEL SECURITY;

-- Case participants can view invitations for their case
CREATE POLICY "Participants view case invitations"
  ON public.attorney_invitations FOR SELECT
  USING (is_case_participant(auth.uid(), case_id));

-- Case participants can create invitations
CREATE POLICY "Participants create invitations"
  ON public.attorney_invitations FOR INSERT
  WITH CHECK (is_case_participant(auth.uid(), case_id) AND invited_by = auth.uid());

-- Invitation sender can update (revoke)
CREATE POLICY "Sender can update invitations"
  ON public.attorney_invitations FOR UPDATE
  USING (invited_by = auth.uid());

-- Admins manage all
CREATE POLICY "Admins manage invitations"
  ON public.attorney_invitations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Invited user can accept/decline by matching email
CREATE POLICY "Invited user can accept"
  ON public.attorney_invitations FOR UPDATE
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Updated_at trigger
CREATE TRIGGER update_attorney_invitations_updated_at
  BEFORE UPDATE ON public.attorney_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to accept invitation and add as case participant
CREATE OR REPLACE FUNCTION public.accept_attorney_invitation(_invitation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _inv RECORD;
  _user_email TEXT;
  _user_role app_role;
BEGIN
  SELECT email INTO _user_email FROM auth.users WHERE id = auth.uid();
  
  SELECT * INTO _inv FROM public.attorney_invitations 
  WHERE id = _invitation_id AND status = 'pending' AND invited_email = _user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or not eligible';
  END IF;

  -- Determine role from collaborator type
  CASE _inv.collaborator_type
    WHEN 'attorney' THEN _user_role := 'attorney';
    WHEN 'ar_doj' THEN _user_role := 'practitioner';
    WHEN 'organization' THEN _user_role := 'practitioner';
    ELSE _user_role := 'practitioner';
  END CASE;

  -- Add as case participant
  INSERT INTO public.case_participants (case_id, user_id, role)
  VALUES (_inv.case_id, auth.uid(), _user_role)
  ON CONFLICT DO NOTHING;

  -- Update invitation
  UPDATE public.attorney_invitations
  SET status = 'accepted', accepted_by = auth.uid(), accepted_at = now()
  WHERE id = _invitation_id;
END;
$$;
