
-- Affiliate notifications table
CREATE TABLE public.affiliate_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_notifications ENABLE ROW LEVEL SECURITY;

-- Affiliates can read their own notifications
CREATE POLICY "Affiliates read own notifications"
  ON public.affiliate_notifications FOR SELECT TO authenticated
  USING (affiliate_id IN (
    SELECT id FROM public.affiliates WHERE user_id = auth.uid()
  ));

-- Affiliates can update (mark read) their own notifications
CREATE POLICY "Affiliates update own notifications"
  ON public.affiliate_notifications FOR UPDATE TO authenticated
  USING (affiliate_id IN (
    SELECT id FROM public.affiliates WHERE user_id = auth.uid()
  ));

-- System can insert notifications (service role or admin)
CREATE POLICY "Admins insert notifications"
  ON public.affiliate_notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create function to auto-notify on new attribution
CREATE OR REPLACE FUNCTION public.notify_affiliate_new_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.affiliate_notifications (affiliate_id, type, title, message)
  VALUES (
    NEW.affiliate_id,
    'new_referral',
    'New Referral!',
    'A new user signed up through your referral link.'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_affiliate_new_referral
  AFTER INSERT ON public.affiliate_attributions
  FOR EACH ROW EXECUTE FUNCTION public.notify_affiliate_new_referral();

-- Create function to auto-notify on new commission
CREATE OR REPLACE FUNCTION public.notify_affiliate_new_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.affiliate_notifications (affiliate_id, type, title, message, metadata)
  VALUES (
    NEW.affiliate_id,
    'new_commission',
    'New Commission Earned!',
    'You earned $' || ROUND(NEW.commission_amount::numeric, 2)::text || ' in commission.',
    jsonb_build_object('amount', NEW.commission_amount, 'type', NEW.revenue_type)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_affiliate_new_commission
  AFTER INSERT ON public.affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_affiliate_new_commission();

-- Create function to auto-notify on payout status change
CREATE OR REPLACE FUNCTION public.notify_affiliate_payout_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.affiliate_notifications (affiliate_id, type, title, message, metadata)
    VALUES (
      NEW.affiliate_id,
      'payout_' || NEW.status,
      CASE NEW.status
        WHEN 'approved' THEN 'Payout Approved!'
        WHEN 'paid' THEN 'Payout Sent!'
        WHEN 'held' THEN 'Payout On Hold'
        ELSE 'Payout Update'
      END,
      CASE NEW.status
        WHEN 'approved' THEN 'Your payout of $' || ROUND(NEW.total_amount::numeric, 2)::text || ' has been approved.'
        WHEN 'paid' THEN 'Your payout of $' || ROUND(NEW.total_amount::numeric, 2)::text || ' has been sent!'
        WHEN 'held' THEN 'Your payout of $' || ROUND(NEW.total_amount::numeric, 2)::text || ' is currently on hold.'
        ELSE 'Your payout status has been updated to ' || NEW.status || '.'
      END,
      jsonb_build_object('amount', NEW.total_amount, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_affiliate_payout_update
  AFTER UPDATE ON public.affiliate_payouts
  FOR EACH ROW EXECUTE FUNCTION public.notify_affiliate_payout_update();
