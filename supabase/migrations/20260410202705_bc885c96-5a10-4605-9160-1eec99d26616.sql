
-- Filing recommendations from AI analysis
CREATE TABLE public.tax_filing_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_file_id UUID NOT NULL REFERENCES public.tax_files(id) ON DELETE CASCADE,
  detected_filing_type TEXT,
  confidence_score NUMERIC(5,2),
  evidence_summary JSONB DEFAULT '[]'::jsonb,
  recommendation_text TEXT,
  alternative_paths JSONB DEFAULT '[]'::jsonb,
  user_confirmed BOOLEAN DEFAULT false,
  confirmed_filing_type TEXT,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID,
  ai_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Per-document AI extraction results
CREATE TABLE public.tax_document_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.tax_file_documents(id) ON DELETE CASCADE,
  tax_file_id UUID NOT NULL REFERENCES public.tax_files(id) ON DELETE CASCADE,
  document_type TEXT,
  detected_tax_year INTEGER,
  detected_entity_name TEXT,
  detected_entity_tin TEXT,
  extracted_fields JSONB DEFAULT '{}'::jsonb,
  key_amounts JSONB DEFAULT '{}'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  extraction_model TEXT,
  extraction_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Year-to-year carryforward vault
CREATE TABLE public.tax_return_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_client_id UUID NOT NULL REFERENCES public.tax_clients(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  filing_type TEXT NOT NULL,
  key_values JSONB DEFAULT '{}'::jsonb,
  addresses JSONB DEFAULT '[]'::jsonb,
  officers JSONB DEFAULT '[]'::jsonb,
  carryforward_data JSONB DEFAULT '{}'::jsonb,
  review_notes TEXT,
  source_tax_file_id UUID REFERENCES public.tax_files(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tax_client_id, tax_year, filing_type)
);

-- Spreadsheet mapping templates
CREATE TABLE public.tax_spreadsheet_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_client_id UUID NOT NULL REFERENCES public.tax_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  column_mappings JSONB DEFAULT '{}'::jsonb,
  category_mappings JSONB DEFAULT '{}'::jsonb,
  source_type TEXT DEFAULT 'excel',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add new columns to tax_file_documents for better classification
ALTER TABLE public.tax_file_documents ADD COLUMN IF NOT EXISTS tax_year INTEGER;
ALTER TABLE public.tax_file_documents ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.tax_file_documents ADD COLUMN IF NOT EXISTS ai_classification TEXT;
ALTER TABLE public.tax_file_documents ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(5,2);

-- Add filing recommendation fields to tax_files
ALTER TABLE public.tax_files ADD COLUMN IF NOT EXISTS ai_recommended_filing_type TEXT;
ALTER TABLE public.tax_files ADD COLUMN IF NOT EXISTS filing_confirmed BOOLEAN DEFAULT false;
ALTER TABLE public.tax_files ADD COLUMN IF NOT EXISTS filing_confirmed_at TIMESTAMPTZ;
ALTER TABLE public.tax_files ADD COLUMN IF NOT EXISTS source_documents_count INTEGER DEFAULT 0;

-- RLS
ALTER TABLE public.tax_filing_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_return_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_spreadsheet_mappings ENABLE ROW LEVEL SECURITY;

-- Tax staff can see all
CREATE POLICY "Tax staff can view all recommendations" ON public.tax_filing_recommendations
  FOR SELECT TO authenticated USING (public.is_tax_staff(auth.uid()));
CREATE POLICY "Tax staff can manage all recommendations" ON public.tax_filing_recommendations
  FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid())) WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE POLICY "Tax staff can view all extractions" ON public.tax_document_extractions
  FOR SELECT TO authenticated USING (public.is_tax_staff(auth.uid()));
CREATE POLICY "Tax staff can manage all extractions" ON public.tax_document_extractions
  FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid())) WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE POLICY "Tax staff can view all history" ON public.tax_return_history
  FOR SELECT TO authenticated USING (public.is_tax_staff(auth.uid()));
CREATE POLICY "Tax staff can manage all history" ON public.tax_return_history
  FOR ALL TO authenticated USING (public.is_tax_staff(auth.uid())) WITH CHECK (public.is_tax_staff(auth.uid()));

CREATE POLICY "Tax staff can view all mappings" ON public.tax_spreadsheet_mappings
  FOR SELECT TO authenticated USING (public.is_tax_staff(auth.uid()));

-- Users can see their own via tax_clients
CREATE POLICY "Users can view own recommendations" ON public.tax_filing_recommendations
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tax_files tf JOIN public.tax_clients tc ON tf.tax_client_id = tc.id WHERE tf.id = tax_file_id AND tc.user_id = auth.uid())
  );
CREATE POLICY "Users can update own recommendations" ON public.tax_filing_recommendations
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tax_files tf JOIN public.tax_clients tc ON tf.tax_client_id = tc.id WHERE tf.id = tax_file_id AND tc.user_id = auth.uid())
  );

CREATE POLICY "Users can view own extractions" ON public.tax_document_extractions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tax_files tf JOIN public.tax_clients tc ON tf.tax_client_id = tc.id WHERE tf.id = tax_file_id AND tc.user_id = auth.uid())
  );

CREATE POLICY "Users can view own history" ON public.tax_return_history
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tax_clients tc WHERE tc.id = tax_client_id AND tc.user_id = auth.uid())
  );
CREATE POLICY "Users can insert own history" ON public.tax_return_history
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.tax_clients tc WHERE tc.id = tax_client_id AND tc.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own mappings" ON public.tax_spreadsheet_mappings
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tax_clients tc WHERE tc.id = tax_client_id AND tc.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.tax_clients tc WHERE tc.id = tax_client_id AND tc.user_id = auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER update_tax_filing_recommendations_updated_at BEFORE UPDATE ON public.tax_filing_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tax_return_history_updated_at BEFORE UPDATE ON public.tax_return_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tax_spreadsheet_mappings_updated_at BEFORE UPDATE ON public.tax_spreadsheet_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
