-- Rate limiting for the uscis-case-status edge function.
-- One row per user; window resets automatically once expired.
CREATE TABLE public.uscis_lookup_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  request_count INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.uscis_lookup_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only reachable through the SECURITY DEFINER function below.

CREATE OR REPLACE FUNCTION public.check_uscis_rate_limit(max_requests INTEGER, window_seconds INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _now TIMESTAMPTZ := now();
  _count INTEGER;
BEGIN
  IF _uid IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.uscis_lookup_rate_limits (user_id, window_start, request_count)
  VALUES (_uid, _now, 1)
  ON CONFLICT (user_id) DO UPDATE
    SET window_start = CASE
          WHEN public.uscis_lookup_rate_limits.window_start < _now - (window_seconds || ' seconds')::interval
          THEN _now
          ELSE public.uscis_lookup_rate_limits.window_start
        END,
        request_count = CASE
          WHEN public.uscis_lookup_rate_limits.window_start < _now - (window_seconds || ' seconds')::interval
          THEN 1
          ELSE public.uscis_lookup_rate_limits.request_count + 1
        END
  RETURNING request_count INTO _count;

  RETURN _count <= max_requests;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_uscis_rate_limit(INTEGER, INTEGER) TO authenticated;
