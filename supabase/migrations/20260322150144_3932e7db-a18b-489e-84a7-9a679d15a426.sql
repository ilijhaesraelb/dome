
-- Law Firms table
CREATE TABLE public.law_firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  practice_areas TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{en}',
  subscription_status TEXT DEFAULT 'trial',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Firm members with roles
CREATE TYPE public.firm_role AS ENUM ('firm_admin', 'attorney', 'paralegal', 'intake_staff', 'reviewer', 'billing', 'readonly');

CREATE TABLE public.firm_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES public.law_firms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role firm_role NOT NULL DEFAULT 'attorney',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(firm_id, user_id)
);

-- Client intake requests
CREATE TYPE public.intake_status AS ENUM ('new', 'reviewing', 'accepted', 'assigned', 'declined', 'consultation_scheduled', 'needs_info');

CREATE TABLE public.intake_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES public.law_firms(id) ON DELETE CASCADE,
  client_user_id UUID,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  preferred_language TEXT DEFAULT 'en',
  case_type TEXT,
  urgency TEXT DEFAULT 'normal',
  source TEXT DEFAULT 'website',
  notes TEXT,
  status intake_status DEFAULT 'new',
  assigned_to UUID,
  case_id UUID REFERENCES public.cases(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_requests ENABLE ROW LEVEL SECURITY;

-- Security definer to check firm membership
CREATE OR REPLACE FUNCTION public.is_firm_member(_user_id UUID, _firm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.firm_members
    WHERE user_id = _user_id AND firm_id = _firm_id AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.get_firm_role(_user_id UUID, _firm_id UUID)
RETURNS firm_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.firm_members
  WHERE user_id = _user_id AND firm_id = _firm_id AND is_active = true
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_firm_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT firm_id FROM public.firm_members
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1
$$;

-- RLS Policies for law_firms
CREATE POLICY "Firm members can view their firm" ON public.law_firms
  FOR SELECT TO authenticated USING (public.is_firm_member(auth.uid(), id));

CREATE POLICY "Firm admins can update their firm" ON public.law_firms
  FOR UPDATE TO authenticated USING (public.get_firm_role(auth.uid(), id) = 'firm_admin');

CREATE POLICY "Authenticated users can create firms" ON public.law_firms
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- RLS Policies for firm_members
CREATE POLICY "Firm members can view other members" ON public.firm_members
  FOR SELECT TO authenticated USING (public.is_firm_member(auth.uid(), firm_id));

CREATE POLICY "Firm admins can manage members" ON public.firm_members
  FOR INSERT TO authenticated WITH CHECK (public.get_firm_role(auth.uid(), firm_id) = 'firm_admin');

CREATE POLICY "Firm admins can update members" ON public.firm_members
  FOR UPDATE TO authenticated USING (public.get_firm_role(auth.uid(), firm_id) = 'firm_admin');

CREATE POLICY "Firm creators can add themselves" ON public.firm_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RLS Policies for intake_requests
CREATE POLICY "Firm members can view intake" ON public.intake_requests
  FOR SELECT TO authenticated USING (
    firm_id IS NOT NULL AND public.is_firm_member(auth.uid(), firm_id)
    OR client_user_id = auth.uid()
  );

CREATE POLICY "Anyone can create intake request" ON public.intake_requests
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Firm members can update intake" ON public.intake_requests
  FOR UPDATE TO authenticated USING (
    firm_id IS NOT NULL AND public.is_firm_member(auth.uid(), firm_id)
  );

-- Updated_at triggers
CREATE TRIGGER update_law_firms_updated_at BEFORE UPDATE ON public.law_firms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_intake_requests_updated_at BEFORE UPDATE ON public.intake_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
