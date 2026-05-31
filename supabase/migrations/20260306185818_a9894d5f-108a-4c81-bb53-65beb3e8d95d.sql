
-- =============================================
-- TRIAL REFERRAL SYSTEM
-- =============================================

-- Enum for trial referral type
CREATE TYPE public.referral_target_type AS ENUM ('customer', 'attorney', 'accredited_representative', 'organization', 'general_public');

-- Enum for referral activation mode
CREATE TYPE public.referral_activation_mode AS ENUM ('instant', 'approval_required', 'invite_only');

-- Enum for redemption status
CREATE TYPE public.referral_redemption_status AS ENUM ('pending', 'active', 'expired', 'revoked', 'denied');

-- Enum for affiliate payout model
CREATE TYPE public.affiliate_payout_model AS ENUM ('export_only', 'subscription_only', 'hybrid');

-- Enum for commission status
CREATE TYPE public.commission_status AS ENUM ('pending', 'approved', 'paid', 'held', 'disputed', 'cancelled');

-- Enum for payout status
CREATE TYPE public.payout_status AS ENUM ('pending', 'approved', 'paid', 'held', 'disputed');

-- Enum for affiliate compliance
CREATE TYPE public.compliance_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- Enum for revenue type
CREATE TYPE public.revenue_type AS ENUM ('export', 'subscription', 'addon');

-- 1. trial_referrals
CREATE TABLE public.trial_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  referral_type referral_target_type NOT NULL DEFAULT 'general_public',
  activation_mode referral_activation_mode NOT NULL DEFAULT 'instant',
  duration_days integer NOT NULL DEFAULT 30,
  start_at timestamptz,
  end_at timestamptz,
  max_uses integer,
  max_orgs integer,
  max_users_per_org integer,
  is_active boolean NOT NULL DEFAULT true,
  auto_expire boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trial_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage trial_referrals" ON public.trial_referrals FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read active trial_referrals" ON public.trial_referrals FOR SELECT USING (is_active = true);

-- 2. trial_referral_feature_rules
CREATE TABLE public.trial_referral_feature_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_referral_id uuid NOT NULL REFERENCES public.trial_referrals(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  usage_limit integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trial_referral_feature_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage trial_feature_rules" ON public.trial_referral_feature_rules FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can read trial_feature_rules" ON public.trial_referral_feature_rules FOR SELECT USING (true);

-- 3. trial_referral_redemptions
CREATE TABLE public.trial_referral_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_referral_id uuid NOT NULL REFERENCES public.trial_referrals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  organization_id text,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status referral_redemption_status NOT NULL DEFAULT 'pending',
  approved_by uuid,
  request_info jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trial_referral_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage redemptions" ON public.trial_referral_redemptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own redemptions" ON public.trial_referral_redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can redeem" ON public.trial_referral_redemptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =============================================
-- AFFILIATE REFERRAL SYSTEM
-- =============================================

-- 4. affiliates
CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  affiliate_code text NOT NULL UNIQUE,
  display_name text NOT NULL,
  type text NOT NULL DEFAULT 'individual',
  email text,
  payout_model affiliate_payout_model NOT NULL DEFAULT 'hybrid',
  export_commission_pct numeric(5,2) NOT NULL DEFAULT 20.00,
  subscription_commission_pct numeric(5,2) NOT NULL DEFAULT 20.00,
  payout_term_months integer NOT NULL DEFAULT 12,
  attribution_window_days integer NOT NULL DEFAULT 60,
  cookie_duration_days integer NOT NULL DEFAULT 60,
  min_payout_amount numeric(10,2) NOT NULL DEFAULT 25.00,
  is_active boolean NOT NULL DEFAULT true,
  tax_status compliance_status NOT NULL DEFAULT 'pending',
  compliance_status compliance_status NOT NULL DEFAULT 'pending',
  fraud_hold boolean NOT NULL DEFAULT false,
  payment_method text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage affiliates" ON public.affiliates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Affiliates view own record" ON public.affiliates FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 5. affiliate_clicks
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  click_token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  ip_hash text,
  user_agent text,
  referrer_url text,
  clicked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage clicks" ON public.affiliate_clicks FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Affiliates view own clicks" ON public.affiliate_clicks FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM affiliates a WHERE a.id = affiliate_clicks.affiliate_id AND a.user_id = auth.uid()));
CREATE POLICY "Anyone can insert clicks" ON public.affiliate_clicks FOR INSERT WITH CHECK (true);

-- 6. affiliate_attributions
CREATE TABLE public.affiliate_attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  attributed_at timestamptz NOT NULL DEFAULT now(),
  attribution_expires_at timestamptz NOT NULL,
  attribution_model text NOT NULL DEFAULT 'last_click',
  click_id uuid REFERENCES public.affiliate_clicks(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage attributions" ON public.affiliate_attributions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Affiliates view own attributions" ON public.affiliate_attributions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM affiliates a WHERE a.id = affiliate_attributions.affiliate_id AND a.user_id = auth.uid()));

-- 7. affiliate_commissions
CREATE TABLE public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  revenue_type revenue_type NOT NULL,
  source_id text,
  gross_amount numeric(10,2) NOT NULL DEFAULT 0,
  commission_amount numeric(10,2) NOT NULL DEFAULT 0,
  status commission_status NOT NULL DEFAULT 'pending',
  earned_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  paid_at timestamptz,
  payout_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage commissions" ON public.affiliate_commissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Affiliates view own commissions" ON public.affiliate_commissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM affiliates a WHERE a.id = affiliate_commissions.affiliate_id AND a.user_id = auth.uid()));

-- 8. affiliate_payouts
CREATE TABLE public.affiliate_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  payout_period_start date NOT NULL,
  payout_period_end date NOT NULL,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status payout_status NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  payment_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payouts" ON public.affiliate_payouts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Affiliates view own payouts" ON public.affiliate_payouts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM affiliates a WHERE a.id = affiliate_payouts.affiliate_id AND a.user_id = auth.uid()));

-- Add commission payout_id FK after payouts table exists
ALTER TABLE public.affiliate_commissions ADD CONSTRAINT affiliate_commissions_payout_id_fkey FOREIGN KEY (payout_id) REFERENCES public.affiliate_payouts(id);
