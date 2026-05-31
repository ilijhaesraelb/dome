
-- Entity types enum
CREATE TYPE public.entity_type AS ENUM ('llc', 'corporation', 'nonprofit', 'sole_proprietorship', 'partnership', 'dba');

-- Business listing status
CREATE TYPE public.listing_status AS ENUM ('draft', 'pending_review', 'published', 'rejected', 'expired', 'suspended');

-- Listing category
CREATE TYPE public.listing_category AS ENUM ('startup_investor', 'expansion_capital', 'real_estate', 'immigrant_business', 'nonprofit_partnership', 'franchise_acquisition', 'affordable_housing', 'other');

-- Formation intake status
CREATE TYPE public.formation_status AS ENUM ('started', 'in_progress', 'completed', 'submitted', 'filed');

-- Handoff request type
CREATE TYPE public.handoff_type AS ENUM ('review_draft', 'complete_filing', 'consultation', 'nonprofit_review', 'eb5_review', 'tax_setup');

-- Marketplace mode
CREATE TYPE public.marketplace_mode AS ENUM ('public_listing', 'capital_raising_referral');

-- States reference table
CREATE TABLE public.us_states (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  filing_office_name TEXT,
  filing_office_url TEXT,
  notes TEXT
);

-- Formation intakes (main guided workflow data)
CREATE TABLE public.formation_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  state_code TEXT NOT NULL REFERENCES public.us_states(code),
  entity_type entity_type NOT NULL,
  business_name TEXT,
  business_purpose TEXT,
  registered_agent_name TEXT,
  registered_agent_address TEXT,
  business_address TEXT,
  owners JSONB DEFAULT '[]'::jsonb,
  officers JSONB DEFAULT '[]'::jsonb,
  authorized_shares INTEGER,
  nonprofit_board JSONB DEFAULT '[]'::jsonb,
  charitable_purpose TEXT,
  additional_data JSONB DEFAULT '{}'::jsonb,
  status formation_status NOT NULL DEFAULT 'started',
  ai_guidance_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nonprofit-specific intakes
CREATE TABLE public.nonprofit_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_intake_id UUID REFERENCES public.formation_intakes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  ein_status TEXT DEFAULT 'not_started',
  form_1023_type TEXT,
  board_members JSONB DEFAULT '[]'::jsonb,
  conflict_of_interest_policy BOOLEAN DEFAULT false,
  bylaws_drafted BOOLEAN DEFAULT false,
  organizing_docs_ready BOOLEAN DEFAULT false,
  charitable_registration_states JSONB DEFAULT '[]'::jsonb,
  irs_submission_ready BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EB-5 information intakes
CREATE TABLE public.eb5_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  investment_type TEXT,
  investment_amount NUMERIC,
  target_area BOOLEAN DEFAULT false,
  source_of_funds_docs JSONB DEFAULT '[]'::jsonb,
  business_plan_ready BOOLEAN DEFAULT false,
  job_creation_plan TEXT,
  attorney_consulted BOOLEAN DEFAULT false,
  risk_acknowledged BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Business opportunity listings
CREATE TABLE public.business_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  state TEXT NOT NULL,
  industry TEXT NOT NULL,
  summary TEXT NOT NULL,
  business_stage TEXT,
  amount_sought NUMERIC,
  use_of_funds TEXT,
  founder_overview TEXT,
  traction TEXT,
  website TEXT,
  contact_method TEXT,
  category listing_category NOT NULL DEFAULT 'other',
  marketplace_mode marketplace_mode NOT NULL DEFAULT 'public_listing',
  status listing_status NOT NULL DEFAULT 'draft',
  disclaimer_accepted BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Listing subscriptions (payment tracking)
CREATE TABLE public.listing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  listing_id UUID REFERENCES public.business_listings(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Professional handoff requests
CREATE TABLE public.professional_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  handoff_type handoff_type NOT NULL,
  related_intake_id UUID,
  related_intake_type TEXT,
  message TEXT,
  preferred_contact TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disclosure acceptance logs
CREATE TABLE public.disclosure_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  disclosure_type TEXT NOT NULL,
  disclosure_version TEXT NOT NULL DEFAULT '1.0',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT
);

-- Tax setup requests
CREATE TABLE public.tax_setup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  formation_intake_id UUID REFERENCES public.formation_intakes(id),
  entity_type entity_type,
  ein_needed BOOLEAN DEFAULT true,
  tax_classification TEXT,
  payroll_needed BOOLEAN DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Investor leads (contact requests from marketplace)
CREATE TABLE public.investor_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.business_listings(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT,
  accredited_investor_ack BOOLEAN DEFAULT false,
  risk_ack BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compliance flags for moderation
CREATE TABLE public.compliance_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.business_listings(id) ON DELETE CASCADE,
  flagged_by UUID,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.formation_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nonprofit_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eb5_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disclosure_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_setup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.us_states ENABLE ROW LEVEL SECURITY;

-- Public read on us_states
CREATE POLICY "Anyone can read states" ON public.us_states FOR SELECT USING (true);
CREATE POLICY "Admins manage states" ON public.us_states FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Formation intakes: users own, admins all
CREATE POLICY "Users manage own formation intakes" ON public.formation_intakes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all formation intakes" ON public.formation_intakes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Nonprofit intakes
CREATE POLICY "Users manage own nonprofit intakes" ON public.nonprofit_intakes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all nonprofit intakes" ON public.nonprofit_intakes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- EB-5 intakes
CREATE POLICY "Users manage own eb5 intakes" ON public.eb5_intakes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all eb5 intakes" ON public.eb5_intakes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Business listings: owner manages, published visible to all authenticated
CREATE POLICY "Users manage own listings" ON public.business_listings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Published listings visible to all" ON public.business_listings FOR SELECT USING (status = 'published');
CREATE POLICY "Admins manage all listings" ON public.business_listings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Listing subscriptions
CREATE POLICY "Users manage own listing subs" ON public.listing_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all listing subs" ON public.listing_subscriptions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Professional handoffs
CREATE POLICY "Users manage own handoffs" ON public.professional_handoffs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all handoffs" ON public.professional_handoffs FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Practitioners view handoffs" ON public.professional_handoffs FOR SELECT USING (has_role(auth.uid(), 'practitioner'));

-- Disclosure acceptances
CREATE POLICY "Users manage own disclosures" ON public.disclosure_acceptances FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view all disclosures" ON public.disclosure_acceptances FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Tax setup requests
CREATE POLICY "Users manage own tax requests" ON public.tax_setup_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all tax requests" ON public.tax_setup_requests FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Investor leads
CREATE POLICY "Listing owners view leads" ON public.investor_leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.business_listings bl WHERE bl.id = investor_leads.listing_id AND bl.user_id = auth.uid())
);
CREATE POLICY "Authenticated users create leads" ON public.investor_leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage all leads" ON public.investor_leads FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Compliance flags
CREATE POLICY "Admins manage flags" ON public.compliance_flags FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users create flags" ON public.compliance_flags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Insert all 50 states + DC
INSERT INTO public.us_states (code, name) VALUES
  ('AL','Alabama'),('AK','Alaska'),('AZ','Arizona'),('AR','Arkansas'),('CA','California'),
  ('CO','Colorado'),('CT','Connecticut'),('DE','Delaware'),('DC','District of Columbia'),('FL','Florida'),
  ('GA','Georgia'),('HI','Hawaii'),('ID','Idaho'),('IL','Illinois'),('IN','Indiana'),
  ('IA','Iowa'),('KS','Kansas'),('KY','Kentucky'),('LA','Louisiana'),('ME','Maine'),
  ('MD','Maryland'),('MA','Massachusetts'),('MI','Michigan'),('MN','Minnesota'),('MS','Mississippi'),
  ('MO','Missouri'),('MT','Montana'),('NE','Nebraska'),('NV','Nevada'),('NH','New Hampshire'),
  ('NJ','New Jersey'),('NM','New Mexico'),('NY','New York'),('NC','North Carolina'),('ND','North Dakota'),
  ('OH','Ohio'),('OK','Oklahoma'),('OR','Oregon'),('PA','Pennsylvania'),('RI','Rhode Island'),
  ('SC','South Carolina'),('SD','South Dakota'),('TN','Tennessee'),('TX','Texas'),('UT','Utah'),
  ('VT','Vermont'),('VA','Virginia'),('WA','Washington'),('WV','West Virginia'),('WI','Wisconsin'),
  ('WY','Wyoming');
