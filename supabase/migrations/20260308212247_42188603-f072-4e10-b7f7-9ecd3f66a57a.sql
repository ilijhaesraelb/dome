
-- Network listing categories enum
CREATE TYPE public.network_listing_category AS ENUM (
  'immigration_opportunity',
  'employment_sponsorship',
  'business_opportunity',
  'nonprofit_program',
  'education_scholarship',
  'housing_relocation',
  'professional_service'
);

CREATE TYPE public.network_listing_status AS ENUM (
  'draft', 'pending_review', 'published', 'rejected', 'expired'
);

CREATE TYPE public.professional_type AS ENUM (
  'immigration_attorney', 'accredited_representative', 'tax_professional',
  'nonprofit_advisor', 'business_consultant', 'translator', 'relocation_advisor'
);

-- Unified network listings table
CREATE TABLE public.network_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category public.network_listing_category NOT NULL,
  status public.network_listing_status NOT NULL DEFAULT 'draft',
  organization_name TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  location TEXT,
  state TEXT,
  country TEXT DEFAULT 'US',
  requirements TEXT,
  contact_method TEXT,
  website TEXT,
  application_link TEXT,
  salary_range TEXT,
  sponsorship_type TEXT,
  professional_type public.professional_type,
  credentials TEXT,
  services_offered TEXT[],
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  disclaimer_accepted BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.network_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published network listings visible to all" ON public.network_listings
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users manage own network listings" ON public.network_listings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all network listings" ON public.network_listings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Community stories table
CREATE TABLE public.community_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'success_story',
  milestone_type TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  display_name TEXT,
  location_approx TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved stories visible to all" ON public.community_stories
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users manage own stories" ON public.community_stories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all stories" ON public.community_stories
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Success map entries
CREATE TABLE public.success_map_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  location_label TEXT,
  case_type TEXT NOT NULL,
  milestone TEXT NOT NULL,
  timeline_months INTEGER,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.success_map_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved map entries visible to all" ON public.success_map_entries
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users manage own map entries" ON public.success_map_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all map entries" ON public.success_map_entries
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_network_listings_updated_at BEFORE UPDATE ON public.network_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_stories_updated_at BEFORE UPDATE ON public.community_stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
