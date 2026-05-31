
-- Tax intake records for individuals and nonprofits
CREATE TABLE public.tax_intakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  intake_type TEXT NOT NULL DEFAULT 'individual',
  answers JSONB NOT NULL DEFAULT '{}',
  recommended_form TEXT,
  status TEXT NOT NULL DEFAULT 'started',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Nonprofit filing workspace data
CREATE TABLE public.tax_filings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  intake_id UUID REFERENCES public.tax_intakes(id),
  filing_type TEXT NOT NULL,
  filing_year TEXT,
  field_values JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'in_progress',
  progress INTEGER DEFAULT 0,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  exported_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tax document uploads
CREATE TABLE public.tax_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  filing_id UUID REFERENCES public.tax_filings(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  file_path TEXT,
  file_size INTEGER,
  file_type TEXT,
  extracted_data JSONB,
  status TEXT NOT NULL DEFAULT 'uploaded',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;

-- RLS: users can only access their own data
CREATE POLICY "Users manage own tax intakes" ON public.tax_intakes
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own tax filings" ON public.tax_filings
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users manage own tax documents" ON public.tax_documents
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Updated at trigger
CREATE TRIGGER update_tax_intakes_updated_at BEFORE UPDATE ON public.tax_intakes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tax_filings_updated_at BEFORE UPDATE ON public.tax_filings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
