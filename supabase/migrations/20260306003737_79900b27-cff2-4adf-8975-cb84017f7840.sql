
-- Fix overly permissive INSERT policies
DROP POLICY "System can insert results" ON public.pathway_results;
DROP POLICY "System can insert audit" ON public.pathway_rule_audit;

-- Results: only service role or practitioners can insert (edge function uses service role)
CREATE POLICY "Practitioners can insert results" ON public.pathway_results FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'practitioner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Practitioners can insert audit" ON public.pathway_rule_audit FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'practitioner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
