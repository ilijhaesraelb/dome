-- Self-service affiliate signup from the public Affiliate Program page.
-- The affiliates table only allows admin INSERTs (RLS), and a plain
-- "users insert own row" policy would let a user pick their own commission %,
-- is_active / fraud_hold / compliance flags. This SECURITY DEFINER function
-- creates the row for auth.uid() with fixed program terms instead.

CREATE OR REPLACE FUNCTION public.become_affiliate(
  _display_name TEXT,
  _email TEXT,
  _paypal_email TEXT,
  _country TEXT,
  _tax_status TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _id UUID;
  _base TEXT;
  _code TEXT;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to become an affiliate.';
  END IF;
  IF coalesce(trim(_display_name), '') = '' THEN
    RAISE EXCEPTION 'Full name is required.';
  END IF;

  -- One affiliate account per user: return the existing one
  SELECT id INTO _id FROM public.affiliates WHERE user_id = _uid LIMIT 1;
  IF _id IS NOT NULL THEN
    RETURN _id;
  END IF;

  _base := left(upper(regexp_replace(_display_name, '[^A-Za-z0-9]', '', 'g')), 8);
  IF _base = '' THEN _base := 'DOME'; END IF;
  LOOP
    _code := _base || upper(substr(md5(gen_random_uuid()::text), 1, 4));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliates WHERE affiliate_code = _code);
  END LOOP;

  INSERT INTO public.affiliates (
    user_id, display_name, email, affiliate_code, type, payment_method, notes,
    subscription_commission_pct, export_commission_pct, cookie_duration_days,
    attribution_window_days, min_payout_amount, payout_term_months, created_by
  ) VALUES (
    _uid, left(trim(_display_name), 200), left(trim(_email), 320), _code, 'individual',
    'paypal:' || left(trim(coalesce(_paypal_email, '')), 320),
    'Country: ' || left(coalesce(_country, ''), 100) || ', Tax: ' || left(coalesce(_tax_status, ''), 100),
    20, 15, 90, 90, 50, 12, _uid
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.become_affiliate(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.become_affiliate(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
