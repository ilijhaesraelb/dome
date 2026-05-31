
CREATE TABLE public.product_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'individual',
  is_active BOOLEAN NOT NULL DEFAULT true,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pricing"
  ON public.product_pricing FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read active pricing"
  ON public.product_pricing FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Public can read active pricing"
  ON public.product_pricing FOR SELECT
  TO anon
  USING (is_active = true);

INSERT INTO public.product_pricing (product_key, display_name, description, price_cents, category) VALUES
  ('form_export', 'Form Export (PDF)', 'Export a single completed form as PDF', 300, 'individual'),
  ('990n_filing', '990-N Filing', 'Guided 990-N e-Postcard preparation', 2900, 'nonprofit'),
  ('990ez_filing', '990-EZ Filing', 'Guided 990-EZ preparation', 7500, 'nonprofit'),
  ('8868_extension', 'Extension Filing (8868)', 'Form 8868 extension request', 2500, 'nonprofit'),
  ('professional_review', 'Professional Review', 'Expert review of filing or form', 4900, 'nonprofit'),
  ('priority_processing', 'Priority Processing', 'Expedited processing add-on', 1500, 'individual'),
  ('990_full', '990 Full Prep', 'Full Form 990 guided preparation', 14900, 'nonprofit'),
  ('pro_subscription', 'D.O.M.E. Pro', 'Monthly professional subscription', 1200, 'professional'),
  ('attorney_plan', 'Attorney / A&R Plan', 'Monthly attorney plan', 7900, 'professional'),
  ('firm_plan', 'Firm Plan', 'Monthly firm plan', 14900, 'professional');
